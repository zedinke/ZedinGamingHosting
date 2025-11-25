'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Hiba történt
        </h1>
        <p className="text-gray-600 mb-2">
          {error.message || 'Ismeretlen hiba történt a dashboard betöltése során.'}
        </p>
        {error.digest && (
          <p className="text-sm text-gray-500 mb-4">
            Digest: {error.digest}
          </p>
        )}
        <div className="flex gap-4 justify-center">
          <Button onClick={reset}>
            Újrapróbálás
          </Button>
          <Button
            variant="outline"
            onClick={() => window.location.href = '/'}
          >
            Főoldal
          </Button>
        </div>
      </div>
    </div>
  );
}

