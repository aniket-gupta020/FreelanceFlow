import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api';
import Sidebar from '../components/Sidebar';
import {
    Menu, User, Mail, Phone, IndianRupee, Briefcase, ArrowRight, X, LayoutDashboard
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const GLASS_CLASSES = "bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-xl";

const ClientDetails = () => {
    const { clientId } = useParams();
    const navigate = useNavigate();
    const [client, setClient] = useState(null);
    const [projects, setProjects] = useState([]);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

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
        // 1. Fetch Client Details (We can use existing /users endpoint or filter from /projects if no direct endpoint)
        // Assuming we have a /users/:id or we can get it from projects list essentially?
        // Actually, usually in these apps we might not have a specific GET /users/:id for clients if they are just users.
        // But let's assume we can fetch it. If not, we might need to rely on what we have.
        // However, the best way given the constraints and existing code (which I haven't fully seen all API routes for)
        // is to fetch projects and find the client info from there if possible, OR assume a route exists.
        // Let's try to fetch user by ID if possible, or filter from projects.
        // Wait, the "Clients" page fetched projects and deduced clients. I should probably do same or update backend.
        // To be safe and fast: I will fetch projects and find the client there.
        // Ideally I would add `router.get('/:id', ...)` to `auth.js` or `users.js` but I want to minimize backend changes if not requested.
        // User requested "Registration Update" and "Client Hierarchy".
        // I will try to fetch all projects and filter. It's not efficient but safe given constraints.
        // Actually, I can use the same logic as Clients.jsx to find the client info.

        api.get('/projects').then(res => {
            // Find client info from projects
            const clientProject = res.data.find(p => (p.client?._id === clientId || p.client === clientId));

            if (clientProject && clientProject.client) {
                // If p.client is populated object
                if (typeof clientProject.client === 'object') {
                    setClient(clientProject.client);
                }
            } else {
                // Fallback: maybe the user exists but has no projects? 
                // We really should have a `api.get('/users/' + clientId)` route.
                // Let's try that, if it fails we show error. 
                // Usually `auth.js` might not have it.
                // Let's assume we can get it from the projects list logic for now as `Clients.jsx` did.
                // If `Clients.jsx` deduced clients from projects, `ClientDetails` can too.
                // But what if I want to see a client who has NO projects yet? `Clients.jsx` logic wouldn't show them!
                // `Clients.jsx`: "res.data.forEach(p => ... uniqueClients.push(p.client))"
                // So `Clients.jsx` ONLY shows clients with projects.
                // So it is safe to assume I can find the client in the projects list if they came from `Clients.jsx`.
                const foundClient = res.data.find(p => p.client && p.client._id === clientId)?.client;
                if (foundClient) setClient(foundClient);
            }

            // Filter projects for this client
            const clientProjects = res.data.filter(p => p.client && (p.client._id === clientId || p.client === clientId));
            setProjects(clientProjects);
        }).catch(err => console.error(err));
    }, [clientId]);



    if (!client && projects.length === 0) return <div className="p-10 text-center">Loading or Client Not Found...</div>;

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 dark:from-gray-900 dark:via-black dark:to-gray-900 transition-colors duration-500">
            <div className="flex h-screen overflow-hidden">

                {/* Mobile Menu */}
                <div className={`fixed inset-0 z-50 md:hidden pointer-events-none`}>
                    <div className={`absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0'}`} onClick={() => setIsMobileMenuOpen(false)} />
                    <div className={`absolute top-0 left-0 w-72 h-full ${GLASS_CLASSES} transform transition-transform duration-300 ease-out pointer-events-auto ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                        <Sidebar mobile={true} closeMobile={() => setIsMobileMenuOpen(false)} darkMode={darkMode} toggleTheme={toggleTheme} handleLogout={handleLogout} />
                    </div>
                </div>

                <aside className={`w-72 hidden md:block border-r border-white/20 dark:border-white/5 ${GLASS_CLASSES} z-10`}>
                    <Sidebar mobile={false} darkMode={darkMode} toggleTheme={toggleTheme} handleLogout={handleLogout} />
                </aside>

                <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
                    <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                        <div className="flex items-center gap-4">
                            <button onClick={() => setIsMobileMenuOpen(true)} className={`${GLASS_CLASSES} p-2 rounded-lg text-gray-600 dark:text-gray-300 md:hidden`}><Menu className="w-6 h-6" /></button>
                            <div>
                                <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Client Details</h2>
                                <div className="flex items-center gap-2 text-slate-600 dark:text-gray-400 mt-1">
                                    <Link to="/clients" className="hover:underline">Clients</Link>
                                    <span>/</span>
                                    <span className="text-violet-600 dark:text-yellow-400">{client?.name || 'Unknown'}</span>
                                </div>
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
                                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{client?.name}</h1>
                                    <div className="flex flex-wrap gap-4 mt-2">
                                        <div className="flex items-center gap-2 text-slate-600 dark:text-gray-400 bg-white/50 dark:bg-white/5 px-3 py-1 rounded-full text-sm">
                                            <Mail className="w-4 h-4" /> {client?.email}
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-600 dark:text-gray-400 bg-white/50 dark:bg-white/5 px-3 py-1 rounded-full text-sm">
                                            <Phone className="w-4 h-4" /> {client?.mobile || 'No Mobile'}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                    <IndianRupee className="w-6 h-6" />
                                    <span>{client?.defaultHourlyRate || 0}</span>
                                    <span className="text-sm text-slate-500 font-normal self-end mb-1">/ hour (default)</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Projects List */}
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                        <Briefcase className="w-6 h-6 text-violet-600 dark:text-yellow-400" />
                        Active Projects
                    </h3>

                    {projects.length === 0 ? (
                        <div className="text-center py-10 opacity-60">No projects found for this client.</div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {projects.map((project) => (
                                <div
                                    key={project._id}
                                    onClick={() => navigate(`/projects/${project._id}`)}
                                    className={`${GLASS_CLASSES} p-6 rounded-2xl group hover:scale-[1.01] transition-all cursor-pointer border-l-4 ${project.status === 'Completed' ? 'border-l-emerald-500' : 'border-l-violet-500'}`}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <h4 className="text-lg font-bold text-slate-900 dark:text-white truncate pr-4">{project.title}</h4>
                                        <span className={`text-xs px-2 py-1 rounded-md font-bold uppercase ${project.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-violet-100 text-violet-700'}`}>
                                            {project.status || 'Active'}
                                        </span>
                                    </div>
                                    <p className="text-slate-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">{project.description}</p>

                                    <div className="flex justify-between items-center pt-4 border-t border-gray-200/50 dark:border-white/10">
                                        <div className="font-bold text-slate-800 dark:text-white flex items-center">
                                            <IndianRupee className="w-4 h-4 text-emerald-500" /> {project.budget}
                                        </div>
                                        <div className="flex items-center gap-1 text-violet-600 dark:text-yellow-400 text-sm font-medium group-hover:translate-x-1 transition-transform">
                                            Details <ArrowRight className="w-4 h-4" />
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

export default ClientDetails;
