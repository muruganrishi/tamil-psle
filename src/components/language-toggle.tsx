'use client';

import { useState } from 'react';
import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { LanguageMode } from '@/types/database';

interface LanguageToggleProps {
  /** Current language mode */
  value: LanguageMode;
  /** Callback when language changes */
  onChange: (mode: LanguageMode) => void;
  /** Whether to persist the change to user profile */
  persistToProfile?: boolean;
}

const LANGUAGE_LABELS: Record<LanguageMode, { label: string; description: string }> = {
  en: {
    label: 'English',
    description: 'Show meanings in English only',
  },
  ta: {
    label: 'Tamil',
    description: 'Show meanings in Tamil only',
  },
  both: {
    label: 'Both',
    description: 'Show meanings in both languages',
  },
};

export function LanguageToggle({
  value,
  onChange,
  persistToProfile = false,
}: LanguageToggleProps) {
  const [saving, setSaving] = useState(false);

  const handleChange = async (mode: LanguageMode) => {
    onChange(mode);

    if (persistToProfile) {
      setSaving(true);
      try {
        await fetch('/api/profile/language', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ui_language: mode }),
        });
      } catch (error) {
        console.error('Failed to save language preference:', error);
      } finally {
        setSaving(false);
      }
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={saving}>
          <Globe className="mr-2 h-4 w-4" />
          {LANGUAGE_LABELS[value].label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {(Object.keys(LANGUAGE_LABELS) as LanguageMode[]).map((mode) => (
          <DropdownMenuItem
            key={mode}
            onClick={() => handleChange(mode)}
            className={value === mode ? 'bg-orange-50' : ''}
          >
            <div>
              <div className="font-medium">{LANGUAGE_LABELS[mode].label}</div>
              <div className="text-xs text-gray-500">{LANGUAGE_LABELS[mode].description}</div>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
