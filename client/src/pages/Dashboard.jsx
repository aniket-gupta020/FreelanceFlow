import { useEffect, useState } from 'react';
import api from '../api';
import { toast } from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Clock, IndianRupee, Users, Plus,
  Trash2, Pencil, Briefcase, Menu, X, Sun, Moon,
  LogOut, AlertTriangle, CheckSquare, User,
  ChevronDown, ChevronRight, Database
} from 'lucide-react';
import FinancialDashboard from '../components/FinancialDashboard';
import UpcomingDeadlines from '../components/UpcomingDeadlines';
import Sidebar from '../components/Sidebar';
import LoadingPage from '../components/LoadingPage';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDuration } from '../utils/formatDuration';


const GLASS_CLASSES = "bg-white/60 dark:bg-black/40 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-xl shadow-orange-500/5";
const CARD_HOVER = "hover:scale-105 active:scale-[0.98] transition-all duration-300 ease-out hover:shadow-2xl hover:shadow-orange-500/20";
const BUTTON_BASE = "flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all duration-300 shadow-lg active:scale-95";

const TEXT_HEADLINE = "text-slate-800 dark:text-white";
const TEXT_SUB = "text-slate-600 dark:text-gray-400";
const ACCENT_COLOR = "text-orange-600 dark:text-yellow-400";
const ACCENT_BG = "bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 dark:bg-yellow-500 dark:hover:bg-yellow-600 text-white dark:text-black";

