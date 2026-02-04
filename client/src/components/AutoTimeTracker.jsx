import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';

const AutoTimeTracker = ({ projectId, onSave }) => {
    const [elapsed, setElapsed] = useState(0);
    const startTimeRef = useRef(null);
    const intervalRef = useRef(null);
    // Use a ref to track if we've already saved to prevent double-saving on strict mode or weird unmounts
    const hasSavedRef = useRef(false);

    useEffect(() => {
        // 1. Auto Start on Mount
        startTimeRef.current = new Date();
        hasSavedRef.current = false;

        intervalRef.current = setInterval(() => {
            setElapsed(prev => prev + 1);
        }, 1000);

        // Function to save log
        const saveLog = () => {
            if (hasSavedRef.current || !startTimeRef.current || !projectId) return;

            const endTime = new Date();
            const durationMs = endTime - startTimeRef.current;

            // Only save if duration is meaningful (e.g. > 5 seconds) to avoid accidental refresh spam
            if (durationMs < 5000) return;

            hasSavedRef.current = true; // Mark as saved

            // Construct payload
            const payload = {
                projectId,
                startTime: startTimeRef.current.toISOString(),
                endTime: endTime.toISOString(),
                description: "Auto-tracked Session"
            };

            const token = localStorage.getItem('token');
            // Using the hardcoded URL from api.js since we can't easily access the axios instance base URL here without importing it, 
            // and we need standard fetch for keepalive.
            const url = 'https://freelanceflow-oy9e.onrender.com/api/timelogs';

            // Use fetch with keepalive for reliable exit saving
            fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload),
                keepalive: true
            }).then(() => {
                if (onSave) onSave();
            }).catch(console.error);
        };

        const handleUnload = () => {
            saveLog();
        };

        // 2. Auto Save on Unmount (Component unmount)
        return () => {
            clearInterval(intervalRef.current);
            saveLog();
        };

        // 3. Handle Tab Close / Refresh
        // 'beforeunload' is for prompting validation, 'visibilitychange' or 'pagehide' is better for saving.
        // 'pagehide' is reliable.
        window.addEventListener('pagehide', handleUnload);
        return () => {
            window.removeEventListener('pagehide', handleUnload);
        };
    }, [projectId]);

    // Format time helper
    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
        const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
    };

    return (
        <div className="flex items-center gap-4 p-4 bg-violet-600/10 dark:bg-yellow-500/10 rounded-2xl border border-violet-600/20 dark:border-yellow-500/20 animate-pulse">
            <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-violet-500"></span>
            </div>
            <div>
                <div className="text-xs font-bold uppercase text-violet-600 dark:text-yellow-500 tracking-wider">Auto-Tracking Active</div>
                <div className="font-mono text-xl font-bold text-slate-700 dark:text-gray-200">
                    {formatTime(elapsed)}
                </div>
            </div>
            <div className="ml-auto text-xs text-slate-400 max-w-[150px] text-right">
                Time saves automatically when you leave.
            </div>
        </div>
    );
};

export default AutoTimeTracker;
