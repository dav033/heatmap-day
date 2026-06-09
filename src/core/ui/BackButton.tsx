'use client';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Button from '@mui/material/Button';
import Link from 'next/link';

interface BackButtonProps {
  href?: string;
  label?: string;
}

export function BackButton({ href = '/', label = 'Calendario' }: BackButtonProps) {
  return (
    <Button
      component={Link}
      href={href}
      startIcon={<ArrowBackIcon />}
      variant="text"
      color="inherit"
    >
      {label}
    </Button>
  );
}