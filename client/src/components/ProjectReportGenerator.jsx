import React, { useState } from 'react';
import { PieChart, Calculator, Calendar, Users, IndianRupee, Clock, Eye, CheckCircle, X, Zap } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Link, useLocation } from 'react-router-dom';
import api from '../api';
import { generateInvoicePDF } from './pdfGenerator';
import { formatDuration } from '../utils/formatDuration';

const ProjectReportGenerator = ({ project, timeLogs, onRefresh }) => {
    const location = useLocation();
    const user = (() => {
        try {
            const stored = localStorage.getItem('user');
            return stored ? JSON.parse(stored).user || JSON.parse(stored) : null;
        } catch (e) { return null; }
    })();

    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setMonth(d.getMonth() - 1);
        return d.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [generatedReport, setGeneratedReport] = useState(null);
    const [summaryStats, setSummaryStats] = useState({ cost: 0, hours: 0, freelancers: 0 });

    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedLogs, setSelectedLogs] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleCalculate = () => {
        if (!startDate || !endDate) return toast.error("Please select a date range");
        if (!timeLogs || timeLogs.length === 0) return toast("No time logs found", { icon: 'ℹ️' });

        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        const userMap = {};
        let totalProjectCost = 0;
        let totalProjectHours = 0;
        let skippedCount = 0;

        timeLogs.forEach(log => {
            const logDate = new Date(log.startTime);

            if (logDate < start || logDate > end) return;

            if (log.billed || log.status === 'paid' || log.status === 'billed') {
                skippedCount++;
                return;
            }

            if (!log.user) return;

            const userId = log.user._id || log.user;
            const rate = project.hourlyRate || log.user.defaultHourlyRate || 0;
            const hours = log.durationHours || 0;

            if (!userMap[userId]) {
                userMap[userId] = {
                    id: userId,
                    name: log.user.name || 'Unknown',
                    email: log.user.email || 'No Email',
                    mobile: log.user.mobile || 'N/A',
                    rate: rate,
                    totalHours: 0,
                    totalCost: 0,
                    logs: []
                };
            }

            userMap[userId].totalHours += hours;
            userMap[userId].totalCost += (hours * rate);
            userMap[userId].logs.push(log);

            totalProjectCost += (hours * rate);
            totalProjectHours += hours;
        });

        const reportArray = Object.values(userMap);

        if (reportArray.length === 0) {
            if (skippedCount > 0) {
                toast.success("All logs in this period are already billed! ✅");
            } else {
                toast("No unbilled logs found in this range", { icon: 'ℹ️' });
            }
            setGeneratedReport([]);
            setSummaryStats({ cost: 0, hours: 0, freelancers: 0 });
        } else {
            setGeneratedReport(reportArray);
            const totalLogs = reportArray.reduce((acc, user) => acc + user.logs.length, 0);
            setSummaryStats({
                cost: totalProjectCost,
                hours: totalProjectHours,
                logCount: totalLogs
            });
            toast.success("Found unbilled work for this period.");
        }
    };

    const openBillingModal = (user) => {
        setSelectedUser(user);
        setSelectedLogs(user.logs.map(l => l._id));
        setIsModalOpen(true);
    };

    const toggleLogSelection = (logId) => {
        if (selectedLogs.includes(logId)) {
            setSelectedLogs(selectedLogs.filter(id => id !== logId));
        } else {
            setSelectedLogs([...selectedLogs, logId]);
        }
    };

    const handleProcessPayment = async (actionType) => {
        if (selectedLogs.length === 0) return toast.error("Please select at least one log.");

        const logsToProcess = selectedUser.logs.filter(l => selectedLogs.includes(l._id));
        const totalHours = logsToProcess.reduce((sum, l) => sum + (l.durationHours || 0), 0);
        const totalAmount = totalHours * selectedUser.rate;

        try {
            const payload = {
                projectId: project._id,
                freelancerId: selectedUser.id,
                logIds: selectedLogs,
                amount: totalAmount,
                hours: totalHours,
                date: new Date(),
                status: actionType === 'pay' ? 'paid' : 'sent'
            };

            await api.post('/invoices/create', payload);

            toast.success("Bill Generated Successfully!");
            setIsModalOpen(false);

            const tempInvoice = {
                client: project.client || { name: 'Project Owner', email: 'N/A' },
                freelancer: {
                    name: selectedUser.name,
                    email: selectedUser.email,
                    mobile: selectedUser.mobile
                },
                project: { title: project.title },
                logs: logsToProcess,
                invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
                createdAt: new Date(),
                totalAmount: totalAmount,
                totalHours: totalHours
            };
            generateInvoicePDF(tempInvoice);

            if (onRefresh) {
                onRefresh();
                setGeneratedReport(prev => prev.filter(u => u.id !== selectedUser.id));
            }

        } catch (error) {
            console.error("Payment Error:", error);
            toast.error("Failed to process payment");
        }
    };

    return (
        <>
            <div className="relative overflow-hidden rounded-3xl backdrop-blur-xl bg-white/40 dark:bg-black/40 border border-white/50 dark:border-white/10 shadow-2xl transition-all duration-300 mb-8">
                {/* Top Gradient Line */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 via-yellow-500 to-orange-600"></div>

                {/* Pro Ad Banner */}
                {(user?.subscription !== 'pro' && user?.plan !== 'pro') && (
                    <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-3 flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2">
                            <Zap className="w-4 h-4 text-orange-400" />
                            <span className="font-medium">Get detailed PDF exports with Pro</span>
                        </div>
                        <Link to="/subscription" state={{ from: location }} className="text-orange-400 font-bold hover:underline">Upgrade</Link>
                    </div>
                )}

                <div className="p-8">
                    {/* Header */}
                    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-8">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-2xl shadow-lg shadow-orange-500/20 text-white">
                                <PieChart className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-400">
                                    Financial Reports
                                </h3>
                                <p className="text-sm font-medium text-slate-500 dark:text-gray-400">
                                    View unbilled hours and generate invoices
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 mb-8 p-1">
                        <div className="xl:col-span-6 2xl:col-span-4 group relative">
                            <label className="absolute -top-2.5 left-4 bg-white dark:bg-gray-900 px-2 text-xs font-bold text-orange-600 z-10 transition-all">START DATE</label>
                            <div className="flex items-center bg-white/50 dark:bg-black/20 border-2 border-transparent group-hover:border-orange-500/50 rounded-2xl">
                                <Calendar className="w-5 h-5 text-slate-400 ml-4" />
                                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full p-4 bg-transparent outline-none text-slate-700 dark:text-white dark:[color-scheme:dark]" />
                            </div>
                        </div>

                        <div className="xl:col-span-6 2xl:col-span-4 group relative">
                            <label className="absolute -top-2.5 left-4 bg-white dark:bg-gray-900 px-2 text-xs font-bold text-orange-600 z-10 transition-all">END DATE</label>
                            <div className="flex items-center bg-white/50 dark:bg-black/20 border-2 border-transparent group-hover:border-orange-500/50 rounded-2xl">
                                <Calendar className="w-5 h-5 text-slate-400 ml-4" />
                                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full p-4 bg-transparent outline-none text-slate-700 dark:text-white dark:[color-scheme:dark]" />
                            </div>
                        </div>

                        <div className="xl:col-span-12 2xl:col-span-4">
                            <button onClick={handleCalculate} className="w-full h-full min-h-[56px] flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-black rounded-2xl font-bold text-sm md:text-base xl:text-lg shadow-xl transition-all active:scale-[0.98] whitespace-nowrap">
                                <Calculator className="w-4 h-4 md:w-5 md:h-5" /> Find Unbilled Work
                            </button>
                        </div>
                    </div>

                    {/* Results */}
                    {generatedReport && (
                        <div className="animate-in fade-in slide-in-from-bottom-6 duration-500">
                            {generatedReport.length > 0 && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-4 mb-6">
                                    <div className="bg-orange-50/50 dark:bg-yellow-500/10 p-4 rounded-2xl border border-orange-100 dark:border-orange-500/20">
                                        <div className="flex items-center gap-3 mb-1">
                                            <div className="p-2 bg-orange-100 dark:bg-yellow-500/20 rounded-lg"><IndianRupee className="w-4 h-4 text-orange-600 dark:text-yellow-400" /></div>
                                            <span className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Pending Amount</span>
                                        </div>
                                        <div className="text-2xl font-black text-slate-800 dark:text-white">Rs. {summaryStats.cost.toFixed(2)}</div>
                                    </div>
                                    <div className="bg-emerald-50/50 dark:bg-emerald-900/10 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-500/20">
                                        <div className="flex items-center gap-3 mb-1">
                                            <div className="p-2 bg-emerald-100 dark:bg-emerald-800 rounded-lg"><Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-300" /></div>
                                            <span className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Pending Hours</span>
                                        </div>
                                        <div className="text-2xl font-black text-slate-800 dark:text-white">{formatDuration(summaryStats.hours)}</div>
                                    </div>
                                    <div className="sm:col-span-2 2xl:col-span-1 bg-orange-50/50 dark:bg-yellow-500/10 p-4 rounded-2xl border border-orange-100 dark:border-orange-500/20">
                                        <div className="flex items-center gap-3 mb-1">
                                            <div className="p-2 bg-orange-100 dark:bg-yellow-500/20 rounded-lg"><Clock className="w-4 h-4 text-orange-600 dark:text-yellow-400" /></div>
                                            <span className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Unbilled Sessions</span>
                                        </div>
                                        <div className="text-2xl font-black text-slate-800 dark:text-white">{summaryStats.logCount}</div>
                                    </div>
                                </div>
                            )}

                            {/* Responsive List Container */}
                            <div className="bg-white/40 dark:bg-black/20 rounded-2xl border border-white/50 dark:border-white/5 overflow-hidden backdrop-blur-sm">
                                {generatedReport.length === 0 ? (
                                    <div className="p-12 text-center text-slate-500">No unbilled work found for this period.</div>
                                ) : (
                                    <>
                                        {/* Mobile/Tablet Card View (< 1536px) */}
                                        <div className="block 2xl:hidden divide-y divide-white/40 dark:divide-white/5">
                                            {generatedReport.map((user) => (
                                                <div key={user.id} className="p-5 flex flex-col gap-4">
                                                    {/* Header: Name & Rate - Wrap on very small screens */}
                                                    <div className="flex flex-col min-[450px]:flex-row justify-between items-start gap-2">
                                                        <div>
                                                            <div className="font-bold text-slate-800 dark:text-white text-lg break-words">{user.name}</div>
                                                            <div className="text-sm text-slate-500 break-all">{user.email}</div>
                                                        </div>
                                                        <div className="self-start px-3 py-1 bg-orange-100 dark:bg-yellow-500/30 text-orange-700 dark:text-yellow-300 rounded-full text-xs font-bold whitespace-nowrap shadow-orange-500/10">
                                                            Rs. {user.rate}/hr
                                                        </div>
                                                    </div>

                                                    {/* Stats Grid - Single column on < 450px */}
                                                    <div className="grid grid-cols-1 min-[450px]:grid-cols-2 gap-4">
                                                        <div className="bg-slate-50/50 dark:bg-white/5 p-3 rounded-xl border border-white/10">
                                                            <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Hours</div>
                                                            <div className="font-mono font-bold text-slate-800 dark:text-slate-200">{formatDuration(user.totalHours)}</div>
                                                        </div>
                                                        <div className="bg-slate-50/50 dark:bg-white/5 p-3 rounded-xl border border-white/10">
                                                            <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Pending</div>
                                                            <div className="font-bold text-emerald-600">Rs. {user.totalCost.toFixed(2)}</div>
                                                        </div>
                                                    </div>

                                                    <button onClick={() => openBillingModal(user)} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white rounded-xl font-medium shadow-lg transition-transform active:scale-[0.98] hover:scale-105">
                                                        <Eye className="w-4 h-4" /> View Details & Pay
                                                    </button>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Desktop Table View (>= 1536px) */}
                                        <div className="hidden 2xl:block">
                                            <table className="w-full text-left border-collapse">
                                                <thead className="bg-slate-50/80 dark:bg-white/5 border-b border-white/20 dark:border-white/5 text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                                                    <tr>
                                                        <th className="p-5">Work Details</th>
                                                        <th className="p-5 text-right">Hours</th>
                                                        <th className="p-5 text-right">Pending Payout</th>
                                                        <th className="p-5 text-center">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/40 dark:divide-white/5">
                                                    {generatedReport.map((user) => (
                                                        <tr key={user.id} className="hover:bg-orange-50/40 dark:hover:bg-white/5 transition-colors">
                                                            <td className="p-5">
                                                                <div className="font-bold text-slate-800 dark:text-white">{user.name}</div>
                                                                <div className="text-xs text-slate-500">{user.email}</div>
                                                            </td>
                                                            <td className="p-5 text-right font-mono">{formatDuration(user.totalHours)}</td>
                                                            <td className="p-5 text-right font-bold text-emerald-600">Rs. {user.totalCost.toFixed(2)}</td>
                                                            <td className="p-5 text-center">
                                                                <button onClick={() => openBillingModal(user)} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white rounded-xl font-medium text-sm shadow-lg hover:shadow-xl transition-all hover:scale-105">
                                                                    <Eye className="w-4 h-4" /> View & Pay
                                                                </button>
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
                    )}
                </div>
            </div>

            {/* BILLING MODAL */}
            {isModalOpen && selectedUser && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
                    <div className="relative w-full max-w-2xl bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-2xl animate-in zoom-in duration-200 border border-white/20">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Review & Bill</h2>
                                <p className="text-slate-500">Uncheck items to exclude them from this bill.</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-6 h-6" /></button>
                        </div>

                        <div className="max-h-[50vh] overflow-y-auto mb-6 bg-slate-50 dark:bg-black/20 rounded-2xl p-4">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-xs uppercase text-slate-500 border-b border-gray-200">
                                        <th className="pb-3 pl-2">
                                            <input type="checkbox"
                                                checked={selectedLogs.length === selectedUser.logs.length}
                                                onChange={(e) => e.target.checked ? setSelectedLogs(selectedUser.logs.map(l => l._id)) : setSelectedLogs([])}
                                                className="rounded border-orange-300 text-orange-600 focus:ring-orange-500"
                                            />
                                        </th>
                                        <th className="pb-3">Date</th>
                                        <th className="pb-3">Task</th>
                                        <th className="pb-3 text-right">Cost</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {selectedUser.logs.map(log => {
                                        const isSelected = selectedLogs.includes(log._id);
                                        return (
                                            <tr key={log._id} className={isSelected ? 'bg-orange-50/50' : ''}>
                                                <td className="py-3 pl-2">
                                                    <input type="checkbox" checked={isSelected} onChange={() => toggleLogSelection(log._id)} className="rounded border-orange-300 text-orange-600 focus:ring-orange-500" />
                                                </td>
                                                <td className="py-3 text-sm">{new Date(log.startTime).toLocaleDateString()}</td>
                                                <td className="py-3 text-sm">{log.description}</td>
                                                <td className="py-3 text-sm text-right">Rs. {(log.durationHours * selectedUser.rate).toFixed(2)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                            <div>
                                <div className="text-sm text-slate-500">Invoice Total</div>
                                <div className="text-2xl font-bold text-orange-600 dark:text-yellow-400">
                                    Rs. {(selectedUser.logs.filter(l => selectedLogs.includes(l._id)).reduce((sum, l) => sum + (l.durationHours * selectedUser.rate), 0)).toFixed(2)}
                                </div>
                            </div>
                            <button onClick={() => handleProcessPayment('bill')} className="px-6 py-3 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white rounded-xl font-bold shadow-lg flex items-center gap-2 hover:scale-105 active:scale-95 transition-all">
                                <CheckCircle className="w-5 h-5" /> Generate Bill
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ProjectReportGenerator;