import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api from '../api';
import { useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard, Users, Clock, IndianRupee, Menu, X,
  Sun, Moon, LogOut, CheckCircle, Circle, Trash2, Plus,
  Calendar, AlertCircle, CheckSquare, User, ChevronDown, Briefcase
} from 'lucide-react';

const GLASS_CLASSES = "bg-white/60 dark:bg-black/40 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-xl shadow-orange-500/10";
const INPUT_CLASSES = "w-full p-3 pl-10 bg-white/50 dark:bg-black/20 border border-orange-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all dark:text-white";
const LABEL_CLASSES = "block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1";
const BUTTON_BASE = "flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all duration-300 shadow-lg active:scale-95";

const Sidebar = ({ mobile, closeMobile, darkMode, toggleTheme, handleLogout }) => (
  <div className="flex flex-col h-full">
    <div className="p-6 flex items-center justify-between">
      <h1 className="text-2xl font-bold text-orange-600 dark:text-yellow-400 flex items-center gap-2">
        <LayoutDashboard className="w-8 h-8" /> FreelanceFlow
      </h1>
      {mobile && <button onClick={closeMobile}><X className="w-6 h-6 dark:text-white" /></button>}
    </div>
    <nav className="mt-2 px-4 space-y-3 flex-1">
      <Link to="/" className="flex items-center gap-3 px-4 py-3 text-slate-600 dark:text-gray-400 hover:bg-white/20 dark:hover:bg-white/5 rounded-xl font-medium transition-all">
        <LayoutDashboard className="w-5 h-5" /> Dashboard
      </Link>

      <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-orange-500 to-yellow-500 dark:bg-yellow-500 text-white dark:text-black rounded-xl font-medium shadow-lg shadow-orange-500/20">
        <CheckSquare className="w-5 h-5" /> Tasks
      </div>

      <Link to="/clients" className="flex items-center gap-3 px-4 py-3 text-slate-600 dark:text-gray-400 hover:bg-white/20 dark:hover:bg-white/5 rounded-xl font-medium transition-all">
        <Users className="w-5 h-5" /> Clients
      </Link>
      <Link to="/time" className="flex items-center gap-3 px-4 py-3 text-slate-600 dark:text-gray-400 hover:bg-white/20 dark:hover:bg-white/5 rounded-xl font-medium transition-all">
        <Clock className="w-5 h-5" /> Time Tracking
      </Link>
      <Link to="/invoices" className="flex items-center gap-3 px-4 py-3 text-slate-600 dark:text-gray-400 hover:bg-white/20 dark:hover:bg-white/5 rounded-xl font-medium transition-all">
        <IndianRupee className="w-5 h-5" /> Invoices
      </Link>

      <Link to="/profile" className="flex items-center gap-3 px-4 py-3 text-slate-600 dark:text-gray-400 hover:bg-white/20 dark:hover:bg-white/5 rounded-xl font-medium transition-all">
        <User className="w-5 h-5" /> Profile
      </Link>
    </nav>
    <div className="p-4 border-t border-white/20 dark:border-white/5 space-y-3">
      <button onClick={toggleTheme} className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 dark:text-gray-400 hover:bg-white/20 dark:hover:bg-white/5 rounded-xl font-medium transition-all">
        {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />} {darkMode ? "Light Mode" : "Dark Mode"}
      </button>
      <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-500/10 rounded-xl font-medium transition-all">
        <LogOut className="w-5 h-5" /> Log Out
      </button>
    </div>
  </div>
);

