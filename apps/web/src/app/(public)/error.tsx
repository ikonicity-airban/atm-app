'use client';

import React from 'react';
import { ErrorView } from '../../components/error/ErrorView.tsx';

export default function PublicError({
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
      portalTitle="Something went wrong"
      homeHref="/"
    />
  );
}
