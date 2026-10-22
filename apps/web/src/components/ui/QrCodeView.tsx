'use client';

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { cn } from '../../lib/utils.ts';

export interface QrCodeViewProps {
  value: string;
  size?: number;
  className?: string;
  darkColor?: string;
  lightColor?: string;
}

export function QrCodeView({
  value,
  size = 120,
  className = '',
  darkColor = '#0f172a',
  lightColor = '#ffffff',
}: QrCodeViewProps) {
  const [svgMarkup, setSvgMarkup] = useState<string>('');

  useEffect(() => {
    let isCancelled = false;

    QRCode.toString(value, {
      type: 'svg',
      margin: 1,
      color: {
        dark: darkColor,
        light: lightColor,
      },
    })
      .then((svg) => {
        if (!isCancelled) {
          setSvgMarkup(svg);
        }
      })
      .catch((err) => {
        console.error('Failed to generate real QR code:', err);
      });

    return () => {
      isCancelled = true;
    };
  }, [value, darkColor, lightColor]);

  if (!svgMarkup) {
    return (
      <div
        style={{ width: size, height: size }}
        className={cn(
          'bg-muted/30 rounded-xl flex items-center justify-center p-2 border border-border shadow-xs',
          className
        )}
      />
    );
  }

  return (
    <div
      style={{ width: size, height: size }}
      className={cn(
        'bg-white rounded-xl overflow-hidden flex items-center justify-center p-1 border border-border/80 shadow-xs [&>svg]:w-full [&>svg]:h-full [&>svg]:block',
        className
      )}
      dangerouslySetInnerHTML={{ __html: svgMarkup }}
      aria-label={`Verified QR Code for ${value}`}
    />
  );
}
