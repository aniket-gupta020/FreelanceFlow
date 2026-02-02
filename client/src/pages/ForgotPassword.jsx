import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useNavigate, Link } from 'react-router-dom';
import { LayoutDashboard, Mail, Lock, ArrowRight, Sun, Moon, KeyRound } from 'lucide-react';

const GLASS_CLASSES = "bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-xl";
const INPUT_GROUP = "relative flex items-center";
const INPUT_ICON = "absolute left-3 w-5 h-5 text-gray-400 dark:text-gray-500";
const INPUT_CLASSES = "w-full pl-10 p-3 bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition-all dark:text-white";
const LABEL_CLASSES = "block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1";

const BACKEND_URL = "https://freelanceflow-oy9e.onrender.com/api/auth";

const ForgotPassword = () => {
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false);

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

    const handleSendOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post(`${BACKEND_URL}/send-otp`, { email });
            toast.success("OTP Sent! Check your email.");
            setStep(2);
        } catch (err) {
            toast.error(err.response?.data?.message || "User not found");
        } finally {
            setLoading(false);
        }
    };

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
            toast.success("Password Reset Successful!");
            navigate('/login');
        } catch (err) {
            toast.error(err.response?.data?.message || "Invalid OTP or Error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 dark:from-gray-900 dark:via-black dark:to-gray-900 transition-colors duration-500 flex items-center justify-center p-4 relative">

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

            <div className={`w-full max-w-md ${GLASS_CLASSES} rounded-3xl p-8 relative overflow-hidden`}>
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-violet-500/30 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-pink-500/30 rounded-full blur-3xl"></div>

                <div className="text-center mb-8 relative z-10">
                    <div className="inline-flex p-3 rounded-2xl bg-violet-100 dark:bg-white/10 text-violet-600 dark:text-yellow-400 mb-4 shadow-inner">
                        <LayoutDashboard className="w-8 h-8" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Recover Account</h1>
                    <p className="text-slate-500 dark:text-gray-400 mt-2">
                        {step === 1 ? "Enter your email to reset password" : "Enter OTP and new password"}
                    </p>
                </div>

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
                            className="w-full py-3.5 bg-violet-600 hover:bg-violet-700 dark:bg-yellow-500 dark:hover:bg-yellow-600 text-white dark:text-black font-bold rounded-xl transition-all shadow-lg shadow-violet-500/30 flex items-center justify-center gap-2"
                        >
                            {loading ? 'Sending OTP...' : 'Send OTP'}
                            {!loading && <ArrowRight className="w-5 h-5" />}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleResetPassword} className="space-y-6 relative z-10">
                        <div>
                            <label className={LABEL_CLASSES}>Enter OTP</label>
                            <div className={INPUT_GROUP}>
                                <KeyRound className={INPUT_ICON} />
                                <input
                                    type="text"
                                    required
                                    className={INPUT_CLASSES}
                                    placeholder="6-digit code"
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
                            className="w-full py-3.5 bg-violet-600 hover:bg-violet-700 dark:bg-yellow-500 dark:hover:bg-yellow-600 text-white dark:text-black font-bold rounded-xl transition-all shadow-lg shadow-violet-500/30 flex items-center justify-center gap-2"
                        >
                            {loading ? 'Resetting...' : 'Reset Password'}
                            {!loading && <ArrowRight className="w-5 h-5" />}
                        </button>
                    </form>
                )}

                <p className="text-center mt-8 text-slate-600 dark:text-gray-400 relative z-10">
                    Remembered password?{' '}
                    <Link to="/login" className="font-bold text-violet-600 dark:text-yellow-400 hover:underline">
                        Login here
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default ForgotPassword;
