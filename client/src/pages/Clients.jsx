import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api from '../api';
import { useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard, Users, User, Mail, Menu, X, Sun, Moon,
  LogOut, Clock, IndianRupee, CheckSquare, Plus, Lock, ChevronDown, ChevronRight, UserMinus, History, Search
} from 'lucide-react';
import UpgradeButton from '../components/UpgradeButton'; // Import UpgradeButton


// Styling Constants
const GLASS_CLASSES = "bg-white/60 dark:bg-black/40 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-xl shadow-orange-500/10";
const BUTTON_BASE = "flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all duration-300 shadow-lg active:scale-95 hover:scale-105";
const ACCENT_BG = "bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 dark:bg-yellow-500 dark:hover:bg-yellow-600 text-white dark:text-black";


import Sidebar from '../components/Sidebar';
import LoadingPage from '../components/LoadingPage';
import { formatCurrency } from '../utils/formatCurrency';

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  // NEW STATE FOR FREELANCERS
  const [userSubscription, setUserSubscription] = useState('free');
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', email: '', phone: '+91 ' });
  const [searchQuery, setSearchQuery] = useState('');
  const [activeClients, setActiveClients] = useState([]);
  const [pastClients, setPastClients] = useState([]);
  const [showPastClients, setShowPastClients] = useState(false);
  const [deletedClients, setDeletedClients] = useState([]);
  const [showDeletedClients, setShowDeletedClients] = useState(false);
  const [allProjects, setAllProjects] = useState([]); // Store all projects for status checks

  const navigate = useNavigate();

  const storedUser = (() => { try { return JSON.parse(localStorage.getItem('user')); } catch (e) { return null; } })();

  // Robust check for user role
  const isFreelancer = storedUser?.role === 'freelancer';

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

  // FETCH DATA BASED ON ROLE
  useEffect(() => {
    if (!storedUser?._id) return;

    setLoading(true);

    if (isFreelancer) {
      // 1. Fetch My Clients
      const fetchClients = api.get('/clients');
      // 2. Fetch User Plan (Refresh from DB to be sure)
      const fetchUser = api.get(`/users/${storedUser._id}`);
      // 3. Fetch Projects to check status
      const fetchProjects = api.get('/projects');

      Promise.all([fetchClients, fetchUser, fetchProjects])
        .then(([resClients, resUser, resProjects]) => {
          const allClients = resClients.data;
          const allProjects = resProjects.data;

          // Helper to check if project is active
          const isProjectActive = (project) => {
            const status = project.status ? project.status.toLowerCase() : 'active';
            if (status === 'completed') return false;
            if (status === 'expired') return false; // Explicit check for expired
            // Check if deadline passed
            if (project.deadline && new Date(project.deadline) < new Date()) return false;
            return true;
          };

          // Filter clients
          const active = [];
          const past = [];
          const deleted = [];

          allClients.forEach(client => {
            // Find projects for this client
            const clientProjects = allProjects.filter(p => {
              const pClientId = p.client?._id || p.client;
              return String(pClientId) === String(client._id);
            });

            // Check if ANY project is active
            const hasActiveProject = clientProjects.some(p => isProjectActive(p));

            // Priority logic: Active projects always bring a client to the "Active" section
            if (hasActiveProject) {
              active.push(client);
              return;
            }

            // If no active projects, use the isDeleted flag
            if (client.isDeleted) {
              deleted.push(client);
              return;
            }

            if (clientProjects.length === 0) {
              // Active: New client with no projects
              active.push(client);
            } else {
              // Past: Has only inactive projects
              past.push(client);
            }
          });

          setClients(allClients); // Keep full list if needed, or just use active/past
          setActiveClients(active);
          setPastClients(past);
          setDeletedClients(deleted);
          setAllProjects(allProjects); // Save for later checks

          setUserSubscription(resUser.data.subscription || resUser.data.plan || 'free');
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          toast.error("Failed to load clients");
          setLoading(false);
        });

    } else {
      // EXISTING LOGIC FOR CLIENT ROLE (View Freelancers)
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
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [storedUser?._id, isFreelancer]);

  // ADD CLIENT HANDLER
  const handleAddClient = async (e) => {
    e.preventDefault();

    // Phone validation
    const digitsOnly = newClient.phone.replace(/\D/g, '');

    // Strict check for India (starts with 91)
    if (digitsOnly.startsWith('91')) {
      if (digitsOnly.length !== 12) { // 91 + 10 digits = 12
        return toast.error("For India (+91), please enter exactly 10 digits.");
      }
    } else {
      // Generic validation for other codes (assuming min 1 digit code + 10 digit number = 11)
      if (digitsOnly.length < 11 || digitsOnly.length > 15) {
        return toast.error("Please enter a valid phone number (Min 10 digits + Country Code).");
      }
    }

    try {
      const res = await api.post('/clients', newClient);
      const newClientId = res.data._id;

      toast.success("Client added successfully!");
      setShowAddClientModal(false);
      setNewClient({ name: '', email: '', phone: '+91 ' });

      // Navigate to the newly created client's profile
      navigate(`/clients/${newClientId}`);
    } catch (err) {
      console.error(err);
      // Check for limit error
      if (err.response?.status === 403) {
        toast.error(err.response.data.message); // "Free limit reached"
      } else {
        toast.error("Failed to add client");
      }
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

  // CALCULATE LIMITS
  const clientCount = activeClients.length + pastClients.length + deletedClients.length; // Count ALL clients including deleted ones
  const isLimitReached = isFreelancer && userSubscription === 'free' && clientCount >= 2;

  const handleDeleteClient = async (e, clientId) => {
    e.stopPropagation();

    // Check if client has active projects
    const hasActiveProjects = allProjects.some(p =>
      (p.client?._id || p.client) === clientId &&
      p.status?.toLowerCase() !== 'completed' &&
      new Date(p.deadline) > new Date()
    );

    const performDelete = async () => {
      try {
        await api.delete(`/clients/${clientId}`);
        toast.success("Client moved to Previous Clients");

        // Update local state without refetching
        const clientToDelete = clients.find(c => c._id === clientId);
        if (clientToDelete) {
          const updatedClient = { ...clientToDelete, isDeleted: true };
          setClients(prev => prev.map(c => c._id === clientId ? updatedClient : c));

          // Move from active/past to deleted
          setActiveClients(prev => prev.filter(c => c._id !== clientId));
          setPastClients(prev => prev.filter(c => c._id !== clientId));
          setDeletedClients(prev => [...prev, updatedClient]);
        }
      } catch (err) {
        console.error(err);
        toast.error(err.response?.data?.message || "Failed to remove client");
      }
    };

    const showSecondWarning = () => {
      toast.custom((t) => (
        <div className={`${GLASS_CLASSES} p-6 rounded-2xl max-w-sm w-full border-2 border-red-500/50 animate-in fade-in zoom-in duration-300`}>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-red-500/20 rounded-full">
              <Lock className="w-6 h-6 text-red-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-red-600 dark:text-red-400 mb-1">
                Final Warning!
              </h3>
              <p className="text-sm text-slate-700 dark:text-gray-300 mb-4">
                This client has <b>active work</b>. Moving them to Previous Clients will instantly <b>mark all projects as completed</b>. Continue?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    toast.dismiss(t.id);
                    performDelete();
                  }}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm transition-colors"
                >
                  Yes, Complete All
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

    toast.custom((t) => (
      <div className={`${GLASS_CLASSES} p-6 rounded-2xl max-w-sm w-full animate-in fade-in zoom-in duration-300`}>
        <div className="flex items-start gap-4">
          <div className="p-3 bg-red-500/10 rounded-full">
            <UserMinus className="w-6 h-6 text-red-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-slate-800 dark:text-white mb-1">
              Remove Client?
            </h3>
            <p className="text-sm text-slate-600 dark:text-gray-400 mb-4">
              Have you completed work with this client?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  if (hasActiveProjects) {
                    showSecondWarning();
                  } else {
                    performDelete();
                  }
                }}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium text-sm transition-colors"
              >
                Yes
              </button>
              <button
                onClick={() => toast.dismiss(t.id)}
                className="flex-1 px-4 py-2 bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-white hover:bg-slate-300 dark:hover:bg-white/20 rounded-xl font-medium text-sm transition-colors"
              >
                No
              </button>
            </div>
          </div>
        </div>
      </div>
    ), { duration: Infinity });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-yellow-100 to-orange-50 dark:from-gray-900 dark:via-black dark:to-gray-900 transition-colors duration-500">
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
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
                {isFreelancer ? "My Clients" : "Freelancers"}
              </h2>
              <p className="text-slate-600 dark:text-gray-400">
                {isFreelancer ? "Manage your clients and billing" : "People working on your projects"}
              </p>
            </div>

            {/* Floating Action Button for Mobile */}
            {isFreelancer && (
              <div className="fixed bottom-8 right-8 z-40 md:static">
                {isLimitReached ? (
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800 shadow-2xl md:shadow-none">
                      <Lock className="w-4 h-4" />
                      <span className="text-sm font-bold">Limit Reached</span>
                    </div>
                    <p className="text-[10px] font-bold text-red-500 dark:text-red-400 uppercase tracking-tighter mr-2">
                      {clientCount}/2 Clients created
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAddClientModal(true)}
                    className={`${BUTTON_BASE} ${ACCENT_BG} shadow-2xl md:shadow-lg !rounded-full md:!rounded-xl p-4 md:px-5 md:py-2.5`}
                  >
                    <Plus className="w-6 h-6 md:w-5 md:h-5" />
                    <span className="hidden md:inline">New Client</span>
                  </button>
                )}
              </div>
            )}
          </header>

          {/* Search Bar */}
          <div className="relative w-full mb-8">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search clients by name, email, phone, or project..."
              className="block w-full pl-10 pr-3 py-2 border border-orange-200 dark:border-white/10 rounded-xl leading-5 bg-white/50 dark:bg-black/20 text-slate-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent sm:text-sm transition-all shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* UPGRADE BANNER (If Limit Reached) */}
          {isLimitReached && (
            <div className="mb-8 animate-in slide-in-from-top-4 duration-500">
              <UpgradeButton />
            </div>
          )}

          {loading ? (
            <LoadingPage />
          ) : (
            <>
              {(() => {
                // Filter functions
                const filterList = (list) => {
                  if (!searchQuery) return list;
                  const lowerQuery = searchQuery.toLowerCase();

                  return list.filter(client => {
                    // 1. Check basic fields
                    if (
                      client.name?.toLowerCase().includes(lowerQuery) ||
                      client.email?.toLowerCase().includes(lowerQuery) ||
                      (client.phone || client.mobile)?.includes(lowerQuery)
                    ) {
                      return true;
                    }

                    // 2. Check projects
                    const clientProjects = allProjects.filter(p =>
                      (p.client?._id || p.client) === client._id
                    );

                    return clientProjects.some(p => p.title?.toLowerCase().includes(lowerQuery));
                  });
                };

                const filteredActive = filterList(activeClients);
                const filteredPast = filterList(pastClients);
                const filteredDeleted = filterList(deletedClients);

                const hasResults = filteredActive.length > 0 || filteredPast.length > 0 || filteredDeleted.length > 0;

                if (!hasResults && searchQuery) {
                  return (
                    <div className={`text-center py-20 ${GLASS_CLASSES} rounded-3xl`}>
                      <Search className="w-12 h-12 text-slate-300 dark:text-gray-600 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-slate-900 dark:text-white">No Clients Found</h3>
                      <p className="text-slate-500 dark:text-gray-400">
                        No matches found for "{searchQuery}"
                      </p>
                    </div>
                  );
                }

                if (activeClients.length === 0 && pastClients.length === 0 && deletedClients.length === 0) {
                  return (
                    <div className={`text-center py-20 ${GLASS_CLASSES} rounded-3xl`}>
                      <Users className="w-12 h-12 text-slate-300 dark:text-gray-600 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-slate-900 dark:text-white">
                        {isFreelancer ? "No Clients Yet" : "No Freelancers Found"}
                      </h3>
                      <p className="text-slate-500 dark:text-gray-400">
                        {isFreelancer
                          ? "Add your first client to start tracking time and invoicing."
                          : "Once people apply to your projects, they will appear here."}
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="flex flex-col gap-12">
                    {/* Active Clients Grid */}
                    {filteredActive.length > 0 && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
                        {filteredActive.map((client) => (
                          <div
                            key={client._id}
                            onClick={() => navigate(`/clients/${client._id}`)}
                            className={`${GLASS_CLASSES} p-6 rounded-2xl flex flex-col gap-4 hover:scale-105 transition-all cursor-pointer group animate-fade-in-up`}
                          >
                            {/* Client Card Content (Same as before) */}
                            <div className="flex items-center gap-4">
                              <div className="bg-orange-100 dark:bg-yellow-500/20 p-4 rounded-full text-orange-600 dark:text-yellow-400 group-hover:rotate-12 transition-transform">
                                <User className="w-6 h-6" />
                              </div>
                              <div className="overflow-hidden flex-1">
                                <div className="flex justify-between items-start">
                                  <h3 className="font-bold text-slate-900 dark:text-white truncate text-lg">{client.name}</h3>
                                  <button
                                    onClick={(e) => handleDeleteClient(e, client._id)}
                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                    title="Remove Client"
                                  >
                                    <UserMinus className="w-4 h-4" />
                                  </button>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-gray-400 mt-1 truncate">
                                  <Mail className="w-4 h-4 flex-shrink-0" />
                                  <span className="truncate">{client.email}</span>
                                </div>
                              </div>
                            </div>

                            <div className="mt-2 pt-4 border-t border-white/20 dark:border-white/5 flex justify-between items-center">
                              <div className="flex flex-col">
                                <span className="text-xs text-slate-500 dark:text-gray-500 uppercase font-bold tracking-wider">Mobile</span>
                                <span className="text-sm font-medium text-slate-700 dark:text-gray-300">{client.mobile || client.phone || 'N/A'}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Past Clients Section */}
                    {filteredPast.length > 0 && (
                      <div>
                        <button
                          onClick={() => setShowPastClients(!showPastClients)}
                          className="flex items-center justify-between w-full text-xl font-bold text-slate-800 dark:text-white mb-6 opacity-80 hover:opacity-100 transition-opacity"
                        >
                          <div className="flex items-center gap-2">
                            <Clock className="w-6 h-6 text-slate-500" />
                            Past Clients
                          </div>
                          {showPastClients || searchQuery ? <ChevronDown className="w-6 h-6" /> : <ChevronRight className="w-6 h-6" />}
                        </button>

                        {(showPastClients || searchQuery) && (
                          <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6 animate-in slide-in-from-top-2 fade-in duration-300">
                            {filteredPast.map((client) => (
                              <div
                                key={client._id}
                                onClick={() => navigate(`/clients/${client._id}`)}
                                className={`${GLASS_CLASSES} p-6 rounded-2xl flex flex-col gap-4 transition-all cursor-pointer border-l-4 border-l-slate-400 opacity-60 grayscale-[0.8] hover:opacity-80`}
                              >
                                {/* Client Card Content (Same as before) */}
                                <div className="flex items-center gap-4">
                                  <div className="bg-slate-100 dark:bg-slate-700/20 p-4 rounded-full text-slate-600 dark:text-slate-400">
                                    <User className="w-6 h-6" />
                                  </div>
                                  <div className="overflow-hidden flex-1">
                                    <div className="flex justify-between items-start">
                                      <h3 className="font-bold text-slate-900 dark:text-white truncate text-lg">{client.name}</h3>
                                      <button
                                        onClick={(e) => handleDeleteClient(e, client._id)}
                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                        title="Remove Client"
                                      >
                                        <UserMinus className="w-4 h-4" />
                                      </button>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-gray-400 mt-1 truncate">
                                      <Mail className="w-4 h-4 flex-shrink-0" />
                                      <span className="truncate">{client.email}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="mt-2 pt-4 border-t border-white/20 dark:border-white/5 flex justify-between items-center">
                                  <div className="flex flex-col">
                                    <span className="text-xs text-slate-500 dark:text-gray-500 uppercase font-bold tracking-wider">Mobile</span>
                                    <span className="text-sm font-medium text-slate-700 dark:text-gray-300">{client.mobile || client.phone || 'N/A'}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Previous Clients Section */}
                    {filteredDeleted.length > 0 && (
                      <div>
                        <button
                          onClick={() => setShowDeletedClients(!showDeletedClients)}
                          className="flex items-center justify-between w-full text-xl font-bold text-slate-800 dark:text-white mb-6 opacity-80 hover:opacity-100 transition-opacity"
                        >
                          <div className="flex items-center gap-2">
                            <History className="w-6 h-6 text-red-500" />
                            Previous Clients
                          </div>
                          {showDeletedClients || searchQuery ? <ChevronDown className="w-6 h-6" /> : <ChevronRight className="w-6 h-6" />}
                        </button>

                        {(showDeletedClients || searchQuery) && (
                          <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6 animate-in slide-in-from-top-2 fade-in duration-300">
                            {filteredDeleted.map((client) => (
                              <div
                                key={client._id}
                                onClick={() => navigate(`/clients/${client._id}`)}
                                className={`${GLASS_CLASSES} p-6 rounded-2xl flex flex-col gap-4 transition-all cursor-pointer hover:scale-[1.02] border-l-4 border-l-red-500 group`}
                              >
                                {/* Client Card Content (Same as before) */}
                                <div className="flex items-center gap-4">
                                  <div className="bg-red-100 dark:bg-red-900/20 p-4 rounded-full text-red-600 dark:text-red-400 group-hover:rotate-12 transition-transform">
                                    <User className="w-6 h-6" />
                                  </div>
                                  <div className="overflow-hidden flex-1">
                                    <div className="flex justify-between items-start">
                                      <h3 className="font-bold text-slate-900 dark:text-white truncate text-lg">{client.name}</h3>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-gray-400 mt-1 truncate">
                                      <Mail className="w-4 h-4 flex-shrink-0" />
                                      <span className="truncate">{client.email}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="mt-2 pt-4 border-t border-white/20 dark:border-white/5 flex justify-between items-center">
                                  <div className="flex flex-col">
                                    <span className="text-xs text-slate-500 dark:text-gray-500 uppercase font-bold tracking-wider">Mobile</span>
                                    <span className="text-sm font-medium text-slate-700 dark:text-gray-300">{client.mobile || client.phone || 'N/A'}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-red-500 uppercase">Previous</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}
            </>
          )}

          {/* ADD CLIENT MODAL */}
          {showAddClientModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <div className={`${GLASS_CLASSES} w-full max-w-md p-6 rounded-2xl animate-in zoom-in duration-200`}>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white">Add New Client</h3>
                  <button onClick={() => setShowAddClientModal(false)} className="text-slate-500 hover:text-slate-700 dark:text-gray-400 dark:hover:text-white">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleAddClient} className="flex flex-col gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Client Name</label>
                    <input
                      required
                      type="text"
                      value={newClient.name}
                      onChange={e => {
                        const val = e.target.value;
                        // Only allow letters and spaces
                        if (/^[a-zA-Z\s]*$/.test(val)) {
                          setNewClient({ ...newClient, name: val });
                        }
                      }}
                      className="w-full p-2 rounded-xl bg-white/50 dark:bg-black/20 border border-orange-200 dark:border-gray-700 focus:ring-2 focus:ring-orange-500 outline-none transition-all dark:text-white"
                      placeholder="e.g. Guptaji's Company"
                    />
                    <p className="text-xs text-slate-500 mt-1 pl-1">Letters and spaces only</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Email</label>
                    <input
                      required
                      type="email"
                      value={newClient.email}
                      onChange={e => setNewClient({ ...newClient, email: e.target.value })}
                      className="w-full p-2 rounded-xl bg-white/50 dark:bg-black/20 border border-orange-200 dark:border-gray-700 focus:ring-2 focus:ring-orange-500 outline-none transition-all dark:text-white"
                      placeholder="Factory@Guptaji.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Phone</label>
                    <input
                      required
                      type="tel"
                      value={newClient.phone}
                      onChange={e => {
                        const val = e.target.value;
                        // Allow + at start, then numbers, spaces, - and ()
                        if (/^[+]?[0-9\s-()]*$/.test(val)) {
                          setNewClient({ ...newClient, phone: val });
                        }
                      }}
                      className="w-full p-2 rounded-xl bg-white/50 dark:bg-black/20 border border-orange-200 dark:border-gray-700 focus:ring-2 focus:ring-orange-500 outline-none transition-all dark:text-white"
                      placeholder="+91 9876543210"
                    />
                    <p className="text-xs text-slate-500 mt-1 pl-1">Format: Country Code + Number (e.g. +91 9876543210)</p>
                  </div>

                  <button
                    type="submit"
                    className={`mt-4 w-full ${BUTTON_BASE} ${ACCENT_BG}`}
                  >
                    Add Client
                  </button>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Clients;