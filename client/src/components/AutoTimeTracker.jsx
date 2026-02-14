import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';

const AutoTimeTracker = ({ projectId, onSave }) => {
    const [elapsed, setElapsed] = useState(0);
    const startTimeRef = useRef(null);
    const intervalRef = useRef(null);

    const hasSavedRef = useRef(false);

    useEffect(() => {

        startTimeRef.current = new Date();
        hasSavedRef.current = false;

        intervalRef.current = setInterval(() => {
            setElapsed(prev => prev + 1);
        }, 1000);


        const saveLog = () => {
            if (hasSavedRef.current || !startTimeRef.current || !projectId) return;

            const endTime = new Date();
            const durationMs = endTime - startTimeRef.current;


            if (durationMs < 5000) return;

            hasSavedRef.current = true;


            const payload = {
                projectId,
                startTime: startTimeRef.current.toISOString(),
                endTime: endTime.toISOString(),
                description: "Auto-tracked Session"
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
            }).then(() => {
                if (onSave) onSave();
            }).catch(console.error);
        };

        const handleUnload = () => {
            saveLog();
        };


        return () => {
            clearInterval(intervalRef.current);
            saveLog();
        };




        window.addEventListener('pagehide', handleUnload);
        return () => {
            window.removeEventListener('pagehide', handleUnload);
        };
    }, [projectId]);


    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
        const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
    };

    return (
        <div className="flex items-center gap-4 p-4 bg-orange-600/10 dark:bg-yellow-500/10 rounded-2xl border border-orange-600/20 dark:border-yellow-500/20 animate-pulse shadow-orange-500/10">
            <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
            </div>
            <div>
                <div className="text-xs font-bold uppercase text-orange-600 dark:text-yellow-500 tracking-wider">Auto-Tracking Active</div>
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
