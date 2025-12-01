'use client';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Hiba történt</h1>
        <p className="text-gray-700 mb-4">
          {process.env.NODE_ENV === 'development'
            ? error.message || 'Ismeretlen hiba történt'
            : 'Egy hiba történt az admin panel betöltése során. Kérjük, próbáld újra később.'}
        </p>
        {error.digest && (
          <p className="text-sm text-gray-500 mb-4">
            Digest: {error.digest}
          </p>
        )}
        {process.env.NODE_ENV === 'development' && error.stack && (
          <details className="mb-4">
            <summary className="text-sm text-gray-600 cursor-pointer mb-2">
              Stack trace
            </summary>
            <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto max-h-48">
              {error.stack}
            </pre>
          </details>
        )}
        <div className="flex gap-3">
          <button
            onClick={reset}
            className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Újrapróbálás
          </button>
          <button
            onClick={() => window.location.href = '/hu/admin'}
            className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Főoldal
          </button>
        </div>
      </div>
    </div>
  );
}

