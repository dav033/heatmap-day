# Plan de Desarrollo — **DayScore** (nombre provisional)

> Heatmap personal de días al estilo IMDb: un calendario donde puntúas cada día (0–10), registras factores/hábitos configurables, y el sistema detecta patrones y efectos acumulativos para entender tus días buenos y malos.

Este documento es la especificación para un **agente de código**. Está ordenado por fases incrementales; cada fase entrega software funcional y tiene **criterios de aceptación** claros. Lee primero las secciones de Arquitectura, Modelo de datos y Reglas de negocio antes de empezar a codear.

---

## 1. Visión del producto

- **Calendario-heatmap** de días, coloreados por un puntaje **0.0–10.0** (rojo = malo, verde = óptimo).
- Vista **semanal por defecto**, conmutable a **mensual** y **anual**.
- Al "entrar" a un día, registras una lista configurable de **trackers** (hábitos/factores): unos tipo *check*, otros tipo *escala 0–10*, otros tipo *contador numérico* (con meta/ideal opcional). Más nota libre y etiquetas del día.
- Un **motor de estadísticas genérico** detecta, para *cualquier* lista de trackers del usuario:
  - **Impacto por factor**: "los días que vas al gimnasio tu puntaje es +N en promedio" (o lo contrario, si los datos lo dicen).
  - **Efectos acumulativos**: "llevas varios días durmiendo mal y el puntaje viene cayendo".
  - **Patrones**: por día de semana, rachas (streaks), tendencias.
- Un módulo de **predicción** que, con suficientes datos, estima el puntaje del día y explica qué factores lo influyen.

---

## 2. Decisiones acordadas (no cambiar sin avisar al usuario)