const StatCard = ({ title, value, subtext, type, icon: Icon }) => {
  const styles = {
    blue: "bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400",
    emerald: "bg-yellow-100 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400",
    rose: "bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400",
  };
  const activeStyle = styles[type] || styles.blue;

  return (
    <div className={`${GLASS_CLASSES} p-6 rounded-2xl flex items-start space-x-4 ${CARD_HOVER}`}>
      <div className={`p-3 rounded-xl ${activeStyle}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <h3 className={`${TEXT_SUB} text-xs font-bold uppercase tracking-wider`}>{title}</h3>
        <p className={`text-2xl font-bold ${TEXT_HEADLINE} my-1`}>{value}</p>
        <p className={`text-xs ${TEXT_SUB} opacity-80`}>{subtext}</p>
      </div>
    </div>
  );
};

const ProjectCard = ({ project, user, isOwner, handleDelete, handleApply, handleMarkComplete, expandedProjectId, setExpandedProjectId, projectTimeLogs, calculateBurnRate, onClick }) => {
  const isExpired = new Date(project.deadline) < new Date();
  const isCompleted = project.status === 'completed';
  const hasApplied = project.applicants?.some(app => String(app._id || app) === String(user?._id));

  return (
    <div
      onClick={onClick}
      className={`bg-white/80 dark:bg-white/5 border border-white/50 dark:border-white/10 rounded-2xl p-6 relative group animate-fade-in-up ${CARD_HOVER} ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="absolute top-4 right-4 flex gap-2 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        {isOwner ? (
          <>
            {!isCompleted && !isExpired && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); handleMarkComplete(project._id); }}
                  className="p-2 bg-white dark:bg-black/50 text-emerald-500 rounded-full shadow-md hover:scale-110 transition"
                  title="Mark as Complete"
                >
                  <CheckSquare className="w-4 h-4" />
                </button>
                <Link
                  to={`/edit-project/${project._id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="p-2 bg-white dark:bg-black/50 text-blue-500 rounded-full shadow-md hover:scale-110 transition"
                >
                  <Pencil className="w-4 h-4" />
                </Link>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(project._id); }}
                  className="p-2 bg-white dark:bg-black/50 text-red-500 rounded-full shadow-md hover:scale-110 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
            {isCompleted && (
              <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">
                Completed
              </span>
            )}
            {!isCompleted && isExpired && (
              <span className="px-3 py-1 rounded-full bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold uppercase tracking-wider">
                Deadline Exceeded
              </span>
            )}
          </>
        ) : (
          /* Status Indicators for Non-Owners */
          <>
            {isCompleted ? (
              <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">
                Completed
              </span>
            ) : isExpired ? (
              <span className="px-3 py-1 rounded-full bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold uppercase tracking-wider">
                Deadline Exceeded
              </span>
            ) : hasApplied ? (
              <span className="px-3 py-1 rounded-full bg-orange-100 dark:bg-yellow-500/20 text-orange-600 dark:text-yellow-400 text-xs font-bold uppercase tracking-wider shadow-orange-500/10">
                Applied
              </span>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); handleApply(project._id); }}
                className={`p-2 ${ACCENT_BG} rounded-full shadow-md hover:scale-110 transition`}
              >
                <Briefcase className="w-4 h-4" />
              </button>
            )}
          </>
        )}
      </div>
      <h4 className={`font-bold text-lg ${ACCENT_COLOR} mb-2 pr-32 truncate`}>{project.title}</h4>
      <p className={`text-sm ${TEXT_SUB} mb-4 line-clamp-2 leading-relaxed`}>{project.description}</p>

      {(() => {
        const clientRate = project.hourlyRate || project.client?.defaultHourlyRate || 0;
        const burn = calculateBurnRate(project._id, project.budget, clientRate);
        const burnPercent = project.budget > 0 ? Math.round((burn.cost / project.budget) * 100) : 0;
        const displayProgress = Math.min(Math.max(burnPercent, 0), 100);

        return (
          <div className="mb-4 p-4 bg-gray-50 dark:bg-black/40 rounded-xl border border-gray-100 dark:border-white/5">
            <div className="text-xs font-bold text-slate-700 dark:text-white mb-2 flex justify-between">
              <span>Budget Burn</span>
              <span>{displayProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
              <div className={`h-2.5 rounded-full ${displayProgress > 80 ? 'bg-red-500' : displayProgress > 50 ? 'bg-yellow-500' : 'bg-emerald-500'}`} style={{ width: `${displayProgress}%` }}></div>
            </div>
            <div className="text-xs mt-3 space-y-1.5 font-medium text-slate-600 dark:text-slate-300">
              <div className="flex justify-between">
                <span>Hours Logged:</span><span className="font-bold text-slate-800 dark:text-white">{formatDuration(burn.hours)}</span>
              </div>
              <div className="flex justify-between">
                <span>Cost:</span><span className="select-text cursor-text font-bold text-slate-800 dark:text-white">{formatCurrency(burn.cost)}</span>
              </div>
            </div>
          </div>
        );
      })()}

      <div className="flex justify-between items-center pt-4 border-t border-gray-200/50 dark:border-white/10">
        <div className="flex items-center gap-2">
          <span className={`select-text cursor-text font-bold ${TEXT_HEADLINE}`}>{formatCurrency(project.budget)}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className={`text-xs font-medium px-3 py-1 rounded-full bg-gray-100 dark:bg-white/10 ${TEXT_SUB}`}>
            {new Date(project.deadline).toLocaleDateString()}
          </span>
          {isCompleted && project.completedAt && (
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">
              Completed: {new Date(project.completedAt).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      {isOwner && project.applicants && project.applicants.length > 0 && (
        <div className="mt-4">
          <button
            onClick={(e) => { e.stopPropagation(); setExpandedProjectId(prev => String(prev) === String(project._id) ? null : project._id); }}
            className="text-sm px-3 py-1 rounded-full bg-white/50 dark:bg-black/30 border border-gray-200 dark:border-white/10 text-slate-700 dark:text-gray-200 hover:bg-white/80 transition"
          >
            {project.applicants.length} Applicant{project.applicants.length > 1 ? 's' : ''}
          </button>
        </div>
      )}

      {String(expandedProjectId) === String(project._id) && project.applicants && project.applicants.length > 0 && (
        <div onClick={(e) => e.stopPropagation()} className="mt-4 p-3 rounded-lg bg-white/50 dark:bg-black/40 backdrop-blur-md border border-gray-200 dark:border-white/10">
          {project.applicants.map((app) => {
            const applicant = app.name ? app : { _id: app, name: 'Unknown', email: '' };
            return (
              <div key={applicant._id} className="py-2 border-b border-gray-200 dark:border-white/10 last:border-b-0">
                <Link
                  to={`/clients/${applicant._id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="font-medium text-sm text-slate-800 dark:text-white hover:text-orange-600 dark:hover:text-yellow-400 hover:underline transition-colors"
                >
                  {applicant.name}
                </Link>
                <div className="select-text cursor-text text-xs text-slate-600 dark:text-gray-400">{applicant.email || applicant._id}</div>
              </div>
            );
          })}
        </div>
      )}


    </div>
  );
};

