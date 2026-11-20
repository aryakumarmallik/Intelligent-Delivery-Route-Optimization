import React, { useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, ChevronLeft, ChevronRight, Gauge } from 'lucide-react';

interface PlaybackControlsProps {
  currentStep: number;
  totalSteps: number;
  isPlaying: boolean;
  onPlayPause: () => void;
  onPrev: () => void;
  onNext: () => void;
  onReset: () => void;
  speed: 'slow' | 'normal';
  onSpeedToggle: () => void;
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  currentStep,
  totalSteps,
  isPlaying,
  onPlayPause,
  onPrev,
  onNext,
  onReset,
  speed,
  onSpeedToggle,
}) => {
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isPlaying) {
      const intervalMs = speed === 'slow' ? 1800 : 800;
      timerRef.current = window.setInterval(() => {
        if (currentStep < totalSteps - 1) {
          onNext();
        } else {
          onPlayPause(); // stop when reached end
        }
      }, intervalMs);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, currentStep, totalSteps, speed, onNext, onPlayPause]);

  return (
    <div className="bg-white border-t border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm">
      <div className="flex items-center space-x-2">
        <button
          onClick={onReset}
          title="Reset to Step 0"
          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={onPrev}
          disabled={currentStep <= 0}
          title="Previous Step"
          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent rounded-md transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <button
          onClick={onPlayPause}
          title={isPlaying ? 'Pause' : 'Play / Auto-step'}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-md shadow-sm transition-colors"
        >
          {isPlaying ? (
            <>
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Play</span>
            </>
          )}
        </button>

        <button
          onClick={onNext}
          disabled={currentStep >= totalSteps - 1}
          title="Next Step"
          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent rounded-md transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center space-x-3">
        <span className="text-xs font-medium text-slate-500 font-mono">
          Step <span className="font-semibold text-slate-900">{totalSteps > 0 ? currentStep + 1 : 0}</span> of{' '}
          <span className="font-semibold text-slate-700">{totalSteps}</span>
        </span>

        <button
          onClick={onSpeedToggle}
          title={`Click to switch to ${speed === 'slow' ? 'Normal' : 'Slow'} speed`}
          className="flex items-center space-x-1 px-2 py-1 text-xs border border-slate-200 hover:bg-slate-100 text-slate-700 rounded transition-colors"
        >
          <Gauge className="w-3 h-3 text-slate-500" />
          <span className="capitalize">{speed}</span>
        </button>
      </div>
    </div>
  );
};
