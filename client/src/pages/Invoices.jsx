import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import api from '../api';
import { useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard, Clock, IndianRupee, Users, Plus,
  Trash2, Menu, X, Sun, Moon, LogOut, Download, AlertTriangle,
  CheckCircle, AlertCircle, Send, CheckSquare, User, ArrowDownCircle, ArrowUpCircle
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { generateInvoicePDF } from '../components/pdfGenerator';

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

const InvoiceItemRender = ({ invoice, isIncome, handleDelete, handleStatusChange, setSelectedInvoice, setShowDetails, handlePrint }) => (
  <div
    className={`${GLASS_CLASSES} p-6 rounded-2xl ${CARD_HOVER} cursor-pointer border-l-4 ${isIncome ? 'border-l-emerald-500' : 'border-l-orange-500'}`}
    onClick={() => {
      setSelectedInvoice(invoice);
      setShowDetails(true);
    }}
  >
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          {isIncome ? (
            <ArrowDownCircle className="w-6 h-6 text-emerald-500" />
          ) : (
            <ArrowUpCircle className="w-6 h-6 text-orange-500" />
          )}
          <h3 className={`select-text cursor-text text-lg font-bold ${TEXT_HEADLINE}`}>
            {invoice.invoiceNumber || `INV-${invoice._id.substring(0, 6).toUpperCase()}`}
          </h3>
          <InvoiceStatusBadge status={invoice.status} />
        </div>

        <div className="flex flex-col gap-1 text-sm ml-9">
          <p className={`${TEXT_SUB}`}>
            <span className="font-semibold">{isIncome ? 'Project:' : 'Project:'}</span> {invoice.project?.title || 'Untitled Project'}
          </p>
          <p className={`${TEXT_SUB} flex items-center gap-2`}>
            {isIncome ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                Received from {invoice.client?.name || 'Unknown'}
              </span>
            ) : (
              <span className="text-orange-600 dark:text-orange-400 font-semibold flex items-center gap-1">
                Paid to {invoice.freelancer?.name || 'Unknown'}
              </span>
            )}
          </p>
          <p className={`${TEXT_SUB} text-xs mt-1 opacity-70`}>
            {new Date(invoice.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="flex flex-col md:items-end gap-3 ml-9 md:ml-0">
        <p className={`select-text cursor-text text-2xl font-bold ${isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-orange-600 dark:text-orange-400'}`}>
          {isIncome ? '+' : '-'} ₹{invoice.totalAmount.toFixed(2)}
        </p>

        <div className="flex gap-2 flex-wrap justify-start md:justify-end">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrint(invoice);
            }}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-600 dark:text-white rounded-lg transition text-xs font-medium flex items-center gap-1"
          >
            <Download className="w-3 h-3" /> PDF
          </button>

          {invoice.status === 'draft' && isIncome && (
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

          {!isIncome && (invoice.status === 'sent' || invoice.status === 'overdue') && (
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
  const [activeTab, setActiveTab] = useState('received'); // 'received' or 'paid'
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

  const calculateTotals = () => {
    // Total Income vs Total Expense
    let totalIncome = 0;
    let totalExpense = 0;

    if (!user) return { totalIncome, totalExpense };

    invoices.forEach(inv => {
      // Income = I am the freelancer
      if (inv.freelancer?._id === user._id) {
        if (inv.status === 'paid') totalIncome += inv.totalAmount;
      }
      // Expense = I am the client
      else if (inv.client?._id === user._id) {
        if (inv.status === 'paid') totalExpense += inv.totalAmount;
      }
    });

    return { totalIncome, totalExpense };
  };

  const totals = calculateTotals();

  // Filter Invoices based on Tabs
  const receivedInvoices = invoices.filter(inv => user && inv.freelancer?._id === user._id);
  const paidInvoices = invoices.filter(inv => user && inv.client?._id === user._id);

  const displayedInvoices = activeTab === 'received' ? receivedInvoices : paidInvoices;



  return (
    <div className="min-h-screen transition-colors duration-500 bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 dark:from-gray-900 dark:via-black dark:to-gray-900 select-none">
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
          <header className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Transaction History</h2>
              <p className="text-slate-600 dark:text-gray-400">Track your income and expenses</p>
            </div>

          </header>

          <div className="max-w-5xl mx-auto">

            {/* Stats Overview */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className={`${GLASS_CLASSES} p-5 rounded-2xl flex items-center justify-between`}>
                <div>
                  <h3 className="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">Total Income</h3>
                  <p className={`text-2xl font-bold ${TEXT_HEADLINE}`}>₹{totals.totalIncome.toFixed(2)}</p>
                </div>
                <div className="p-3 bg-emerald-100 dark:bg-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400">
                  <ArrowDownCircle className="w-6 h-6" />
                </div>
              </div>
              <div className={`${GLASS_CLASSES} p-5 rounded-2xl flex items-center justify-between`}>
                <div>
                  <h3 className="text-sm font-bold text-orange-600 dark:text-orange-400 uppercase tracking-widest mb-1">Total Expenses</h3>
                  <p className={`text-2xl font-bold ${TEXT_HEADLINE}`}>₹{totals.totalExpense.toFixed(2)}</p>
                </div>
                <div className="p-3 bg-orange-100 dark:bg-orange-500/20 rounded-xl text-orange-600 dark:text-orange-400">
                  <ArrowUpCircle className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center mb-6">
              {/* TABS */}
              <div className="flex bg-white/30 dark:bg-black/20 p-1.5 rounded-xl backdrop-blur-md">
                <button
                  onClick={() => setActiveTab('received')}
                  className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'received' ? 'bg-white dark:bg-gray-800 shadow-md text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200'}`}
                >
                  Incoming Payments
                </button>
                <button
                  onClick={() => setActiveTab('paid')}
                  className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'paid' ? 'bg-white dark:bg-gray-800 shadow-md text-orange-600 dark:text-orange-400' : 'text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200'}`}
                >
                  Outgoing Payments
                </button>
              </div>
            </div>

            {loading ? (
              <div className={`${GLASS_CLASSES} p-12 rounded-2xl text-center`}>
                <div className="animate-spin w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className={TEXT_SUB}>Loading transactions...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {displayedInvoices.length === 0 ? (
                  <div className={`${GLASS_CLASSES} p-12 rounded-2xl text-center`}>
                    <div className="w-16 h-16 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                      <IndianRupee className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className={`text-lg font-bold ${TEXT_HEADLINE} mb-2`}>No transactions found</h3>
                    <p className={TEXT_SUB}>You haven't {activeTab === 'received' ? 'received any payments' : 'paid any invoices'} yet.</p>
                  </div>
                ) : (
                  displayedInvoices.map((invoice) => (
                    <InvoiceItemRender
                      key={invoice._id}
                      invoice={invoice}
                      isIncome={activeTab === 'received'}
                      handleDelete={handleDelete}
                      handleStatusChange={handleStatusChange}
                      setSelectedInvoice={setSelectedInvoice}
                      setShowDetails={setShowDetails}
                      handlePrint={handlePrint}
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
                    <p className={`${TEXT_SUB} text-xs font-bold uppercase mb-1`}>Freelancer</p>
                    <p className={`${TEXT_HEADLINE} font-semibold`}>{selectedInvoice.freelancer?.name || user?.name}</p>
                  </div>
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
                              <td className={`text-right py-3 px-4 ${TEXT_HEADLINE}`}><span className="select-text cursor-text">₹{item.hourlyRate?.toFixed(2)}</span></td>
                              <td className={`text-right py-3 px-4 ${TEXT_HEADLINE} font-bold`}><span className="select-text cursor-text">₹{item.amount?.toFixed(2)}</span></td>
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
                    <p className={`select-text cursor-text text-2xl font-bold text-violet-600 dark:text-yellow-400`}>
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