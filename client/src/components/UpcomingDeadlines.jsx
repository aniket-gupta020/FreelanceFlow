import { useEffect, useState } from 'react';
import api from '../api';
import { Calendar, AlertCircle } from 'lucide-react';

const GLASS_CLASSES = "bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-xl";

const SAMPLE_TASKS = [
  { _id: 't1', title: 'Finalize Mockups', project: { title: 'E-Commerce Redesign' }, dueDate: new Date(Date.now() + 86400000 * 2).toISOString() },
  { _id: 't2', title: 'Database Schema', project: { title: 'Mobile App MVP' }, dueDate: new Date(Date.now() + 86400000 * 5).toISOString() },
  { _id: 't3', title: 'Client Meeting', project: { title: 'Consulting' }, dueDate: new Date(Date.now() + 86400000 * 1).toISOString() }
];

export default function UpcomingDeadlines({ isSampleMode }) {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    if (isSampleMode) {
      setTasks(SAMPLE_TASKS);
    } else {
      fetchUpcomingTasks();
    }
  }, [isSampleMode]);

  const fetchUpcomingTasks = async () => {
    try {
      const res = await api.get('/dashboard/deadlines'); // Use configured axios instance 'api'
      setTasks(res.data);
    } catch (err) {
      console.error('Error fetching tasks:', err);
    }
  };

  const formatDate = (date) => new Date(date).toLocaleDateString();
  const daysUntil = (date) => {
    const diff = new Date(date) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className={`${GLASS_CLASSES} rounded-3xl p-6`}>
      <div className="flex items-center gap-3 mb-4">
        <Calendar className="w-5 h-5 text-amber-500" />
        <h3 className="text-xl font-bold text-slate-800 dark:text-white">Upcoming Deadlines</h3>
      </div>

      {tasks.length === 0 ? (
        <p className="text-slate-600 dark:text-gray-400 text-sm">No upcoming deadlines. Tasks sync when implemented.</p>
      ) : (
        <div className="space-y-3">
          {tasks.map(task => (
            <div key={task._id} className="flex justify-between items-center p-3 bg-white/20 rounded-lg">
              <div>
                <p className="font-semibold text-slate-800 dark:text-white">
                  {task.title} <span className="text-slate-500 font-normal">- {task.project?.title}</span>
                </p>
                <p className="text-xs text-slate-600 dark:text-gray-400">{formatDate(task.dueDate)}</p>
              </div>
              <div className="text-right">
                <p className={`text-sm font-bold ${daysUntil(task.dueDate) <= 3 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {daysUntil(task.dueDate)} days
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
