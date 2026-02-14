import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import api from '../api';
import { useNavigate } from 'react-router-dom';
import {
  IndianRupee,
  Trash2, Menu, X, LogOut, Download,
  Send, CheckCircle, ArrowDownCircle, Lock
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import LoadingPage from '../components/LoadingPage';
import { generateInvoicePDF } from '../components/pdfGenerator';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDuration } from '../utils/formatDuration';

const GLASS_CLASSES = "bg-white/60 dark:bg-black/40 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-xl shadow-orange-500/10";
const CARD_HOVER = "hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 ease-out hover:shadow-2xl hover:shadow-orange-500/20";
const BUTTON_BASE = "flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all duration-300 shadow-lg active:scale-95 hover:scale-105";
const TEXT_HEADLINE = "text-slate-800 dark:text-white";
const TEXT_SUB = "text-slate-600 dark:text-gray-400";
const ACCENT_BG = "bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 dark:bg-yellow-500 dark:hover:bg-yellow-600 text-white dark:text-black";

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

const InvoiceItemRender = ({ invoice, handleDelete, handleStatusChange, setSelectedInvoice, setShowDetails, handlePrint, user }) => (
  <div
    className={`${GLASS_CLASSES} p-6 rounded-2xl ${CARD_HOVER} cursor-pointer border-l-4 border-l-orange-500 animate-fade-in-up`}
    onClick={() => {
      setSelectedInvoice(invoice);
      setShowDetails(true);
    }}
  >
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-orange-100 dark:bg-yellow-500/20 rounded-lg">
            <IndianRupee className="w-5 h-5 text-orange-600 dark:text-yellow-400" />
          </div>
          <h3 className={`select-text cursor-text text-lg font-bold ${TEXT_HEADLINE}`}>
            {invoice.invoiceNumber || `INV-${invoice._id.substring(0, 6).toUpperCase()}`}
          </h3>
          <InvoiceStatusBadge status={invoice.status} />
        </div>

        <div className="flex flex-col gap-1 text-sm ml-12">
          <p className={`${TEXT_SUB} flex items-center gap-2`}>
            <span className="font-semibold text-slate-700 dark:text-slate-300">Client:</span>
            <span className="text-slate-900 dark:text-white font-medium">{invoice.client?.name || 'Unknown'}</span>
          </p>
          <p className={`${TEXT_SUB} flex items-center gap-2`}>
            <span className="font-semibold text-slate-700 dark:text-slate-300">Project:</span>
            <span className="text-slate-900 dark:text-white font-medium">{invoice.project?.title || 'Untitled Project'}</span>
          </p>
          <p className={`${TEXT_SUB} text-xs mt-1 opacity-70`}>
            Created: {new Date(invoice.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="flex flex-col md:items-end gap-3 ml-12 md:ml-0">
        <p className={`select-text cursor-text text-2xl font-bold text-orange-600 dark:text-yellow-400`}>
          {formatCurrency(invoice.totalAmount)}
        </p>

        <div className="flex gap-2 flex-wrap justify-start md:justify-end">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrint(invoice);
            }}
            className={`px-3 py-1.5 ${user?.subscription === 'pro' ? 'bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-600 dark:text-white' : 'bg-gray-100 text-gray-400 cursor-not-allowed'} rounded-lg transition text-xs font-medium flex items-center gap-1`}
          >
            {user?.subscription === 'pro' ? <Download className="w-3 h-3" /> : <Lock className="w-3 h-3" />} PDF
          </button>

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
                className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 text-blue-600 rounded-lg transition flex items-center gap-1 text-xs font-bold"
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
              className="px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/30 text-emerald-600 rounded-lg transition flex items-center gap-1 text-xs font-bold"
            >
              <CheckCircle className="w-3 h-3" /> Mark Paid
            </button>
          )}
        </div>
      </div>
    </div>
  </div>
);

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
      setInvoices(res.data || []);
    } catch (err) {
      console.error('Error fetching invoices:', err);
      toast.error("Failed to load invoices.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      try {
        await api.delete(`/invoices/${id}`);
        setInvoices(prev => prev.filter(inv => inv._id !== id));
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
      setInvoices(prev => prev.map(inv => inv._id === id ? response.data : inv));
      toast.success(`Invoice marked as ${newStatus}!`);
    } catch (err) {
      console.error('Error updating invoice:', err);
      toast.error('Failed to update invoice status');
    }
  };

  const handlePrint = (invoice) => {
    if (user?.subscription !== 'pro') {
      toast.custom((t) => (
        <div className={`${GLASS_CLASSES} p-6 rounded-2xl max-w-sm w-full animate-in fade-in zoom-in duration-300`}>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-full text-white shadow-lg shadow-orange-500/30">
              <Lock className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-slate-800 dark:text-white mb-1">Pro Feature</h3>
              <p className="text-sm text-slate-600 dark:text-gray-400 mb-4">
                Upgrade to Pro to generate professional PDF invoices.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    toast.dismiss(t.id);
                    navigate('/subscription');
                  }}
                  className={`flex-1 px-4 py-2 ${ACCENT_BG} rounded-xl font-bold text-sm transition-all shadow-lg active:scale-95`}
                >
                  Upgrade Now
                </button>
                <button
                  onClick={() => toast.dismiss(t.id)}
                  className="flex-1 px-4 py-2 bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-white hover:bg-slate-300 dark:hover:bg-white/20 rounded-xl font-medium text-sm transition-colors"
                >
                  Later
                </button>
              </div>
            </div>
          </div>
        </div>
      ));
      return;
    }
    generateInvoicePDF(invoice);
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

  const [searchQuery, setSearchQuery] = useState('');

  const calculateTotalIncome = () => {
    if (!user) return 0;
    return invoices
      .filter(inv => inv.freelancer?._id === user._id && inv.status === 'paid')
      .reduce((acc, curr) => acc + curr.totalAmount, 0);
  };

  const totalIncome = calculateTotalIncome();

  // Filter Invoices: Only show invoices where I am the freelancer (creator) AND matches search
  const myInvoices = invoices.filter(inv => {
    if (!user || inv.freelancer?._id !== user._id) return false;

    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();
    const invoiceNum = (inv.invoiceNumber || '').toLowerCase();
    const clientName = (inv.client?.name || '').toLowerCase();
    const projectTitle = (inv.project?.title || '').toLowerCase();
    const dateStr = new Date(inv.createdAt).toLocaleDateString().toLowerCase();

    return invoiceNum.includes(query) ||
      clientName.includes(query) ||
      projectTitle.includes(query) ||
      dateStr.includes(query);
  });

  return (
    <div className="min-h-screen transition-colors duration-500 bg-gradient-to-br from-orange-100 via-yellow-100 to-orange-50 dark:from-gray-900 dark:via-black dark:to-gray-900 select-none">
      <div className="flex h-screen overflow-hidden">

        <div className={`fixed inset-0 z-50 md:hidden pointer-events-none`}>
          <div className={`absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0'}`} onClick={() => setIsMobileMenuOpen(false)} />
          <div className={`absolute top-0 left-0 w-72 h-full ${GLASS_CLASSES} transform transition-transform duration-300 ease-out pointer-events-auto ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <Sidebar mobile={true} closeMobile={() => setIsMobileMenuOpen(false)} darkMode={darkMode} toggleTheme={toggleTheme} handleLogout={handleLogout} user={user} />
          </div>
        </div>

        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className={`fixed top-4 right-4 z-50 md:hidden ${GLASS_CLASSES} p-2 rounded-lg text-gray-600 dark:text-gray-300 shadow-lg`}
        >
          <Menu className="w-6 h-6" />
        </button>

        <aside className={`w-72 hidden md:block border-r border-white/20 dark:border-white/5 ${GLASS_CLASSES} z-10`}>
          <Sidebar mobile={false} darkMode={darkMode} toggleTheme={toggleTheme} handleLogout={handleLogout} user={user} />
        </aside>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-3xl font-bold text-slate-800 dark:text-white">My Invoices</h2>
              <p className="text-slate-600 dark:text-gray-400">Manage your generated invoices</p>
            </div>

            <div className="relative w-full md:w-72">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search invoices..."
                className="block w-full pl-10 pr-3 py-2 border border-orange-200 dark:border-white/10 rounded-xl leading-5 bg-white/50 dark:bg-black/20 text-slate-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent sm:text-sm transition-all shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </header>

          <div className="max-w-5xl mx-auto">

            {/* Stats Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
              <div className={`${GLASS_CLASSES} p-6 rounded-2xl flex items-center justify-between`}>
                <div>
                  <h3 className="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">Total Collected</h3>
                  <p className={`text-3xl font-bold ${TEXT_HEADLINE}`}>{formatCurrency(totalIncome)}</p>
                </div>
                <div className="p-4 bg-emerald-100 dark:bg-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400">
                  <ArrowDownCircle className="w-8 h-8" />
                </div>
              </div>
            </div>

            {loading ? (
              <LoadingPage />
            ) : (
              <div className="space-y-4">
                {myInvoices.length === 0 ? (
                  <div className={`${GLASS_CLASSES} p-12 rounded-2xl text-center`}>
                    <div className="w-16 h-16 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                      <IndianRupee className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className={`text-lg font-bold ${TEXT_HEADLINE} mb-2`}>No invoices found</h3>
                    <p className={TEXT_SUB}>You haven't generated any invoices yet.</p>
                  </div>
                ) : (
                  myInvoices.map((invoice) => (
                    <InvoiceItemRender
                      key={invoice._id}
                      invoice={invoice}
                      handleDelete={handleDelete}
                      handleStatusChange={handleStatusChange}
                      setSelectedInvoice={setSelectedInvoice}
                      setShowDetails={setShowDetails}
                      handlePrint={handlePrint}
                      user={user}
                    />
                  ))
                )}
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
                <h2 className={`select-text cursor-text text-2xl font-bold ${TEXT_HEADLINE}`}>
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
                    <p className={`${TEXT_SUB} text-xs font-bold uppercase mb-1`}>Client</p>
                    <p className={`${TEXT_HEADLINE} font-semibold`}>{selectedInvoice.client?.name}</p>
                  </div>
                  <div className="p-4 bg-white/30 dark:bg-white/5 rounded-xl">
                    <p className={`${TEXT_SUB} text-xs font-bold uppercase mb-1`}>Project</p>
                    <p className={`${TEXT_HEADLINE} font-semibold truncate`}>{selectedInvoice.project?.title || 'N/A'}</p>
                  </div>
                  <div className="p-4 bg-white/30 dark:bg-white/5 rounded-xl">
                    <p className={`${TEXT_SUB} text-xs font-bold uppercase mb-1`}>Due Date</p>
                    <p className={`${TEXT_HEADLINE} font-semibold`}>
                      {selectedInvoice.dueDate ? new Date(selectedInvoice.dueDate).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div className="p-4 bg-white/30 dark:bg-white/5 rounded-xl">
                    <p className={`${TEXT_SUB} text-xs font-bold uppercase mb-1`}>Status</p>
                    <InvoiceStatusBadge status={selectedInvoice.status} />
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
                              <td className={`text-right py-3 px-4 ${TEXT_HEADLINE}`}>{formatDuration(item.hours)}</td>
                              <td className={`text-right py-3 px-4 ${TEXT_HEADLINE}`}><span className="select-text cursor-text">{formatCurrency(item.hourlyRate)}</span></td>
                              <td className={`text-right py-3 px-4 ${TEXT_HEADLINE} font-bold`}><span className="select-text cursor-text">{formatCurrency(item.amount)}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="bg-orange-50 dark:bg-white/5 p-6 rounded-xl space-y-3">
                  <div className="flex justify-between items-center">
                    <p className={`${TEXT_HEADLINE} font-bold text-lg`}>Total Amount</p>
                    <p className={`select-text cursor-text text-2xl font-bold text-orange-600 dark:text-yellow-400`}>
                      {formatCurrency(selectedInvoice.totalAmount)}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t border-white/10">
                  <button
                    onClick={() => handlePrint(selectedInvoice)}
                    className={`${BUTTON_BASE} ${user?.subscription === 'pro' ? ACCENT_BG : 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'}`}
                  >
                    {user?.subscription === 'pro' ? <Download className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
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
