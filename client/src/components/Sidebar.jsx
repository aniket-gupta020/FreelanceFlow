import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, Users, Clock, IndianRupee,
    User, Sun, Moon, LogOut, X
} from 'lucide-react';

const Sidebar = ({ mobile, closeMobile, darkMode, toggleTheme, handleLogout, user }) => {
    const location = useLocation();
    const isActive = (path) => path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

    // Retrieve user from localStorage if not provided via props
    const currentUser = user || (() => {
        try {
            const stored = localStorage.getItem('user');
            if (stored) {
                const parsed = JSON.parse(stored);
                return parsed.user || parsed;
            }
        } catch (e) { console.error("Error parsing user from local storage", e); }
        return null;
    })();

    const LINK_CLASSES = (path) => `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-300 ${isActive(path)
        ? "bg-gradient-to-r from-orange-500 to-yellow-500 text-white dark:bg-yellow-500 dark:text-black shadow-lg shadow-orange-500/20"
        : "text-slate-600 dark:text-gray-400 hover:bg-white/20 dark:hover:bg-white/5"
        }`;

    return (
        <div className="flex flex-col h-full">
            <div className="p-6 flex items-center justify-between">
                <h1 className="text-2xl font-bold text-orange-600 dark:text-yellow-400 flex items-center gap-2">
                    <LayoutDashboard className="w-8 h-8" /> FreelanceFlow
                </h1>
                {mobile && <button onClick={closeMobile}><X className="w-6 h-6 dark:text-white" /></button>}
            </div>

            <nav className="mt-2 px-4 space-y-3 flex-1">
                <Link to="/" className={LINK_CLASSES('/')}>
                    <LayoutDashboard className="w-5 h-5" /> Dashboard
                </Link>
                <Link to="/clients" className={LINK_CLASSES('/clients')}>
                    <Users className="w-5 h-5" /> Clients
                </Link>
                <Link to="/invoices" className={LINK_CLASSES('/invoices')}>
                    <IndianRupee className="w-5 h-5" /> Invoices
                </Link>
                <Link to="/profile" className={LINK_CLASSES('/profile')}>
                    <User className="w-5 h-5" /> {currentUser?.name || 'Profile'}
                </Link>
            </nav>

            <div className="p-4 border-t border-white/20 dark:border-white/5 space-y-3">
                <button onClick={toggleTheme} className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 dark:text-gray-400 hover:bg-white/20 dark:hover:bg-white/5 rounded-xl font-medium transition-all duration-300">
                    {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />} {darkMode ? "Light Mode" : "Dark Mode"}
                </button>
                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-500/10 rounded-xl font-medium transition-all duration-300">
                    <LogOut className="w-5 h-5" /> Log Out
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