| Tema | Decisión |
|---|---|
| Puntaje del día | **Manual**. La predicción es un módulo aparte y posterior. Rango `0.0–10.0`, 1 decimal, 10 = óptimo. |
| Tipos de tracker (v1) | `CHECK` (booleano), `SCALE` (0–10, 10 = óptimo), `COUNTER` (numérico, con `unit` y `target/ideal` opcionales). Sistema de tipos **extensible** (p. ej. `DURATION`, `CATEGORICAL` a futuro). |
| Meta/ideal | Configurable por el usuario (ej. 3 L agua, 8 h sueño) **o vacío**. Se usa para normalizar y para metas, **no** para asumir dirección. |
| Edición de trackers | Se pueden crear/renombrar/**archivar** (soft). Archivar **no** afecta estadísticas pasadas ni futuras. |
| Datos faltantes | "No registrado" **≠** "registrado en 0". Solo entra al análisis lo que se registró explícitamente, dentro de la ventana de vida del tracker. |
| Vistas de calendario | **Semanal (default)** / Mensual / Anual. |
| Estadísticas | Genéricas y adaptativas: descubren impacto, dirección, efectos acumulativos y patrones sin nombres hardcodeados. |
| UI | **MUI v6** (Material Design) + **tema oscuro único**. **Tailwind** solo para utilidades de layout, conviviendo con MUI. |
| Persistencia | **Prisma + SQLite** ahora; preparado para **PostgreSQL** después (cambio de provider + repositorios desacoplados). |
| Usuarios | **Mono-usuario** (usuario local por defecto), pero **todo cuelga de `userId`** para multiusuario futuro sin migración. |
| Entorno | Web. **PWA-ready** (no PWA completa todavía). |
| Lenguaje del código | Código, identificadores y rutas en **inglés**; comentarios/UI en **español**. TypeScript en modo **strict**. |

---

## 3. Stack tecnológico

- **Next.js** (App Router, versión estable más reciente) + **React** + **TypeScript (strict)**.
- **MUI (Material UI) v6** + Emotion → componentes y tema. Tema **dark-only** vía `createTheme`. Sin toggle de tema.
- **Tailwind CSS** → utilidades de layout/espaciado, configurado para convivir con MUI (ver §6).
- **Prisma ORM** + **SQLite** (provider `sqlite`). Migración futura a `postgresql` por cambio de provider + `DATABASE_URL`. Acceso a datos **detrás de interfaces de repositorio** (aísla incluso el ORM).
- **Zod** → validación en los bordes (server actions / route handlers) y derivación de tipos donde aporte.
- **MUI X Charts** → gráficas integradas al tema Material (tendencias, distribuciones).
- **date-fns** → manejo de fechas. Las fechas de día se guardan como `YYYY-MM-DD` (date-only) para evitar bugs de zona horaria.
- **simple-statistics** → correlaciones, medias, etc. Para predicción: regresión lineal multivariante ligera (`ml-regression-multivariate-linear` o equivalente). **Sin deep learning.**
- **Vitest** → tests unitarios (foco en domain y motor de estadísticas).
- Lint/format: **ESLint + Prettier** (configuración estándar Next + reglas de orden de imports).

> Gestión de estado: por defecto **RSC para lecturas + Server Actions para escrituras + estado local de React (`useState`/`useOptimistic`)**. TanStack Query es **opcional**, solo si surge necesidad real de caché cliente. No sobre-ingenierizar.

---

## 4. Arquitectura — capas

Arquitectura por **features** + **capas ligeras**. Regla de dependencia: **UI → API → Application → Domain**, y **Application → interfaces de repositorio**. El **Domain no depende de nada** (ni framework, ni ORM).

1. **Domain** (`core/domain`, `features/*/domain`)
   - TS puro: entidades, tipos, value objects, lógica pura (mapeo puntaje→color, fórmulas estadísticas, validaciones de negocio). Lo más testeable.
2. **Data / Persistencia** (`core/db`, `core/repositories/*`)
   - Interfaces de repositorio (orientadas al dominio) + implementación con Prisma. **Único lugar** que toca la DB. Swappable.
3. **Application** (`features/*/application`)
   - Casos de uso / servicios que orquestan dominio + repositorios (`scoreDay`, `computeStatistics`, `predictScore`, etc.).
4. **API / Interface** (`app/api/*`, `features/*/api`)
   - Adaptadores finos: Route Handlers + Server Actions. Validación con Zod aquí.
5. **UI / Presentación** (`features/*/ui`, `core/ui`)
   - React (Server/Client Components), hooks, MUI. Las lecturas vía RSC llaman a servicios; las escrituras vía Server Actions.

> **Reglas de código (obligatorias):**
> - **Modularización primero.** Ningún archivo "monstruoso". Límite blando: **~200–250 líneas/archivo**; si lo supera, dividir.
> - **Componentizar** todo lo razonable. Componentes pequeños y de responsabilidad única.
> - Cada feature expone su superficie pública con un `index.ts` (barrel). Las features **no** se importan internals entre sí.
> - Tipos de dominio compartidos viven en `core/domain`; las features los consumen, no los duplican.
> - Nada de lógica de negocio en componentes UI ni en route handlers: va en `application`.

### Estructura de carpetas

```
src/
  app/                          # Next.js App Router (fino: páginas + handlers + actions)
    layout.tsx                  # tema MUI dark + providers
    (dashboard)/
      page.tsx                  # calendario (vista por defecto)
      day/[date]/page.tsx       # detalle del día
      stats/page.tsx            # dashboard de estadísticas
      trackers/page.tsx         # configuración de trackers/categorías
      settings/page.tsx
    api/
      export/route.ts           # exportar JSON/CSV
      import/route.ts           # importar JSON/CSV
      backup/route.ts           # backup SQLite
  features/
    calendar/                   # heatmap + puntaje manual del día
      domain/   application/   api/   ui/   index.ts
    trackers/                   # definición de trackers + categorías + captura diaria
      domain/   application/   api/   ui/   index.ts
    statistics/                 # motor de análisis + dashboard
      domain/   application/   ui/   index.ts
    prediction/                 # predicción de puntaje
      domain/   application/   ui/   index.ts
    data-io/                    # export / import / backup
      application/   api/   ui/   index.ts
  core/
    domain/                     # entidades y tipos compartidos (DayEntry, Tracker, TrackerValue, ...)
    repositories/
      interfaces/               # DayEntryRepository, TrackerRepository, ...
      prisma/                   # implementaciones Prisma
    db/                         # prisma client (singleton)
    ui/                         # componentes MUI compartidos, layout, AppShell
    lib/                        # utils: date, colorScale, statistics helpers, result/error
    config/                     # env, constantes, feature flags
  theme/                        # createTheme dark + glue Tailwind/MUI
prisma/
  schema.prisma
  migrations/
  seed.ts                       # crea usuario por defecto + (opcional) datos demo
tests/                          # unit tests (domain, statistics)
```

---

## 5. Modelo de datos

### Entidades

- **User** — `id`, `name`, `createdAt`. (Mono-usuario: se crea uno por defecto en el seed; todo FK a `userId`.)
- **DayEntry** — un día puntuado. `id`, `userId`, `date` (`YYYY-MM-DD`, único por usuario), `score` (Float 0–10, nullable), `note` (String, nullable), `predictedScore` (Float, nullable), `createdAt`, `updatedAt`.
- **Tracker** — definición de un factor/hábito. `id`, `userId`, `name`, `type` (`CHECK|SCALE|COUNTER`), `unit` (nullable), `target` (Float, nullable), `categoryId` (nullable), `order` (Int), `expectedPolarity` (`POSITIVE|NEGATIVE|UNKNOWN`, default `UNKNOWN`, **solo pista visual**), `createdAt`, `archivedAt` (nullable → soft-archive).
- **TrackerValue** — valor de un tracker en un día. `id`, `dayEntryId`, `trackerId`, `boolValue` (nullable), `numericValue` (nullable), `createdAt`. **Único por (`dayEntryId`, `trackerId`).** *La existencia de la fila = "registrado"; su ausencia = "no registrado".*
- **Category** — agrupa trackers. `id`, `userId`, `name`, `color` (nullable), `order`.
- **Tag** — etiqueta de día. `id`, `userId`, `name`, `color` (nullable).
- **DayTag** — join `dayEntryId` ↔ `tagId`.

### Prisma schema (boceto)

```prisma
datasource db { provider = "sqlite"  url = env("DATABASE_URL") }
generator client { provider = "prisma-client-js" }

enum TrackerType { CHECK SCALE COUNTER }
enum Polarity   { POSITIVE NEGATIVE UNKNOWN }

model User {
  id        String   @id @default(cuid())
  name      String
  createdAt DateTime @default(now())
  days      DayEntry[]
  trackers  Tracker[]
  categories Category[]
  tags      Tag[]
}

model DayEntry {
  id             String   @id @default(cuid())
  userId         String
  date           String   // YYYY-MM-DD
  score          Float?
  note           String?
  predictedScore Float?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  user           User     @relation(fields: [userId], references: [id])
  values         TrackerValue[]
  tags           DayTag[]
  @@unique([userId, date])
}

model Tracker {
  id               String     @id @default(cuid())
  userId           String
  name             String
  type             TrackerType
  unit             String?
  target           Float?
  expectedPolarity Polarity   @default(UNKNOWN)
  categoryId       String?
  order            Int        @default(0)
  createdAt        DateTime   @default(now())
  archivedAt       DateTime?
  user             User       @relation(fields: [userId], references: [id])
  category         Category?  @relation(fields: [categoryId], references: [id])
  values           TrackerValue[]
}

model TrackerValue {
  id           String   @id @default(cuid())
  dayEntryId   String
  trackerId    String
  boolValue    Boolean?
  numericValue Float?
  createdAt    DateTime @default(now())
  day          DayEntry @relation(fields: [dayEntryId], references: [id], onDelete: Cascade)
  tracker      Tracker  @relation(fields: [trackerId], references: [id])
  @@unique([dayEntryId, trackerId])
}

model Category { id String @id @default(cuid()) userId String name String color String? order Int @default(0) user User @relation(fields:[userId], references:[id]) trackers Tracker[] }
model Tag      { id String @id @default(cuid()) userId String name String color String? user User @relation(fields:[userId], references:[id]) days DayTag[] }
model DayTag   { dayEntryId String tagId String day DayEntry @relation(fields:[dayEntryId], references:[id], onDelete: Cascade) tag Tag @relation(fields:[tagId], references:[id]) @@id([dayEntryId, tagId]) }
```

### Tipos de dominio (TS, uniones discriminadas)

```ts
export type TrackerType = 'CHECK' | 'SCALE' | 'COUNTER';

export interface Tracker {
  id: string;
  name: string;
  type: TrackerType;
  unit?: string;
  target?: number;          // ideal opcional
  expectedPolarity: 'POSITIVE' | 'NEGATIVE' | 'UNKNOWN';
  categoryId?: string;
  order: number;
  archivedAt?: Date;        // soft-archive
  createdAt: Date;
}

// Valor narrow-eado por el tipo del tracker
export type TrackerValue =
  | { trackerId: string; kind: 'CHECK';   done: boolean }
  | { trackerId: string; kind: 'SCALE';   value: number }   // 0..10
  | { trackerId: string; kind: 'COUNTER'; value: number };

export interface DayEntry {
  id: string;
  date: string;             // YYYY-MM-DD
  score?: number;           // 0..10 manual
  note?: string;
  predictedScore?: number;
  values: TrackerValue[];   // solo lo registrado
  tagIds: string[];
}
```

---

## 6. Reglas de negocio importantes

1. **Datos faltantes (CRÍTICO).** El análisis de un tracker considera **solo** los días con `TrackerValue` para ese tracker **y** cuyo `date` ≥ `tracker.createdAt` (y, si está archivado, opcionalmente ≤ `archivedAt`). Un día sin fila = excluido, **nunca** tratado como 0. Documentar esta regla en `statistics/domain` con tests.
2. **Soft-archive.** Archivar un tracker (`archivedAt`) lo oculta de la captura diaria y de nuevas estadísticas, pero **conserva** sus valores históricos y no recalcula nada hacia atrás.
3. **Escala de color.** Función pura `scoreToColor(score: number): string` en `core/lib/colorScale.ts`. Gradiente rojo→naranja→amarillo→verde sobre 0–10. Umbrales centralizados y (a futuro) configurables. Días sin puntaje → color neutro/vacío.
4. **Fechas.** Siempre `YYYY-MM-DD` (date-only), zona horaria del usuario, sin `Date` con hora para evitar desfases. Helpers en `core/lib/date.ts`.
5. **Dirección de un factor.** No se asume. El motor la **descubre** por el signo de la correlación. `expectedPolarity` es solo una pista para UI/orden, nunca para los cálculos.
6. **MUI + Tailwind (convivencia).** Tailwind se usa solo para utilidades de layout (`flex`, `grid`, `gap`, spacing). MUI domina componentes, colores y tipografía. Config: desactivar el *preflight* de Tailwind (o limitarlo) y fijar el orden de capas CSS para que MUI no se vea pisado. Documentar el setup en `theme/`. Si hay fricción seria, preferir MUI y degradar Tailwind a utilidades mínimas.

---

## 7. Plan por fases

> Convención: cada fase = una rama/commit lógico. No avanzar a la siguiente sin cumplir **criterios de aceptación**. Mantener archivos pequeños y tipados estrictos en todo momento.

### Fase 0 — Setup y fundaciones
**Objetivo:** proyecto arrancable con stack, tema y estructura listos.
- [ ] `create-next-app` (App Router, TS, ESLint). TS `strict: true`.
- [ ] Instalar y configurar MUI v6 (Emotion) + tema **dark único** en `theme/` y `app/layout.tsx` (`CssBaseline`, `ThemeProvider`).
- [ ] Instalar Tailwind y configurarlo para convivir con MUI (§6).
- [ ] Prisma + SQLite: `schema.prisma` inicial (solo `User`), cliente singleton en `core/db`, `.env` con `DATABASE_URL`.
- [ ] Seed: crear **usuario por defecto**. Helper `getCurrentUserId()` (devuelve el usuario local; punto único a cambiar para multiusuario).
- [ ] Crear la **estructura de carpetas** completa (vacía/placeholder) de §4.
- [ ] ESLint/Prettier + reglas de orden de imports. Vitest configurado.
- [ ] `AppShell` base (MUI: layout con barra lateral/superior, navegación a Calendario / Estadísticas / Trackers / Settings).

**Aceptación:** la app levanta en dark mode, navegación entre rutas vacías funciona, `prisma migrate` y `seed` corren sin error, lint y un test dummy pasan.

---

### Fase 1 — Modelo de datos y capa de persistencia
**Objetivo:** todas las entidades + repositorios desacoplados.
- [ ] `schema.prisma` completo (§5) + migración inicial.
- [ ] Tipos de dominio en `core/domain` (uniones discriminadas, §5).
- [ ] Interfaces de repositorio en `core/repositories/interfaces`: `DayEntryRepository`, `TrackerRepository`, `TrackerValueRepository`, `CategoryRepository`, `TagRepository`.
- [ ] Implementaciones Prisma en `core/repositories/prisma` + mappers (Prisma model ↔ tipo de dominio).
- [ ] Tests unitarios de mappers y de la **regla de datos faltantes** (queries que excluyen días sin valor / fuera de ventana).

**Aceptación:** se puede crear/leer/actualizar cada entidad vía repositorios (test de integración con SQLite en memoria/temporal). Ninguna otra capa importa Prisma directamente.

---

### Fase 2 — Calendario-Heatmap + puntaje manual
**Objetivo:** el corazón visible. Ver y puntuar días.
- [ ] `calendar/application`: `getDayEntries(range)`, `setDayScore(date, score)`, `getDayEntry(date)`.
- [ ] `calendar/api`: Server Actions para puntuar; lecturas vía RSC.
- [ ] `calendar/ui`: 
  - [ ] **Heatmap** con celdas coloreadas (`scoreToColor`). Tres vistas: **Semanal (default)** / **Mensual** / **Anual** (estilo contribuciones tipo GitHub para anual).
  - [ ] Navegación (anterior/siguiente período, "hoy"), selector de vista.
  - [ ] Click en una celda → abre/da paso al detalle del día.
  - [ ] Editar el puntaje del día (slider/stepper 0–10, 1 decimal) con `useOptimistic`.
  - [ ] Leyenda de color.
- [ ] Componentes pequeños: `HeatmapCell`, `WeekView`, `MonthView`, `YearView`, `ScoreEditor`, `ColorLegend`.

**Aceptación:** puedo abrir cualquier día, ponerle puntaje, y verlo coloreado en las tres vistas; el cambio persiste.

---

### Fase 3 — Configuración de trackers y categorías
**Objetivo:** definir la lista de factores del usuario.
- [ ] `trackers/application`: CRUD de `Tracker` (crear, renombrar, cambiar tipo solo si no tiene datos, **archivar/restaurar**, reordenar), CRUD de `Category`.
- [ ] `trackers/api`: Server Actions + validación Zod (ej. `SCALE` 0–10; `COUNTER` con `unit`/`target` opcionales).
- [ ] `trackers/ui`: pantalla de gestión — lista por categoría, crear/editar tracker (formulario por tipo), drag-to-reorder, archivar con confirmación, set de `target`/`unit`/`expectedPolarity`.
- [ ] Manejar **soft-archive** en UI (sección "archivados", restaurar).

**Aceptación:** puedo definir una lista propia (checks, escalas, contadores con meta), agruparla en categorías, reordenar y archivar sin perder historial.

---

### Fase 4 — Captura diaria (detalle del día)
**Objetivo:** registrar los trackers de cada día + nota + tags.
- [ ] `trackers/application`: `getDayValues(date)`, `upsertTrackerValue(date, trackerId, value)`, borrar valor (volver a "no registrado").
- [ ] Mostrar **solo trackers activos** en la fecha (no archivados y `createdAt` ≤ fecha).
- [ ] `trackers/ui` en `day/[date]`:
  - [ ] `CHECK` → switch/checkbox MUI.
  - [ ] `SCALE` → slider 0–10 (10 = óptimo).
  - [ ] `COUNTER` → input numérico + unidad; si hay `target`, mostrar progreso hacia la meta.
  - [ ] Estado claro **"sin registrar"** vs registrado (poder limpiar un valor).
  - [ ] Campo de **nota/diario** del día.
  - [ ] **Tags** del día (crear al vuelo, asignar/quitar).
  - [ ] Acceso rápido al `ScoreEditor` del día.
- [ ] Optimistic updates; autosave o guardado explícito (definir UX simple y consistente).

**Aceptación:** entro a un día, registro mis factores (cada tipo con su control), escribo una nota, pongo tags; todo persiste y respeta "no registrado ≠ 0".

---

### Fase 5 — Motor de estadísticas + dashboard
**Objetivo:** patrones y efectos acumulativos, genéricos para cualquier lista. (Ver §8 por el detalle de algoritmos.)
- [ ] `statistics/domain`: funciones **puras** y testeadas (correlaciones, medias por grupo, medias móviles, detección de rachas, tendencias, guardas de tamaño muestral).
- [ ] `statistics/application`: `computeStatistics(range?)` que itera trackers activos, despacha por tipo y agrega resultados; respeta la **regla de datos faltantes** (§6.1).
- [ ] `statistics/ui` (`/stats`):
  - [ ] **Impacto por factor**: para cada tracker, su efecto sobre el puntaje (delta promedio / correlación + dirección descubierta), con etiqueta de confianza ("preliminar" vs "consistente") según muestra.
  - [ ] **Efectos acumulativos**: detección tipo "varios días seguidos con X bajo → puntaje cayendo"; visualizar racha + trayectoria del puntaje.
  - [ ] **Patrones**: promedio por día de semana, mejores/peores días, distribución de puntajes.
  - [ ] **Gráficas de tendencia** por tracker (MUI X Charts) y del puntaje en el tiempo.
  - [ ] Selector de rango (semana/mes/año/todo).
- [ ] Tests unitarios sólidos del `statistics/domain` con datasets sintéticos (incluyendo casos con huecos).

**Aceptación:** con datos de prueba, el dashboard muestra correlaciones correctas y con signo correcto, detecta una racha de "mal sueño" asociada a caída de puntaje, y **nunca** usa días no registrados; los tests lo prueban.

---

### Fase 6 — Predicción de puntaje
**Objetivo:** estimar el puntaje del día cuando hay suficientes datos, de forma explicable.
- [ ] Umbral mínimo de datos (ej. ≥ 30–60 días puntuados) antes de habilitar.
- [ ] `prediction/domain`: features = valores de trackers del día + **features de rezago/acumulación** (medias móviles 3/7 días, puntaje del día anterior). Modelo = **regresión lineal multivariante** (o ridge) ligera. Normalización con `target` donde exista.
- [ ] `prediction/application`: `trainModel()` (recalcula periódicamente o on-demand), `predict(date)` → guarda `predictedScore`.
- [ ] `prediction/ui`: mostrar **predicho vs real**, error reciente, y **pesos del modelo** ("qué está empujando tu día") para que sea explicable, no una caja negra.

**Aceptación:** con suficientes datos, se entrena un modelo, predice el día y muestra los factores más influyentes; si no hay datos suficientes, el módulo se muestra deshabilitado con mensaje claro.

---

### Fase 7 — Datos, utilidades y PWA-ready
**Objetivo:** portabilidad, respaldo y base para PWA.
- [ ] **Export/Import** (`data-io`): exportar todo a **JSON** (modelo completo) y **CSV** (días + valores tabulares); importar JSON con validación Zod (merge/replace). Route handlers en `app/api/export|import`.
- [ ] **Backup** del archivo SQLite (descarga del `.db`) vía `app/api/backup`.
- [ ] **Búsqueda/filtrado de días** por criterios (rango de puntaje, tags, "días donde tracker X cumplió/no").
- [ ] **PWA-ready**: `manifest.webmanifest` + meta + iconos placeholder + estructura lista para sumar service worker (`next-pwa`) más adelante. **No** activar PWA completa todavía.

**Aceptación:** puedo exportar e importar mis datos sin pérdida, descargar un backup, filtrar días; el manifest existe y la app es instalable-ready (sin SW activo).

---

### Fase 8 (opcional) — Pulido
- [ ] Accesibilidad (focus, ARIA, contraste del heatmap), responsive fino.
- [ ] Estados de carga/vacío/error consistentes (skeletons MUI).
- [ ] Performance (memoización de cálculos de stats, paginación de rangos largos).
- [ ] Cobertura de tests ampliada (application + e2e ligero opcional con Playwright).

---

## 8. Diseño del motor de estadísticas (detalle)

Todo en `statistics/domain` como funciones puras; `application` solo orquesta. **Genérico**: itera sobre los trackers activos y despacha por tipo.

**Por tracker (impacto):**
- `CHECK`: comparar `score` promedio en días con `done=true` vs `done=false` → **delta** ("+N puntos"). Requiere muestra mínima por grupo (ej. ≥ 5).
- `SCALE`/`COUNTER`: **correlación** (Pearson) entre valor y `score`; el **signo** define la dirección descubierta. Complementar con buckets (sobre/bajo `target` o mediana) para un delta interpretable.

**Efectos acumulativos:**
- Medias móviles (3/7 días) de cada tracker → correlación con el `score` del día (captura "varios días durmiendo mal → cae").
- **Rachas (streaks):** secuencias consecutivas bajo/sobre umbral; relacionar longitud de racha con la trayectoria del puntaje.
- **Tendencia:** ¿el `score` viene bajando en una ventana? ¿qué trackers se mueven con él?

**Patrones generales:** promedio por día de semana, mejores/peores días, distribución del puntaje.

**Guardas:** etiquetar confianza ("preliminar" vs "consistente") según tamaño muestral; nunca afirmar patrones con muestras diminutas. **Excluir siempre** días sin valor o fuera de la ventana del tracker (§6.1).

---

## 9. Features extra incluidas (confirmadas)

- Nota/diario por día · Categorías de trackers · Tags por día.
- Export/Import (JSON/CSV) + backup SQLite (clave para la futura migración de DB).
- Gráficas de tendencia por tracker · Sistema de rachas · Búsqueda/filtrado de días.
- (Sugerencia adicional, opcional) **Metas/objetivos** visibles por tracker usando `target`, y un pequeño resumen "cómo vienes esta semana".

---

## 10. Convenciones para el agente

- Implementar **fase por fase**, en commits/PRs separados con sus criterios de aceptación cumplidos.
- **Archivos pequeños** (~200–250 líneas máx.), responsabilidad única, componentizar.
- Respetar **capas y dirección de dependencias** (§4). UI sin lógica de negocio. Solo `core/repositories/prisma` toca Prisma.
- **TypeScript strict** sin `any`. Tipos de dominio como fuente de verdad; Zod en los bordes.
- Tests al menos para `core/domain` y `statistics/domain` (incluir casos con datos faltantes).
- Acceso al usuario siempre por `getCurrentUserId()` (un solo punto a tocar para multiusuario).
- No introducir librerías nuevas sin necesidad clara; preferir lo del stack (§3).

---

## 11. Roadmap futuro (fuera de alcance ahora)

- **PostgreSQL**: cambiar `provider` + `DATABASE_URL`, ajustar tipos/migraciones; el resto no cambia gracias a los repositorios.
- **Multiusuario + Auth** (ej. NextAuth/Auth.js): poblar `userId` real; el modelo ya está listo.
- **PWA completa** (service worker, offline, instalación).
- **Modelos de predicción** más ricos (más features, validación cruzada) manteniendo explicabilidad.
- **Recordatorios** / quick-entry diario.
```