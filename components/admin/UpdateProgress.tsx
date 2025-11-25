'use client';

interface UpdateProgressProps {
  progress: {
    status: string;
    message: string;
    progress: number;
    currentStep?: string;
    totalSteps?: number;
    error?: string;
    log?: string;
  };
}

export function UpdateProgress({ progress }: UpdateProgressProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'starting':
      case 'in_progress':
        return 'bg-primary-600';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return '✓';
      case 'error':
        return '✗';
      default:
        return '⟳';
    }
  };

  const steps = [
    { key: 'git_pull', label: 'Git változások letöltése' },
    { key: 'npm_install', label: 'Függőségek telepítése' },
    { key: 'db_migrate', label: 'Adatbázis migrációk' },
    { key: 'docker_build', label: 'Docker build' },
    { key: 'docker_restart', label: 'Docker újraindítás' },
    { key: 'completed', label: 'Frissítés befejezve' },
  ];

  const currentStepIndex = steps.findIndex(
    (s) => s.key === progress.currentStep
  );

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">
            {progress.message}
          </span>
          <span className="text-sm text-gray-600">
            {Math.round(progress.progress)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${getStatusColor(
              progress.status
            )} flex items-center justify-center`}
            style={{ width: `${progress.progress}%` }}
          >
            {progress.status === 'in_progress' && (
              <div className="w-full h-full bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer"></div>
            )}
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-2">
        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          const isPending = index > currentStepIndex;

          return (
            <div
              key={step.key}
              className={`flex items-center gap-3 p-2 rounded-lg transition-all ${
                isCurrent
                  ? 'bg-primary-50 border border-primary-200'
                  : isCompleted
                  ? 'bg-green-50'
                  : 'bg-gray-50'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  isCompleted
                    ? 'bg-green-500 text-white'
                    : isCurrent
                    ? 'bg-primary-600 text-white animate-spin'
                    : 'bg-gray-300 text-gray-600'
                }`}
              >
                {isCompleted ? '✓' : isCurrent ? '⟳' : index + 1}
              </div>
              <span
                className={`text-sm ${
                  isCurrent
                    ? 'font-semibold text-primary-700'
                    : isCompleted
                    ? 'text-green-700'
                    : 'text-gray-500'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Live Log */}
      {progress.log && (
        <div className="p-4 bg-gray-900 text-green-400 rounded-lg font-mono text-xs max-h-96 overflow-y-auto">
          <div className="flex justify-between items-center mb-2">
            <span className="text-green-300 font-semibold">Live Log:</span>
            {progress.status === 'in_progress' && (
              <span className="text-green-400 animate-pulse">●</span>
            )}
          </div>
          <pre className="whitespace-pre-wrap break-words">
            {progress.log}
          </pre>
        </div>
      )}

      {/* Error message */}
      {progress.status === 'error' && progress.error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 font-semibold mb-1">Hiba történt:</p>
          <p className="text-red-700 text-sm">{progress.error}</p>
        </div>
      )}

      {/* Success message */}
      {progress.status === 'completed' && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 font-semibold">
            ✓ Frissítés sikeresen befejezve!
          </p>
          <p className="text-green-700 text-sm mt-1">
            Az oldal hamarosan újratöltődik...
          </p>
        </div>
      )}
    </div>
  );
}

