import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api from '../api';
import Stopwatch from '../components/Stopwatch';
import Sidebar from '../components/Sidebar';
import { useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard, Users, Clock, IndianRupee,
  Calendar, Menu, X, Sun, Moon, LogOut,
  PlayCircle, CheckCircle, AlertCircle, Briefcase, FileText,
  CheckSquare, User, Trash2
} from 'lucide-react';

const GLASS_CLASSES = "bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-xl";
const INPUT_CLASSES = "w-full p-3 pl-10 bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition-all dark:text-white";
const LABEL_CLASSES = "block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1";
const BUTTON_BASE = "flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all duration-300 shadow-lg active:scale-95";

export default function TimeTracker() {
  const [projects, setProjects] = useState([]);
  const [logs, setLogs] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const [manualForm, setManualForm] = useState({
    hours: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [darkMode, setDarkMode] = useState(() => {
    if (localStorage.getItem('theme')) return localStorage.getItem('theme') === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const toggleTheme = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    toast.success(`Switched to ${newMode ? 'Dark' : 'Light'} Mode`, {
      icon: newMode ? <Moon className="w-4 h-4 text-white" /> : <Sun className="w-4 h-4 text-orange-500" />,
      style: { borderRadius: '12px', background: newMode ? '#333' : '#fff', color: newMode ? '#fff' : '#000' }
    });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [projRes, logRes] = await Promise.all([
        api.get('/projects'),
        api.get('/timelogs')
      ]);
      setProjects(projRes.data);
      setLogs(logRes.data);

      if (projRes.data.length > 0 && !selectedProjectId) {
        setSelectedProjectId(projRes.data[0]._id);
      }
    } catch (err) {
      console.error("Failed to load data", err);
    } finally {
      setLoading(false);
    }
  };

  const submitManual = async (e) => {
    e.preventDefault();
    if (!selectedProjectId) return toast.error('Please select a project');

    const hours = parseFloat(manualForm.hours);
    if (isNaN(hours) || hours <= 0) {
      return toast.error('Please enter valid hours (e.g. 1.5)');
    }

    const entryDate = new Date(manualForm.date);
    entryDate.setHours(12, 0, 0, 0);
    const endTime = new Date(entryDate);
    const startTime = new Date(endTime.getTime() - (hours * 60 * 60 * 1000));

    try {
      await api.post('/timelogs', {
        projectId: selectedProjectId,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        description: manualForm.description || 'Manual Entry'
      });
      toast.success('Time logged successfully!');
      setManualForm({ hours: '', description: '', date: new Date().toISOString().split('T')[0] });
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to log time: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = (id) => {
    toast.custom((t) => (
      <div className={`${GLASS_CLASSES} p-6 rounded-2xl max-w-sm w-full animate-in fade-in zoom-in duration-300`}>
        <div className="flex items-start gap-4">
          <div className="p-3 bg-red-500/10 rounded-full">
            <Trash2 className="w-6 h-6 text-red-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-slate-800 dark:text-white mb-1">
              Delete Time Log?
            </h3>
            <p className="text-sm text-slate-600 dark:text-gray-400 mb-4">
              Are you sure you want to remove this entry?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  performDelete(id);
                }}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium text-sm transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => toast.dismiss(t.id)}
                className="flex-1 px-4 py-2 bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-white hover:bg-slate-300 dark:hover:bg-white/20 rounded-xl font-medium text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    ), { duration: Infinity });
  };

  const performDelete = async (id) => {
    try {
      await api.delete(`/timelogs/${id}`);
      setLogs(logs.filter(l => l._id !== id));
      toast.success("Log deleted successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete log");
    }
  };

  const handleLogout = () => {
    toast.custom((t) => (
      <div className={`${GLASS_CLASSES} p-6 rounded-2xl max-w-sm w-full animate-in fade-in zoom-in duration-300`}>
        <div className="flex items-start gap-4">
          <div className="p-3 bg-red-500/10 rounded-full">
            <LogOut className="w-6 h-6 text-red-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-slate-800 dark:text-white mb-1">Log Out?</h3>
            <p className="text-sm text-slate-600 dark:text-gray-400 mb-4">Really want to log out?</p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  localStorage.removeItem('user');
                  localStorage.removeItem('token');
                  toast.success("Logged out successfully");
                  navigate('/login');
                }}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium text-sm transition-colors"
              >
                Log Out
              </button>
              <button
                onClick={() => toast.dismiss(t.id)}
                className="flex-1 px-4 py-2 bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-white hover:bg-slate-300 dark:hover:bg-white/20 rounded-xl font-medium text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    ));
  };

  const totalHours = logs.reduce((acc, log) => acc + (log.durationHours || 0), 0);



  return (
    <div className="min-h-screen transition-colors duration-500 bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 dark:from-gray-900 dark:via-black dark:to-gray-900 select-none">
      <div className="flex h-screen overflow-hidden">
        <div className={`fixed inset-0 z-50 md:hidden pointer-events-none`}>
          <div className={`absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0'}`} onClick={() => setIsMobileMenuOpen(false)} />
          <div className={`absolute top-0 left-0 w-72 h-full ${GLASS_CLASSES} transform transition-transform duration-300 ease-out pointer-events-auto ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <Sidebar mobile={true} closeMobile={() => setIsMobileMenuOpen(false)} darkMode={darkMode} toggleTheme={toggleTheme} handleLogout={handleLogout} user={JSON.parse(localStorage.getItem('user'))} />
          </div>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className={`fixed top-4 right-4 z-50 md:hidden ${GLASS_CLASSES} p-2 rounded-lg text-gray-600 dark:text-gray-300 shadow-lg`}
        >
          <Menu className="w-6 h-6" />
        </button>
        <aside className={`w-72 hidden md:block border-r border-white/20 dark:border-white/5 ${GLASS_CLASSES} z-10`}>
          <Sidebar mobile={false} darkMode={darkMode} toggleTheme={toggleTheme} handleLogout={handleLogout} user={JSON.parse(localStorage.getItem('user'))} />
        </aside>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
          <header className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Time Tracking</h2>
              <p className="text-slate-600 dark:text-gray-400">Manage hours and boost productivity</p>
            </div>

            <div className="flex items-center gap-4">
              <div className={`${GLASS_CLASSES} px-4 py-2 rounded-xl flex items-center gap-2 text-violet-600 dark:text-yellow-400 font-bold`}>
                <Clock className="w-5 h-5" />
                <span>{totalHours.toFixed(2)} Hrs Total</span>
              </div>

            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            <div className="lg:col-span-1 space-y-6">

              <div className={`${GLASS_CLASSES} rounded-3xl p-6`}>
                <label className={LABEL_CLASSES}>Active Project</label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-3.5 w-5 h-5 text-gray-400 dark:text-gray-300" />
                  <select
                    className={INPUT_CLASSES}
                    value={selectedProjectId}
                    onChange={e => setSelectedProjectId(e.target.value)}
                  >
                    <option value="" disabled>-- Select Project --</option>
                    {projects.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}
                  </select>
                </div>
              </div>

              <div className={`${GLASS_CLASSES} rounded-3xl p-6 border-t-4 border-t-violet-500 dark:border-t-yellow-500`}>
                <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                  <PlayCircle className="w-5 h-5 text-violet-500 dark:text-yellow-500" /> Live Timer
                </h3>
                <Stopwatch defaultProjectId={selectedProjectId} onStop={fetchData} />
              </div>

              <div className={`${GLASS_CLASSES} rounded-3xl p-6`}>
                <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-500" /> Manual Entry
                </h3>
                <form onSubmit={submitManual} className="space-y-4">
                  <div>
                    <label className={LABEL_CLASSES}>Description</label>
                    <input
                      type="text"
                      placeholder="Task details..."
                      value={manualForm.description}
                      onChange={e => setManualForm({ ...manualForm, description: e.target.value })}
                      className={`w-full p-3 bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white`}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={LABEL_CLASSES}>Hours</label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-3.5 w-4 h-4 text-gray-400 dark:text-gray-300" />
                        <input
                          type="number"
                          step="0.1"
                          value={manualForm.hours}
                          onChange={e => setManualForm({ ...manualForm, hours: e.target.value })}
                          className={INPUT_CLASSES}
                          placeholder="e.g. 1.5"
                        />
                      </div>
                    </div>
                    <div>
                      <label className={LABEL_CLASSES}>Date</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-3.5 w-4 h-4 text-gray-400 dark:text-gray-300" />
                        <input
                          type="date"
                          value={manualForm.date}
                          onChange={e => setManualForm({ ...manualForm, date: e.target.value })}
                          className={`${INPUT_CLASSES} pl-10 dark:[color-scheme:dark]`}
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className={`w-full ${BUTTON_BASE} bg-emerald-600 hover:bg-emerald-700 text-white justify-center mt-2`}
                  >
                    Log Time
                  </button>
                </form>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className={`${GLASS_CLASSES} rounded-3xl overflow-hidden min-h-[500px] flex flex-col`}>
                <div className="px-6 py-4 border-b border-white/20 dark:border-white/5 bg-white/20 dark:bg-white/5 flex justify-between items-center">
                  <h3 className="font-bold text-slate-800 dark:text-white">Recent Activity</h3>
                  <button onClick={fetchData} className="text-sm text-violet-600 dark:text-yellow-400 hover:underline">Refresh</button>
                </div>

                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="text-slate-500 dark:text-gray-400 text-xs uppercase bg-white/30 dark:bg-black/20">
                        <th className="p-4">Date</th>
                        <th className="p-4">Project</th>
                        <th className="p-4">Task</th>
                        <th className="p-4 text-right">Duration</th>
                        <th className="p-4 text-center">Status</th>
                        <th className="p-4"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/20 dark:divide-white/5">
                      {logs.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="p-10 text-center text-slate-400 dark:text-gray-500">
                            No logs found. Start the timer!
                          </td>
                        </tr>
                      ) : (
                        logs.map(log => (
                          <tr key={log._id} className="hover:bg-white/30 dark:hover:bg-white/5 transition">
                            <td className="p-4 text-sm text-slate-600 dark:text-gray-300">
                              {new Date(log.startTime).toLocaleDateString()}
                            </td>
                            <td className="p-4 font-medium text-slate-800 dark:text-white">
                              {log.project?.title || <span className="text-red-400 italic">Deleted</span>}
                            </td>
                            <td className="p-4 text-sm text-slate-600 dark:text-gray-300 max-w-[150px] truncate">
                              {log.description || '-'}
                            </td>
                            <td className="p-4 text-right font-bold text-slate-700 dark:text-gray-200">
                              {log.durationHours?.toFixed(2)} hrs
                            </td>
                            <td className="p-4 text-center">
                              {log.billed ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 text-xs rounded-full font-bold">
                                  <CheckCircle className="w-3 h-3" /> BILLED
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 text-xs rounded-full font-bold">
                                  <AlertCircle className="w-3 h-3" /> PENDING
                                </span>
                              )}
                            </td>
                            <td className="p-4 text-right">
                              {!log.billed && (
                                <button
                                  onClick={() => handleDelete(log._id)}
                                  className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 rounded-full transition-colors"
                                  title="Delete Log"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}