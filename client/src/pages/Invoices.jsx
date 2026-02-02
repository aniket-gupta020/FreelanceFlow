import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import api from '../api';
import { useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard, Clock, IndianRupee, Users, Plus,
  Trash2, Pencil, Briefcase, Menu, X, Sun, Moon,
  LogOut, Download, AlertTriangle, Eye, FileText, DollarSign,
  CheckCircle, AlertCircle, Send, CheckSquare, User
} from 'lucide-react';

const GLASS_CLASSES = "bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-xl";
const CARD_HOVER = "hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 ease-out";
const BUTTON_BASE = "flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all duration-300 shadow-lg active:scale-95";
const TEXT_HEADLINE = "text-slate-800 dark:text-white";
const TEXT_SUB = "text-slate-600 dark:text-gray-400";
const ACCENT_BG = "bg-violet-600 hover:bg-violet-700 dark:bg-yellow-500 dark:hover:bg-yellow-600 text-white dark:text-black";

const InvoiceStatusBadge = ({ status }) => {
  const styles = {
    draft: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
    sent: 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400',
    paid: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400',
    overdue: 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400'
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${styles[status] || styles.draft}`}>
      {status}
    </span>
  );
};

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [user, setUser] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
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
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
  };

  useEffect(() => {
    const storedUserStr = localStorage.getItem('user');
    if (!storedUserStr) {
      navigate('/login');
      return;
    }

    const parsed = JSON.parse(storedUserStr);
    const actualUser = parsed.user || parsed;
    setUser(actualUser);

    fetchInvoices();
  }, [navigate]);

  const fetchInvoices = async () => {
    try {
      const res = await api.get('/invoices');
      setInvoices(res.data);
    } catch (err) {
      console.error('Error fetching invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      try {
        await api.delete(`/invoices/${id}`);
        setInvoices(invoices.filter(inv => inv._id !== id));
        toast.success('Invoice deleted successfully!');
      } catch (err) {
        console.error('Error deleting invoice:', err);
        toast.error('Failed to delete invoice');
      }
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const response = await api.put(`/invoices/${id}`, { status: newStatus });
      setInvoices(invoices.map(inv => inv._id === id ? response.data : inv));
      toast.success(`Invoice marked as ${newStatus}!`);
    } catch (err) {
      console.error('Error updating invoice:', err);
      toast.error('Failed to update invoice status');
    }
  };

  const handlePrint = (invoice) => {
    window.print();
  };

  const calculateTotals = () => {
    let paid = 0, pending = 0, overdue = 0;
    invoices.forEach(inv => {
      if (inv.status === 'paid') paid += inv.totalAmount;
      else if (inv.status === 'overdue') overdue += inv.totalAmount;
      else if (inv.status !== 'draft') pending += inv.totalAmount;
    });
    return { paid, pending, overdue };
  };

  const totals = calculateTotals();

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

  const NavContent = ({ mobile = false }) => (
    <div className="flex flex-col h-full">
      <div className="p-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-violet-600 dark:text-yellow-400 flex items-center gap-2">
          <LayoutDashboard className="w-8 h-8" /> FreelanceFlow
        </h1>
        {mobile && <button onClick={() => setIsMobileMenuOpen(false)}><X className="w-6 h-6 dark:text-white" /></button>}
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
        <div className="flex items-center gap-3 px-4 py-3 bg-violet-600 dark:bg-yellow-500 text-white dark:text-black rounded-xl font-medium shadow-lg shadow-indigo-500/20">
          <IndianRupee className="w-5 h-5" /> Invoices
        </div>
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

  return (
    <div className="min-h-screen transition-colors duration-500 bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 dark:from-gray-900 dark:via-black dark:to-gray-900 select-none">
      <div className="flex h-screen overflow-hidden">

        <div className={`fixed inset-0 z-50 md:hidden pointer-events-none`}>
          <div className={`absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0'}`} onClick={() => setIsMobileMenuOpen(false)} />
          <div className={`absolute top-0 left-0 w-72 h-full ${GLASS_CLASSES} transform transition-transform duration-300 ease-out pointer-events-auto ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <NavContent mobile={true} />
          </div>
        </div>

        <aside className={`w-72 hidden md:block border-r border-white/20 dark:border-white/5 ${GLASS_CLASSES} z-10`}>
          <NavContent />
        </aside>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
          <header className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Invoices</h2>
              <p className="text-slate-600 dark:text-gray-400">Manage billing and payments</p>
            </div>
            <button onClick={() => setIsMobileMenuOpen(true)} className={`${GLASS_CLASSES} p-2 rounded-lg text-gray-600 dark:text-gray-300`}><Menu className="w-6 h-6" /></button>
          </header>

          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className={`${GLASS_CLASSES} p-6 rounded-2xl`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`${TEXT_SUB} text-sm font-bold uppercase tracking-wider`}>Total Paid</p>
                    <p className={`text-2xl font-bold ${TEXT_HEADLINE} my-2`}>₹{totals.paid.toFixed(2)}</p>
                  </div>
                  <div className="bg-emerald-100 dark:bg-emerald-500/20 p-3 rounded-xl">
                    <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>
              </div>

              <div className={`${GLASS_CLASSES} p-6 rounded-2xl`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`${TEXT_SUB} text-sm font-bold uppercase tracking-wider`}>Pending</p>
                    <p className={`text-2xl font-bold ${TEXT_HEADLINE} my-2`}>₹{totals.pending.toFixed(2)}</p>
                  </div>
                  <div className="bg-blue-100 dark:bg-blue-500/20 p-3 rounded-xl">
                    <AlertCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </div>

              <div className={`${GLASS_CLASSES} p-6 rounded-2xl`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`${TEXT_SUB} text-sm font-bold uppercase tracking-wider`}>Overdue</p>
                    <p className={`text-2xl font-bold ${TEXT_HEADLINE} my-2`}>₹{totals.overdue.toFixed(2)}</p>
                  </div>
                  <div className="bg-rose-100 dark:bg-rose-500/20 p-3 rounded-xl">
                    <AlertTriangle className="w-6 h-6 text-rose-600 dark:text-rose-400" />
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-8 flex justify-end">
              <Link to="/invoices/create" className={`${BUTTON_BASE} ${ACCENT_BG}`}>
                <Plus className="w-5 h-5" />
                Create Invoice
              </Link>
            </div>

            {loading ? (
              <div className={`${GLASS_CLASSES} p-8 rounded-2xl text-center`}>
                <p className={TEXT_SUB}>Loading invoices...</p>
              </div>
            ) : invoices.length === 0 ? (
              <div className={`${GLASS_CLASSES} p-12 rounded-2xl text-center`}>
                <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4 opacity-50" />
                <p className={`${TEXT_SUB} mb-4`}>No invoices yet. Create your first invoice to get started!</p>
                <Link to="/invoices/create" className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium ${ACCENT_BG}`}>
                  <Plus className="w-5 h-5" />
                  Create Invoice
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {invoices.map((invoice) => (
                  <div
                    key={invoice._id}
                    className={`${GLASS_CLASSES} p-6 rounded-2xl ${CARD_HOVER} cursor-pointer`}
                    onClick={() => {
                      setSelectedInvoice(invoice);
                      setShowDetails(true);
                    }}
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className={`text-lg font-bold ${TEXT_HEADLINE}`}>
                            {invoice.invoiceNumber || `INV-${invoice._id.substring(0, 6).toUpperCase()}`}
                          </h3>
                          <InvoiceStatusBadge status={invoice.status} />
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm">
                          <p className={`${TEXT_SUB}`}>
                            <span className="font-semibold">Client:</span> {invoice.client?.name || 'Unknown'}
                          </p>
                          <p className={`${TEXT_SUB}`}>
                            <span className="font-semibold">Due:</span> {new Date(invoice.dueDate || invoice.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col md:items-end gap-2">
                        <p className={`text-2xl font-bold ${TEXT_HEADLINE}`}>₹{invoice.totalAmount.toFixed(2)}</p>
                        <div className="flex gap-2 flex-wrap justify-start md:justify-end">

                          {invoice.status === 'draft' && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(invoice._id);
                                }}
                                className="p-2 bg-rose-100 hover:bg-rose-200 dark:bg-rose-900/30 text-rose-600 rounded-lg transition"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStatusChange(invoice._id, 'sent');
                                }}
                                className="p-2 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 text-blue-600 rounded-lg transition flex items-center gap-1 text-xs font-bold"
                              >
                                <Send className="w-3 h-3" /> Send
                              </button>
                            </>
                          )}

                          {(invoice.status === 'sent' || invoice.status === 'overdue') && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusChange(invoice._id, 'paid');
                              }}
                              className="p-2 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/30 text-emerald-600 rounded-lg transition flex items-center gap-1 text-xs font-bold"
                            >
                              <CheckCircle className="w-3 h-3" /> Mark Paid
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>

        {showDetails && selectedInvoice && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowDetails(false)}>
            <div
              className={`${GLASS_CLASSES} rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative bg-white dark:bg-gray-900`}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-2xl font-bold ${TEXT_HEADLINE}`}>
                  {selectedInvoice.invoiceNumber || `INV-${selectedInvoice._id.substring(0, 6).toUpperCase()}`}
                </h2>
                <button
                  onClick={() => setShowDetails(false)}
                  className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition"
                >
                  <X className="w-5 h-5 dark:text-white" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white/30 dark:bg-white/5 rounded-xl">
                    <p className={`${TEXT_SUB} text-xs font-bold uppercase mb-1`}>Freelancer</p>
                    <p className={`${TEXT_HEADLINE} font-semibold`}>{selectedInvoice.freelancer?.name || user?.name}</p>
                  </div>
                  <div className="p-4 bg-white/30 dark:bg-white/5 rounded-xl">
                    <p className={`${TEXT_SUB} text-xs font-bold uppercase mb-1`}>Client</p>
                    <p className={`${TEXT_HEADLINE} font-semibold`}>{selectedInvoice.client?.name}</p>
                  </div>
                  <div className="p-4 bg-white/30 dark:bg-white/5 rounded-xl">
                    <p className={`${TEXT_SUB} text-xs font-bold uppercase mb-1`}>Issue Date</p>
                    <p className={`${TEXT_HEADLINE} font-semibold`}>
                      {new Date(selectedInvoice.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="p-4 bg-white/30 dark:bg-white/5 rounded-xl">
                    <p className={`${TEXT_SUB} text-xs font-bold uppercase mb-1`}>Due Date</p>
                    <p className={`${TEXT_HEADLINE} font-semibold`}>
                      {selectedInvoice.dueDate ? new Date(selectedInvoice.dueDate).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>

                {selectedInvoice.items && selectedInvoice.items.length > 0 && (
                  <div>
                    <h3 className={`text-lg font-bold ${TEXT_HEADLINE} mb-3`}>Items</h3>
                    <div className="overflow-x-auto rounded-xl border border-white/20">
                      <table className="w-full text-sm">
                        <thead className="bg-black/5 dark:bg-white/10">
                          <tr>
                            <th className={`text-left py-3 px-4 ${TEXT_SUB} font-bold`}>Description</th>
                            <th className={`text-right py-3 px-4 ${TEXT_SUB} font-bold`}>Hours</th>
                            <th className={`text-right py-3 px-4 ${TEXT_SUB} font-bold`}>Rate</th>
                            <th className={`text-right py-3 px-4 ${TEXT_SUB} font-bold`}>Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                          {selectedInvoice.items.map((item, idx) => (
                            <tr key={idx}>
                              <td className={`py-3 px-4 ${TEXT_HEADLINE}`}>{item.description}</td>
                              <td className={`text-right py-3 px-4 ${TEXT_HEADLINE}`}>{item.hours?.toFixed(2)}</td>
                              <td className={`text-right py-3 px-4 ${TEXT_HEADLINE}`}>₹{item.hourlyRate?.toFixed(2)}</td>
                              <td className={`text-right py-3 px-4 ${TEXT_HEADLINE} font-bold`}>₹{item.amount?.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="bg-violet-50 dark:bg-white/5 p-6 rounded-xl space-y-3">
                  <div className="flex justify-between items-center">
                    <p className={`${TEXT_HEADLINE} font-bold text-lg`}>Total Amount</p>
                    <p className={`text-2xl font-bold text-violet-600 dark:text-yellow-400`}>
                      ₹{selectedInvoice.totalAmount.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t border-white/10">
                  <button
                    onClick={() => handlePrint(selectedInvoice)}
                    className={`${BUTTON_BASE} ${ACCENT_BG}`}
                  >
                    <Download className="w-5 h-5" />
                    Print / PDF
                  </button>
                  <button
                    onClick={() => setShowDetails(false)}
                    className={`${BUTTON_BASE} bg-gray-200 hover:bg-gray-300 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-white`}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}