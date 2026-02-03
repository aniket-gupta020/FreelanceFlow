import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import {
  LayoutDashboard, Users, Clock, IndianRupee, Menu, X,
  Sun, Moon, LogOut, User, Mail, Briefcase, Save, Trash2, CheckSquare
} from 'lucide-react';

const GLASS_CLASSES = "bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-xl";
const INPUT_CLASSES = "w-full p-3 pl-10 bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition-all dark:text-white";
const LABEL_CLASSES = "block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1";
const BUTTON_BASE = "flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all duration-300 shadow-lg active:scale-95";

const Sidebar = ({ mobile, closeMobile, darkMode, toggleTheme, handleLogout }) => (
  <div className="flex flex-col h-full">
    <div className="p-6 flex items-center justify-between">
      <h1 className="text-2xl font-bold text-violet-600 dark:text-yellow-400 flex items-center gap-2">
        <LayoutDashboard className="w-8 h-8" /> FreelanceFlow
      </h1>
      {mobile && <button onClick={closeMobile}><X className="w-6 h-6 dark:text-white" /></button>}
    </div>
    <nav className="mt-2 px-4 space-y-3 flex-1">
      <Link to="/" className="flex items-center gap-3 px-4 py-3 text-slate-600 dark:text-gray-400 hover:bg-white/20 dark:hover:bg-white/5 rounded-xl font-medium transition-all">
        <LayoutDashboard className="w-5 h-5" /> Dashboard
      </Link>
      <Link to="/tasks" className="flex items-center gap-3 px-4 py-3 text-slate-600 dark:text-gray-400 hover:bg-white/20 dark:hover:bg-white/5 rounded-xl font-medium transition-all">
        <CheckSquare className="w-5 h-5" /> Tasks
      </Link>
      <Link to="/clients" className="flex items-center gap-3 px-4 py-3 text-slate-600 dark:text-gray-400 hover:bg-white/20 dark:hover:bg-white/5 rounded-xl font-medium transition-all">
        <Users className="w-5 h-5" /> Clients
      </Link>
      <Link to="/time" className="flex items-center gap-3 px-4 py-3 text-slate-600 dark:text-gray-400 hover:bg-white/20 dark:hover:bg-white/5 rounded-xl font-medium transition-all">
        <Clock className="w-5 h-5" /> Time Tracking
      </Link>
      <Link to="/invoices" className="flex items-center gap-3 px-4 py-3 text-slate-600 dark:text-gray-400 hover:bg-white/20 dark:hover:bg-white/5 rounded-xl font-medium transition-all">
        <IndianRupee className="w-5 h-5" /> Invoices
      </Link>

      <div className="flex items-center gap-3 px-4 py-3 bg-violet-600 dark:bg-yellow-500 text-white dark:text-black rounded-xl font-medium shadow-lg shadow-indigo-500/20">
        <User className="w-5 h-5" /> Profile
      </div>
    </nav>
    <div className="p-4 border-t border-white/20 dark:border-white/5 space-y-3">
      <button onClick={toggleTheme} className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 dark:text-gray-400 hover:bg-white/20 dark:hover:bg-white/5 rounded-xl font-medium transition-all">
        {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />} {darkMode ? "Light Mode" : "Dark Mode"}
      </button>
      <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-500/10 rounded-xl font-medium transition-all">
        <LogOut className="w-5 h-5" /> Log Out
      </button>
    </div>
  </div>
);

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [securityModal, setSecurityModal] = useState({ isOpen: false, type: 'email', step: 1, loading: false });
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [formData, setFormData] = useState({
    name: '', email: '', bio: '', skills: '', defaultHourlyRate: 0
  });

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
    toast.success(`Switched to ${newMode ? 'Dark' : 'Light'} Mode`, {
      icon: newMode ? <Moon className="w-4 h-4 text-white" /> : <Sun className="w-4 h-4 text-orange-500" />,
      style: { borderRadius: '12px', background: newMode ? '#333' : '#fff', color: newMode ? '#fff' : '#000' }
    });
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (!storedUser) return navigate('/login');

        const res = await api.get(`/users/${storedUser._id}`);
        const u = res.data;
        setUser(u);
        setFormData({
          name: u.name,
          email: u.email,
          bio: u.bio || '',
          skills: u.skills ? u.skills.join(', ') : '',
          defaultHourlyRate: u.defaultHourlyRate || 0
        });
      } catch (err) { toast.error("Failed to load profile"); }
      finally { setLoading(false); }
    };
    fetchProfile();
  }, [navigate]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const skillsArray = formData.skills.split(',').map(s => s.trim()).filter(s => s);
      const payload = { ...formData, skills: skillsArray };

      const res = await api.put(`/users/${user._id}`, payload);
      toast.success("Profile Updated Successfully!");

      const lsUser = JSON.parse(localStorage.getItem('user'));
      lsUser.name = res.data.name;
      localStorage.setItem('user', JSON.stringify(lsUser));
    } catch (err) { toast.error("Failed to update profile"); }
  };

  const handleDeleteAccount = () => {
    toast.custom((t) => (
      <div className={`${GLASS_CLASSES} p-6 rounded-2xl max-w-sm w-full animate-in fade-in zoom-in duration-300`}>
        <div className="flex items-start gap-4">
          <div className="p-3 bg-red-500/10 rounded-full">
            <Trash2 className="w-6 h-6 text-red-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-slate-800 dark:text-white mb-1">
              ⚠️ DANGER: Delete account?
            </h3>
            <p className="text-sm text-slate-600 dark:text-gray-400 mb-4">
              This will permanently delete your Freelancer Account.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  confirmDeleteStep2();
                }}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium text-sm transition-colors"
              >
                Delete
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
    ), { duration: Infinity });
  };

  const confirmDeleteStep2 = () => {
    toast.custom((t) => (
      <div className={`${GLASS_CLASSES} p-6 rounded-2xl max-w-sm w-full animate-in fade-in zoom-in duration-300`}>
        <div className="flex items-start gap-4">
          <div className="p-3 bg-red-500/10 rounded-full">
            <Trash2 className="w-6 h-6 text-red-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-slate-800 dark:text-white mb-1">
              Are you absolutely sure?
            </h3>
            <p className="text-sm text-slate-600 dark:text-gray-400 mb-4">
              This action cannot be undone. All your data will be lost.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  performDelete();
                }}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium text-sm transition-colors"
              >
                Confirm Delete
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
    ), { duration: Infinity });
  };

  const performDelete = async () => {
    const deletePromise = new Promise(async (resolve, reject) => {
      try {
        await api.delete(`/users/${user._id}`);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        resolve();
        // Small delay to let the toast show before navigating
        setTimeout(() => navigate('/register'), 1000);
      } catch (err) {
        reject(err);
      }
    });

    toast.promise(deletePromise, {
      loading: 'Deleting account...',
      success: 'Account deleted successfully',
      error: 'Failed to delete account',
    });
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

  if (loading) return <div className="p-10 text-center">Loading...</div>;

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setSecurityModal(prev => ({ ...prev, loading: true }));
    try {
      if (securityModal.type === 'email') {
        if (!newEmail) { toast.error("Enter new email"); return; }
        await api.post(`/users/${user._id}/request-email-change-otp`, { newEmail });
        toast.success(`OTP sent to ${newEmail}`);
        setSecurityModal(prev => ({ ...prev, step: 2 }));
      } else {
        await api.post(`/users/${user._id}/request-password-change-otp`);
        toast.success(`OTP sent to ${user.email}`);
        setSecurityModal(prev => ({ ...prev, step: 2 }));
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setSecurityModal(prev => ({ ...prev, loading: false }));
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setSecurityModal(prev => ({ ...prev, loading: true }));
    const otpValue = otp.join('');
    try {
      if (securityModal.type === 'email') {
        const res = await api.post(`/users/${user._id}/update-email-otp`, { otp: otpValue });
        toast.success("Email updated successfully!");
        setUser(prev => ({ ...prev, email: res.data.newEmail }));
        setFormData(prev => ({ ...prev, email: res.data.newEmail }));
      } else {
        if (newPassword !== confirmPassword) { toast.error("Passwords do not match"); return; }
        await api.post(`/users/${user._id}/update-password-otp`, { otp: otpValue, newPassword });
        toast.success("Password updated successfully!");
      }
      setSecurityModal({ isOpen: false, type: null, step: 0, loading: false });
      resetForm();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Verification failed");
    } finally {
      setSecurityModal(prev => ({ ...prev, loading: false }));
    }
  };

  const resetForm = () => {
    setOtp(['', '', '', '', '', '']);
    setNewEmail('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`).focus();
    }
  };

  return (
    <div className="min-h-screen transition-colors duration-500 bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 dark:from-gray-900 dark:via-black dark:to-gray-900 select-none">
      <div className="flex h-screen overflow-hidden">

        <div className={`fixed inset-0 z-50 md:hidden pointer-events-none`}>
          <div className={`absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0'}`} onClick={() => setIsMobileMenuOpen(false)} />
          <div className={`absolute top-0 left-0 w-72 h-full ${GLASS_CLASSES} transform transition-transform duration-300 ease-out pointer-events-auto ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <Sidebar mobile={true} closeMobile={() => setIsMobileMenuOpen(false)} darkMode={darkMode} toggleTheme={toggleTheme} handleLogout={handleLogout} />
          </div>
        </div>
        <aside className={`w-72 hidden md:block border-r border-white/20 dark:border-white/5 ${GLASS_CLASSES} z-10`}>
          <Sidebar
            mobile={false}
            darkMode={darkMode}
            toggleTheme={toggleTheme}
            handleLogout={handleLogout}
          />
        </aside>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
          <header className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">My Profile</h2>
              <p className="text-slate-600 dark:text-gray-400">Manage your settings</p>
            </div>
            <button onClick={() => setIsMobileMenuOpen(true)} className={`${GLASS_CLASSES} p-2 rounded-lg text-gray-600 dark:text-gray-300`}><Menu className="w-6 h-6" /></button>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">

            <div className="lg:col-span-1">
              <div className={`${GLASS_CLASSES} rounded-3xl p-8 text-center sticky top-8`}>
                <div className="w-28 h-28 bg-violet-600 dark:bg-yellow-500 rounded-full mx-auto flex items-center justify-center text-white dark:text-black text-4xl font-bold mb-4 shadow-lg">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">{user.name}</h2>
                <p className="text-slate-500 dark:text-gray-400 mb-4">{user.email}</p>
                <span className="inline-block px-4 py-1.5 bg-violet-100 text-violet-700 dark:bg-yellow-500/20 dark:text-yellow-400 rounded-full text-xs font-bold uppercase tracking-wide">
                  {user.role} Account
                </span>
              </div>
            </div>

            <div className="lg:col-span-2">
              <form onSubmit={handleUpdate} className={`${GLASS_CLASSES} rounded-3xl p-8 space-y-6`}>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white border-b border-white/20 pb-2">Edit Details</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={LABEL_CLASSES}>Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        className={INPUT_CLASSES}
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className={LABEL_CLASSES}>Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      className={`${INPUT_CLASSES} opacity-60 cursor-not-allowed`}
                      value={formData.email}
                      readOnly
                    />
                    <button
                      type="button"
                      onClick={() => setSecurityModal({ ...securityModal, type: 'email', isOpen: true, step: 1 })}
                      className="absolute right-2 top-2 px-3 py-1.5 bg-violet-100 text-violet-600 dark:bg-yellow-500/20 dark:text-yellow-400 rounded-lg text-xs font-bold hover:bg-violet-200 dark:hover:bg-yellow-500/30 transition-colors"
                    >
                      Change
                    </button>
                  </div>
                </div>
            </div>

            {/* Password Change Button */}
            <div className="flex justify-start">
              <button
                type="button"
                onClick={() => setSecurityModal({ ...securityModal, type: 'password', isOpen: true, step: 1 })}
                className={`${BUTTON_BASE} bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-white text-sm`}
              >
                <Briefcase className="w-4 h-4" /> Change Password
              </button>
            </div>

            <div>
              <label className={LABEL_CLASSES}>Bio</label>
              <textarea
                className={`${INPUT_CLASSES} pl-4`}
                rows="4"
                placeholder="Tell clients about yourself..."
                value={formData.bio}
                onChange={e => setFormData({ ...formData, bio: e.target.value })}
              ></textarea>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={LABEL_CLASSES}>Skills (comma separated)</label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    className={INPUT_CLASSES}
                    placeholder="React, Node.js..."
                    value={formData.skills}
                    onChange={e => setFormData({ ...formData, skills: e.target.value })}
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
                    value={formData.defaultHourlyRate}
                    onChange={e => setFormData({ ...formData, defaultHourlyRate: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-6 border-t border-white/20">
              <button
                type="button"
                onClick={handleDeleteAccount}
                className="flex items-center gap-2 text-red-500 hover:text-red-600 text-sm font-medium transition"
              >
                <Trash2 className="w-4 h-4" /> Delete Account
              </button>

              <button
                type="submit"
                className={`${BUTTON_BASE} bg-violet-600 hover:bg-violet-700 dark:bg-yellow-500 dark:hover:bg-yellow-600 text-white dark:text-black`}
              >
                <Save className="w-5 h-5" /> Save Changes
              </button>
            </div>
          </form>
      </div>

    </div>
          {
    securityModal.isOpen && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className={`${GLASS_CLASSES} w-full max-w-md p-8 rounded-3xl animate-in fade-in zoom-in duration-300`}>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white">
              {securityModal.type === 'email' ? 'Change Email' : 'Change Password'}
            </h3>
            <button onClick={() => setSecurityModal({ isOpen: false })} className="p-2 hover:bg-black/5 rounded-full"><X className="w-5 h-5 dark:text-white" /></button>
          </div>

          {securityModal.step === 1 ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              {securityModal.type === 'email' ? (
                <div>
                  <label className={LABEL_CLASSES}>New Email Address</label>
                  <input
                    type="email"
                    required
                    className={INPUT_CLASSES}
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="Enter new email"
                  />
                </div>
              ) : (
                <p className="text-slate-600 dark:text-gray-300">
                  We will send a One-Time Password (OTP) to your current email address (<b>{user.email}</b>) to verify this request.
                </p>
              )}
              <button type="submit" disabled={securityModal.loading} className={`${BUTTON_BASE} w-full justify-center bg-violet-600 text-white`}>
                {securityModal.loading ? 'Sending...' : 'Send OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="space-y-2">
                <label className={LABEL_CLASSES}>Enter OTP</label>
                <div className="flex justify-between gap-2">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      maxLength="1"
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      className="w-12 h-12 text-center text-xl font-bold rounded-xl border border-gray-200 dark:border-white/10 bg-white/50 dark:bg-black/20 focus:ring-2 focus:ring-violet-500 outline-none dark:text-white"
                    />
                  ))}
                </div>
              </div>

              {securityModal.type === 'password' && (
                <div className="space-y-4">
                  <div>
                    <label className={LABEL_CLASSES}>New Password</label>
                    <input
                      type="password"
                      required
                      className={INPUT_CLASSES}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={LABEL_CLASSES}>Confirm Password</label>
                    <input
                      type="password"
                      required
                      className={INPUT_CLASSES}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <button type="submit" disabled={securityModal.loading} className={`${BUTTON_BASE} w-full justify-center bg-violet-600 text-white`}>
                {securityModal.loading ? 'Verifying...' : 'Verify & Update'}
              </button>
              <button type="button" onClick={() => setSecurityModal(prev => ({ ...prev, step: 1 }))} className="w-full text-center text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400">
                Back
              </button>
            </form>
          )}
        </div>
      </div>
    )
  }
        </main >
      </div >
    </div >
  );
};

export default Profile;