'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ForgotPasswordPage from '../forgot-password/page';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg-app flex items-center justify-center">Loading...</div>}>
      <ForgotPasswordPage />
    </Suspense>
  );
}
