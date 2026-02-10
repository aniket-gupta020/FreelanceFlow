import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api';
import Sidebar from '../components/Sidebar';
import { formatCurrency } from '../utils/formatCurrency';
import {
    Menu, User, Mail, Phone, IndianRupee, Briefcase, ArrowRight, X,
    Save, Edit, LogOut, Sun, Moon
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const GLASS_CLASSES = "bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-xl";
const INPUT_CLASSES = "w-full p-3 pl-10 bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition-all dark:text-white";
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
        phone: '',
        defaultHourlyRate: 0
    });

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

    // Fetch client data
    useEffect(() => {
        if (clientId) {
            api.get(`/clients/${clientId}`)
                .then(res => {
                    setClient(res.data);
                    setFormData({
                        name: res.data.name || '',
                        email: res.data.email || '',
                        phone: res.data.phone || res.data.mobile || '',
                        defaultHourlyRate: res.data.defaultHourlyRate || 0
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

        if (formData.phone && (!phoneRegex.test(formData.phone) || formData.phone.length < 10 || formData.phone.length > 15)) {
            return toast.error("Invalid Phone Number. Use only numbers, +, -, (, ), and spaces.");
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

    if (!client) return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 dark:from-gray-900 dark:via-black dark:to-gray-900 flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-4 text-slate-600 dark:text-gray-400">Loading client details...</p>
            </div>
        </div>
    );

    const activeProjects = projects.filter(p => isProjectActive(p));
    const pastProjects = projects.filter(p => !isProjectActive(p));

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
                            <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Client Profile</h2>
                            <div className="flex items-center gap-2 text-slate-600 dark:text-gray-400 mt-1">
                                <Link to="/clients" className="hover:underline">My Clients</Link>
                                <span>/</span>
                                <span className="text-violet-600 dark:text-yellow-400">{client?.name || 'Unknown'}</span>
                            </div>
                        </div>
                    </header>

                    {/* Client Info Card */}
                    <div className={`${GLASS_CLASSES} p-8 rounded-3xl mb-8 relative overflow-hidden`}>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                        {!isEditing ? (
                            // View Mode
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex gap-6 items-start">
                                        <div className="bg-gradient-to-br from-violet-500 to-fuchsia-500 p-1 rounded-full shadow-2xl">
                                            <div className="bg-white dark:bg-black p-4 rounded-full">
                                                <User className="w-12 h-12 text-violet-600 dark:text-white" />
                                            </div>
                                        </div>
                                        <div className="flex-1 space-y-4">
                                            <div>
                                                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{client.name}</h1>
                                                <div className="flex flex-wrap gap-4 mt-3">
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

                                            <div className="flex items-center gap-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                                <span className="select-text cursor-text">{formatCurrency(client.defaultHourlyRate || 0)}</span>
                                                <span className="text-sm text-slate-500 font-normal self-end mb-1">/ hour (default)</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 dark:bg-yellow-500 dark:hover:bg-yellow-600 text-white dark:text-black rounded-xl font-medium transition-all shadow-lg active:scale-95"
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
                                    <div>
                                        <label className={LABEL_CLASSES}>Default Hourly Rate (₹)</label>
                                        <div className="relative">
                                            <IndianRupee className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                                            <input
                                                type="number"
                                                className={INPUT_CLASSES}
                                                value={formData.defaultHourlyRate}
                                                onChange={e => setFormData({ ...formData, defaultHourlyRate: e.target.value })}
                                                placeholder="0.00"
                                            />
                                        </div>
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
                                                phone: client.phone || client.mobile || '',
                                                defaultHourlyRate: client.defaultHourlyRate || 0
                                            });
                                        }}
                                        className="px-5 py-2.5 bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-white hover:bg-slate-300 dark:hover:bg-white/20 rounded-xl font-medium transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 dark:bg-yellow-500 dark:hover:bg-yellow-600 text-white dark:text-black rounded-xl font-medium transition-all shadow-lg active:scale-95"
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
                                <Briefcase className="w-6 h-6 text-violet-600 dark:text-yellow-400" />
                                Active Projects
                            </h3>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {activeProjects.map((project) => (
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
                                                <span className="select-text cursor-text">{formatCurrency(project.budget)}</span>
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
                    {pastProjects.length > 0 && (
                        <div className="mb-12">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2 opacity-80">
                                <Briefcase className="w-6 h-6 text-slate-500" />
                                Past Projects
                            </h3>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {pastProjects.map((project) => (
                                    <div
                                        key={project._id}
                                        onClick={() => navigate(`/projects/${project._id}`)}
                                        className={`${GLASS_CLASSES} p-6 rounded-2xl transition-all cursor-pointer border-l-4 border-l-slate-400 opacity-60 grayscale-[0.8] hover:opacity-80`}
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
                        </div>
                    )}

                    {projects.length === 0 && (
                        <div className={`${GLASS_CLASSES} rounded-3xl p-12 text-center`}>
                            <Briefcase className="w-16 h-16 text-slate-300 dark:text-gray-600 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No Projects Yet</h3>
                            <p className="text-slate-500 dark:text-gray-400">This client doesn't have any projects assigned yet.</p>
                        </div>
                    )}

                </main>
            </div>
        </div>
    );
};

export default ClientDetails;
