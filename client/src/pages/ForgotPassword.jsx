import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useNavigate, Link } from 'react-router-dom';
import { LayoutDashboard, Mail, Lock, ArrowRight, Sun, Moon, KeyRound } from 'lucide-react';

// 🎨 DESIGN SYSTEM CONSTANTS (Matches Login/Register)
const GLASS_CLASSES = "bg-white/60 dark:bg-black/40 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-xl shadow-orange-500/10";
const INPUT_GROUP = "relative flex items-center group";
const INPUT_ICON = "absolute left-3 w-5 h-5 text-gray-400 group-focus-within:text-orange-500 dark:group-focus-within:text-yellow-400 transition-colors";
const INPUT_CLASSES = "w-full pl-10 p-3 bg-white/50 dark:bg-black/20 border border-orange-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-orange-500 dark:focus:ring-yellow-400 outline-none transition-all dark:text-white backdrop-blur-sm placeholder:text-gray-400";
const LABEL_CLASSES = "block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1 ml-1";
const BUTTON_CLASSES = "w-full py-3.5 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 dark:bg-yellow-500 dark:hover:bg-yellow-600 text-white dark:text-black font-bold rounded-xl transition-all shadow-lg shadow-orange-500/30 dark:shadow-yellow-500/20 flex items-center justify-center gap-2 active:scale-95";

const BACKEND_URL = "https://freelanceflow-oy9e.onrender.com/api/auth";

const ForgotPassword = () => {
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false);

    // Theme Management
    const [darkMode, setDarkMode] = useState(() => {
        if (localStorage.getItem('theme')) return localStorage.getItem('theme') === 'dark';
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    });

    const navigate = useNavigate();

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [darkMode]);

    const toggleTheme = () => {
        const newMode = !darkMode;
        setDarkMode(newMode);
        toast.success(`Switched to ${newMode ? 'Dark' : 'Light'} Mode`, {
            icon: newMode ? <Moon className="w-4 h-4 text-white" /> : <Sun className="w-4 h-4 text-orange-500" />,
            style: { borderRadius: '12px', background: newMode ? '#333' : '#fff', color: newMode ? '#fff' : '#000' }
        });
    };

    // Step 1: Send OTP
    const handleSendOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post(`${BACKEND_URL}/send-otp`, { email, type: 'forgot_password' });
            toast.success("OTP Sent! Check your email.");
            setStep(2);
        } catch (err) {
            toast.error(err.response?.data?.message || "User not found");
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Reset Password
    const handleResetPassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (newPassword.length < 6) {
                toast.error("Password must be at least 6 characters");
                setLoading(false);
                return;
            }
            await axios.post(`${BACKEND_URL}/reset-password`, { email, otp, newPassword });
            toast.success("Password Reset Successful! Logging you in...");
            setTimeout(() => navigate('/login'), 1500);
        } catch (err) {
            toast.error(err.response?.data?.message || "Invalid OTP or Error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-100 via-yellow-100 to-orange-50 dark:from-gray-900 dark:via-black dark:to-gray-900 transition-colors duration-500 flex items-center justify-center p-4 relative overflow-hidden">

            {/* Floating Theme Toggle */}
            <button
                onClick={toggleTheme}
                className="fixed bottom-6 left-6 p-4 rounded-full bg-white/30 dark:bg-black/30 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-2xl hover:scale-110 transition-transform z-50 group"
                title="Toggle Theme"
            >
                {darkMode ? (
                    <Sun className="w-6 h-6 text-yellow-400 group-hover:rotate-90 transition-transform duration-500" />
                ) : (
                    <Moon className="w-6 h-6 text-slate-700 group-hover:-rotate-12 transition-transform duration-500" />
                )}
            </button>

            {/* Main Glass Card */}
            <div className={`w-full max-w-md ${GLASS_CLASSES} rounded-3xl p-8 relative overflow-hidden`}>

                {/* Breathing Background Blobs */}
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-orange-500/30 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-pink-500/30 rounded-full blur-3xl animate-pulse delay-700"></div>

                {/* Header Section */}
                <div className="text-center mb-8 relative z-10">
                    <div className="inline-flex p-3 rounded-2xl bg-orange-100 dark:bg-white/10 text-orange-600 dark:text-yellow-400 mb-4 shadow-inner ring-1 ring-black/5 dark:ring-white/10">
                        <LayoutDashboard className="w-8 h-8" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">Recover Account</h1>
                    <p className="text-slate-500 dark:text-gray-400 mt-2 text-sm">
                        {step === 1 ? "Enter your email to receive a verification code" : "Check your email for the OTP code"}
                    </p>
                </div>

                {/* Form Steps */}
                {step === 1 ? (
                    <form onSubmit={handleSendOtp} className="space-y-6 relative z-10">
                        <div>
                            <label className={LABEL_CLASSES}>Email Address</label>
                            <div className={INPUT_GROUP}>
                                <Mail className={INPUT_ICON} />
                                <input
                                    type="email"
                                    required
                                    className={INPUT_CLASSES}
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={BUTTON_CLASSES}
                        >
                            {loading ? 'Sending OTP...' : 'Send Verification Code'}
                            {!loading && <ArrowRight className="w-5 h-5" />}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleResetPassword} className="space-y-6 relative z-10">
                        <div>
                            <label className={LABEL_CLASSES}>Verification Code</label>
                            <div className={INPUT_GROUP}>
                                <KeyRound className={INPUT_ICON} />
                                <input
                                    type="text"
                                    required
                                    className={`${INPUT_CLASSES} tracking-widest text-center font-mono text-lg`}
                                    placeholder="000000"
                                    maxLength={6}
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className={LABEL_CLASSES}>New Password</label>
                            <div className={INPUT_GROUP}>
                                <Lock className={INPUT_ICON} />
                                <input
                                    type="password"
                                    required
                                    className={INPUT_CLASSES}
                                    placeholder="••••••••"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={BUTTON_CLASSES}
                        >
                            {loading ? 'Resetting Password...' : 'Set New Password'}
                            {!loading && <ArrowRight className="w-5 h-5" />}
                        </button>
                    </form>
                )}

                {/* Footer Link */}
                <p className="text-center mt-8 text-slate-600 dark:text-gray-400 relative z-10 text-sm">
                    Remembered your password?{' '}
                    <Link to="/login" className="font-bold text-orange-600 dark:text-yellow-400 hover:underline transition-all">
                        Login here
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default ForgotPassword;