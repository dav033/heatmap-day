'use client';

import AddIcon from '@mui/icons-material/Add';
import Autocomplete from '@mui/material/Autocomplete';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useState, useTransition } from 'react';

import type { Tag } from '@/core/domain';

import {
  attachTagAction,
  createOrAttachTagAction,
  detachTagAction,
} from '@/features/calendar/api/tagActions';

interface DayTagsEditorProps {
  date: string;
  allTags: Tag[];
  attachedIds: string[];
}

export function DayTagsEditor({ date, allTags, attachedIds }: DayTagsEditorProps) {
  const [inputValue, setInputValue] = useState('');
  const [optimisticIds, setOptimisticIds] = useState<string[]>(attachedIds);
  const [pending, startTransition] = useTransition();

  const tagsById = new Map(allTags.map((t) => [t.id, t]));
  const attachedTags = optimisticIds.map((id) => tagsById.get(id)).filter((t): t is Tag => !!t);
  const available = allTags.filter((t) => !optimisticIds.includes(t.id));

  const addTag = (input: Tag | string | null) => {
    if (!input) return;
    startTransition(async () => {
      if (typeof input === 'string') {
        const name = input.trim();
        if (!name) return;
        const { tagId } = await createOrAttachTagAction({ date, name });
        setOptimisticIds((ids) => (ids.includes(tagId) ? ids : [...ids, tagId]));
      } else {
        setOptimisticIds((ids) => (ids.includes(input.id) ? ids : [...ids, input.id]));
        await attachTagAction({ date, tagId: input.id });
      }
      setInputValue('');
    });
  };

  const removeTag = (tagId: string) => {
    startTransition(async () => {
      setOptimisticIds((ids) => ids.filter((id) => id !== tagId));
      await detachTagAction({ date, tagId });
    });
  };

  return (
    <Stack spacing={1.5}>
      <Typography variant="caption" color="text.secondary">
        Tags
      </Typography>
      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
        {attachedTags.map((t) => (
          <Chip
            key={t.id}
            label={t.name}
            onDelete={() => removeTag(t.id)}
            disabled={pending}
            size="small"
          />
        ))}
        {attachedTags.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            Sin tags. Agregá uno desde abajo.
          </Typography>
        )}
      </Stack>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <Autocomplete
          freeSolo
          size="small"
          options={available}
          getOptionLabel={(option) => (typeof option === 'string' ? option : option.name)}
          inputValue={inputValue}
          onInputChange={(_e, v) => setInputValue(v)}
          onChange={(_e, v) => addTag(v)}
          sx={{ minWidth: 240 }}
          renderInput={(params) => (
            <TextField {...params} placeholder="Agregar tag (Enter para crear)" />
          )}
        />
        <IconButton
          size="small"
          disabled={pending || inputValue.trim() === ''}
          onClick={() => addTag(inputValue)}
          aria-label="Agregar tag"
        >
          <AddIcon />
        </IconButton>
      </Stack>
    </Stack>
  );
}
