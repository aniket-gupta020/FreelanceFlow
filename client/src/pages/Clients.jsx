import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api from '../api';
import { useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard, Users, User, Mail, Menu, X, Sun, Moon,
  LogOut, Clock, IndianRupee, CheckSquare
} from 'lucide-react';

const GLASS_CLASSES = "bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-xl";

import Sidebar from '../components/Sidebar';

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
    if (!storedUser?._id) return;

    api.get('/projects')
      .then(res => {
        const myFreelancers = [];
        const seenIds = new Set();

        // 1. Filter projects where I am the client
        const myProjects = res.data.filter(p =>
          p.client && (p.client._id === storedUser._id || p.client === storedUser._id)
        );

        // 2. Extract applicants from my projects
        myProjects.forEach(p => {
          if (p.applicants && p.applicants.length > 0) {
            p.applicants.forEach(applicant => {
              const appData = typeof applicant === 'object' ? applicant : null; // Handle if populate failed or it's just ID (though backend populates it)
              if (appData && appData._id && !seenIds.has(appData._id)) {
                seenIds.add(appData._id);
                myFreelancers.push(appData);
              }
            });
          }
        });

        setClients(myFreelancers);
      })
      .catch(err => console.error(err));
  }, [storedUser._id]); // Add dependency

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
            <Sidebar mobile={true} closeMobile={() => setIsMobileMenuOpen(false)} darkMode={darkMode} toggleTheme={toggleTheme} handleLogout={handleLogout} user={storedUser} />
          </div>
        </div>

        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className={`fixed top-4 right-4 z-50 md:hidden ${GLASS_CLASSES} p-2 rounded-lg text-gray-600 dark:text-gray-300 shadow-lg`}
        >
          <Menu className="w-6 h-6" />
        </button>

        <aside className={`w-72 hidden md:block border-r border-white/20 dark:border-white/5 ${GLASS_CLASSES} z-10`}>
          <Sidebar
            mobile={false}
            darkMode={darkMode}
            toggleTheme={toggleTheme}
            handleLogout={handleLogout}
            user={storedUser}
          />
        </aside>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
          <header className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Clients</h2>
              <p className="text-slate-600 dark:text-gray-400">People working on your projects</p>
            </div>

          </header>

          {clients.length === 0 ? (
            <div className={`text-center py-20 ${GLASS_CLASSES} rounded-3xl`}>
              <Users className="w-12 h-12 text-slate-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white">No Clients Found</h3>
              <p className="text-slate-500 dark:text-gray-400">Once people apply to your projects, they will appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {clients.map((client) => {
                const getSafeId = (id) => id?._id || id?.id || id;
                return (
                  <div
                    key={client._id}
                    onClick={() => navigate(`/clients/${client._id}`)}
                    className={`${GLASS_CLASSES} p-6 rounded-2xl flex flex-col gap-4 hover:scale-[1.02] transition-all cursor-pointer group`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="bg-violet-100 dark:bg-yellow-500/20 p-4 rounded-full text-violet-600 dark:text-yellow-400 group-hover:rotate-12 transition-transform">
                        <User className="w-6 h-6" />
                      </div>
                      <div className="overflow-hidden">
                        <h3 className="font-bold text-slate-900 dark:text-white truncate text-lg">{client.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-gray-400 mt-1 truncate">
                          <Mail className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{client.email}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-2 pt-4 border-t border-white/20 dark:border-white/5 flex justify-between items-center">
                      <div className="flex flex-col">
                        <span className="text-xs text-slate-500 dark:text-gray-500 uppercase font-bold tracking-wider">Mobile</span>
                        <span className="text-sm font-medium text-slate-700 dark:text-gray-300">{client.mobile || 'N/A'}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-xs text-slate-500 dark:text-gray-500 uppercase font-bold tracking-wider">Hourly Rate</span>
                        <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                          <IndianRupee className="w-3 h-3" />
                          <span>{client.defaultHourlyRate || 0}/hr</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Clients;