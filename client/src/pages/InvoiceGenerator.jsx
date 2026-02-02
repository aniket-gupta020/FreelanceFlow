import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import api from '../api';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  LayoutDashboard, Clock, ChevronLeft, Save, Menu, X,
  Sun, Moon, LogOut, Briefcase, Plus, Trash2, FileText,
  Users, IndianRupee, Calendar, CheckSquare, CheckCircle, User
} from 'lucide-react';

const GLASS_CLASSES = "bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-xl";
const INPUT_CLASSES = "w-full p-3 bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition-all dark:text-white";
const LABEL_CLASSES = "block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1";
const BUTTON_BASE = "flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all duration-300 shadow-lg active:scale-95";
const TEXT_HEADLINE = "text-slate-800 dark:text-white";
const TEXT_SUB = "text-slate-600 dark:text-gray-400";
const ACCENT_BG = "bg-violet-600 hover:bg-violet-700 dark:bg-yellow-500 dark:hover:bg-yellow-600 text-white dark:text-black";

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
      <Link to="/clients" className="flex items-center gap-3 px-4 py-3 text-slate-600 dark:text-gray-400 hover:bg-white/20 dark:hover:bg-white/5 rounded-xl font-medium transition-all">
        <Users className="w-5 h-5" /> Clients
      </Link>
      <Link to="/time" className="flex items-center gap-3 px-4 py-3 text-slate-600 dark:text-gray-400 hover:bg-white/20 dark:hover:bg-white/5 rounded-xl font-medium transition-all">
        <Clock className="w-5 h-5" /> Time Tracking
      </Link>
      <Link to="/invoices" className="flex items-center gap-3 px-4 py-3 bg-violet-600 dark:bg-yellow-500 text-white dark:text-black rounded-xl font-medium shadow-lg shadow-indigo-500/20">
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

