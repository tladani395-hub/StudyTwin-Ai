'use client';

import React from 'react';
import ColorButtonCSS from './ColorButtonCSS';

interface ColorButtonProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function ColorButton({ className = '', size = 'md' }: ColorButtonProps) {
  return <ColorButtonCSS className={className} size={size} />;
}
