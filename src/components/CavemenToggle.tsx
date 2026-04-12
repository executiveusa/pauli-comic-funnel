import React from 'react';
import { useCavemen } from '../contexts/CavemenContext';
import { Volume2, Zap } from 'lucide-react';

export const CavemenToggle: React.FC = () => {
  const { enabled, intensity, toggle, setIntensity } = useCavemen();

  return (
    <div className="flex items-center gap-2 p-2 bg-slate-700 rounded-lg">
      <button
        onClick={toggle}
        aria-label={enabled ? 'Disable caveman mode' : 'Enable caveman mode'}
        aria-pressed={enabled}
        title={enabled ? 'Caveman mode: ON (token-saving)' : 'Caveman mode: OFF'}
        className={`p-2 rounded transition ${
          enabled
            ? 'bg-blue-600 text-white'
            : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
        }`}
      >
        <Volume2 size={18} />
      </button>

      {enabled && (
        <div className="flex gap-1">
          {(['lite', 'full', 'ultra'] as const).map((level) => (
            <button
              key={level}
              onClick={() => setIntensity(level)}
              aria-label={`Set caveman compression to ${level === 'lite' ? '65%' : level === 'full' ? '0%' : '75%'}`}
              aria-pressed={intensity === level}
              className={`px-2 py-1 text-xs rounded transition ${
                intensity === level
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
              }`}
            >
              {level === 'full' ? 'Normal' : level === 'lite' ? '65%' : '75%'}
            </button>
          ))}
        </div>
      )}

      {enabled && (
        <span className="text-xs text-blue-300 flex items-center gap-1 ml-2">
          <Zap size={14} />
          {intensity === 'lite' ? '65% compression' : intensity === 'ultra' ? '75% compression' : 'Active'}
        </span>
      )}
    </div>
  );
};
