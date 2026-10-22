'use client';

import React, { useEffect, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { isSoundEnabled, setSoundEnabled, playClickSound } from '../../lib/sound.ts';

interface SoundToggleProps {
  showLabel?: boolean;
  className?: string;
}

export function SoundToggle({ showLabel = false, className = '' }: SoundToggleProps) {
  const [enabled, setEnabled] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setEnabled(isSoundEnabled());
    setMounted(true);

    const handleSoundChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ enabled: boolean }>;
      if (customEvent.detail) {
        setEnabled(customEvent.detail.enabled);
      }
    };

    window.addEventListener('atm_sound_changed', handleSoundChange);
    return () => window.removeEventListener('atm_sound_changed', handleSoundChange);
  }, []);

  const handleToggle = () => {
    const next = !enabled;
    setEnabled(next);
    setSoundEnabled(next);
  };

  if (!mounted) {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <div className="w-10 h-6 bg-muted rounded-full animate-pulse" />
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {showLabel && (
        <span className="text-xs font-medium text-muted-foreground select-none">
          {enabled ? 'Sound On' : 'Sound Off'}
        </span>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={handleToggle}
        className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 min-h-7 ${
          enabled ? 'bg-primary' : 'bg-muted'
        }`}
        aria-label={enabled ? 'Disable interface sounds' : 'Enable interface sounds'}
        title={enabled ? 'Sound enabled (click effects and Sienna car sounds)' : 'Sound disabled'}
      >
        <span
          className={`pointer-events-none inline-flex h-6 w-6 transform items-center justify-center rounded-full bg-card shadow-lg ring-0 transition duration-200 ease-in-out ${
            enabled ? 'translate-x-5' : 'translate-x-0'
          }`}
        >
          {enabled ? (
            <Volume2 className="h-3.5 w-3.5 text-primary" />
          ) : (
            <VolumeX className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </span>
      </button>
    </div>
  );
}
