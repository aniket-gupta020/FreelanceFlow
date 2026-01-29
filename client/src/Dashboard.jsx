import React from 'react';
import { LayoutDashboard, Clock, FileText, IndianRupee, Users } from 'lucide-react';

const StatCard = ({ title, value, subtext, color, icon: Icon }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-start space-x-4">
    <div className={`p-3 rounded-lg ${color} bg-opacity-10 text-white`}>
       <Icon className={`w-6 h-6`} style={{ color: color }} />
    </div>
    <div>
      <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">{title}</h3>
      <p className="text-2xl font-bold text-gray-900 my-1">{value}</p>
      <p className="text-xs text-gray-400 font-medium">{subtext}</p>
    </div>
  </div>
);

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:block">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-indigo-600 flex items-center gap-2">
            <LayoutDashboard className="w-8 h-8" />
            FreelanceFlow
          </h1>
        </div>
        <nav className="mt-6 px-4 space-y-2">
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-indigo-600 bg-indigo-50 rounded-lg font-medium">
            <LayoutDashboard className="w-5 h-5" /> Dashboard
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg font-medium transition">
            <Users className="w-5 h-5" /> Clients
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg font-medium transition">
             <Clock className="w-5 h-5" /> Time Tracking
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg font-medium transition">
            <FileText className="w-5 h-5" /> Invoices
          </a>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Overview</h2>
            <p className="text-gray-500">Welcome back, Intern Developer</p>
          </div>
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-sm transition">
            + New Project
          </button>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard 
            title="Active Projects" 
            value="3" 
            subtext="2 deadlines this week"
            color="#4F46E5" // Indigo
            icon={LayoutDashboard}
          />
          <StatCard 
            title="Pending Invoices" 
            value="₹1,250.00" 
            subtext="Last updated today"
            color="#F59E0B" // Amber
            icon={IndianRupee}
          />
          <StatCard 
            title="Upcoming Deadlines" 
            value="Nov 14" 
            subtext="Client: TechCorp"
            color="#EF4444" // Red
            icon={Clock}
          />
        </div>

        {/* Empty State / Content Area */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="max-w-md mx-auto">
                <div className="bg-gray-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <LayoutDashboard className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">No recent activity</h3>
                <p className="text-gray-500 mt-2 mb-6">Your recent projects and time logs will appear here once you start working.</p>
            </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;