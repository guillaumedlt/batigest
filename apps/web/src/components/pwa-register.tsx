'use client';

import { useEffect } from 'react';
import { registerServiceWorker } from '@/lib/register-sw';

export function PwaRegister() {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return null;
}