const Dashboard = () => {
  const [projects, setProjects] = useState([]);
  const [user, setUser] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedProjectId, setExpandedProjectId] = useState(null);
  const [projectTimeLogs, setProjectTimeLogs] = useState({});
  const [showPreviousProjects, setShowPreviousProjects] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSampleLoaded, setIsSampleLoaded] = useState(false);
  const navigate = useNavigate();

  const [darkMode, setDarkMode] = useState(() => {
    if (localStorage.getItem('theme')) return localStorage.getItem('theme') === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  const toggleTheme = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
    toast.success(`Switched to ${newMode ? 'Dark' : 'Light'} Mode`, {
      icon: newMode ? <Moon className="w-4 h-4 text-white" /> : <Sun className="w-4 h-4 text-orange-500" />,
      style: { borderRadius: '12px', background: newMode ? '#333' : '#fff', color: newMode ? '#fff' : '#000' }
    });
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

    api.get('/projects')
      .then(res => setProjects(res.data))
      .catch(err => console.error("Error fetching projects:", err));

    api.get('/timelogs/unbilled')
      .then(res => {
        const logsByProject = {};
        res.data.forEach(log => {
          logsByProject[log.project] = (logsByProject[log.project] || 0) + (log.durationHours || 0);
        });
        setProjectTimeLogs(logsByProject);
      })
      .catch(err => console.error("Error fetching timelogs:", err));

    api.get('/sample-data/status')
      .then(res => setIsSampleLoaded(res.data.isLoaded))
      .catch(err => console.error("Error fetching sample status:", err))
      .finally(() => {
        // Minimum delay for branding as requested
        setTimeout(() => setLoading(false), 800);
      });
  }, [navigate]);



  const calculateBurnRate = (projectId, budget, clientRate) => {
    const hours = projectTimeLogs[projectId] || 0;
    const cost = hours * (clientRate || 0);
    return { hours, cost, remaining: Math.max(0, budget - cost) };
  };

  const handleApply = async (projectId) => {
    try {
      await api.post(`/projects/${projectId}/apply`, { userId: user._id });

      setProjects(prevProjects => prevProjects.map(project => {
        if (project._id === projectId) {
          // Optimistically update applicants to include current user
          const updatedApplicants = project.applicants ? [...project.applicants, user] : [user];
          return { ...project, applicants: updatedApplicants };
        }
        return project;
      }));

      toast.success("Applied Successfully! 🚀");
    } catch (err) {
      toast.error(err.response?.data?.message || "Error applying");
    }
  };

  const handleDelete = (id) => {
    toast((t) => (
      <div className="flex flex-col gap-3 items-center p-2">
        <p className="font-medium text-slate-800 dark:text-white">Delete this project?</p>
        <div className="flex gap-3">
          <button
            onClick={() => {
              toast.dismiss(t.id);
            }}
            className="px-4 py-1.5 text-sm bg-gray-200 dark:bg-white/10 rounded-lg hover:bg-gray-300 dark:hover:bg-white/20 transition text-slate-700 dark:text-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                await api.delete(`/projects/${id}`);
                setProjects(prev => prev.filter(project => project._id !== id));
                toast.success("Project deleted successfully");
              } catch (err) {
                console.error("Error deleting:", err);
                toast.error("Failed to delete project");
              }
            }}
            className="px-4 py-1.5 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 shadow-red-500/30 shadow-lg transition"
          >
            Delete
          </button>
        </div>
      </div>
    ), { duration: 5000, style: { minWidth: '300px' } });
  };

  const handleMarkComplete = async (id) => {
    try {
      await api.put(`/projects/${id}`, { status: 'completed' });
      setProjects(prev => prev.map(p => p._id === id ? { ...p, status: 'completed' } : p));
      toast.success("Project marked as complete! 🎉");
    } catch (err) {
      console.error("Error updating project:", err);
      toast.error("Failed to update status");
    }
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

  const handleLoadSampleData = async () => {
    const toastId = toast.loading("Loading sample data...");
    try {
      await api.post('/sample-data/load');
      setIsSampleLoaded(true);
      toast.success("Sample data loaded! 🚀", { id: toastId });
      // Refresh projects
      const res = await api.get('/projects');
      setProjects(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load sample data", { id: toastId });
    }
  };

  const handleUnloadSampleData = async () => {
    const toastId = toast.loading("Removing sample data...");
    try {
      await api.delete('/sample-data/unload');
      setIsSampleLoaded(false);
      toast.success("Sample data removed", { id: toastId });
      // Refresh projects
      const res = await api.get('/projects');
      setProjects(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove sample data", { id: toastId });
    }
  };


  const getSafeId = (id) => id?._id || id?.id || id;
  const currentUserId = user ? getSafeId(user) : null;

  const myProjects = projects.filter(project => {
    const projectOwnerId = getSafeId(project.createdBy);
    const projectClientId = getSafeId(project.client);
    return String(currentUserId) === String(projectOwnerId) || String(currentUserId) === String(projectClientId);
  });

  const activeMyProjects = myProjects.filter(p => p.status !== 'completed' && new Date(p.deadline) >= new Date());
  const pastMyProjects = myProjects.filter(p => p.status === 'completed' || new Date(p.deadline) < new Date());

  // Only show user's own past projects (dead and completed)
  const allPastProjects = pastMyProjects;

  const checkIsOwner = (project) => {
    const projectOwnerId = getSafeId(project.createdBy);
    const projectClientId = getSafeId(project.client);
    return String(currentUserId) === String(projectOwnerId) || String(currentUserId) === String(projectClientId);
  };


  if (loading) return <LoadingPage />;

  return (
    <div className={`min-h-screen transition-colors duration-500 ease-in-out bg-gradient-to-br from-orange-100 via-yellow-100 to-orange-50 dark:from-gray-900 dark:via-black dark:to-gray-900 select-none`}>
      <div className="flex h-screen overflow-hidden">

        {/* Mobile Menu Overlay */}
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
            <div className="md:hidden flex items-center justify-between w-full mb-4">
              <div className={`font-bold text-xl flex items-center gap-2 ${ACCENT_COLOR}`}>
                <LayoutDashboard className="w-6 h-6" /> FreelanceFlow
              </div>
              <button onClick={() => setIsMobileMenuOpen(true)} className={`${GLASS_CLASSES} p-2 rounded-lg text-gray-600 dark:text-gray-300 opacity-0 pointer-events-none`}><Menu className="w-6 h-6" /></button>
            </div>

            <div>
              <h2 className={`text-3xl font-bold ${TEXT_HEADLINE} tracking-tight`}>Overview</h2>
              <p className={`${TEXT_SUB} mt-1`}>Welcome back, {user?.name}</p>
            </div>

            <button
              onClick={isSampleLoaded ? handleUnloadSampleData : handleLoadSampleData}
              className={`${BUTTON_BASE} ${isSampleLoaded
                ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 hover:bg-red-500/20'
                : ACCENT_BG
                } backdrop-blur-md shadow-xl`}
            >
              {isSampleLoaded ? (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Unload Sample Data</span>
                </>
              ) : (
                <>
                  <Database className="w-4 h-4" />
                  <span>Load Sample Data</span>
                </>
              )}
            </button>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <StatCard title="Active Projects" value={activeMyProjects.length} subtext="Currently active" type="emerald" icon={Briefcase} />
            <StatCard title="Owned Projects" value={myProjects.length} subtext="Total owned" type="blue" icon={LayoutDashboard} />
          </div>

          <div className={`${GLASS_CLASSES} rounded-3xl p-6 md:p-8 mb-8`}>
            <h3 className={`text-xl font-bold ${TEXT_HEADLINE} mb-6`}>My Active Projects</h3>
            {activeMyProjects.length === 0 ? (
              <div className="text-center py-16">
                <div className="bg-gray-100 dark:bg-white/5 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <Briefcase className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className={`text-lg font-bold ${TEXT_HEADLINE}`}>No active projects</h3>
                <p className={`${TEXT_SUB} mt-2`}>Projects you create or work on will appear here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {activeMyProjects.map(project => (
                  <ProjectCard
                    key={project._id}
                    project={project}
                    user={user}
                    isOwner={true}
                    handleDelete={handleDelete}
                    handleApply={handleApply}
                    handleMarkComplete={handleMarkComplete}
                    expandedProjectId={expandedProjectId}
                    setExpandedProjectId={setExpandedProjectId}
                    projectTimeLogs={projectTimeLogs}
                    calculateBurnRate={calculateBurnRate}
                    onClick={() => navigate(`/projects/${project._id}`)}
                  />
                ))}
              </div>
            )}
          </div>

          {allPastProjects.length > 0 && (
            <div className={`mb-8 ${GLASS_CLASSES} rounded-3xl transition-all duration-300 grayscale ${showPreviousProjects ? 'p-6 md:p-8 opacity-90' : 'p-4 opacity-75 hover:opacity-100'}`}>
              <button
                onClick={() => setShowPreviousProjects(!showPreviousProjects)}
                className={`w-full flex items-center justify-between text-xl font-bold ${TEXT_HEADLINE} hover:opacity-80 transition-opacity`}
              >
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" /> Previous Projects
                </div>
                {showPreviousProjects ? <ChevronDown className="w-6 h-6" /> : <ChevronRight className="w-6 h-6" />}
              </button>

              {showPreviousProjects && (
                <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 animate-in slide-in-from-top-2 fade-in duration-300">
                  {allPastProjects.map(project => (
                    <ProjectCard
                      key={project._id}
                      project={project}
                      user={user}
                      isOwner={checkIsOwner(project)}
                      handleDelete={handleDelete}
                      handleApply={handleApply}
                      handleMarkComplete={handleMarkComplete}
                      expandedProjectId={expandedProjectId}
                      setExpandedProjectId={setExpandedProjectId}
                      projectTimeLogs={projectTimeLogs}
                      calculateBurnRate={calculateBurnRate}
                      onClick={undefined}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="mt-8 flex flex-col gap-8 pb-8">
            <FinancialDashboard />
            <UpcomingDeadlines />

          </div>

        </main>
      </div>
    </div>
  );
};

export default Dashboard;