import { useState, useEffect, useRef } from 'react';
import api from '../api';
import { toast } from 'react-hot-toast';

export default function Stopwatch({ defaultProjectId, onStop }) {
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const timerRef = useRef(null);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const handleStart = () => {
    if (!defaultProjectId) return toast.error("Please select a project first!");
    toast.success("Timer Started ⏱️");
    setIsRunning(true);
    setStartTime(new Date());
    timerRef.current = setInterval(() => {
      setTime(prev => prev + 1);
    }, 1000);
  };

  const handleStop = async () => {
    if (!startTime || !defaultProjectId) return;

    const endTime = new Date();
    clearInterval(timerRef.current);
    setIsRunning(false);

    try {
      await api.post('/timelogs', {
        projectId: defaultProjectId,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        description: "Live Timer Session"
      });

      setTime(0);
      setStartTime(null);

      if (onStop) onStop();
      toast.success("Timer Stopped. Session Logged! ✅");

    } catch (err) {
      console.error(err);
      toast.error("Failed to save. Check if Project is selected.");
    }
  };

  useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center space-y-4 w-full">
      <div className="text-5xl lg:text-3xl xl:text-5xl font-mono font-bold tracking-wider text-slate-700 dark:text-white bg-slate-100 dark:bg-black/40 px-4 py-4 w-full text-center rounded-2xl shadow-inner transition-all duration-300">
        {formatTime(time)}
      </div>

      <div className="flex gap-3 w-full">
        {!isRunning ? (
          <button
            onClick={handleStart}
            className="flex-1 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/30 transition active:scale-95"
          >
            Start
          </button>
        ) : (
          <button
            onClick={handleStop}
            className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold shadow-lg shadow-red-500/30 transition active:scale-95 animate-pulse"
          >
            Stop
          </button>
        )}
      </div>
    </div>
  );
}