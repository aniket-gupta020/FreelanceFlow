import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { Calendar, Briefcase, ListTodo } from 'lucide-react';

const GLASS_CLASSES = "bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-xl";

export default function UpcomingDeadlines() {
  const [tasks, setTasks] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUpcomingTasks();
  }, []);

  const fetchUpcomingTasks = async () => {
    try {
      const res = await api.get('/dashboard/deadlines');
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

  const handleClick = (task) => {
    const projectId = task.isProjectDeadline ? task._id : (task.project?._id || task.project);
    if (projectId) {
      navigate(`/projects/${projectId}`);
    }
  };

  return (
    <div className={`${GLASS_CLASSES} rounded-3xl p-6`}>
      <div className="flex items-center gap-3 mb-4">
        <Calendar className="w-5 h-5 text-amber-500" />
        <h3 className="text-xl font-bold text-slate-800 dark:text-white">Upcoming Deadlines</h3>
      </div>

      {tasks.length === 0 ? (
        <p className="text-slate-600 dark:text-gray-400 text-sm">No upcoming deadlines.</p>
      ) : (
        <div className="space-y-3">
          {tasks.map(task => (
            <div
              key={task._id}
              onClick={() => handleClick(task)}
              className="flex justify-between items-center p-3 bg-white/20 dark:bg-white/5 rounded-lg cursor-pointer hover:bg-white/40 dark:hover:bg-white/10 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${task.isProjectDeadline ? 'bg-orange-100 dark:bg-yellow-500/20 text-orange-600 dark:text-yellow-400 shadow-orange-500/10' : 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400'}`}>
                  {task.isProjectDeadline ? <Briefcase className="w-4 h-4" /> : <ListTodo className="w-4 h-4" />}
                </div>
                <div>
                  <p className="font-semibold text-slate-800 dark:text-white">
                    {task.title} <span className="text-slate-500 font-normal">- {task.project?.title}</span>
                  </p>
                  <p className="text-xs text-slate-600 dark:text-gray-400">{formatDate(task.dueDate)}</p>
                </div>
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
