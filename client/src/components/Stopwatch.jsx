import { useState, useEffect, useRef } from 'react';
import api from '../api';
import { toast } from 'react-hot-toast';
import { Play, Pause, Save, X, Clock } from 'lucide-react';

const GLASS_CLASSES = "bg-white/60 dark:bg-black/40 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-xl shadow-orange-500/10";

export default function Stopwatch({ defaultProjectId, onStop }) {
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    const savedState = localStorage.getItem('stopwatchState');
    if (savedState) {
      const { isRunning: wasRunning, startTime: savedStartTimeStr, elapsedTime: savedElapsed } = JSON.parse(savedState);

      let newElapsed = savedElapsed || 0;

      if (wasRunning && savedStartTimeStr) {
        const savedStart = new Date(savedStartTimeStr);
        const now = new Date();
        const diffSeconds = Math.floor((now - savedStart) / 1000);
        newElapsed += diffSeconds;

        setIsRunning(true);
        setStartTime(new Date(new Date() - newElapsed * 1000));
      } else {
        setTime(newElapsed);
      }
    }
  }, []);

  useEffect(() => {
    const state = {
      isRunning,
      startTime: startTime ? startTime.toISOString() : null,
      elapsedTime: time
    };
    localStorage.setItem('stopwatchState', JSON.stringify(state));
  }, [isRunning, startTime, time]);

  useEffect(() => {
    const handleUnload = () => {
      if (isRunning && time > 0) {
        const endTime = new Date();
        const derivedStartTime = new Date(endTime.getTime() - time * 1000);

        const payload = {
          projectId: defaultProjectId,
          startTime: derivedStartTime.toISOString(),
          endTime: endTime.toISOString(),
          description: "Live Timer Session (Auto-saved)"
        };

        const token = localStorage.getItem('token');
        const url = 'https://freelanceflow-oy9e.onrender.com/api/timelogs';

        fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload),
          keepalive: true
        });

        localStorage.removeItem('stopwatchState');
      }
    };

    window.addEventListener('pagehide', handleUnload);
    return () => window.removeEventListener('pagehide', handleUnload);
  }, [isRunning, time, defaultProjectId]);

  useEffect(() => {
    if (isRunning) {
      if (!timerRef.current) {
        timerRef.current = setInterval(() => {
          setTime(prev => prev + 1);
        }, 1000);
      }
    } else {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => clearInterval(timerRef.current);
  }, [isRunning]);


  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const handleStart = () => {
    if (!defaultProjectId) return toast.error("Please select a project first!");

    if (!startTime) {
      setStartTime(new Date());
    }

    setIsRunning(true);
    toast.success("Timer Started ⏱️");
  };

  const clearLocalData = () => {
    localStorage.removeItem('stopwatchState');
  };

  const handlePauseAndShowToast = () => {
    if (!defaultProjectId) return;

    setIsRunning(false);
    clearInterval(timerRef.current);

    toast.custom((t) => (
      <div className={`${GLASS_CLASSES} p-6 rounded-2xl max-w-sm w-full animate-in fade-in zoom-in duration-300 pointer-events-auto`}>
        <div className="flex items-start gap-4">
          <div className="p-3 bg-orange-500/10 rounded-full">
            <Clock className="w-6 h-6 text-orange-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-slate-800 dark:text-white mb-1">Timer Paused</h3>
            <p className="text-sm text-slate-600 dark:text-gray-400 mb-2">
              Time Logged: <span className="font-mono font-bold text-slate-800 dark:text-white">{formatTime(time)}</span>
            </p>
            <p className="text-xs text-slate-500 mb-4">
              What would you like to do?
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => handleSaveLog(t.id)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 dark:bg-yellow-500 dark:hover:bg-yellow-600 text-white dark:text-black rounded-xl font-medium text-sm transition-all shadow-lg shadow-orange-500/20"
              >
                <Save className="w-4 h-4" /> Save
              </button>
              <button
                onClick={() => handleResume(t.id)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-orange-200 dark:border-yellow-500 text-orange-600 dark:text-yellow-400 hover:bg-orange-50 dark:hover:bg-white/5 rounded-xl font-medium text-sm transition-all"
              >
                <Play className="w-4 h-4" /> Resume
              </button>
            </div>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="mt-2 w-full text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 py-1"
            >
              Dismiss (Keep Paused)
            </button>
          </div>
        </div>
      </div>
    ), { duration: Infinity, id: 'stopwatch-toast' });
  };

  const handleResume = (toastId) => {
    toast.dismiss(toastId);
    setIsRunning(true);
    toast.success("Resumed! ⏯️");
  };

  const getCalculatedStartTime = () => {
    const now = new Date();
    const derivedStart = new Date(now.getTime() - (time * 1000));
    return derivedStart;
  };

  const handleSaveLog = async (toastId) => {
    toast.dismiss(toastId);

    const endTime = new Date();
    const derivedStartTime = new Date(endTime.getTime() - time * 1000);

    try {
      await api.post('/timelogs', {
        projectId: defaultProjectId,
        startTime: derivedStartTime.toISOString(),
        endTime: endTime.toISOString(),
        description: "Live Timer Session"
      });

      setTime(0);
      setStartTime(null);
      clearLocalData();
      if (onStop) onStop();

      toast.success("Session Saved Successfully! ✅");

    } catch (err) {
      console.error(err);
      toast.error("Failed to save. Try again.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4 w-full">
      <div className="text-5xl lg:text-3xl xl:text-5xl font-mono font-bold tracking-wider text-slate-700 dark:text-white bg-slate-100 dark:bg-black/40 px-4 py-4 w-full text-center rounded-2xl shadow-inner transition-all duration-300 select-none">
        {formatTime(time)}
      </div>

      <div className="flex gap-3 w-full">
        {!isRunning ? (
          <button
            onClick={handleStart}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white rounded-xl font-bold shadow-lg shadow-orange-500/30 transition active:scale-95 hover:scale-105"
          >
            <Play className="w-5 h-5 fill-current" /> Start
          </button>
        ) : (
          <button
            onClick={handlePauseAndShowToast}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold shadow-lg shadow-orange-500/30 transition active:scale-95 animate-pulse"
          >
            <Pause className="w-5 h-5 fill-current" /> Stop / Pause
          </button>
        )}
      </div>
    </div>
  );
}