export default function InvoiceGenerator() {
  const navigate = useNavigate();
  const { id: invoiceId } = useParams();
  const [projects, setProjects] = useState([]);
  const [timeLogs, setTimeLogs] = useState([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedTimeLogs, setSelectedTimeLogs] = useState(new Set());

  const [darkMode, setDarkMode] = useState(() => {
    if (localStorage.getItem('theme')) return localStorage.getItem('theme') === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [formData, setFormData] = useState({
    projectId: '',
    clientId: '',
    taxPercentage: '0',
    notes: '',
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    hourlyRate: ''
  });
  const [clientName, setClientName] = useState('');

  const userFromStorage = (() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch (e) { return null; }
  })();

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
    if (!userFromStorage) navigate('/login');
    fetchProjects();
  }, [navigate, userFromStorage]);

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects');

      const projectsWithLogs = await Promise.all(
        res.data.map(async (project) => {
          try {
            const logs = await api.get(`/invoices/project/${project._id}/unbilled`);
            return logs.data.length > 0 ? project : null;
          } catch (e) {
            return null;
          }
        })
      );

      const validProjects = projectsWithLogs.filter(p => p !== null);
      setProjects(validProjects.length > 0 ? validProjects : res.data);
    } catch (err) {
      console.error('Failed to load projects:', err);
    }
  };

  const fetchUnbilledTimeLogs = async (projectId) => {
    if (!projectId) {
      setTimeLogs([]);
      return;
    }
    try {
      const res = await api.get(`/invoices/project/${projectId}/unbilled`);
      setTimeLogs(res.data);
      setSelectedTimeLogs(new Set());
    } catch (err) {
      console.error('Failed to load time logs:', err);
    }
  };

  const handleProjectChange = (e) => {
    const projectId = e.target.value;
    setFormData({ ...formData, projectId });

    const selected = projects.find(p => p._id === projectId);
    if (selected && selected.client) {
      const clientId = selected.client._id || selected.client;
      const clientDisplayName = selected.client.name || 'Unknown Client';
      setFormData(prev => ({
        ...prev,
        clientId: clientId
      }));
      setClientName(clientDisplayName);
    } else {
      setClientName('');
    }

    fetchUnbilledTimeLogs(projectId);
  };

  const toggleTimeLog = (logId) => {
    const newSelected = new Set(selectedTimeLogs);
    if (newSelected.has(logId)) {
      newSelected.delete(logId);
    } else {
      newSelected.add(logId);
    }
    setSelectedTimeLogs(newSelected);
  };

  const getSelectedLogsData = () => {
    return timeLogs.filter(log => selectedTimeLogs.has(log._id));
  };

  const calculateTotals = () => {
    const selectedLogs = getSelectedLogsData();
    const hourlyRate = parseFloat(formData.hourlyRate) || 0;

    const subtotal = selectedLogs.reduce((sum, log) => {
      return sum + (log.durationHours * hourlyRate);
    }, 0);

    const taxAmount = (subtotal * parseFloat(formData.taxPercentage)) / 100;
    const totalAmount = subtotal + taxAmount;

    return { subtotal, taxAmount, totalAmount };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.projectId || !formData.clientId || selectedTimeLogs.size === 0) {
      toast.error('Please select a project, client, and at least one time log');
      return;
    }

    if (!formData.hourlyRate) {
      toast.error('Please enter hourly rate');
      return;
    }

    setLoading(true);
    try {
      const selectedLogs = getSelectedLogsData();
      const hourlyRate = parseFloat(formData.hourlyRate);

      const items = selectedLogs.map(log => ({
        description: log.description || 'Work completed',
        hours: log.durationHours,
        hourlyRate: hourlyRate,
        amount: log.durationHours * hourlyRate,
        timeLogId: log._id
      }));

      await api.post('/invoices', {
        projectId: formData.projectId,
        clientId: formData.clientId,
        items,
        taxPercentage: parseFloat(formData.taxPercentage),
        notes: formData.notes,
        dueDate: new Date(formData.dueDate).toISOString()
      });

      toast.success('Invoice created successfully!');
      navigate('/invoices');
    } catch (err) {
      console.error('Error creating invoice:', err);
      toast.error('Failed to create invoice: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const totals = calculateTotals();
  const selectedLogs = getSelectedLogsData();



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
    <div className={`min-h-screen transition-colors duration-500 bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 dark:from-gray-900 dark:via-black dark:to-gray-900 select-none`}>
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

          <header className="flex items-center gap-4 mb-8">
            <button
              onClick={() => navigate('/invoices')}
              className={`p-2 rounded-full ${GLASS_CLASSES} hover:scale-110 transition`}
            >
              <ChevronLeft className="w-6 h-6 text-slate-700 dark:text-white" />
            </button>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Create Invoice</h2>
              <p className="text-slate-600 dark:text-gray-400">Generate a new invoice for client work</p>
            </div>
            <button onClick={() => setIsMobileMenuOpen(true)} className={`${GLASS_CLASSES} p-2 rounded-lg text-gray-600 dark:text-gray-300`}><Menu className="w-6 h-6" /></button>
          </header>

          <div className="max-w-5xl mx-auto">
            <form onSubmit={handleSubmit} className="space-y-8">

              <div className={`${GLASS_CLASSES} p-8 rounded-3xl space-y-6`}>
                <h2 className={`text-xl font-bold ${TEXT_HEADLINE} flex items-center gap-2`}>
                  <FileText className="w-5 h-5 text-violet-600 dark:text-yellow-400" /> Invoice Details
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={LABEL_CLASSES}>Project *</label>
                    <select
                      value={formData.projectId}
                      onChange={handleProjectChange}
                      required
                      className={INPUT_CLASSES}
                    >
                      <option value="">Select a project...</option>
                      {projects.map(p => (
                        <option key={p._id} value={p._id}>
                          {p.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={LABEL_CLASSES}>Client *</label>
                    <input
                      type="text"
                      value={clientName}
                      disabled
                      className={`${INPUT_CLASSES} bg-gray-100 dark:bg-gray-700/50 cursor-not-allowed opacity-70`}
                      placeholder="Select a project first"
                    />
                  </div>

                  <div>
                    <label className={LABEL_CLASSES}>Hourly Rate (₹) *</label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-3.5 w-5 h-5 text-gray-400 dark:text-gray-300" />
                      <input
                        type="number"
                        step="0.01"
                        value={formData.hourlyRate}
                        onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                        required
                        className={`${INPUT_CLASSES} pl-10`}
                        placeholder="500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className={LABEL_CLASSES}>Tax Percentage (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.taxPercentage}
                      onChange={(e) => setFormData({ ...formData, taxPercentage: e.target.value })}
                      className={INPUT_CLASSES}
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className={LABEL_CLASSES}>Due Date *</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3.5 w-5 h-5 text-gray-400 dark:text-gray-300" />
                      <input
                        type="date"
                        value={formData.dueDate}
                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                        required
                        className={`${INPUT_CLASSES} pl-10 dark:[color-scheme:dark]`}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className={LABEL_CLASSES}>Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className={`${INPUT_CLASSES} min-h-[100px]`}
                    placeholder="Add any additional notes for the invoice..."
                  />
                </div>
              </div>

              {formData.projectId && (
                <div className={`${GLASS_CLASSES} p-8 rounded-3xl space-y-6`}>
                  <h2 className={`text-xl font-bold ${TEXT_HEADLINE} flex items-center gap-2`}>
                    <Clock className="w-5 h-5 text-violet-600 dark:text-yellow-400" /> Select Work to Bill
                  </h2>

                  {timeLogs.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed border-white/30 rounded-xl">
                      <p className={TEXT_SUB}>No unbilled time logs found for this project.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {timeLogs.map(log => (
                        <div
                          key={log._id}
                          onClick={() => toggleTimeLog(log._id)}
                          className={`flex items-start gap-4 p-4 rounded-xl transition-all cursor-pointer border border-transparent ${selectedTimeLogs.has(log._id) ? 'bg-violet-100/50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800' : 'bg-white/30 dark:bg-white/5 hover:bg-white/50 dark:hover:bg-white/10'}`}
                        >
                          <div className={`mt-1 w-5 h-5 rounded flex items-center justify-center border ${selectedTimeLogs.has(log._id) ? 'bg-violet-600 border-violet-600' : 'border-gray-400 bg-white dark:bg-black/20'}`}>
                            {selectedTimeLogs.has(log._id) && <CheckSquare className="w-3.5 h-3.5 text-white" />}
                          </div>

                          <div className="flex-1">
                            <p className={`${TEXT_HEADLINE} font-semibold`}>{log.description || 'Work log'}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-xs px-2 py-0.5 rounded-full bg-white/50 dark:bg-black/30 ${TEXT_SUB}`}>
                                {log.durationHours.toFixed(2)} hrs
                              </span>
                              <span className={`text-xs ${TEXT_SUB}`}>
                                {new Date(log.startTime).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`${TEXT_HEADLINE} font-bold`}>
                              ₹{(log.durationHours * (parseFloat(formData.hourlyRate) || 0)).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {selectedLogs.length > 0 && (
                <div className={`${GLASS_CLASSES} p-8 rounded-3xl space-y-4 border-t-4 border-emerald-500`}>
                  <h2 className={`text-xl font-bold ${TEXT_HEADLINE}`}>Invoice Summary</h2>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className={TEXT_SUB}>Total Hours:</span>
                      <span className={`${TEXT_HEADLINE} font-bold`}>
                        {selectedLogs.reduce((sum, log) => sum + log.durationHours, 0).toFixed(2)} hrs
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={TEXT_SUB}>Hourly Rate:</span>
                      <span className={`${TEXT_HEADLINE} font-bold`}>₹{parseFloat(formData.hourlyRate || 0).toFixed(2)}</span>
                    </div>
                    <div className="border-t border-gray-300 dark:border-white/10 pt-3 flex justify-between items-center">
                      <span className={TEXT_SUB}>Subtotal:</span>
                      <span className={`${TEXT_HEADLINE} font-bold`}>₹{totals.subtotal.toFixed(2)}</span>
                    </div>
                    {totals.taxAmount > 0 && (
                      <div className="flex justify-between items-center">
                        <span className={TEXT_SUB}>Tax ({formData.taxPercentage}%):</span>
                        <span className={`${TEXT_HEADLINE} font-bold`}>₹{totals.taxAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="border-t border-gray-300 dark:border-white/10 pt-3 flex justify-between items-center bg-violet-100 dark:bg-violet-500/10 p-4 rounded-xl">
                      <span className={`${TEXT_HEADLINE} font-bold text-lg`}>Total Amount:</span>
                      <span className="text-2xl font-bold text-violet-600 dark:text-yellow-400">
                        ₹{totals.totalAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-4 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => navigate('/invoices')}
                  className="px-6 py-3 rounded-xl font-medium text-slate-600 dark:text-gray-300 hover:bg-white/20 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`${BUTTON_BASE} ${ACCENT_BG} disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <Save className="w-5 h-5" />
                  {loading ? 'Creating...' : 'Create Invoice'}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}