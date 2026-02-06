import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api';
import Sidebar from '../components/Sidebar';
import { generateInvoicePDF } from '../components/pdfGenerator';
import {
    Menu, User, Mail, Phone, IndianRupee, Briefcase, ArrowRight, X, LayoutDashboard,
    FileText, Send, CheckCircle, AlertCircle, Clock, Download
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const GLASS_CLASSES = "bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-xl";

const ClientDetails = () => {
    const { clientId } = useParams();
    const navigate = useNavigate();
    const [freelancer, setFreelancer] = useState(null);
    const [projects, setProjects] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [showInvoiceDetails, setShowInvoiceDetails] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

    const storedUser = (() => { try { return JSON.parse(localStorage.getItem('user')); } catch (e) { return null; } })();

    useEffect(() => {
        if (darkMode) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
    }, [darkMode]);

    const toggleTheme = () => {
        setDarkMode(!darkMode);
        localStorage.setItem('theme', !darkMode ? 'dark' : 'light');
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        navigate('/login');
    };

    useEffect(() => {
        if (clientId) {
            api.get(`/users/${clientId}`)
                .then(res => setFreelancer(res.data))
                .catch(err => {
                    console.error("Error fetching user details:", err);
                    toast.error("Failed to load client details");
                });
        }
    }, [clientId]);

    useEffect(() => {
        if (!storedUser?._id) return;

        api.get('/projects').then(res => {
            // We want to find projects where:
            // 1. I am the client (Project Owner) -> storedUser._id
            // 2. The person we are viewing (clientId) is an applicant/freelancer

            const myProjects = res.data.filter(p =>
                p.client && (p.client._id === storedUser._id || p.client === storedUser._id)
            );

            // Filter projects meant for THIS freelancer (clientId)
            const sharedProjects = myProjects.filter(p => {
                if (!p.applicants) return false;
                return p.applicants.some(app => {
                    const appId = app._id || app;
                    return String(appId) === String(clientId);
                });
            });

            // Helper to check if project is active
            const isProjectActive = (p) => {
                const status = p.status ? p.status.toLowerCase() : 'active';
                // Check if status is explicitly completed
                if (status === 'completed') return false;

                // Check if deadline has passed
                if (p.deadline && new Date(p.deadline) < new Date()) return false;

                return true;
            };

            // Sorting Logic: Active first, then completed/expired
            const sortedProjects = [...sharedProjects].sort((a, b) => {
                const aActive = isProjectActive(a);
                const bActive = isProjectActive(b);

                if (aActive && !bActive) return -1; // a (Active) comes first
                if (!aActive && bActive) return 1;  // b (Inactive) comes first

                // Secondary sort: Deadline (Ascending - urgent first)
                const dateA = a.deadline ? new Date(a.deadline) : new Date('9999-12-31');
                const dateB = b.deadline ? new Date(b.deadline) : new Date('9999-12-31');

                return dateA - dateB;
            });

            // Fetch Invoices for this freelancer
            api.get('/invoices').then(invRes => {
                const allInvoices = invRes.data.filter(inv =>
                    inv.client?._id === storedUser._id &&
                    inv.freelancer?._id === clientId // Use clientId directly
                );

                // Sort: Pending/Overdue/Sent first, then Paid
                const sortedInvoices = allInvoices.sort((a, b) => {
                    const score = (status) => {
                        if (status === 'overdue') return 0;
                        if (status === 'draft') return 1;
                        if (status === 'sent') return 2;
                        return 3; // paid
                    };
                    return score(a.status) - score(b.status);
                });

                setInvoices(sortedInvoices);
            }).catch(err => console.error("Error fetching invoices:", err));

            setProjects(sortedProjects);

        }).catch(err => console.error(err));
    }, [clientId, storedUser._id]);

    const handleInvoiceStatus = async (id, newStatus) => {
        try {
            const response = await api.put(`/invoices/${id}`, { status: newStatus });
            // If satisfied (paid), remove from list. If just sent, update status.
            if (newStatus === 'paid') {
                setInvoices(prev => prev.filter(inv => inv._id !== id));
                toast.success('Invoice marked as Paid!');
            } else {
                setInvoices(prev => prev.map(inv => inv._id === id ? response.data : inv));
                toast.success(`Invoice marked as ${newStatus}!`);
            }
        } catch (err) {
            console.error('Error updating invoice:', err);
            toast.error('Failed to update invoice status');
        }
    };

    if (!freelancer && projects.length === 0) return <div className="p-10 text-center">Loading or Freelancer Not Found...</div>;

    const isCardActive = (project) => {
        const status = project.status ? project.status.toLowerCase() : 'active';
        if (status === 'completed') return false;
        if (project.deadline && new Date(project.deadline) < new Date()) return false;
        return true;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 dark:from-gray-900 dark:via-black dark:to-gray-900 transition-colors duration-500">
            <div className="flex h-screen overflow-hidden">

                {/* Mobile Menu */}
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
                    <Sidebar mobile={false} darkMode={darkMode} toggleTheme={toggleTheme} handleLogout={handleLogout} user={storedUser} />
                </aside>

                <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
                    <header className="flex justify-between items-start md:items-center mb-8 gap-4">
                        <div>
                            <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Clients Profile</h2>
                            <div className="flex items-center gap-2 text-slate-600 dark:text-gray-400 mt-1">
                                <Link to="/clients" className="hover:underline">My Freelancers</Link>
                                <span>/</span>
                                <span className="text-violet-600 dark:text-yellow-400">{freelancer?.name || 'Unknown'}</span>
                            </div>
                        </div>



                    </header>

                    {/* Client Info Card */}
                    <div className={`${GLASS_CLASSES} p-8 rounded-3xl mb-8 relative overflow-hidden`}>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start md:items-center">
                            <div className="bg-gradient-to-br from-violet-500 to-fuchsia-500 p-1 rounded-full shadow-2xl">
                                <div className="bg-white dark:bg-black p-4 rounded-full">
                                    <User className="w-12 h-12 text-violet-600 dark:text-white" />
                                </div>
                            </div>
                            <div className="flex-1 space-y-4">
                                <div>
                                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{freelancer?.name}</h1>
                                    <div className="flex flex-wrap gap-4 mt-2">
                                        <div className="select-text cursor-text flex items-center gap-2 text-slate-600 dark:text-gray-400 bg-white/50 dark:bg-white/5 px-3 py-1 rounded-full text-sm">
                                            <Mail className="w-4 h-4" /> {freelancer?.email}
                                        </div>
                                        <div className="select-text cursor-text flex items-center gap-2 text-slate-600 dark:text-gray-400 bg-white/50 dark:bg-white/5 px-3 py-1 rounded-full text-sm">
                                            <Phone className="w-4 h-4" /> {freelancer?.mobile || 'No Mobile'}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                    <IndianRupee className="w-6 h-6" />
                                    <span className="select-text cursor-text">{freelancer?.defaultHourlyRate || 0}</span>
                                    <span className="text-sm text-slate-500 font-normal self-end mb-1">/ hour (default)</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Projects Lists */}

                    {/* Active Projects Section */}
                    {projects.filter(p => isCardActive(p)).length > 0 && (
                        <div className="mb-12">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                                <Briefcase className="w-6 h-6 text-violet-600 dark:text-yellow-400" />
                                Currently Working
                            </h3>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {projects.filter(p => isCardActive(p)).map((project) => (
                                    <div
                                        key={project._id}
                                        onClick={() => navigate(`/projects/${project._id}`)}
                                        className={`${GLASS_CLASSES} p-6 rounded-2xl group hover:scale-[1.01] transition-all cursor-pointer border-l-4 border-l-violet-500`}
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <h4 className="text-lg font-bold text-slate-900 dark:text-white truncate pr-4">{project.title}</h4>
                                            <span className="text-xs px-2 py-1 rounded-md font-bold uppercase bg-violet-100 text-violet-700">
                                                Active
                                            </span>
                                        </div>
                                        <p className="text-slate-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">{project.description}</p>

                                        <div className="flex justify-between items-center pt-4 border-t border-gray-200/50 dark:border-white/10">
                                            <div className="font-bold text-slate-800 dark:text-white flex items-center">
                                                <IndianRupee className="w-4 h-4 text-emerald-500" /> <span className="select-text cursor-text">{project.budget}</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-violet-600 dark:text-yellow-400 text-sm font-medium group-hover:translate-x-1 transition-transform">
                                                Details <ArrowRight className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Past Projects Section */}
                    {projects.filter(p => !isCardActive(p)).length > 0 && (
                        <div className="mb-12">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2 opacity-80">
                                <Briefcase className="w-6 h-6 text-slate-500" />
                                Projects Worked On
                            </h3>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {projects.filter(p => !isCardActive(p)).map((project) => (
                                    <div
                                        key={project._id}
                                        className={`${GLASS_CLASSES} p-6 rounded-2xl transition-all cursor-default border-l-4 border-l-slate-400 opacity-60 grayscale-[0.8]`}
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <h4 className="text-lg font-bold text-slate-900 dark:text-white truncate pr-4">{project.title}</h4>
                                            <span className="text-xs px-2 py-1 rounded-md font-bold uppercase bg-slate-100 text-slate-600">
                                                {project.status === 'Completed' ? 'Completed' : 'Expired'}
                                            </span>
                                        </div>
                                        <p className="text-slate-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">{project.description}</p>

                                        <div className="flex justify-between items-center pt-4 border-t border-gray-200/50 dark:border-white/10">
                                            <div className="font-bold text-slate-800 dark:text-white flex items-center">
                                                <IndianRupee className="w-4 h-4 text-emerald-500" /> {project.budget}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Invoices Section (Pending & Paid) */}
                    {invoices.length > 0 && (
                        <div className="mb-8">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                                <FileText className="w-6 h-6 text-rose-500" />
                                Project Invoices
                            </h3>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {invoices.map((inv) => {
                                    const isPaid = inv.status === 'paid';
                                    return (
                                        <div
                                            key={inv._id}
                                            onClick={() => { setSelectedInvoice(inv); setShowInvoiceDetails(true); }}
                                            className={`${GLASS_CLASSES} p-6 rounded-2xl relative group hover:scale-[1.01] transition-all cursor-pointer
                                        ${isPaid ? 'opacity-60 grayscale-[0.8]' : ''}`}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h4 className="select-text cursor-text text-lg font-bold text-slate-900 dark:text-white">
                                                        {inv.invoiceNumber || `INV-${inv._id.substring(0, 6).toUpperCase()}`}
                                                    </h4>
                                                    <p className="text-xs text-slate-500 font-mono">
                                                        {new Date(inv.createdAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase mb-1
                                                    ${inv.status === 'sent' ? 'bg-blue-100 text-blue-700' :
                                                            inv.status === 'overdue' ? 'bg-rose-100 text-rose-700' :
                                                                inv.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                                                                    'bg-gray-100 text-gray-700'}`}>
                                                        {inv.status}
                                                    </span>
                                                    <span className="text-xl font-bold text-slate-800 dark:text-white flex items-center">
                                                        <IndianRupee className="w-4 h-4" /><span className="select-text cursor-text">{inv.totalAmount}</span>
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-200/50 dark:border-white/10">
                                                {!isPaid && inv.status === 'draft' && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleInvoiceStatus(inv._id, 'sent'); }}
                                                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-xs font-bold transition-colors"
                                                    >
                                                        <Send className="w-3 h-3" /> Send
                                                    </button>
                                                )}
                                                {!isPaid && (inv.status === 'sent' || inv.status === 'overdue') && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleInvoiceStatus(inv._id, 'paid'); }}
                                                        className="flex items-center gap-1 px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg text-xs font-bold transition-colors"
                                                    >
                                                        <CheckCircle className="w-3 h-3" /> Mark Paid
                                                    </button>
                                                )}
                                                {isPaid && (
                                                    <span className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-500 rounded-lg text-xs font-bold">
                                                        <CheckCircle className="w-3 h-3" /> Paid
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {projects.length === 0 && (
                        <div className="text-center py-10 opacity-60">No projects found for this client.</div>
                    )}

                </main>
            </div>

            {/* Invoice Details Modal */}
            {
                showInvoiceDetails && selectedInvoice && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4" onClick={() => setShowInvoiceDetails(false)}>
                        <div
                            className={`${GLASS_CLASSES} rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative bg-white dark:bg-gray-900 shadow-2xl animate-in zoom-in-95 duration-200`}
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="select-text cursor-text text-2xl font-bold text-slate-800 dark:text-white">
                                    {selectedInvoice.invoiceNumber || `INV-${selectedInvoice._id.substring(0, 6).toUpperCase()}`}
                                </h2>
                                <button
                                    onClick={() => setShowInvoiceDetails(false)}
                                    className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition"
                                >
                                    <X className="w-5 h-5 dark:text-white" />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-white/30 dark:bg-white/5 rounded-xl">
                                        <p className="text-slate-600 dark:text-gray-400 text-xs font-bold uppercase mb-1">Freelancer</p>
                                        <p className="text-slate-800 dark:text-white font-semibold">{selectedInvoice.freelancer?.name}</p>
                                    </div>
                                    <div className="p-4 bg-white/30 dark:bg-white/5 rounded-xl">
                                        <p className="text-slate-600 dark:text-gray-400 text-xs font-bold uppercase mb-1">Client</p>
                                        <p className="text-slate-800 dark:text-white font-semibold">{selectedInvoice.client?.name}</p>
                                    </div>
                                    <div className="p-4 bg-white/30 dark:bg-white/5 rounded-xl">
                                        <p className="text-slate-600 dark:text-gray-400 text-xs font-bold uppercase mb-1">Date</p>
                                        <p className="text-slate-800 dark:text-white font-semibold">{new Date(selectedInvoice.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <div className="p-4 bg-white/30 dark:bg-white/5 rounded-xl">
                                        <p className="text-slate-600 dark:text-gray-400 text-xs font-bold uppercase mb-1">Status</p>
                                        <p className={`font-bold uppercase ${selectedInvoice.status === 'paid' ? 'text-emerald-500' : 'text-slate-800 dark:text-white'}`}>
                                            {selectedInvoice.status}
                                        </p>
                                    </div>
                                </div>

                                {selectedInvoice.items && selectedInvoice.items.length > 0 ? (
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-3">Items</h3>
                                        <div className="overflow-x-auto rounded-xl border border-white/20">
                                            <table className="w-full text-sm">
                                                <thead className="bg-black/5 dark:bg-white/10">
                                                    <tr>
                                                        <th className="text-left py-3 px-4 text-slate-600 dark:text-gray-300 font-bold">Description</th>
                                                        <th className="text-right py-3 px-4 text-slate-600 dark:text-gray-300 font-bold">Hours</th>
                                                        <th className="text-right py-3 px-4 text-slate-600 dark:text-gray-300 font-bold">Rate</th>
                                                        <th className="text-right py-3 px-4 text-slate-600 dark:text-gray-300 font-bold">Amount</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/10">
                                                    {selectedInvoice.items.map((item, idx) => (
                                                        <tr key={idx}>
                                                            <td className="py-3 px-4 text-slate-800 dark:text-white">{item.description}</td>
                                                            <td className="text-right py-3 px-4 text-slate-800 dark:text-white">{item.hours?.toFixed(2)}</td>
                                                            <td className="text-right py-3 px-4 text-slate-800 dark:text-white"><span className="select-text cursor-text">₹{item.hourlyRate?.toFixed(2)}</span></td>
                                                            <td className="text-right py-3 px-4 text-slate-800 dark:text-white font-bold"><span className="select-text cursor-text">₹{item.amount?.toFixed(2)}</span></td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ) : null}

                                <div className="bg-violet-50 dark:bg-white/5 p-6 rounded-xl space-y-3">
                                    <div className="flex justify-between items-center">
                                        <p className="text-slate-800 dark:text-white font-bold text-lg">Total Amount</p>
                                        <p className="select-text cursor-text text-2xl font-bold text-violet-600 dark:text-yellow-400">
                                            ₹{selectedInvoice.totalAmount.toFixed(2)}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-3 justify-end pt-4 border-t border-white/10">
                                    <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all duration-300 shadow-lg active:scale-95 bg-violet-600 hover:bg-violet-700 dark:bg-yellow-500 dark:hover:bg-yellow-600 text-white dark:text-black"
                                        onClick={() => generateInvoicePDF(selectedInvoice)}
                                    >
                                        <Download className="w-5 h-5" /> Print / PDF
                                    </button>
                                    <button
                                        onClick={() => setShowInvoiceDetails(false)}
                                        className="flex-1 px-4 py-2 bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-white hover:bg-slate-300 dark:hover:bg-white/20 rounded-xl font-medium text-sm transition-colors"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default ClientDetails;
