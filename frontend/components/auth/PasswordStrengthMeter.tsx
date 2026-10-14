'use client';

import React from 'react';
import { Check, X } from 'lucide-react';

interface PasswordStrengthProps {
  password: string;
}

export default function PasswordStrengthMeter({ password }: PasswordStrengthProps) {
  if (!password) return null;

  const hasLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  const criteriaMet = [hasLength, hasUpper, hasLower, hasDigit, hasSpecial].filter(Boolean).length;

  let strengthLabel = 'Weak';
  let barColor = 'bg-rose-500';
  let percent = 20;

  if (criteriaMet >= 5) {
    strengthLabel = 'Very Strong';
    barColor = 'bg-emerald-500';
    percent = 100;
  } else if (criteriaMet === 4) {
    strengthLabel = 'Strong';
    barColor = 'bg-teal-500';
    percent = 80;
  } else if (criteriaMet === 3) {
    strengthLabel = 'Good';
    barColor = 'bg-blue-500';
    percent = 60;
  } else if (criteriaMet === 2) {
    strengthLabel = 'Fair';
    barColor = 'bg-amber-500';
    percent = 40;
  }

  return (
    <div className="mt-2 space-y-2 text-xs">
      {/* Progress Bar & Label */}
      <div className="flex items-center justify-between text-[11px] font-medium text-text-muted">
        <span>Password Strength</span>
        <span className="font-semibold text-text-main">{strengthLabel}</span>
      </div>
      <div className="h-1.5 w-full bg-border-subtle/50 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 rounded-full ${barColor}`}
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Criteria Checklist */}
      <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px]">
        <div className={`flex items-center gap-1 ${hasLength ? 'text-emerald-500 font-medium' : 'text-text-muted'}`}>
          {hasLength ? <Check className="w-3 h-3" /> : <X className="w-3 h-3 text-rose-400" />}
          <span>8+ characters</span>
        </div>
        <div className={`flex items-center gap-1 ${hasUpper && hasLower ? 'text-emerald-500 font-medium' : 'text-text-muted'}`}>
          {hasUpper && hasLower ? <Check className="w-3 h-3" /> : <X className="w-3 h-3 text-rose-400" />}
          <span>Upper & lowercase</span>
        </div>
        <div className={`flex items-center gap-1 ${hasDigit ? 'text-emerald-500 font-medium' : 'text-text-muted'}`}>
          {hasDigit ? <Check className="w-3 h-3" /> : <X className="w-3 h-3 text-rose-400" />}
          <span>At least 1 number</span>
        </div>
        <div className={`flex items-center gap-1 ${hasSpecial ? 'text-emerald-500 font-medium' : 'text-text-muted'}`}>
          {hasSpecial ? <Check className="w-3 h-3" /> : <X className="w-3 h-3 text-rose-400" />}
          <span>Special symbol</span>
        </div>
      </div>
    </div>
  );
}