const Tasks = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({ title: '', description: '', dueDate: '' });
  const [loading, setLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const [darkMode, setDarkMode] = useState(() => {
    if (localStorage.getItem('theme')) return localStorage.getItem('theme') === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (darkMode) { document.documentElement.classList.add('dark'); localStorage.setItem('theme', 'dark'); }
    else { document.documentElement.classList.remove('dark'); localStorage.setItem('theme', 'light'); }
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
    const fetchProjects = async () => {
      try {
        const res = await api.get('/projects');
        setProjects(res.data);
        if (res.data.length > 0) setSelectedProjectId(res.data[0]._id);
      } catch (err) { console.error("Failed to load projects", err); }
    };
    fetchProjects();
  }, []);

  useEffect(() => {
    if (!selectedProjectId) return;
    const fetchTasks = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/tasks?projectId=${selectedProjectId}`);
        setTasks(res.data);
      } catch (err) { console.error("Failed to load tasks", err); }
      finally { setLoading(false); }
    };
    fetchTasks();
  }, [selectedProjectId]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!selectedProjectId) return toast.error("Select a project first!");
    if (!newTask.title) return toast.error("Title required");

    try {
      const payload = { ...newTask, projectId: selectedProjectId };
      const res = await api.post('/tasks', payload);
      setTasks([res.data, ...tasks]);
      setNewTask({ title: '', description: '', dueDate: '' });
      toast.success("Task created successfully!");
    } catch (err) { toast.error("Error creating task"); }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const res = await api.put(`/tasks/${taskId}`, { status: newStatus });
      setTasks(tasks.map(t => t._id === taskId ? res.data : t));
    } catch (err) { toast.error("Failed to update status"); }
  };

  const handleDelete = (taskId) => {
    toast.custom((t) => (
      <div className={`${GLASS_CLASSES} p-6 rounded-2xl max-w-sm w-full animate-in fade-in zoom-in duration-300`}>
        <div className="flex items-start gap-4">
          <div className="p-3 bg-red-500/10 rounded-full">
            <Trash2 className="w-6 h-6 text-red-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-slate-800 dark:text-white mb-1">
              Delete This Task?
            </h3>
            <p className="text-sm text-slate-600 dark:text-gray-400 mb-4">
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  performDelete(taskId);
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

  const performDelete = async (taskId) => {
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks(tasks.filter(t => t._id !== taskId));
      toast.success("Task deleted successfully");
    } catch (err) { toast.error("Failed to delete task"); }
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

  return (
    <div className="min-h-screen transition-colors duration-500 bg-gradient-to-br from-orange-100 via-yellow-100 to-orange-50 dark:from-gray-900 dark:via-black dark:to-gray-900 select-none">
      <div className="flex h-screen overflow-hidden">

        {/* Mobile Menu Overlay */}
        <div className={`fixed inset-0 z-50 md:hidden pointer-events-none`}>
          <div className={`absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0'}`} onClick={() => setIsMobileMenuOpen(false)} />
          <div className={`absolute top-0 left-0 w-72 h-full ${GLASS_CLASSES} transform transition-transform duration-300 ease-out pointer-events-auto ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <Sidebar mobile={true} closeMobile={() => setIsMobileMenuOpen(false)} darkMode={darkMode} toggleTheme={toggleTheme} handleLogout={handleLogout} />
          </div>
        </div>

        <aside className={`w-72 hidden md:block border-r border-white/20 dark:border-white/5 ${GLASS_CLASSES} z-10`}>
          <Sidebar
            mobile={false}
            darkMode={darkMode}
            toggleTheme={toggleTheme}
            handleLogout={handleLogout}
          />
        </aside>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
          <header className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Project Tasks</h2>
              <p className="text-slate-600 dark:text-gray-400">Manage your to-do list</p>
            </div>
            <button onClick={() => setIsMobileMenuOpen(true)} className={`${GLASS_CLASSES} p-2 rounded-lg text-gray-600 dark:text-gray-300 md:hidden`}><Menu className="w-6 h-6" /></button>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">

            <div className="lg:col-span-1 space-y-6">

              <div className={`${GLASS_CLASSES} rounded-3xl p-6`}>
                <label className={LABEL_CLASSES}>Select Project</label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />

                  <select
                    className={`${INPUT_CLASSES} appearance-none cursor-pointer`}
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                  >
                    <option value="" disabled>-- Choose Project --</option>
                    {projects.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}
                  </select>

                  <ChevronDown className="absolute right-3 top-3.5 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div className={`${GLASS_CLASSES} rounded-3xl p-6 border-t-4 border-orange-500 dark:border-yellow-500 shadow-orange-500/10`}>
                <h3 className="font-bold text-slate-800 dark:text-white mb-4">Add New Task</h3>
                <form onSubmit={handleCreateTask} className="space-y-4">
                  <div>
                    <label className={LABEL_CLASSES}>Title</label>
                    <input
                      type="text"
                      className="w-full p-3 bg-white/50 dark:bg-black/20 border border-orange-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none dark:text-white"
                      placeholder="e.g. Fix Login Bug"
                      value={newTask.title}
                      onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className={LABEL_CLASSES}>Description</label>
                    <textarea
                      className="w-full p-3 bg-white/50 dark:bg-black/20 border border-orange-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none dark:text-white"
                      placeholder="Details..."
                      rows="3"
                      value={newTask.description}
                      onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    ></textarea>
                  </div>
                  <div>
                    <label className={LABEL_CLASSES}>Due Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                      <input
                        type="date"
                        className={`${INPUT_CLASSES} dark:[color-scheme:dark]`}
                        value={newTask.dueDate}
                        onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className={`w-full ${BUTTON_BASE} bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 dark:bg-yellow-500 dark:hover:bg-yellow-600 text-white dark:text-black justify-center mt-2 hover:scale-105`}
                  >
                    <Plus className="w-5 h-5" /> Add Task
                  </button>
                </form>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className={`${GLASS_CLASSES} rounded-3xl overflow-hidden min-h-[500px]`}>
                <div className="p-6 border-b border-white/20 dark:border-white/5 bg-white/20 dark:bg-white/5">
                  <h3 className="font-bold text-slate-800 dark:text-white">Task List</h3>
                </div>

                <div className="p-6 space-y-4">
                  {loading ? (
                    <div className="text-center p-10 text-slate-500">Loading...</div>
                  ) : tasks.length === 0 ? (
                    <div className="text-center py-10 border-2 border-dashed border-white/30 rounded-xl">
                      <p className="text-slate-500 dark:text-gray-400">No tasks found.</p>
                    </div>
                  ) : (
                    tasks.map(task => (
                      <div key={task._id} className="bg-white/40 dark:bg-white/5 border border-white/50 dark:border-white/10 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start gap-4 transition hover:bg-white/60 dark:hover:bg-white/10">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            {task.status === 'done' ? (
                              <CheckCircle className="w-5 h-5 text-emerald-500" />
                            ) : task.status === 'in-progress' ? (
                              <Clock className="w-5 h-5 text-blue-500" />
                            ) : (
                              <Circle className="w-5 h-5 text-slate-400" />
                            )}
                            <h3 className={`font-bold text-lg text-slate-800 dark:text-white ${task.status === 'done' ? 'line-through opacity-60' : ''}`}>
                              {task.title}
                            </h3>
                          </div>
                          <p className="text-slate-600 dark:text-gray-400 text-sm mb-2 ml-8">{task.description}</p>
                          {task.dueDate && (
                            <div className="ml-8 flex items-center gap-2 text-xs text-slate-500 dark:text-gray-500">
                              <Calendar className="w-3 h-3" /> Due: {new Date(task.dueDate).toLocaleDateString()}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 ml-8 sm:ml-0">
                          <select
                            className="p-2 text-sm bg-white/50 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-lg outline-none dark:text-white"
                            value={task.status}
                            onChange={(e) => handleStatusChange(task._id, e.target.value)}
                          >
                            <option value="todo">To Do</option>
                            <option value="in-progress">In Progress</option>
                            <option value="done">Done</option>
                          </select>

                          <button
                            onClick={() => handleDelete(task._id)}
                            className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

export default Tasks;