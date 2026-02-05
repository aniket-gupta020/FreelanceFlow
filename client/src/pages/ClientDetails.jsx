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
    const [freelancer, setFreelancer] = useState(null);
    const [projects, setProjects] = useState([]);
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
        if (!storedUser?._id) return;

        api.get('/projects').then(res => {
            // We want to find projects where:
            // 1. I am the client (Project Owner) -> storedUser._id
            // 2. The person we are viewing (clientId) is an applicant/freelancer

            const myProjects = res.data.filter(p =>
                p.client && (p.client._id === storedUser._id || p.client === storedUser._id)
            );

            // Find the freelancer details from the applicants list in my projects
            let foundFreelancer = null;
            const sharedProjects = myProjects.filter(p => {
                if (!p.applicants) return false;
                const isApplicant = p.applicants.find(app => {
                    const appId = app._id || app;
                    if (String(appId) === String(clientId)) {
                        // Capture the full freelancer object if available
                        if (typeof app === 'object' && !foundFreelancer) {
                            foundFreelancer = app;
                        }
                        return true;
                    }
                    return false;
                });
                return isApplicant;
            });

            // Helper to check if project is active
            const isProjectActive = (p) => {
                // Check if status is explicitly completed
                if (p.status === 'Completed') return false;

                // Check if deadline has passed
                if (p.deadline && new Date(p.deadline) < new Date()) return false;

                return true;
            };

            // Sorting Logic: Active first, then completed/expired
            const sortedProjects = [...sharedProjects].sort((a, b) => {
                const aActive = isProjectActive(a);
                const bActive = isProjectActive(b);

                if (aActive && !bActive) return -1; // a comes first
                if (!aActive && bActive) return 1;  // b comes first

                // Secondary sort: Deadline (Ascending for active, Descending for past - optional preference)
                // For now, let's just keep them in default order or sort by deadline
                return new Date(a.deadline) - new Date(b.deadline);
            });

            if (foundFreelancer) setFreelancer(foundFreelancer);
            setProjects(sortedProjects);

        }).catch(err => console.error(err));
    }, [clientId, storedUser._id]);

    if (!freelancer && projects.length === 0) return <div className="p-10 text-center">Loading or Freelancer Not Found...</div>;

    const isCardActive = (project) => {
        if (project.status === 'Completed') return false;
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
                                <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Freelancer Details</h2>
                                <div className="flex items-center gap-2 text-slate-600 dark:text-gray-400 mt-1">
                                    <Link to="/clients" className="hover:underline">My Freelancers</Link>
                                    <span>/</span>
                                    <span className="text-violet-600 dark:text-yellow-400">{freelancer?.name || 'Unknown'}</span>
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
                                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{freelancer?.name}</h1>
                                    <div className="flex flex-wrap gap-4 mt-2">
                                        <div className="flex items-center gap-2 text-slate-600 dark:text-gray-400 bg-white/50 dark:bg-white/5 px-3 py-1 rounded-full text-sm">
                                            <Mail className="w-4 h-4" /> {freelancer?.email}
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-600 dark:text-gray-400 bg-white/50 dark:bg-white/5 px-3 py-1 rounded-full text-sm">
                                            <Phone className="w-4 h-4" /> {freelancer?.mobile || 'No Mobile'}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                    <IndianRupee className="w-6 h-6" />
                                    <span>{freelancer?.defaultHourlyRate || 0}</span>
                                    <span className="text-sm text-slate-500 font-normal self-end mb-1">/ hour (default)</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Projects List */}
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                        <Briefcase className="w-6 h-6 text-violet-600 dark:text-yellow-400" />
                        Projects Worked On
                    </h3>

                    {projects.length === 0 ? (
                        <div className="text-center py-10 opacity-60">No projects found for this client.</div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {projects.map((project) => {
                                const active = isCardActive(project);
                                return (
                                    <div
                                        key={project._id}
                                        onClick={() => active && navigate(`/projects/${project._id}`)}
                                        className={`${GLASS_CLASSES} p-6 rounded-2xl transition-all border-l-4 
                                    ${active ? 'cursor-pointer group hover:scale-[1.01]' : 'cursor-default opacity-60 grayscale-[0.8]'}
                                    ${project.status === 'Completed' ? 'border-l-emerald-500' : 'border-l-violet-500'}`}
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
                                            {active && (
                                                <div className="flex items-center gap-1 text-violet-600 dark:text-yellow-400 text-sm font-medium group-hover:translate-x-1 transition-transform">
                                                    Details <ArrowRight className="w-4 h-4" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}

                </main>
            </div>
        </div>
    );
};

export default ClientDetails;
