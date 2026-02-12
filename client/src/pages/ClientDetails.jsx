import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api';
import Sidebar from '../components/Sidebar';
import { formatCurrency } from '../utils/formatCurrency';
import {
    Menu, User, Mail, Phone, IndianRupee, Briefcase, ArrowRight, X,
    Save, Edit, LogOut, Sun, Moon, Plus, Calendar, FileText, ChevronDown, ChevronRight, CheckCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const GLASS_CLASSES = "bg-white/60 dark:bg-black/40 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-xl shadow-orange-500/10";
const INPUT_CLASSES = "w-full p-3 pl-10 bg-white/50 dark:bg-black/20 border border-orange-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all dark:text-white";
const LABEL_CLASSES = "block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1";

const ClientDetails = () => {
    const { clientId } = useParams();
    const navigate = useNavigate();
    const [client, setClient] = useState(null);
    const [projects, setProjects] = useState([]);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: ''
    });
    const [showProjectModal, setShowProjectModal] = useState(false);
    const [projectFormData, setProjectFormData] = useState({
        title: '',
        description: '',
        budget: '',
        deadline: '',
        startDate: new Date().toISOString().split('T')[0],
        hourlyRate: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPastProjects, setShowPastProjects] = useState(false);
    const [invoices, setInvoices] = useState([]);
    const [showPastInvoices, setShowPastInvoices] = useState(false);

    // Fetch Invoices
    useEffect(() => {
        if (clientId) {
            api.get('/invoices')
                .then(res => {
                    const clientInvoices = res.data.filter(inv =>
                        (inv.client?._id || inv.client) === clientId
                    );
                    setInvoices(clientInvoices);
                })
                .catch(err => console.error("Error fetching invoices:", err));
        }
    }, [clientId]);

    const storedUser = (() => { try { return JSON.parse(localStorage.getItem('user')); } catch (e) { return null; } })();

    useEffect(() => {
        if (storedUser && storedUser.defaultHourlyRate) {
            setProjectFormData(prev => ({ ...prev, hourlyRate: storedUser.defaultHourlyRate }));
        }
    }, []);

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

    // Fetch client data
    useEffect(() => {
        if (clientId) {
            api.get(`/clients/${clientId}`)
                .then(res => {
                    setClient(res.data);
                    setFormData({
                        name: res.data.name || '',
                        email: res.data.email || '',
                        phone: res.data.phone || res.data.mobile || ''
                    });
                })
                .catch(err => {
                    console.error("Error fetching client details:", err);
                    toast.error("Failed to load client details");
                });
        }
    }, [clientId]);

    // Fetch projects where this client is the client/owner
    useEffect(() => {
        if (!clientId) return;

        api.get('/projects').then(res => {
            // Filter projects where the clientId matches the project's client field
            const clientProjects = res.data.filter(p => {
                const projectClientId = p.client?._id || p.client;
                return String(projectClientId) === String(clientId);
            });

            // Sort by active/inactive
            const sortedProjects = [...clientProjects].sort((a, b) => {
                const aActive = isProjectActive(a);
                const bActive = isProjectActive(b);

                if (aActive && !bActive) return -1;
                if (!aActive && bActive) return 1;

                const dateA = a.deadline ? new Date(a.deadline) : new Date('9999-12-31');
                const dateB = b.deadline ? new Date(b.deadline) : new Date('9999-12-31');
                return dateA - dateB;
            });

            setProjects(sortedProjects);
        }).catch(err => console.error(err));
    }, [clientId]);

    const isProjectActive = (project) => {
        const status = project.status ? project.status.toLowerCase() : 'active';
        if (status === 'completed') return false;
        if (project.deadline && new Date(project.deadline) < new Date()) return false;
        return true;
    };

    const handleUpdateClient = async (e) => {
        e.preventDefault();

        // Validation
        const nameRegex = /^[a-zA-Z\s]+$/;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^[0-9+\(\)\s-]+$/;

        if (!nameRegex.test(formData.name) || formData.name.length < 2) {
            return toast.error("Invalid Name. Please use letters and spaces only.");
        }

        if (!emailRegex.test(formData.email)) {
            return toast.error("Invalid Email format.");
        }

        if (!formData.phone) {
            return toast.error("Phone Number is required.");
        }

        const digitsOnly = formData.phone.replace(/\D/g, '');
        // Strict check for India (starts with 91)
        if (digitsOnly.startsWith('91')) {
            if (digitsOnly.length !== 12) { // 91 + 10 digits = 12
                return toast.error("For India (+91), please enter exactly 10 digits.");
            }
        } else {
            // Generic validation for other codes
            if (digitsOnly.length < 11 || digitsOnly.length > 15) {
                return toast.error("Please enter a valid phone number (Min 10 digits + Country Code).");
            }
        }

        try {
            const res = await api.put(`/clients/${clientId}`, formData);
            setClient(res.data);
            setIsEditing(false);
            toast.success("Client updated successfully!");
        } catch (err) {
            console.error("Error updating client:", err);
            toast.error(err.response?.data?.message || "Failed to update client");
        }
    };

    const handleCreateProject = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        if (new Date(projectFormData.deadline) < new Date(projectFormData.startDate)) {
            setIsSubmitting(false);
            return toast.error("Deadline cannot be earlier than start date");
        }

        try {
            const payload = {
                ...projectFormData,
                client: clientId  // Automatically link to current client
            };

            await api.post('/projects', payload);
            toast.success("Project created successfully! 🚀");

            // Reset form and close modal
            setProjectFormData({
                title: '',
                description: '',
                budget: '',
                deadline: '',
                startDate: new Date().toISOString().split('T')[0],
                hourlyRate: storedUser?.defaultHourlyRate || ''
            });
            setShowProjectModal(false);

            // Refresh projects list
            api.get('/projects').then(res => {
                const clientProjects = res.data.filter(p => {
                    const projectClientId = p.client?._id || p.client;
                    return String(projectClientId) === String(clientId);
                });

                const sortedProjects = [...clientProjects].sort((a, b) => {
                    const aActive = isProjectActive(a);
                    const bActive = isProjectActive(b);

                    if (aActive && !bActive) return -1;
                    if (!aActive && bActive) return 1;

                    const dateA = a.deadline ? new Date(a.deadline) : new Date('9999-12-31');
                    const dateB = b.deadline ? new Date(b.deadline) : new Date('9999-12-31');
                    return dateA - dateB;
                });

                setProjects(sortedProjects);
            });
        } catch (err) {
            console.error("Error creating project:", err);
            toast.error(err.response?.data?.message || "Failed to create project");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!client) return (
        <div className="min-h-screen bg-gradient-to-br from-orange-100 via-yellow-100 to-orange-50 dark:from-gray-900 dark:via-black dark:to-gray-900 flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
                <p className="mt-4 text-slate-600 dark:text-gray-400">Loading client details...</p>
            </div>
        </div>
    );

    const activeProjects = projects.filter(p => isProjectActive(p));
    const pastProjects = projects.filter(p => !isProjectActive(p));

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-100 via-yellow-100 to-orange-50 dark:from-gray-900 dark:via-black dark:to-gray-900 transition-colors duration-500">
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
                            <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Client Profile</h2>
                            <div className="flex items-center gap-2 text-slate-600 dark:text-gray-400 mt-1">
                                <Link to="/clients" className="hover:underline">My Clients</Link>
                                <span>/</span>
                                <span className="text-orange-600 dark:text-yellow-400">{client?.name || 'Unknown'}</span>
                            </div>
                        </div>
                        <div className="fixed bottom-8 right-8 z-40 md:static">
                            <button
                                onClick={() => setShowProjectModal(true)}
                                className="flex items-center justify-center gap-2 p-4 md:px-5 md:py-2.5 !rounded-full md:!rounded-xl font-medium transition-all duration-300 shadow-2xl md:shadow-lg active:scale-95 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 dark:bg-yellow-500 dark:hover:bg-yellow-600 text-white dark:text-black hover:scale-105"
                            >
                                <Plus className="w-6 h-6 md:w-5 md:h-5" />
                                <span className="hidden md:inline">New Project</span>
                            </button>
                        </div>
                    </header>

                    {/* Client Info Card */}
                    <div className={`${GLASS_CLASSES} p-8 rounded-3xl mb-8 relative overflow-hidden`}>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                        {!isEditing ? (
                            // View Mode
                            <div className="relative z-10">
                                <div className="flex flex-col lg:flex-row justify-between items-center lg:items-start mb-6 gap-6">
                                    <div className="flex flex-col lg:flex-row gap-6 items-center lg:items-start w-full text-center lg:text-left">
                                        <div className="bg-gradient-to-br from-orange-500 to-yellow-500 p-1 rounded-full shadow-2xl shrink-0">
                                            <div className="bg-white dark:bg-black p-4 rounded-full">
                                                <User className="w-12 h-12 text-orange-600 dark:text-white" />
                                            </div>
                                        </div>
                                        <div className="flex-1 space-y-4 w-full">
                                            <div>
                                                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{client.name}</h1>
                                                <div className="flex flex-wrap justify-center lg:justify-start gap-4 mt-3">
                                                    <div className="select-text cursor-text flex items-center gap-2 text-slate-600 dark:text-gray-400 bg-white/50 dark:bg-white/5 px-3 py-1 rounded-full text-sm">
                                                        <Mail className="w-4 h-4" /> {client.email}
                                                    </div>
                                                    {client.phone && (
                                                        <div className="select-text cursor-text flex items-center gap-2 text-slate-600 dark:text-gray-400 bg-white/50 dark:bg-white/5 px-3 py-1 rounded-full text-sm">
                                                            <Phone className="w-4 h-4" /> {client.phone || client.mobile}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>


                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 dark:bg-yellow-500 dark:hover:bg-yellow-600 text-white dark:text-black rounded-xl font-medium transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
                                    >
                                        <Edit className="w-4 h-4" /> Edit
                                    </button>
                                </div>
                            </div>
                        ) : (
                            // Edit Mode
                            <form onSubmit={handleUpdateClient} className="relative z-10">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Edit Client Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                    <div>
                                        <label className={LABEL_CLASSES}>Client Name</label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                                            <input
                                                required
                                                type="text"
                                                className={INPUT_CLASSES}
                                                value={formData.name}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    if (/^[a-zA-Z\s]*$/.test(val)) {
                                                        setFormData({ ...formData, name: val });
                                                    }
                                                }}
                                                placeholder="Client Name"
                                            />
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1 pl-1">Letters and spaces only</p>
                                    </div>
                                    <div>
                                        <label className={LABEL_CLASSES}>Email</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                                            <input
                                                required
                                                type="email"
                                                className={INPUT_CLASSES}
                                                value={formData.email}
                                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                                placeholder="client@example.com"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className={LABEL_CLASSES}>Phone Number</label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                                            <input
                                                required
                                                type="text"
                                                className={INPUT_CLASSES}
                                                value={formData.phone}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    if (/^[0-9+\(\)\s-]*$/.test(val)) {
                                                        setFormData({ ...formData, phone: val });
                                                    }
                                                }}
                                                placeholder="+1 234 567 8900"
                                            />
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1 pl-1">Numbers, +, -, (, ), and spaces only</p>
                                    </div>

                                </div>

                                <div className="flex gap-3 justify-end">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsEditing(false);
                                            setFormData({
                                                name: client.name || '',
                                                email: client.email || '',
                                                phone: client.phone || client.mobile || ''
                                            });
                                        }}
                                        className="px-5 py-2.5 bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-white hover:bg-slate-300 dark:hover:bg-white/20 rounded-xl font-medium transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 dark:bg-yellow-500 dark:hover:bg-yellow-600 text-white dark:text-black rounded-xl font-medium transition-all shadow-lg active:scale-95 hover:scale-105"
                                    >
                                        <Save className="w-5 h-5" /> Save Changes
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>

                    {/* Active Projects Section */}
                    {activeProjects.length > 0 && (
                        <div className="mb-12">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                                <Briefcase className="w-6 h-6 text-orange-600 dark:text-yellow-400" />
                                Active Projects
                            </h3>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {activeProjects.map((project) => (
                                    <div
                                        key={project._id}
                                        onClick={() => navigate(`/projects/${project._id}`)}
                                        className={`${GLASS_CLASSES} p-6 rounded-2xl group hover:scale-105 transition-all cursor-pointer border-l-4 border-l-orange-500 shadow-orange-500/10 animate-fade-in-up`}
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <h4 className="text-lg font-bold text-slate-900 dark:text-white truncate pr-4">{project.title}</h4>
                                            <span className="text-xs px-2 py-1 rounded-md font-bold uppercase bg-orange-100 text-orange-700 shadow-orange-500/10">
                                                Active
                                            </span>
                                        </div>
                                        <p className="text-slate-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">{project.description}</p>

                                        <div className="flex justify-between items-center pt-4 border-t border-gray-200/50 dark:border-white/10">
                                            <div className="font-bold text-slate-800 dark:text-white flex items-center">
                                                <span className="select-text cursor-text">{formatCurrency(project.budget)}</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-orange-600 dark:text-yellow-400 text-sm font-medium group-hover:translate-x-1 transition-transform">
                                                Details <ArrowRight className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Pending Payments Section */}
                    {invoices.some(inv => inv.status !== 'paid') && (
                        <div className="mb-12">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                                <IndianRupee className="w-6 h-6 text-rose-500" />
                                Pending Payments
                            </h3>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {invoices.filter(inv => inv.status !== 'paid').map(invoice => (
                                    <div key={invoice._id} className={`${GLASS_CLASSES} p-6 rounded-2xl border-l-4 border-l-rose-500`}>
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h4 className="text-lg font-bold text-slate-900 dark:text-white">{invoice.project?.title || 'Unknown Project'}</h4>
                                                <p className="text-sm text-slate-500">{invoice.invoiceNumber}</p>
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                <span className="text-xs px-2 py-1 rounded-md font-bold uppercase bg-rose-100 text-rose-700">
                                                    {invoice.status}
                                                </span>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();

                                                        const handleMarkPaid = async () => {
                                                            try {
                                                                await api.put(`/invoices/${invoice._id}`, { status: 'paid', paidDate: new Date() });
                                                                setInvoices(prev => prev.map(inv =>
                                                                    inv._id === invoice._id ? { ...inv, status: 'paid', paidDate: new Date() } : inv
                                                                ));
                                                                toast.success("Invoice marked as Paid");
                                                            } catch (err) {
                                                                console.error(err);
                                                                toast.error("Failed to update status");
                                                            }
                                                        };

                                                        toast.custom((t) => (
                                                            <div className={`${GLASS_CLASSES} p-6 rounded-2xl max-w-sm w-full animate-in fade-in zoom-in duration-300`}>
                                                                <div className="flex items-start gap-4">
                                                                    <div className="p-3 bg-orange-100 dark:bg-yellow-500/20 rounded-full text-orange-600 dark:text-yellow-400">
                                                                        <IndianRupee className="w-6 h-6" />
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <h3 className="font-bold text-slate-800 dark:text-white mb-1">Confirm Payment?</h3>
                                                                        <p className="text-sm text-slate-600 dark:text-gray-400 mb-4">
                                                                            Mark invoice <b>{invoice.invoiceNumber}</b> of <b>{formatCurrency(invoice.totalAmount)}</b> as PAID?
                                                                        </p>
                                                                        <div className="flex gap-3">
                                                                            <button
                                                                                onClick={() => {
                                                                                    toast.dismiss(t.id);
                                                                                    handleMarkPaid();
                                                                                }}
                                                                                className="flex-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium text-sm transition-colors"
                                                                            >
                                                                                Confirm
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
                                                    }}
                                                    className="flex items-center gap-1 px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/30 text-emerald-600 rounded-lg transition text-xs font-bold"
                                                >
                                                    <CheckCircle className="w-3 h-3" /> Mark Paid
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center pt-4 border-t border-gray-200/50 dark:border-white/10">
                                            <div className="font-bold text-slate-800 dark:text-white">
                                                {formatCurrency(invoice.totalAmount)}
                                            </div>
                                            <div className="text-sm text-slate-500">
                                                Due: {new Date(invoice.dueDate).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Past Projects Section */}
                    {pastProjects.length > 0 && (
                        <div className="mb-12">
                            <button
                                onClick={() => setShowPastProjects(!showPastProjects)}
                                className="flex items-center justify-between w-full text-xl font-bold text-slate-800 dark:text-white mb-6 opacity-80 hover:opacity-100 transition-opacity"
                            >
                                <div className="flex items-center gap-2">
                                    <Briefcase className="w-6 h-6 text-slate-500" />
                                    Past Projects
                                </div>
                                {showPastProjects ? <ChevronDown className="w-6 h-6" /> : <ChevronRight className="w-6 h-6" />}
                            </button>

                            {showPastProjects && (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in slide-in-from-top-2 fade-in duration-300">
                                    {pastProjects.map((project) => (
                                        <div
                                            key={project._id}
                                            className={`${GLASS_CLASSES} p-6 rounded-2xl transition-all border-l-4 border-l-slate-400 opacity-70`}
                                        >
                                            <div className="flex justify-between items-start mb-4">
                                                <h4 className="text-lg font-bold text-slate-900 dark:text-white truncate pr-4">{project.title}</h4>
                                                <span className="text-xs px-2 py-1 rounded-md font-bold uppercase bg-slate-100 text-slate-600">
                                                    {project.status === 'completed' ? 'Completed' : 'Expired'}
                                                </span>
                                            </div>
                                            <p className="text-slate-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">{project.description}</p>

                                            <div className="flex justify-between items-center pt-4 border-t border-gray-200/50 dark:border-white/10">
                                                <div className="font-bold text-slate-800 dark:text-white flex items-center">
                                                    {formatCurrency(project.budget)}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Previous Invoices Section */}
                    {invoices.some(inv => inv.status === 'paid') && (
                        <div className="mb-12">
                            <button
                                onClick={() => setShowPastInvoices(!showPastInvoices)}
                                className="flex items-center justify-between w-full text-xl font-bold text-slate-800 dark:text-white mb-6 opacity-80 hover:opacity-100 transition-opacity"
                            >
                                <div className="flex items-center gap-2">
                                    <FileText className="w-6 h-6 text-slate-500" />
                                    Paid Invoices
                                </div>
                                {showPastInvoices ? <ChevronDown className="w-6 h-6" /> : <ChevronRight className="w-6 h-6" />}
                            </button>

                            {showPastInvoices && (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in slide-in-from-top-2 fade-in duration-300">
                                    {invoices.filter(inv => inv.status === 'paid').map(invoice => (
                                        <div key={invoice._id} className={`${GLASS_CLASSES} p-6 rounded-2xl border-l-4 border-l-emerald-500 opacity-75 hover:opacity-100 transition-opacity`}>
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h4 className="text-lg font-bold text-slate-900 dark:text-white">{invoice.project?.title || 'Unknown Project'}</h4>
                                                    <p className="text-sm text-slate-500">{invoice.invoiceNumber}</p>
                                                </div>
                                                <span className="text-xs px-2 py-1 rounded-md font-bold uppercase bg-emerald-100 text-emerald-700">
                                                    Paid
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center pt-4 border-t border-gray-200/50 dark:border-white/10">
                                                <div className="font-bold text-slate-800 dark:text-white">
                                                    {formatCurrency(invoice.totalAmount)}
                                                </div>
                                                <div className="text-sm text-slate-500">
                                                    Paid: {new Date(invoice.paidDate || invoice.updatedAt).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {projects.length === 0 && (
                        <div className={`${GLASS_CLASSES} rounded-3xl p-12 text-center`}>
                            <Briefcase className="w-16 h-16 text-slate-300 dark:text-gray-600 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No Projects Yet</h3>
                            <p className="text-slate-500 dark:text-gray-400">This client doesn't have any projects assigned yet.</p>
                            <button
                                onClick={() => setShowProjectModal(true)}
                                className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all duration-300 shadow-lg active:scale-95 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 dark:bg-yellow-500 dark:hover:bg-yellow-600 text-white dark:text-black hover:scale-105"
                            >
                                <Plus className="w-5 h-5" /> Create First Project
                            </button>
                        </div>
                    )}

                    {/* Project Creation Modal */}
                    {showProjectModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowProjectModal(false)}>
                            <div className={`${GLASS_CLASSES} rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto`} onClick={(e) => e.stopPropagation()}>
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white">Create New Project</h3>
                                    <button
                                        onClick={() => setShowProjectModal(false)}
                                        className="p-2 hover:bg-white/20 dark:hover:bg-white/10 rounded-lg transition"
                                    >
                                        <X className="w-6 h-6 text-slate-600 dark:text-gray-400" />
                                    </button>
                                </div>

                                <form onSubmit={handleCreateProject} className="space-y-6">
                                    <div>
                                        <label className={LABEL_CLASSES}>Project Title</label>
                                        <div className="relative">
                                            <FileText className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                                            <input
                                                required
                                                type="text"
                                                className={INPUT_CLASSES}
                                                value={projectFormData.title}
                                                onChange={(e) => setProjectFormData({ ...projectFormData, title: e.target.value })}
                                                placeholder="e.g. E-commerce Website"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className={LABEL_CLASSES}>Description</label>
                                        <textarea
                                            required
                                            rows="4"
                                            className={INPUT_CLASSES}
                                            value={projectFormData.description}
                                            onChange={(e) => setProjectFormData({ ...projectFormData, description: e.target.value })}
                                            placeholder="Project details..."
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className={LABEL_CLASSES}>Start Date</label>
                                            <div className="relative">
                                                <Calendar className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                                                <input
                                                    required
                                                    type="date"
                                                    className={`${INPUT_CLASSES} dark:[color-scheme:dark]`}
                                                    value={projectFormData.startDate}
                                                    onChange={(e) => setProjectFormData({ ...projectFormData, startDate: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className={LABEL_CLASSES}>Budget (₹)</label>
                                            <div className="relative">
                                                <IndianRupee className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                                                <input
                                                    required
                                                    type="number"
                                                    className={INPUT_CLASSES}
                                                    value={projectFormData.budget}
                                                    onChange={(e) => setProjectFormData({ ...projectFormData, budget: e.target.value })}
                                                    placeholder="5000"
                                                    min="0"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className={LABEL_CLASSES}>Deadline</label>
                                            <div className="relative">
                                                <Calendar className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                                                <input
                                                    required
                                                    type="date"
                                                    className={`${INPUT_CLASSES} dark:[color-scheme:dark]`}
                                                    value={projectFormData.deadline}
                                                    onChange={(e) => setProjectFormData({ ...projectFormData, deadline: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className={LABEL_CLASSES}>Hourly Rate (₹)</label>
                                            <div className="relative">
                                                <IndianRupee className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                                                <input
                                                    type="number"
                                                    className={INPUT_CLASSES}
                                                    value={projectFormData.hourlyRate}
                                                    onChange={(e) => setProjectFormData({ ...projectFormData, hourlyRate: e.target.value })}
                                                    placeholder="500"
                                                    min="0"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-3 justify-end pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setShowProjectModal(false)}
                                            className="px-5 py-2.5 bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-white hover:bg-slate-300 dark:hover:bg-white/20 rounded-xl font-medium transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 dark:bg-yellow-500 dark:hover:bg-yellow-600 text-white dark:text-black rounded-xl font-medium transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
                                        >
                                            <Save className="w-5 h-5" /> {isSubmitting ? 'Creating...' : 'Create Project'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}


                </main>
            </div>
        </div>
    );
};

export default ClientDetails;
