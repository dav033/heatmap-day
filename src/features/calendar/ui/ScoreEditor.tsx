'use client';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Slider from '@mui/material/Slider';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import {
  useEffect,
  useOptimistic,
  useRef,
  useState,
  useTransition,
  type ChangeEvent,
} from 'react';

import { scoreToColor } from '@/core/lib/colorScale';
import { setDayScoreAction } from '@/features/calendar/api/actions';

interface ScoreEditorProps {
  date: string;
  initialScore: number | null;
}

const MARKS = [0, 2, 4, 6, 8, 10].map((v) => ({ value: v, label: `${v}` }));

const round1 = (v: number) => Math.round(v * 10) / 10;

export function ScoreEditor({ date, initialScore }: ScoreEditorProps) {
  const [optimisticScore, setOptimisticScore] = useOptimistic<number | null, number | null>(
    initialScore,
    (_prev, next) => next,
  );
  // Valor en vivo mientras se arrastra el slider; el guardado ocurre una sola
  // vez al soltar (onChangeCommitted), no en cada movimiento.
  const [draft, setDraft] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();
  const inputTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (inputTimer.current) clearTimeout(inputTimer.current);
    };
  }, []);

  const commit = (value: number | null) => {
    startTransition(async () => {
      setOptimisticScore(value);
      await setDayScoreAction({ date, score: value });
    });
  };

  const onSliderChange = (_e: Event, value: number | number[]) => {
    setDraft(round1(Array.isArray(value) ? value[0]! : value));
  };

  const onSliderCommitted = (_e: unknown, value: number | number[]) => {
    setDraft(null);
    commit(round1(Array.isArray(value) ? value[0]! : value));
  };

  const onClear = () => commit(null);

  const onInput = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.trim();
    if (inputTimer.current) clearTimeout(inputTimer.current);
    if (raw === '') {
      setDraft(null);
      return onClear();
    }
    const n = Number(raw);
    if (Number.isFinite(n) && n >= 0 && n <= 10) {
      const v = round1(n);
      setDraft(v);
      inputTimer.current = setTimeout(() => {
        setDraft(null);
        commit(v);
      }, 600);
    }
  };

  const shown = draft ?? optimisticScore;
  const color = shown !== null ? scoreToColor(shown) : '#a1a1aa';

  return (
    <Stack spacing={2.5}>
      <Stack direction="row" spacing={3} sx={{ alignItems: 'center' }}>
        <Box
          sx={{
            width: 110,
            height: 110,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: shown !== null
              ? `radial-gradient(circle at 30% 30%, ${color}aa, ${color})`
              : 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: shown !== null ? `0 6px 24px ${color}55` : 'none',
            flexShrink: 0,
            transition: 'background 200ms ease, box-shadow 200ms ease',
          }}
        >
          <Typography
            variant="h1"
            sx={{
              fontSize: '2.4rem',
              fontWeight: 800,
              color: shown !== null ? '#0a0b10' : 'text.secondary',
            }}
          >
            {shown === null ? '—' : shown.toFixed(1)}
          </Typography>
        </Box>
        <Box sx={{ flexGrow: 1 }}>
          <Slider
            value={shown ?? 0}
            min={0}
            max={10}
            step={0.1}
            marks={MARKS}
            valueLabelDisplay="auto"
            onChange={onSliderChange}
            onChangeCommitted={onSliderCommitted}
            aria-label="Puntaje del día"
            sx={{
              '& .MuiSlider-thumb': { width: 18, height: 18 },
              '& .MuiSlider-track': { background: `linear-gradient(90deg, ${scoreToColor(0)}, ${scoreToColor(10)})`, border: 'none', height: 8 },
              '& .MuiSlider-rail': { height: 8 },
            }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            Manual · 0–10 · 1 decimal · 10 = óptimo
          </Typography>
        </Box>
      </Stack>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
        <TextField
          type="number"
          size="small"
          slotProps={{ htmlInput: { step: 0.1, min: 0, max: 10 } }}
          value={shown ?? ''}
          onChange={onInput}
          placeholder="0.0"
          aria-label="Puntaje numérico"
          sx={{ width: 110 }}
        />
        <Button
          variant="outlined"
          onClick={onClear}
          disabled={pending || shown === null}
          size="small"
        >
          Limpiar
        </Button>
      </Stack>
    </Stack>
  );
}
