import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api from '../api';
import { useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard, Users, User, Mail, Menu, X, Sun, Moon,
  LogOut, Clock, IndianRupee, CheckSquare
} from 'lucide-react';

const GLASS_CLASSES = "bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-xl";

const Sidebar = ({ mobile, closeMobile, darkMode, toggleTheme, handleLogout }) => (
  <div className="flex flex-col h-full">
    <div className="p-6 flex items-center justify-between">
      <h1 className="text-2xl font-bold text-violet-600 dark:text-yellow-400 flex items-center gap-2">
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

      <div className="flex items-center gap-3 px-4 py-3 bg-violet-600 dark:bg-yellow-500 text-white dark:text-black rounded-xl font-medium shadow-lg shadow-indigo-500/20">
        <Users className="w-5 h-5" /> Clients
      </div>

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

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const storedUser = (() => { try { return JSON.parse(localStorage.getItem('user')); } catch (e) { return null; } })();
  useEffect(() => { if (!storedUser) navigate('/login'); }, [navigate, storedUser]);

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
    api.get('/projects')
      .then(res => {
        const uniqueClients = [];
        const seenIds = new Set();

        res.data.forEach(p => {
          if (p.client && p.client._id && !seenIds.has(p.client._id)) {
            seenIds.add(p.client._id);
            uniqueClients.push(p.client);
          }
        });

        setClients(uniqueClients);
      })
      .catch(err => console.error(err));
  }, []);

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
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 dark:from-gray-900 dark:via-black dark:to-gray-900 transition-colors duration-500">
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
          <header className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Client Directory</h2>
              <p className="text-slate-600 dark:text-gray-400">People hiring on FreelanceFlow</p>
            </div>
            <button onClick={() => setIsMobileMenuOpen(true)} className={`${GLASS_CLASSES} p-2 rounded-lg text-gray-600 dark:text-gray-300`}><Menu className="w-6 h-6" /></button>
          </header>

          {clients.length === 0 ? (
            <div className={`text-center py-20 ${GLASS_CLASSES} rounded-3xl`}>
              <Users className="w-12 h-12 text-slate-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white">No Clients Found</h3>
              <p className="text-slate-500 dark:text-gray-400">Wait for users to post projects.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {clients.map((client) => (
                <div key={client._id} className={`${GLASS_CLASSES} p-6 rounded-2xl flex items-center gap-4 hover:scale-[1.02] transition-all`}>
                  <div className="bg-violet-100 dark:bg-yellow-500/20 p-4 rounded-full text-violet-600 dark:text-yellow-400">
                    <User className="w-6 h-6" />
                  </div>
                  <div className="overflow-hidden">
                    <h3 className="font-bold text-slate-900 dark:text-white truncate">{client.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-gray-400 mt-1 truncate">
                      <Mail className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{client.email}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Clients;