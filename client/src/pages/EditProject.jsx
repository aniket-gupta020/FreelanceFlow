import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api from '../api';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  LayoutDashboard, Users, ChevronLeft, Save,
  Menu, X, Sun, Moon, LogOut, Clock, IndianRupee,
  CheckSquare, User
} from 'lucide-react';

const GLASS_CLASSES = "bg-white/60 dark:bg-black/40 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-xl shadow-orange-500/10";
const INPUT_CLASSES = "w-full p-3 bg-white/50 dark:bg-black/20 border border-orange-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all dark:text-white";
const LABEL_CLASSES = "block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1";
const BUTTON_BASE = "flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all duration-300 shadow-lg active:scale-95 hover:scale-105";

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
      <Link to="/tasks" className="flex items-center gap-3 px-4 py-3 text-slate-600 dark:text-gray-400 hover:bg-white/20 dark:hover:bg-white/5 rounded-xl font-medium transition-all">
        <CheckSquare className="w-5 h-5" /> Tasks
      </Link>
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

const EditProject = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    budget: '',
    deadline: ''
  });
  const [loading, setLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [darkMode, setDarkMode] = useState(() => {
    if (localStorage.getItem('theme')) return localStorage.getItem('theme') === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const { id } = useParams();
  const navigate = useNavigate();

  const storedUser = (() => { try { return JSON.parse(localStorage.getItem('user')); } catch (e) { return null; } })();
  useEffect(() => { if (!storedUser) navigate('/login'); }, [navigate, storedUser]);

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
    api.get(`/projects`)
      .then(res => {
        const project = res.data.find(p => String(p._id) === String(id));
        if (project) {
          setFormData({
            title: project.title,
            description: project.description,
            budget: project.budget,
            deadline: project.deadline.split('T')[0]
          });
        }
      })
      .catch(err => console.error(err));
  }, [id]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put(`/projects/${id}`, formData);
      toast.success("Project Updated Successfully!");
      navigate('/');
    } catch (err) {
      toast.error("Failed to update project");
    } finally {
      setLoading(false);
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
                  try { delete api.defaults.headers.common['Authorization']; } catch (e) { }
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
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('/')} className={`p-2 rounded-full ${GLASS_CLASSES} hover:scale-110 transition`}>
                <ChevronLeft className="w-6 h-6 text-slate-700 dark:text-white" />
              </button>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Edit Project</h2>
            </div>
            <button onClick={() => setIsMobileMenuOpen(true)} className={`${GLASS_CLASSES} p-2 rounded-lg text-gray-600 dark:text-gray-300 md:hidden`}><Menu className="w-6 h-6" /></button>
          </header>

          <div className={`max-w-3xl mx-auto ${GLASS_CLASSES} rounded-3xl p-8`}>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className={LABEL_CLASSES}>Project Title</label>
                <input type="text" name="title" value={formData.title} required className={INPUT_CLASSES} onChange={handleChange} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={LABEL_CLASSES}>Budget (₹)</label>
                  <input type="number" name="budget" value={formData.budget} required className={INPUT_CLASSES} onChange={handleChange} />
                </div>
                <div>
                  <label className={LABEL_CLASSES}>Deadline</label>
                  <input type="date" name="deadline" value={formData.deadline} required className={`${INPUT_CLASSES} dark:[color-scheme:dark]`} onChange={handleChange} />
                </div>
              </div>

              <div>
                <label className={LABEL_CLASSES}>Description</label>
                <textarea name="description" value={formData.description} required rows="5" className={INPUT_CLASSES} onChange={handleChange} />
              </div>

              <div className="pt-4 flex justify-end gap-4">
                <button type="button" onClick={() => navigate('/')} className="px-6 py-2.5 text-slate-600 dark:text-gray-300 font-medium hover:bg-white/20 rounded-xl transition">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className={`${BUTTON_BASE} bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 dark:bg-yellow-500 dark:hover:bg-yellow-600 text-white dark:text-black justify-center`}>
                  <Save className="w-5 h-5" /> {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default EditProject;