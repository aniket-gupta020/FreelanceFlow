import React from 'react';
import { Link } from 'react-router-dom';
import {
    LayoutDashboard, Users, Clock, IndianRupee,
    User, Sun, Moon, LogOut, X
} from 'lucide-react';

const Sidebar = ({ mobile, closeMobile, darkMode, toggleTheme, handleLogout }) => {
    const ACCENT_BG = "bg-violet-600 hover:bg-violet-700 dark:bg-yellow-500 dark:hover:bg-yellow-600 text-white dark:text-black";
    const TEXT_SUB = "text-slate-600 dark:text-gray-400";
    const ACCENT_COLOR = "text-violet-600 dark:text-yellow-400";

    return (
        <div className="flex flex-col h-full">
            <div className="p-6 flex items-center justify-between">
                <h1 className={`text-2xl font-bold ${ACCENT_COLOR} flex items-center gap-2`}>
                    <LayoutDashboard className="w-8 h-8" /> FreelanceFlow
                </h1>
                {mobile && <button onClick={closeMobile}><X className="w-6 h-6 dark:text-white" /></button>}
            </div>

            <nav className="mt-2 px-4 space-y-3 flex-1">
                <Link to="/" className={`flex items-center gap-3 px-4 py-3 ${TEXT_SUB} hover:bg-white/20 dark:hover:bg-white/5 rounded-xl font-medium transition-all duration-300`}>
                    <LayoutDashboard className="w-5 h-5" /> Dashboard
                </Link>
                <Link to="/clients" className={`flex items-center gap-3 px-4 py-3 ${TEXT_SUB} hover:bg-white/20 dark:hover:bg-white/5 rounded-xl font-medium transition-all duration-300`}>
                    <Users className="w-5 h-5" /> Clients
                </Link>
                <Link to="/invoices" className={`flex items-center gap-3 px-4 py-3 ${TEXT_SUB} hover:bg-white/20 dark:hover:bg-white/5 rounded-xl font-medium transition-all duration-300`}>
                    <IndianRupee className="w-5 h-5" /> Invoices
                </Link>
                <Link to="/profile" className={`flex items-center gap-3 px-4 py-3 ${TEXT_SUB} hover:bg-white/20 dark:hover:bg-white/5 rounded-xl font-medium transition-all duration-300`}>
                    <User className="w-5 h-5" /> Profile
                </Link>
            </nav>

            <div className="p-4 border-t border-white/20 dark:border-white/5 space-y-3">
                <button onClick={toggleTheme} className={`w-full flex items-center gap-3 px-4 py-3 ${TEXT_SUB} hover:bg-white/20 dark:hover:bg-white/5 rounded-xl font-medium transition-all duration-300`}>
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
