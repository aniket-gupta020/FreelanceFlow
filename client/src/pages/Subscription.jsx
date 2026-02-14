import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Star, Zap, Shield, IndianRupee, ArrowRight, Loader2, X, LogOut, Moon, Sun } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../api';
import Sidebar from '../components/Sidebar';

const GLASS_CLASSES = "bg-white/60 dark:bg-black/40 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-xl shadow-orange-500/10";
const ACCENT_GRADIENT = "bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600";

const Subscription = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState(() => {
        try {
            const stored = localStorage.getItem('user');
            return stored ? JSON.parse(stored).user || JSON.parse(stored) : null;
        } catch (e) {
            return null;
        }
    });

    const [darkMode, setDarkMode] = useState(() => {
        if (localStorage.getItem('theme')) return localStorage.getItem('theme') === 'dark';
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    });

    const toggleTheme = () => {
        const newMode = !darkMode;
        setDarkMode(newMode);
        localStorage.setItem('theme', newMode ? 'dark' : 'light');
        if (newMode) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
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

    // Handle Mock Payment & Upgrade
    const handleUpgrade = async () => {
        setLoading(true);
        try {
            // 1. Simulate Payment Delay
            await new Promise(resolve => setTimeout(resolve, 2000));

            // 2. Mock API Call to Upgrade User
            const res = await api.put(`/users/${user._id}`, { subscription: 'pro' });

            // 3. Update Local Storage & State
            const updatedUser = res.data;
            const lsData = JSON.parse(localStorage.getItem('user'));

            // Handle different storage structures (some store as {user: ...} others just {...})
            if (lsData.user) {
                lsData.user = updatedUser;
            } else {
                Object.assign(lsData, updatedUser);
            }
            localStorage.setItem('user', JSON.stringify(lsData));
            setUser(updatedUser);

            // 4. Success Message
            toast.custom((t) => (
                <div className={`${GLASS_CLASSES} p-6 rounded-2xl max-w-sm w-full animate-in fade-in zoom-in duration-300 border-l-4 border-l-green-500`}>
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-green-500/10 rounded-full">
                            <Zap className="w-6 h-6 text-green-500" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 dark:text-white mb-1">Payment Successful!</h3>
                            <p className="text-sm text-slate-600 dark:text-gray-400">
                                Welcome to FreelanceFlow <b>Pro</b>. <br />
                                You now have access to all premium features.
                            </p>
                        </div>
                    </div>
                </div>
            ));

            // 5. Redirect after delay
            setTimeout(() => navigate('/invoices'), 2000);

        } catch (err) {
            console.error(err);
            toast.error("Payment failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen transition-colors duration-500 bg-gradient-to-br from-orange-50 via-yellow-50 to-orange-100 dark:from-gray-900 dark:via-black dark:to-gray-900 select-none flex">
            {/* Sidebar (Optional: keep layout consistent) */}
            <aside className={`w-72 hidden md:block border-r border-white/20 dark:border-white/5 ${GLASS_CLASSES} z-10 sticky top-0 h-screen`}>
                <Sidebar user={user} darkMode={darkMode} toggleTheme={toggleTheme} handleLogout={handleLogout} />
            </aside>

            <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-12">
                        <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-yellow-600 mb-4 pb-2">
                            Upgrade Your Workflow
                        </h1>
                        <p className="text-lg text-slate-600 dark:text-gray-400 max-w-2xl mx-auto">
                            Unlock the full potential of FreelanceFlow with our Pro plan. Generate professional invoices, track unlimited clients, and more.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                        {/* Free Plan */}
                        <div className={`${GLASS_CLASSES} rounded-3xl p-8 relative overflow-hidden transition-all hover:scale-[1.01]`}>
                            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Starter</h3>
                            <div className="flex items-baseline gap-1 mb-6">
                                <span className="text-4xl font-bold text-slate-900 dark:text-white">Free</span>
                            </div>

                            <ul className="space-y-4 mb-8">
                                <li className="flex items-center gap-3 text-slate-600 dark:text-gray-300">
                                    <Check className="w-5 h-5 text-green-500" /> 2 Clients Limit
                                </li>
                                <li className="flex items-center gap-3 text-slate-600 dark:text-gray-300">
                                    <Check className="w-5 h-5 text-green-500" /> Basic Time Tracking
                                </li>
                                <li className="flex items-center gap-3 text-slate-400 dark:text-gray-600">
                                    <X className="w-5 h-5" /> PDF Invoices
                                </li>
                                <li className="flex items-center gap-3 text-slate-400 dark:text-gray-600">
                                    <X className="w-5 h-5" /> Priority Support
                                </li>
                            </ul>

                            <button className="w-full py-4 rounded-xl font-bold bg-slate-200 dark:bg-white/10 text-slate-500 cursor-not-allowed">
                                Current Plan
                            </button>
                        </div>

                        {/* Pro Plan */}
                        <div className={`${GLASS_CLASSES} rounded-3xl p-8 relative overflow-hidden border-2 border-orange-500 transform hover:scale-[1.02] transition-all shadow-2xl shadow-orange-500/20`}>
                            <div className="absolute top-0 right-0 bg-gradient-to-l from-orange-500 to-yellow-500 text-white text-xs font-bold px-4 py-1 rounded-bl-xl">
                                MOST POPULAR
                            </div>

                            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
                                <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" /> Pro
                            </h3>
                            <div className="flex items-baseline gap-1 mb-1">
                                <span className="text-4xl font-bold text-slate-900 dark:text-white">₹799</span>
                                <span className="text-slate-500">/month</span>
                            </div>
                            <p className="text-sm text-slate-500 mb-6">Billed monthly</p>

                            <ul className="space-y-4 mb-8">
                                <li className="flex items-center gap-3 text-slate-800 dark:text-white font-medium">
                                    <div className="p-1 bg-green-500/20 rounded-full"><Check className="w-4 h-4 text-green-600" /></div>
                                    Unlimited Clients
                                </li>
                                <li className="flex items-center gap-3 text-slate-800 dark:text-white font-medium">
                                    <div className="p-1 bg-green-500/20 rounded-full"><Check className="w-4 h-4 text-green-600" /></div>
                                    <span className="flex items-center gap-2">Professional PDF Invoices <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">New</span></span>
                                </li>
                                <li className="flex items-center gap-3 text-slate-800 dark:text-white font-medium">
                                    <div className="p-1 bg-green-500/20 rounded-full"><Check className="w-4 h-4 text-green-600" /></div>
                                    Advanced Reports
                                </li>
                                <li className="flex items-center gap-3 text-slate-800 dark:text-white font-medium">
                                    <div className="p-1 bg-green-500/20 rounded-full"><Check className="w-4 h-4 text-green-600" /></div>
                                    Priority Support
                                </li>
                            </ul>

                            {user?.subscription === 'pro' ? (
                                <button className="w-full py-4 rounded-xl font-bold bg-green-500/10 text-green-600 border border-green-500 cursor-default flex items-center justify-center gap-2">
                                    <Check className="w-5 h-5" /> Active Plan
                                </button>
                            ) : (
                                <button
                                    onClick={handleUpgrade}
                                    disabled={loading}
                                    className={`w-full py-4 rounded-xl font-bold text-white shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2 transition-all active:scale-95 ${ACCENT_GRADIENT} ${loading ? 'opacity-80 cursor-wait' : ''}`}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" /> Processing...
                                        </>
                                    ) : (
                                        <>
                                            Upgrade to Pro <ArrowRight className="w-5 h-5" />
                                        </>
                                    )}
                                </button>
                            )}

                            <p className="text-center text-xs text-slate-400 mt-4 flex items-center justify-center gap-1">
                                <Shield className="w-3 h-3" /> Secure generic payment simulation
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Subscription;
