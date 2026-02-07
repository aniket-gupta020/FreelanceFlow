import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api';
import Sidebar from '../components/Sidebar';
import {
    Menu, CheckSquare, Plus, ArrowRight, X, Clock, IndianRupee, Briefcase, Calendar,
    PlayCircle, FileText, Trash2, CheckCircle, AlertCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Stopwatch from '../components/Stopwatch';
import AutoTimeTracker from '../components/AutoTimeTracker';
import ProjectReportGenerator from '../components/ProjectReportGenerator';

const GLASS_CLASSES = "bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-xl";
const INPUT_CLASSES = "w-full p-3 bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition-all dark:text-white";
const LABEL_CLASSES = "block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1";

const ProjectDetails = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [timeLogs, setTimeLogs] = useState([]);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

    // Modal State
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskDesc, setNewTaskDesc] = useState('');
    const [newTaskDeadline, setNewTaskDeadline] = useState('');

    // Time Tracking State
    const [manualForm, setManualForm] = useState({
        hours: '',
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

        // Fetch Tasks
        api.get(`/tasks?projectId=${projectId}`).then(res => {
            const projectTasks = res.data.filter(t => t.project === projectId || (t.project && t.project._id === projectId));
            setTasks(projectTasks);
        }).catch(console.error);

        // Fetch Time Logs
        api.get('/timelogs').then(res => {
            // Filter logs for this project
            // Note: Backend might not support filtering yet properly, so we filter here.
            // Usually logs have `project` populated or as ID.
            const pLogs = res.data.filter(l => (l.projectId === projectId || l.project === projectId || l.project?._id === projectId));
            setTimeLogs(pLogs);
        }).catch(console.error);
    };

    useEffect(() => {
        fetchProjectData();
    }, [projectId]);

    const handleCreateTask = async (e) => {
        e.preventDefault();
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
            fetchProjectData(); // Refresh list
        } catch (err) {
            toast.error("Failed to add task");
            console.error(err);
        }
    };

    const handleMarkComplete = async () => {
        try {
            await api.put(`/projects/${projectId}`, { status: 'Completed' });
            toast.success("Project Marked as Complete!");
            fetchProjectData();
        } catch (err) {
            toast.error("Error updating project");
        }
    };

    const submitManual = async (e) => {
        e.preventDefault();
        const hours = parseFloat(manualForm.hours);
        if (isNaN(hours) || hours <= 0) return toast.error('Please enter valid hours');
        if (!manualForm.description.trim()) return toast.error('Description is required');

        // Validation: Cannot exceed project age (Now - CreatedAt)
        if (project.createdAt) {
            const created = new Date(project.createdAt);
            const now = new Date();
            const projectAgeHours = (now - created) / (1000 * 60 * 60);

            if (hours > projectAgeHours) {
                return toast.error(`Cannot log ${hours} hours. Project is only ${projectAgeHours.toFixed(2)} hours old.`);
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
            setManualForm({ hours: '', description: '', date: new Date().toISOString().split('T')[0] });
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

    if (!project) return <div className="p-10 text-center">Loading Project...</div>;

    const user = JSON.parse(localStorage.getItem('user'));
    const isCreator = user && (user._id === project.createdBy || user._id === project.createdBy?._id);

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 dark:from-gray-900 dark:via-black dark:to-gray-900 transition-colors duration-500">
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
                    <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                        <div className="flex items-center justify-between w-full md:w-auto gap-4">
                            <div>
                                <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Project Details</h2>
                                <div className="flex items-center gap-2 text-slate-600 dark:text-gray-400 mt-1">
                                    {!isCreator && (
                                        <>
                                            {project.client?.isDeleted ? (
                                                <span className="text-gray-400 italic cursor-not-allowed" title="Account Deactivated">
                                                    {project.client?.name} (Deactivated)
                                                </span>
                                            ) : (
                                                <Link to={`/clients/${project.client?._id || project.client}`} className="hover:underline">
                                                    {project.client?.name || 'Client'}
                                                </Link>
                                            )}
                                            <span>/</span>
                                        </>
                                    )}
                                    <span className="text-violet-600 dark:text-yellow-400">{project.title}</span>
                                </div>
                            </div>

                        </div>

                        <div className="flex gap-3">
                            {/* Only the user who CREATED the project can mark it as complete */}
                            {project.status !== 'Completed' && (() => {
                                const user = JSON.parse(localStorage.getItem('user'));
                                if (user && (user._id === project.createdBy || user._id === project.createdBy?._id)) {
                                    return (
                                        <button onClick={handleMarkComplete} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium shadow-lg transition-all active:scale-95">
                                            Mark as Complete
                                        </button>
                                    );
                                }
                                return null;
                            })()}
                        </div>
                    </header>

                    {/* Project Info */}
                    <div className={`${GLASS_CLASSES} p-8 rounded-3xl mb-8`}>
                        <div className="flex justify-between items-start">
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{project.title}</h1>
                                <p className="text-slate-600 dark:text-gray-400 max-w-2xl">{project.description}</p>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-sm font-bold uppercase ${project.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                                {project.status || 'Active'}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                            <div className="bg-white/50 dark:bg-white/5 p-4 rounded-2xl flex items-center gap-4">
                                <div className="p-3 bg-violet-100 dark:bg-violet-900/30 rounded-xl text-violet-600 dark:text-violet-400">
                                    <IndianRupee className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="text-sm text-slate-500 dark:text-gray-400">Budget</div>
                                    <div className="font-bold text-lg text-slate-800 dark:text-white">{project.budget}</div>
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
                            <CheckSquare className="w-6 h-6 text-violet-600 dark:text-yellow-400" />
                            Project Tasks
                        </h3>

                        {/* Only the user who CREATED the project can add tasks */}
                        {(() => {
                            const user = JSON.parse(localStorage.getItem('user'));
                            if (user && (user._id === project.createdBy || user._id === project.createdBy?._id)) {
                                return (
                                    <button onClick={() => setIsTaskModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-medium shadow-lg transition-all active:scale-95">
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
                                <div key={task._id} className={`${GLASS_CLASSES} p-4 rounded-xl flex items-center justify-between group hover:border-violet-400 transition-colors`}>
                                    <div className="flex items-center gap-4">
                                        <div className={`w-2 h-2 rounded-full ${task.status === 'done' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                                        <div>
                                            <h4 className={`font-bold text-slate-800 dark:text-white ${task.status === 'done' ? 'line-through opacity-60' : ''}`}>{task.title}</h4>
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

                    {/* Time Tracking Section - Hidden for Creator */
                        (() => {
                            const user = JSON.parse(localStorage.getItem('user'));
                            const isCreator = user && (user._id === project.createdBy || user._id === project.createdBy?._id);

                            if (isCreator) return null;

                            return (
                                <>
                                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mt-8 mb-6 flex items-center gap-2">
                                        <Clock className="w-6 h-6 text-violet-600 dark:text-yellow-400" />
                                        Time Tracking
                                    </h3>

                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                        {/* Timer & Manual Entry */}
                                        <div className="space-y-6">
                                            <div className={`${GLASS_CLASSES} rounded-3xl p-6 border-t-4 border-t-violet-500 dark:border-t-yellow-500`}>
                                                <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                                    <PlayCircle className="w-5 h-5 text-violet-500 dark:text-yellow-500" /> Live Timer
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
                                                            <input
                                                                type="number" step="0.1"
                                                                value={manualForm.hours}
                                                                onChange={e => setManualForm({ ...manualForm, hours: e.target.value })}
                                                                className={INPUT_CLASSES}
                                                                placeholder="1.5"
                                                            />
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
                                        <div className="lg:col-span-2">
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
                                                                            <span className="font-mono font-bold text-violet-600 dark:text-yellow-400">
                                                                                {log.durationHours?.toFixed(2)} hrs
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
                                                                                <td className="p-4 text-right font-bold text-slate-800 dark:text-gray-300">{log.durationHours?.toFixed(2)} hrs</td>
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
                                        className="w-full p-3 bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none dark:text-white"
                                        value={newTaskTitle}
                                        onChange={e => setNewTaskTitle(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700 dark:text-gray-300">Description</label>
                                    <textarea
                                        className="w-full p-3 bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none dark:text-white"
                                        value={newTaskDesc}
                                        onChange={e => setNewTaskDesc(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700 dark:text-gray-300">Due Date</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full p-3 bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none dark:text-white"
                                        value={newTaskDeadline}
                                        onChange={e => setNewTaskDeadline(e.target.value)}
                                    />
                                </div>
                                <button type="submit" className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl shadow-lg">
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
