'use client';

import React from 'react';
import { ErrorView } from '../../../components/error/ErrorView.tsx';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorView
      error={error}
      reset={reset}
      density="compact"
      portalTitle="Admin Console Disruption"
      homeHref="/admin"
    />
  );
}
