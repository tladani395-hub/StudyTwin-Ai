'use client';

import React from 'react';
import ThemeControls from '@/components/theme/ThemeControls';

interface Theme3DButtonProps {
  className?: string;
  showLightDarkToggle?: boolean;
  showSoundToggle?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function Theme3DButton({
  className = '',
  showLightDarkToggle = true,
  showSoundToggle = false,
  size = 'md',
}: Theme3DButtonProps) {
  return (
    <ThemeControls
      className={className}
      showLightDark={showLightDarkToggle}
      showSound={showSoundToggle}
      size={size}
    />
  );
}
