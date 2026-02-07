import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import {
  LayoutDashboard, Users, Clock, IndianRupee, Menu, X,
  Sun, Moon, LogOut, User, Mail, Briefcase, Save, Trash2, CheckSquare, Lock, Key,
  ChevronDown, ChevronUp
} from 'lucide-react';
import Sidebar from '../components/Sidebar';

const GLASS_CLASSES = "bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-xl";
const INPUT_CLASSES = "w-full p-3 pl-10 bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition-all dark:text-white";
const LABEL_CLASSES = "block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1";
const BUTTON_BASE = "flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all duration-300 shadow-lg active:scale-95";



const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '', email: '', bio: '', skills: '', defaultHourlyRate: 0, mobile: ''
  });

  // OTP & Security State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSensitiveChange, setIsSensitiveChange] = useState(false);

  const [otpAction, setOtpAction] = useState('update'); // 'update' or 'delete'
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

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
          defaultHourlyRate: u.defaultHourlyRate || 0,
          mobile: u.mobile || ''
        });
      } catch (err) { toast.error("Failed to load profile"); }
      finally { setLoading(false); }
    };
    fetchProfile();
  }, [navigate]);

  const handleUpdate = async (e) => {
    e.preventDefault();

    // Validation Logic from Register.jsx
    const nameRegex = /^[a-zA-Z\s]+$/;
    const mobileRegex = /^[0-9+\(\)\s-]+$/;

    if (!nameRegex.test(formData.name) || formData.name.length < 2) {
      return toast.error("Invalid Name. Please use letters only.");
    }

    if (formData.mobile && (!mobileRegex.test(formData.mobile) || formData.mobile.length < 10 || formData.mobile.length > 15)) {
      return toast.error("Invalid Mobile Number.");
    }

    try {
      const skillsArray = formData.skills.split(',').map(s => s.trim()).filter(s => s);
      const payload = { ...formData, skills: skillsArray };

      // Check for sensitive changes
      const isEmailChanged = user.email.toLowerCase() !== formData.email.toLowerCase();
      const isPasswordChanged = newPassword.length > 0;

      if (isPasswordChanged && newPassword !== confirmPassword) {
        return toast.error("Passwords do not match!");
      }

      if (isEmailChanged || isPasswordChanged) {
        setIsSensitiveChange(true);
        setOtpAction('update');
        setShowOtpModal(true);
        // Send OTP immediately
        const type = isEmailChanged ? 'update_email' : 'profile_update';
        await api.post('/auth/send-otp', { email: user.email, type });
        toast.success(`OTP sent to ${user.email} for verification`);
        return;
      }

      // Standard Update
      const res = await api.put(`/users/${user._id}`, payload);
      toast.success("Profile Updated Successfully!");

      const lsUser = JSON.parse(localStorage.getItem('user'));
      lsUser.name = res.data.name;
      lsUser.email = res.data.email; // Update email in local storage
      localStorage.setItem('user', JSON.stringify(lsUser));
      setUser(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    }
  };

  const handleVerifyAndSave = async () => {
    try {
      const skillsArray = formData.skills.split(',').map(s => s.trim()).filter(s => s);
      const payload = { ...formData, skills: skillsArray, otp };

      if (newPassword) payload.password = newPassword;

      const res = await api.put(`/users/${user._id}`, payload);
      toast.success("Profile Updated Securely!");

      const lsUser = JSON.parse(localStorage.getItem('user'));
      lsUser.name = res.data.name;
      lsUser.email = res.data.email;
      localStorage.setItem('user', JSON.stringify(lsUser));
      setUser(res.data);

      // Reset State
      setShowOtpModal(false);
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
      setIsSensitiveChange(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid OTP or Update Failed");
    }
  };

  const verifyAndDelete = async () => {
    try {
      await api.delete(`/users/${user._id}`, { data: { otp } });
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      toast.success('Account deleted successfully');
      setShowOtpModal(false);
      setTimeout(() => navigate('/register'), 1000);
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid OTP or Delete Failed");
    }
  };

  const handleVerifyAction = () => {
    if (otpAction === 'delete') {
      verifyAndDelete();
    } else {
      handleVerifyAndSave();
    }
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
                  requestDeleteOtp();
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

  const requestDeleteOtp = async () => {
    try {
      await api.post('/auth/send-otp', { email: user.email, type: 'delete_account' });
      setOtpAction('delete');
      setShowOtpModal(true);
      toast.success(`OTP sent to ${user.email} for deletion verification`);
    } catch (err) {
      toast.error("Failed to send OTP for deletion");
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
          <Sidebar
            mobile={false}
            darkMode={darkMode}
            toggleTheme={toggleTheme}
            handleLogout={handleLogout}
            user={user}
          />
        </aside>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
          <header className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">My Profile</h2>
              <p className="text-slate-600 dark:text-gray-400">Manage your settings</p>
            </div>

          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">

            <div className="lg:col-span-1">
              <div className={`${GLASS_CLASSES} rounded-3xl p-8 text-center sticky top-8`}>
                <div className="w-28 h-28 bg-violet-600 dark:bg-yellow-500 rounded-full mx-auto flex items-center justify-center text-white dark:text-black text-4xl font-bold mb-4 shadow-lg">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">{user.name}</h2>
                <p className="select-text cursor-text text-slate-500 dark:text-gray-400 mb-4">{user.email}</p>
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
                        onChange={e => {
                          const val = e.target.value;
                          if (/^[a-zA-Z\s]*$/.test(val)) {
                            setFormData({ ...formData, name: val });
                          }
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={LABEL_CLASSES}>Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                      <input

                        type="email"
                        className={INPUT_CLASSES}
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-1 pl-1">Changing email requires OTP verification.</p>
                  </div>
                </div>

                {/* Password Change Section */}
                <div className="border-t border-white/20 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsChangePasswordOpen(!isChangePasswordOpen)}
                    className="flex items-center gap-2 text-violet-600 dark:text-yellow-400 font-medium hover:underline focus:outline-none"
                  >
                    {isChangePasswordOpen ? "Cancel Password Change" : "Change Password"}
                    {isChangePasswordOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {isChangePasswordOpen && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 animate-in slide-in-from-top-2 fade-in duration-300">
                      <div>
                        <label className={LABEL_CLASSES}>New Password</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                          <input
                            type="password"
                            className={INPUT_CLASSES}
                            placeholder="Leave blank to keep current"
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                          />
                        </div>
                      </div>
                      <div>
                        <label className={LABEL_CLASSES}>Confirm New Password</label>
                        <div className="relative">
                          <Key className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                          <input
                            type="password"
                            className={INPUT_CLASSES}
                            placeholder="Confirm new password"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  )}
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

                  <div>
                    <label className={LABEL_CLASSES}>Mobile Number</label>
                    <div className="relative">
                      <User className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        className={INPUT_CLASSES}
                        placeholder="+91 9876543210"
                        value={formData.mobile}
                        onChange={e => {
                          const val = e.target.value;
                          if (/^[0-9+\(\)\s-]*$/.test(val)) {
                            setFormData({ ...formData, mobile: val });
                          }
                        }}
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
        </main>
      </div>
      {/* OTP Verification Modal */}
      {
        showOtpModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className={`${GLASS_CLASSES} w-full max-w-md p-6 rounded-2xl shadow-2xl scale-100 animate-in zoom-in-95 duration-200`}>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-violet-100 dark:bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-8 h-8 text-violet-600 dark:text-yellow-400" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
                  {otpAction === 'delete' ? 'Confirm Deletion' : 'Security Verification'}
                </h2>
                <p className="text-slate-600 dark:text-gray-400 mt-2">
                  We sent a code to <b>{user.email}</b>. <br />
                  {otpAction === 'delete' ? 'Enter it to permanently delete your account.' : 'Enter it below to confirm changes.'}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={LABEL_CLASSES}>Enter OTP</label>
                  <input
                    type="text"
                    className={`${INPUT_CLASSES} text-center text-2xl tracking-widest font-mono`}
                    placeholder="000000"
                    maxLength={6}
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleVerifyAction}
                    className={`flex-1 py-3 ${otpAction === 'delete' ? 'bg-red-600 hover:bg-red-700' : 'bg-violet-600 hover:bg-violet-700 dark:bg-yellow-500 dark:hover:bg-yellow-600'} text-white dark:text-black rounded-xl font-bold shadow-lg transition-transform active:scale-95`}
                  >
                    {otpAction === 'delete' ? 'Verify & Delete' : 'Verify & Save'}
                  </button>
                  <button
                    onClick={() => setShowOtpModal(false)}
                    className="px-6 py-3 bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-700 dark:text-white rounded-xl font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }
    </div>
  );
};

export default Profile;