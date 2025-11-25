'use client';

export default function Error({
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
          {error.message || 'Ismeretlen hiba történt'}
        </p>
        {error.digest && (
          <p className="text-sm text-gray-500 mb-4">
            Digest: {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          className="w-full bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
        >
          Újrapróbálás
        </button>
      </div>
    </div>
  );
}

