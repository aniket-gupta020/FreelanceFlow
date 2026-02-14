import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api';
import Sidebar from '../components/Sidebar';
import LoadingPage from '../components/LoadingPage';
import {
    Menu, CheckSquare, Plus, ArrowRight, X, Clock, IndianRupee, Briefcase, Calendar,
    PlayCircle, FileText, Trash2, CheckCircle, AlertCircle, Edit, Save
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Stopwatch from '../components/Stopwatch';
import AutoTimeTracker from '../components/AutoTimeTracker';
import ProjectReportGenerator from '../components/ProjectReportGenerator';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDuration } from '../utils/formatDuration';

const GLASS_CLASSES = "bg-white/60 dark:bg-black/40 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-xl shadow-orange-500/10";
const INPUT_CLASSES = "w-full p-3 bg-white/50 dark:bg-black/20 border border-orange-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all dark:text-white";
const LABEL_CLASSES = "block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1";

const ProjectDetails = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [timeLogs, setTimeLogs] = useState([]);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');


    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskDesc, setNewTaskDesc] = useState('');
    const [newTaskDeadline, setNewTaskDeadline] = useState('');


    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editFormData, setEditFormData] = useState({
        title: '',
        description: '',
        status: '',
        budget: '',
        hourlyRate: '',
        startDate: '',
        deadline: ''
    });


    const [manualForm, setManualForm] = useState({
        hours: '',
        minutes: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
    });

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

    const fetchProjectData = () => {
        api.get(`/projects`).then(res => {
            const found = res.data.find(p => p._id === projectId);
            if (found) setProject(found);
        }).catch(console.error);


        api.get(`/tasks?projectId=${projectId}`).then(res => {
            const projectTasks = res.data.filter(t => t.project === projectId || (t.project && t.project._id === projectId));
            setTasks(projectTasks);
        }).catch(console.error);


        api.get('/timelogs').then(res => {



            const pLogs = res.data.filter(l => (l.projectId === projectId || l.project === projectId || l.project?._id === projectId));
            setTimeLogs(pLogs);
        }).catch(console.error);
    };

    useEffect(() => {
        fetchProjectData();
    }, [projectId]);

    const handleCreateTask = async (e) => {
        e.preventDefault();


        if (project.deadline && newTaskDeadline) {
            const taskDate = new Date(newTaskDeadline);
            const projectDate = new Date(project.deadline);

            if (taskDate > projectDate) {
                return toast.error(`Task deadline cannot be after Project deadline (${new Date(project.deadline).toLocaleDateString()})`);
            }
        }

        try {
            await api.post('/tasks', {
                title: newTaskTitle,
                description: newTaskDesc,
                deadline: newTaskDeadline,
                project: projectId,
                status: 'todo'
            });
            toast.success("Task Added Successfully");
            setIsTaskModalOpen(false);
            setNewTaskTitle('');
            setNewTaskDesc('');
            setNewTaskDeadline('');
            fetchProjectData();
        } catch (err) {
            toast.error("Failed to add task");
            console.error(err);
        }
    };

    const handleMarkComplete = async () => {
        try {
            await api.put(`/projects/${projectId}`, {
                status: 'completed',
                completedAt: new Date().toISOString()
            });
            toast.success("Project Marked as Complete!");
            fetchProjectData();
        } catch (err) {
            toast.error("Error updating project");
        }
    };

    const handleDeleteProject = () => {
        toast.custom((t) => (
            <div className={`${GLASS_CLASSES} p-6 rounded-2xl max-w-sm w-full animate-in fade-in zoom-in duration-300`}>
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-red-500/10 rounded-full">
                        <Trash2 className="w-6 h-6 text-red-500" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-slate-800 dark:text-white mb-1">Delete Project?</h3>
                        <p className="text-sm text-slate-600 dark:text-gray-400 mb-4">This action is permanent and will remove all associated tasks and logs.</p>
                        <div className="flex gap-3">
                            <button onClick={() => { toast.dismiss(t.id); performDeleteProject(); }} className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium text-sm transition-colors">Delete</button>
                            <button onClick={() => toast.dismiss(t.id)} className="flex-1 px-4 py-2 bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-white hover:bg-slate-300 dark:hover:bg-white/20 rounded-xl font-medium text-sm transition-colors">Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
        ));
    };

    const performDeleteProject = async () => {
        try {
            await api.delete(`/projects/${projectId}`);
            toast.success("Project deleted successfully");
            navigate(`/clients/${project.client?._id || project.client}`);
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || "Failed to delete project");
        }
    };

    const openEditModal = () => {
        if (project) {
            setEditFormData({
                title: project.title,
                description: project.description,
                status: project.status,
                budget: project.budget,
                hourlyRate: project.hourlyRate || project.client?.defaultHourlyRate || 0,
                startDate: project.startDate?.split('T')[0] || '',
                deadline: project.deadline?.split('T')[0] || ''
            });
            setIsEditModalOpen(true);
        }
    };

    const handleUpdateProject = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/projects/${projectId}`, editFormData);
            toast.success("Project Updated Successfully!");
            setIsEditModalOpen(false);
            fetchProjectData();
        } catch (err) {
            console.error(err);
            toast.error("Failed to update project");
        }
    };

    const submitManual = async (e) => {
        e.preventDefault();

        const hrs = parseInt(manualForm.hours || 0);
        const mins = parseInt(manualForm.minutes || 0);

        if (hrs === 0 && mins === 0) return toast.error('Please enter valid time');


        const hours = hrs + (mins / 60);

        if (!manualForm.description.trim()) return toast.error('Description is required');


        if (project.createdAt || project.startDate) {
            const effectiveStart = new Date(project.startDate || project.createdAt);
            const now = new Date();

            if (now > effectiveStart) {
                const projectAgeHours = (now - effectiveStart) / (1000 * 60 * 60);


                if (hours > projectAgeHours + 0.1) {
                    return toast.error(`Cannot log ${hours.toFixed(2)} hours. Project is only ${projectAgeHours.toFixed(2)} hours old.`);
                }
            }


            const selectedDate = new Date(manualForm.date);
            selectedDate.setHours(0, 0, 0, 0);

            const effectiveStartDate = new Date(project.startDate || project.createdAt);
            effectiveStartDate.setHours(0, 0, 0, 0);

            if (selectedDate < effectiveStartDate) {
                return toast.error(`Cannot log time before project start date (${effectiveStartDate.toLocaleDateString()})`);
            }

            if (project.deadline) {
                const deadlineDate = new Date(project.deadline);
                deadlineDate.setHours(0, 0, 0, 0);

                if (selectedDate > deadlineDate) {
                    return toast.error(`Cannot log time after project deadline (${deadlineDate.toLocaleDateString()})`);
                }
            }
        }

        const entryDate = new Date(manualForm.date);
        entryDate.setHours(12, 0, 0, 0);
        const endTime = new Date(entryDate);
        const startTime = new Date(endTime.getTime() - (hours * 60 * 60 * 1000));

        try {
            await api.post('/timelogs', {
                projectId: projectId,
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString(),
                description: manualForm.description.trim()
            });
            toast.success('Time logged successfully!');
            setManualForm({ hours: '', minutes: '', description: '', date: new Date().toISOString().split('T')[0] });
            fetchProjectData();
        } catch (err) {
            console.error(err);
            toast.error('Failed to log time');
        }
    };

    const handleDeleteLog = (id) => {
        toast.custom((t) => (
            <div className={`${GLASS_CLASSES} p-6 rounded-2xl max-w-sm w-full animate-in fade-in zoom-in duration-300`}>
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-red-500/10 rounded-full">
                        <Trash2 className="w-6 h-6 text-red-500" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-slate-800 dark:text-white mb-1">Delete Log?</h3>
                        <p className="text-sm text-slate-600 dark:text-gray-400 mb-4">Are you sure you want to remove this entry?</p>
                        <div className="flex gap-3">
                            <button onClick={() => { toast.dismiss(t.id); performDeleteLog(id); }} className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium text-sm transition-colors">Delete</button>
                            <button onClick={() => toast.dismiss(t.id)} className="flex-1 px-4 py-2 bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-white hover:bg-slate-300 dark:hover:bg-white/20 rounded-xl font-medium text-sm transition-colors">Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
        ));
    };

    const performDeleteLog = async (id) => {
        try {
            await api.delete(`/timelogs/${id}`);
            setTimeLogs(timeLogs.filter(l => l._id !== id));
            toast.success("Log deleted");
        } catch (err) {
            toast.error("Failed to delete log");
        }
    };

    const handleToggleTaskStatus = async (task) => {
        const newStatus = task.status === 'done' ? 'todo' : 'done';
        try {
            await api.put(`/tasks/${task._id}`, { status: newStatus });
            setTasks(tasks.map(t => t._id === task._id ? { ...t, status: newStatus } : t));
            toast.success(`Task marked as ${newStatus === 'done' ? 'Complete' : 'Active'}`);
        } catch (err) {
            toast.error("Failed to update task status");
        }
    };

    const handleDeleteTask = (id) => {
        toast.custom((t) => (
            <div className={`${GLASS_CLASSES} p-6 rounded-2xl max-w-sm w-full animate-in fade-in zoom-in duration-300`}>
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-red-500/10 rounded-full">
                        <Trash2 className="w-6 h-6 text-red-500" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-slate-800 dark:text-white mb-1">Delete Task?</h3>
                        <p className="text-sm text-slate-600 dark:text-gray-400 mb-4">This action cannot be undone.</p>
                        <div className="flex gap-3">
                            <button onClick={() => { toast.dismiss(t.id); performDeleteTask(id); }} className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium text-sm transition-colors">Delete</button>
                            <button onClick={() => toast.dismiss(t.id)} className="flex-1 px-4 py-2 bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-white hover:bg-slate-300 dark:hover:bg-white/20 rounded-xl font-medium text-sm transition-colors">Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
        ));
    };

    const performDeleteTask = async (id) => {
        try {
            await api.delete(`/tasks/${id}`);
            setTasks(tasks.filter(t => t._id !== id));
            toast.success("Task deleted");
        } catch (err) {
            toast.error("Failed to delete task");
        }
    };

    if (!project) return <LoadingPage />;

    const user = JSON.parse(localStorage.getItem('user'));
    const isCreator = user && (user._id === project.createdBy || user._id === project.createdBy?._id);
    const isValidUser = isCreator;

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-100 via-yellow-100 to-orange-50 dark:from-gray-900 dark:via-black dark:to-gray-900 transition-colors duration-500">
            <div className="flex h-screen overflow-hidden">

                {/* Mobile Menu */}
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
                    <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-8 gap-4">
                        <div className="flex items-center justify-between w-full md:w-auto gap-4">
                            <div>
                                <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Project Details</h2>
                                <div className="flex items-center gap-2 text-slate-600 dark:text-gray-400 mt-1">
                                    <Link to={`/clients/${project.client?._id || project.client}`} className="hover:underline hover:text-orange-600 dark:hover:text-yellow-400 transition-colors truncate max-w-[120px] sm:max-w-[200px] inline-block align-bottom text-slate-600 dark:text-gray-400">
                                        {project.client?.name || 'Client'}
                                    </Link>
                                    <span>/</span>
                                    <span className="text-orange-600 dark:text-yellow-400 truncate max-w-[150px] sm:max-w-[300px] inline-block align-bottom">{project.title}</span>
                                </div>
                            </div>

                        </div>

                        <div className="flex gap-3">
                            {/* Only the user who CREATED the project can mark it as complete */}
                            {isValidUser && (
                                <>
                                    <button onClick={openEditModal} className="p-2.5 bg-white/50 hover:bg-white/80 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-white rounded-xl transition-all shadow-sm">
                                        <Edit className="w-5 h-5" />
                                    </button>

                                    <button onClick={handleDeleteProject} className="p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-all shadow-sm">
                                        <Trash2 className="w-5 h-5" />
                                    </button>

                                    {project.status !== 'completed' && (
                                        <button onClick={handleMarkComplete} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium shadow-lg transition-all active:scale-95">
                                            Mark as Complete
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </header>

                    {/* Project Info */}
                    <div className={`${GLASS_CLASSES} p-8 rounded-3xl mb-8`}>
                        <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{project.title}</h1>
                                <p className="text-slate-600 dark:text-gray-400 max-w-2xl">{project.description}</p>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-sm font-bold uppercase ${project.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                                {project.status || 'Active'}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6 mt-8">
                            <div className="bg-white/50 dark:bg-white/5 p-4 rounded-2xl flex items-center gap-4">
                                <div className="p-3 bg-fuchsia-100 dark:bg-fuchsia-900/30 rounded-xl text-fuchsia-600 dark:text-fuchsia-400">
                                    <IndianRupee className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="text-sm text-slate-500 dark:text-gray-400">Hourly Rate</div>
                                    <div className="font-bold text-lg text-slate-800 dark:text-white">
                                        {formatCurrency(project.hourlyRate || project.client?.defaultHourlyRate || 0)}/hr
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white/50 dark:bg-white/5 p-4 rounded-2xl flex items-center gap-4">
                                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400">
                                    <Clock className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="text-sm text-slate-500 dark:text-gray-400">Start Date</div>
                                    <div className="font-bold text-lg text-slate-800 dark:text-white">
                                        {new Date(project.startDate || project.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white/50 dark:bg-white/5 p-4 rounded-2xl flex items-center gap-4">
                                <div className="p-3 bg-orange-100 dark:bg-yellow-500/20 rounded-xl text-orange-600 dark:text-yellow-400">
                                    <IndianRupee className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="text-sm text-slate-500 dark:text-gray-400">Budget</div>
                                    <div className="font-bold text-lg text-slate-800 dark:text-white">{formatCurrency(project.budget)}</div>
                                </div>
                            </div>
                            <div className="bg-white/50 dark:bg-white/5 p-4 rounded-2xl flex items-center gap-4">
                                <div className="p-3 bg-rose-100 dark:bg-rose-900/30 rounded-xl text-rose-600 dark:text-rose-400">
                                    <Calendar className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="text-sm text-slate-500 dark:text-gray-400">Deadline</div>
                                    <div className="font-bold text-lg text-slate-800 dark:text-white">{new Date(project.deadline).toLocaleDateString()}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Project Report Generator - Only for Creator */}
                    {(() => {
                        const user = JSON.parse(localStorage.getItem('user'));
                        const isCreator = user && (user._id === project.createdBy || user._id === project.createdBy?._id);
                        if (isCreator) {
                            return (
                                <ProjectReportGenerator
                                    project={project}
                                    timeLogs={timeLogs}
                                    clientName={project.client?.isDeleted ? `${project.client.name} (Deactivated)` : (project.client?.name || 'Unknown Client')}
                                    applicants={project.applicants || []}
                                    onRefresh={fetchProjectData}
                                />
                            );
                        }
                        return null;
                    })()}

                    {/* Tasks List */}
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <CheckSquare className="w-6 h-6 text-orange-600 dark:text-yellow-400" />
                            Project Tasks
                        </h3>

                        {/* Only the user who CREATED the project can add tasks */}
                        {(() => {
                            const user = JSON.parse(localStorage.getItem('user'));
                            if (user && (user._id === project.createdBy || user._id === project.createdBy?._id)) {
                                return (
                                    <button onClick={() => setIsTaskModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 dark:bg-yellow-500 dark:hover:bg-yellow-600 text-white dark:text-black rounded-xl font-medium shadow-lg transition-all active:scale-95 hover:scale-105">
                                        <Plus className="w-4 h-4" /> Add Task
                                    </button>
                                );
                            }
                            return null;
                        })()}
                    </div>

                    {tasks.length === 0 ? (
                        <div className="text-center py-10 opacity-60 bg-white/30 dark:bg-white/5 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700">
                            <CheckSquare className="w-10 h-10 mx-auto mb-2 opacity-50" />
                            {(() => {
                                const user = JSON.parse(localStorage.getItem('user'));
                                const isCreator = user && (user._id === project.createdBy || user._id === project.createdBy?._id);
                                return isCreator ? "No tasks yet. Add one above!" : "No tasks yet.";
                            })()}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {tasks.map((task) => (
                                <div key={task._id} className={`${GLASS_CLASSES} p-4 rounded-xl flex items-center justify-between group hover:border-orange-400 dark:hover:border-yellow-500 transition-all hover:scale-[1.01] animate-fade-in-up`}>
                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                        <div className={`w-2 h-2 shrink-0 rounded-full ${task.status === 'done' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                                        <div className="min-w-0">
                                            <h4 className={`font-bold text-slate-800 dark:text-white truncate ${task.status === 'done' ? 'line-through opacity-60' : ''}`} title={task.title}>{task.title}</h4>
                                            <p className="text-xs text-slate-500 dark:text-gray-400 line-clamp-1">{task.description}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-xs font-mono text-slate-500 bg-white/50 dark:bg-black/30 px-2 py-1 rounded">
                                            {new Date(task.dueDate || task.deadline || task.createdAt).toLocaleDateString()}
                                        </div>
                                        <button
                                            onClick={() => handleToggleTaskStatus(task)}
                                            className={`p-2 rounded-full transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100 ${task.status === 'done' ? 'hover:bg-amber-100 dark:hover:bg-amber-900/30 text-amber-500' : 'hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-500'}`}
                                            title={task.status === 'done' ? "Mark as Incomplete" : "Mark as Complete"}
                                        >
                                            {task.status === 'done' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                                        </button>
                                        {/* Delete Task Button for Creator */}
                                        {(() => {
                                            const user = JSON.parse(localStorage.getItem('user'));
                                            if (user && (user._id === project.createdBy || user._id === project.createdBy?._id)) {
                                                return (
                                                    <button onClick={() => handleDeleteTask(task._id)} className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 rounded-full transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                );
                                            }
                                        })()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Time Tracking Section - Visible to Creator (Owner) and others */
                        (() => {
                            const user = JSON.parse(localStorage.getItem('user'));


                            return (
                                <>
                                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mt-8 mb-6 flex items-center gap-2">
                                        <Clock className="w-6 h-6 text-orange-600 dark:text-yellow-400" />
                                        Time Tracking
                                    </h3>

                                    <div className="grid grid-cols-1 2xl:grid-cols-3 gap-8">
                                        {/* Timer & Manual Entry */}
                                        <div className="space-y-6">
                                            <div className={`${GLASS_CLASSES} rounded-3xl p-6 border-t-4 border-t-orange-500 dark:border-t-yellow-500 shadow-orange-500/10`}>
                                                <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                                    <PlayCircle className="w-5 h-5 text-orange-500 dark:text-yellow-500" /> Live Timer
                                                </h3>
                                                <AutoTimeTracker projectId={projectId} onSave={fetchProjectData} />
                                            </div>

                                            <div className={`${GLASS_CLASSES} rounded-3xl p-6`}>
                                                <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                                    <FileText className="w-5 h-5 text-emerald-500" /> Manual Entry
                                                </h3>
                                                <form onSubmit={submitManual} className="space-y-4">
                                                    <div>
                                                        <label className={LABEL_CLASSES}>Description</label>
                                                        <input
                                                            type="text"
                                                            placeholder="Details..."
                                                            value={manualForm.description}
                                                            onChange={e => setManualForm({ ...manualForm, description: e.target.value })}
                                                            className={INPUT_CLASSES}
                                                        />
                                                    </div>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        <div>
                                                            <label className={LABEL_CLASSES}>Hours</label>
                                                            <div className="flex gap-2">
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    value={manualForm.hours}
                                                                    onChange={e => setManualForm({ ...manualForm, hours: e.target.value })}
                                                                    className={INPUT_CLASSES}
                                                                    placeholder="Hrs"
                                                                />
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    max="59"
                                                                    value={manualForm.minutes}
                                                                    onChange={e => setManualForm({ ...manualForm, minutes: e.target.value })}
                                                                    className={INPUT_CLASSES}
                                                                    placeholder="Mins"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className={LABEL_CLASSES}>Date</label>
                                                            <input
                                                                type="date"
                                                                value={manualForm.date}
                                                                onChange={e => setManualForm({ ...manualForm, date: e.target.value })}
                                                                className={`${INPUT_CLASSES} dark:[color-scheme:dark]`}
                                                            />
                                                        </div>
                                                    </div>
                                                    <button type="submit" className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium shadow-lg transition-all">
                                                        Log Time
                                                    </button>
                                                </form>
                                            </div>
                                        </div>

                                        {/* Recent Logs List */}
                                        <div className="2xl:col-span-2">
                                            <div className={`${GLASS_CLASSES} rounded-3xl overflow-hidden min-h-[400px] flex flex-col`}>
                                                <div className="px-6 py-4 border-b border-white/20 dark:border-white/5 bg-white/20 dark:bg-white/5">
                                                    <h3 className="font-bold text-slate-800 dark:text-white">Recent Activity</h3>
                                                </div>

                                                <div className="flex-1">
                                                    {timeLogs.length === 0 ? (
                                                        <div className="p-12 text-center opacity-50 text-slate-600 dark:text-gray-400">No logs recorded yet.</div>
                                                    ) : (
                                                        <>
                                                            {/* Mobile Card View (< md) */}
                                                            <div className="md:hidden divide-y divide-white/20 dark:divide-white/5">
                                                                {timeLogs.map(log => (
                                                                    <div key={log._id} className="p-4 flex flex-col gap-3 hover:bg-white/30 dark:hover:bg-white/5 transition-colors">
                                                                        <div className="flex justify-between items-start">
                                                                            <span className="text-sm font-bold text-slate-800 dark:text-gray-200">
                                                                                {new Date(log.startTime).toLocaleDateString()}
                                                                            </span>
                                                                            <span className="font-mono font-bold text-orange-600 dark:text-yellow-400">
                                                                                {formatDuration(log.durationHours)}
                                                                            </span>
                                                                        </div>

                                                                        <p className="text-sm text-slate-600 dark:text-gray-400 line-clamp-2">
                                                                            {log.description}
                                                                        </p>

                                                                        <div className="flex justify-between items-center mt-2">
                                                                            <div>
                                                                                {(() => {
                                                                                    if (log.status === 'paid') {
                                                                                        return <span className="text-xs font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-1 rounded-full">Paid</span>;
                                                                                    } else if (log.status === 'billed' || log.billed === true) {
                                                                                        return <span className="text-xs font-bold text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-1 rounded-full">Billed</span>;
                                                                                    } else {
                                                                                        return <span className="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-white/10 dark:text-slate-400 px-2 py-1 rounded-full">Unbilled</span>;
                                                                                    }
                                                                                })()}
                                                                            </div>

                                                                            {!(log.status === 'paid' || log.status === 'billed' || log.billed === true) && (
                                                                                <button onClick={() => handleDeleteLog(log._id)} className="p-2 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                                                                                    <Trash2 className="w-4 h-4" />
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>

                                                            {/* Desktop Table View (>= md) */}
                                                            <div className="hidden md:block overflow-x-auto">
                                                                <table className="w-full text-left">
                                                                    <thead className="text-slate-500 dark:text-gray-400 text-xs uppercase bg-white/30 dark:bg-black/20">
                                                                        <tr>
                                                                            <th className="p-4">Date</th>
                                                                            <th className="p-4">Description</th>
                                                                            <th className="p-4 text-right">Duration</th>
                                                                            <th className="p-4 text-center">Status</th>
                                                                            <th className="p-4"></th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="divide-y divide-white/20 dark:divide-white/5">
                                                                        {timeLogs.map(log => (
                                                                            <tr key={log._id} className="hover:bg-white/30 dark:hover:bg-white/5 transition-colors">
                                                                                <td className="p-4 text-sm text-slate-800 dark:text-gray-300">{new Date(log.startTime).toLocaleDateString()}</td>
                                                                                <td className="p-4 text-sm text-slate-600 dark:text-gray-400 max-w-[200px] truncate" title={log.description}>{log.description}</td>
                                                                                <td className="p-4 text-right font-bold text-slate-800 dark:text-gray-300">{formatDuration(log.durationHours)}</td>
                                                                                <td className="p-4 text-center">
                                                                                    {(() => {
                                                                                        if (log.status === 'paid') {
                                                                                            return <span className="text-xs font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-1 rounded-full">Paid</span>;
                                                                                        } else if (log.status === 'billed' || log.billed === true) {
                                                                                            return <span className="text-xs font-bold text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-1 rounded-full">Billed</span>;
                                                                                        } else {
                                                                                            return <span className="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-white/10 dark:text-slate-400 px-2 py-1 rounded-full">Unbilled</span>;
                                                                                        }
                                                                                    })()}
                                                                                </td>
                                                                                <td className="p-4 text-right">
                                                                                    {!(log.status === 'paid' || log.status === 'billed' || log.billed === true) && (
                                                                                        <button onClick={() => handleDeleteLog(log._id)} className="text-red-400 hover:text-red-500 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                                                                                    )}
                                                                                </td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            );
                        })()}

                </main>

                {/* Edit Project Modal */}
                {isEditModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)}></div>
                        <div className={`relative w-full max-w-2xl ${GLASS_CLASSES} bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-2xl animate-in zoom-in duration-200`}>
                            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Edit Project Details</h2>
                            <form onSubmit={handleUpdateProject} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <label className={LABEL_CLASSES}>Project Title</label>
                                        <input
                                            type="text"
                                            required
                                            className={INPUT_CLASSES}
                                            value={editFormData.title}
                                            onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className={LABEL_CLASSES}>Description</label>
                                        <textarea
                                            required
                                            rows="3"
                                            className={INPUT_CLASSES}
                                            value={editFormData.description}
                                            onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <label className={LABEL_CLASSES}>Status</label>
                                        <select
                                            className={INPUT_CLASSES}
                                            value={editFormData.status}
                                            onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                                        >
                                            <option value="active">Active</option>
                                            <option value="completed">Completed</option>
                                            <option value="hold">On Hold</option>
                                            <option value="cancelled">Cancelled</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className={LABEL_CLASSES}>Hourly Rate (₹)</label>
                                        <div className="relative">
                                            <IndianRupee className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                                            <input
                                                type="number"
                                                className={`${INPUT_CLASSES} pl-10`}
                                                value={editFormData.hourlyRate}
                                                onChange={(e) => setEditFormData({ ...editFormData, hourlyRate: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className={LABEL_CLASSES}>Budget (₹)</label>
                                        <div className="relative">
                                            <IndianRupee className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                                            <input
                                                type="number"
                                                className={`${INPUT_CLASSES} pl-10`}
                                                value={editFormData.budget}
                                                onChange={(e) => setEditFormData({ ...editFormData, budget: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className={LABEL_CLASSES}>Deadline</label>
                                        <input
                                            type="date"
                                            className={`${INPUT_CLASSES} dark:[color-scheme:dark]`}
                                            value={editFormData.deadline}
                                            onChange={(e) => setEditFormData({ ...editFormData, deadline: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsEditModalOpen(false)}
                                        className="px-6 py-2.5 bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-white hover:bg-slate-300 dark:hover:bg-white/20 rounded-xl font-medium transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white rounded-xl font-medium shadow-lg transition-all active:scale-95 hover:scale-105"
                                    >
                                        <Save className="w-5 h-5" /> Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Add Task Modal */}
                {isTaskModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsTaskModalOpen(false)}></div>
                        <div className={`relative w-full max-w-md ${GLASS_CLASSES} bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-2xl animate-in zoom-in duration-200`}>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Add New Task</h2>
                            <form onSubmit={handleCreateTask} className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-slate-700 dark:text-gray-300">Title</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full p-3 bg-white/50 dark:bg-black/20 border border-orange-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none dark:text-white"
                                        value={newTaskTitle}
                                        onChange={e => setNewTaskTitle(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700 dark:text-gray-300">Description</label>
                                    <textarea
                                        className="w-full p-3 bg-white/50 dark:bg-black/20 border border-orange-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none dark:text-white"
                                        value={newTaskDesc}
                                        onChange={e => setNewTaskDesc(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700 dark:text-gray-300">Due Date</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full p-3 bg-white/50 dark:bg-black/20 border border-orange-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none dark:text-white"
                                        value={newTaskDeadline}
                                        onChange={e => setNewTaskDeadline(e.target.value)}
                                    />
                                </div>
                                <button type="submit" className="w-full py-3 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-bold rounded-xl shadow-lg active:scale-95">
                                    Create Task
                                </button>
                            </form>
                            <button onClick={() => setIsTaskModalOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default ProjectDetails;
