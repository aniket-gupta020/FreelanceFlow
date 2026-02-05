import React, { useState } from 'react';
import { Download, PieChart, Calculator, Calendar, Users, TrendingUp, DollarSign, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../api';

const ProjectReportGenerator = ({ project, timeLogs }) => {
    // 1. Date State
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setMonth(d.getMonth() - 1);
        return d.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [generatedReport, setGeneratedReport] = useState(null);
    const [summaryStats, setSummaryStats] = useState({ cost: 0, hours: 0, freelancers: 0 });

    // 2. 🧮 CALCULATION LOGIC
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

        timeLogs.forEach(log => {
            const logDate = new Date(log.startTime);
            if (logDate < start || logDate > end) return;
            if (!log.user) return;

            const userId = log.user._id || log.user;
            const rate = log.user.defaultHourlyRate || 0;
            const hours = log.durationHours || 0;

            if (!userMap[userId]) {
                userMap[userId] = {
                    id: userId,
                    name: log.user.name || 'Unknown',
                    email: log.user.email || 'No Email',
                    mobile: log.user.mobile || '',
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
            toast("No logs found in this range", { icon: 'ℹ️' });
            setGeneratedReport([]);
        } else {
            setGeneratedReport(reportArray);
            setSummaryStats({
                cost: totalProjectCost,
                hours: totalProjectHours,
                freelancers: reportArray.length
            });
            toast.success("Analysis Complete!");
        }
    };

    // 3. 📄 PDF GENERATION (Your Custom Invoice Logic)
    const generatePDF = async (userData) => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();

        // HEADER
        doc.setFontSize(24);
        doc.setTextColor(139, 92, 246); // Violet
        doc.text("PAYOUT STATEMENT", pageWidth - 14, 20, { align: 'right' });

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - 14, 28, { align: 'right' });
        doc.text(`Ref: ${project.title.substring(0, 4).toUpperCase()}-${Date.now().toString().slice(-4)}`, pageWidth - 14, 33, { align: 'right' });

        // BILL FROM (Client)
        const clientName = project.client?.name || 'Project Owner';
        const clientEmail = project.client?.email || 'owner@freelanceflow.com';
        const clientPhone = project.client?.mobile || null;

        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text("From (Payer):", 14, 45);
        doc.setFont("helvetica", "bold");
        doc.text(clientName, 14, 52);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(80);
        let clientY = 57;
        if (clientPhone) { doc.text(clientPhone, 14, clientY); clientY += 5; }
        doc.text(clientEmail, 14, clientY);

        // BILL TO (Freelancer)
        const freelancerName = userData.name;
        const freelancerEmail = userData.email;
        const freelancerPhone = userData.mobile || userData.logs[0]?.user?.mobile || null;

        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text("To (Payee):", pageWidth / 2 + 10, 45);
        doc.setFont("helvetica", "bold");
        doc.text(freelancerName, pageWidth / 2 + 10, 52);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(80);
        let freelancerY = 57;
        if (freelancerPhone) { doc.text(freelancerPhone, pageWidth / 2 + 10, freelancerY); freelancerY += 5; }
        doc.text(freelancerEmail, pageWidth / 2 + 10, freelancerY);

        // PROJECT INFO
        doc.setDrawColor(200);
        doc.line(14, 75, pageWidth - 14, 75);
        doc.setFontSize(10);
        doc.setTextColor(0);
        doc.text(`Project: ${project.title}`, 14, 83);
        doc.text(`Period: ${startDate} to ${endDate}`, 14, 89);

        // SUMMARY BOX
        doc.setFillColor(247, 247, 255);
        doc.rect(14, 95, pageWidth - 28, 25, 'F');
        doc.setDrawColor(139, 92, 246);
        doc.rect(14, 95, pageWidth - 28, 25, 'S');

        doc.setTextColor(0);
        doc.text("Total Hours", 25, 105);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text(`${userData.totalHours.toFixed(2)} hrs`, 25, 113);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text("Rate", 85, 105);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text(`Rs. ${userData.rate}/hr`, 85, 113);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text("Total Payout", 145, 105);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(139, 92, 246);
        doc.text(`Rs. ${userData.totalCost.toFixed(2)}`, 145, 113);

        // TABLE
        const tableBody = userData.logs.map(log => [
            new Date(log.startTime).toLocaleDateString(),
            log.description || 'Manual Entry',
            `${(log.durationHours || 0).toFixed(2)} hrs`,
            `Rs. ${(log.durationHours * userData.rate).toFixed(2)}`
        ]);

        autoTable(doc, {
            startY: 130,
            head: [['Date', 'Task', 'Hours', 'Amount']],
            body: tableBody,
            foot: [['Total', '', `${userData.totalHours.toFixed(2)} hrs`, `Rs. ${userData.totalCost.toFixed(2)}`]],
            theme: 'grid',
            headStyles: { fillColor: [139, 92, 246], textColor: 255 },
            footStyles: { fillColor: [247, 247, 255], textColor: 0, fontStyle: 'bold' },
        });

        // FOOTER
        const finalY = doc.lastAutoTable.finalY + 20;
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text("This is a computer-generated payout statement.", pageWidth / 2, finalY, { align: 'center' });
        doc.text("For questions, please contact support@freelanceflow.com", pageWidth / 2, finalY + 5, { align: 'center' });

        doc.save(`Payout_${userData.name}_${endDate}.pdf`);
        toast.success("Statement Downloaded!");

        // ✅ RECORD INVOICE IN BACKEND
        try {
            console.log("Saving Invoice to Backend...", {
                projectId: project._id,
                freelancerId: userData.id,
                amount: userData.totalCost
            });

            const payload = {
                projectId: project._id,
                freelancerId: userData.id,
                logIds: userData.logs.map(l => l._id),
                amount: userData.totalCost,
                hours: userData.totalHours,
                date: new Date()
            };

            const res = await api.post('/invoices/create', payload);

            console.log("Invoice API Response:", res.data);
            toast.success("Invoice Recorded Successfully!", { icon: '✅' });

        } catch (error) {
            console.error("❌ Failed to record invoice:");
            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                console.error("Data:", error.response.data);
                console.error("Status:", error.response.status);
                console.error("Headers:", error.response.headers);
                toast.error(`Error ${error.response.status}: ${error.response.data?.message || 'Failed to record invoice'}`);
            } else if (error.request) {
                // The request was made but no response was received
                console.error("No response received:", error.request);
                toast.error("Server not responding. Please check your connection.");
            } else {
                // Something happened in setting up the request that triggered an Error
                console.error("Error setting up request:", error.message);
                toast.error("Error setting up invoice request.");
            }
        }
    };

    return (
        <div className="relative overflow-hidden rounded-3xl backdrop-blur-xl bg-white/40 dark:bg-black/40 border border-white/50 dark:border-white/10 shadow-2xl transition-all duration-300 mb-8">
            {/* Top Gradient Line */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-indigo-500"></div>

            <div className="p-8">
                {/* 1. Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl shadow-lg shadow-violet-500/20 text-white">
                            <PieChart className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-400">
                                Financial Reports
                            </h3>
                            <p className="text-sm font-medium text-slate-500 dark:text-gray-400">
                                Generate payout statements & analyze costs
                            </p>
                        </div>
                    </div>
                </div>

                {/* 2. Controls Section (Glassmorphism Inputs) */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-8 p-1">
                    <div className="md:col-span-4 group relative">
                        <label className="absolute -top-2.5 left-4 bg-white dark:bg-gray-900 px-2 text-xs font-bold text-violet-600 z-10 transition-all">START DATE</label>
                        <div className="flex items-center bg-white/50 dark:bg-black/20 border-2 border-transparent group-hover:border-violet-500/50 rounded-2xl focus-within:border-violet-500 focus-within:ring-4 focus-within:ring-violet-500/10 transition-all duration-300">
                            <Calendar className="w-5 h-5 text-slate-400 ml-4" />
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full p-4 bg-transparent outline-none text-slate-700 dark:text-white font-medium cursor-pointer dark:[color-scheme:dark]"
                            />
                        </div>
                    </div>

                    <div className="md:col-span-4 group relative">
                        <label className="absolute -top-2.5 left-4 bg-white dark:bg-gray-900 px-2 text-xs font-bold text-violet-600 z-10 transition-all">END DATE</label>
                        <div className="flex items-center bg-white/50 dark:bg-black/20 border-2 border-transparent group-hover:border-violet-500/50 rounded-2xl focus-within:border-violet-500 focus-within:ring-4 focus-within:ring-violet-500/10 transition-all duration-300">
                            <Calendar className="w-5 h-5 text-slate-400 ml-4" />
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full p-4 bg-transparent outline-none text-slate-700 dark:text-white font-medium cursor-pointer dark:[color-scheme:dark]"
                            />
                        </div>
                    </div>

                    <div className="md:col-span-4">
                        <button
                            onClick={handleCalculate}
                            className="w-full h-full min-h-[56px] flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-black rounded-2xl font-bold text-lg shadow-xl shadow-slate-500/10 hover:shadow-slate-500/20 active:scale-[0.98] transition-all duration-200"
                        >
                            <Calculator className="w-5 h-5" />
                            Run Analysis
                        </button>
                    </div>
                </div>

                {/* 3. Results Section */}
                {generatedReport && (
                    <div className="animate-in fade-in slide-in-from-bottom-6 duration-500">
                        {/* Summary Stats Cards */}
                        {generatedReport.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <div className="bg-violet-50/50 dark:bg-violet-900/10 p-4 rounded-2xl border border-violet-100 dark:border-violet-500/20">
                                    <div className="flex items-center gap-3 mb-1">
                                        <div className="p-2 bg-violet-100 dark:bg-violet-800 rounded-lg"><DollarSign className="w-4 h-4 text-violet-600 dark:text-violet-300" /></div>
                                        <span className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Total Cost</span>
                                    </div>
                                    <div className="text-2xl font-black text-slate-800 dark:text-white">Rs. {summaryStats.cost.toFixed(2)}</div>
                                </div>
                                <div className="bg-emerald-50/50 dark:bg-emerald-900/10 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-500/20">
                                    <div className="flex items-center gap-3 mb-1">
                                        <div className="p-2 bg-emerald-100 dark:bg-emerald-800 rounded-lg"><Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-300" /></div>
                                        <span className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Total Hours</span>
                                    </div>
                                    <div className="text-2xl font-black text-slate-800 dark:text-white">{summaryStats.hours.toFixed(2)}h</div>
                                </div>
                                <div className="bg-blue-50/50 dark:bg-blue-900/10 p-4 rounded-2xl border border-blue-100 dark:border-blue-500/20">
                                    <div className="flex items-center gap-3 mb-1">
                                        <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg"><Users className="w-4 h-4 text-blue-600 dark:text-blue-300" /></div>
                                        <span className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Freelancers</span>
                                    </div>
                                    <div className="text-2xl font-black text-slate-800 dark:text-white">{summaryStats.freelancers}</div>
                                </div>
                            </div>
                        )}

                        {/* Freelancer List */}
                        <div className="bg-white/40 dark:bg-black/20 rounded-2xl border border-white/50 dark:border-white/5 overflow-hidden backdrop-blur-sm">
                            {generatedReport.length === 0 ? (
                                <div className="flex flex-col items-center justify-center p-12 text-center">
                                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                                        <TrendingUp className="w-8 h-8 text-slate-400" />
                                    </div>
                                    <h4 className="text-lg font-bold text-slate-700 dark:text-slate-300">No Data Available</h4>
                                    <p className="text-slate-500">Try adjusting your date range to see results.</p>
                                </div>
                            ) : (
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-slate-50/80 dark:bg-white/5 border-b border-white/20 dark:border-white/5 text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                                        <tr>
                                            <th className="p-5">Freelancer</th>
                                            <th className="p-5 text-right">Performance</th>
                                            <th className="p-5 text-right">Payout</th>
                                            <th className="p-5 text-center">Export</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/40 dark:divide-white/5">
                                        {generatedReport.map((user, idx) => (
                                            <tr key={user.id} className="group hover:bg-violet-50/40 dark:hover:bg-violet-900/10 transition-all duration-200">
                                                <td className="p-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white font-bold shadow-md">
                                                            {user.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-slate-800 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                                                                {user.name}
                                                            </div>
                                                            <div className="text-xs text-slate-500">{user.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-5 text-right">
                                                    <div className="font-mono font-bold text-slate-700 dark:text-slate-300">{user.totalHours.toFixed(2)} hrs</div>
                                                    <div className="text-xs text-slate-400">@ Rs.{user.rate}/hr</div>
                                                </td>
                                                <td className="p-5 text-right">
                                                    <div className="inline-block px-3 py-1 rounded-lg bg-emerald-100/50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-800">
                                                        Rs. {user.totalCost.toFixed(2)}
                                                    </div>
                                                </td>
                                                <td className="p-5 text-center">
                                                    <button
                                                        onClick={() => generatePDF(user)}
                                                        className="p-2 text-slate-400 hover:text-violet-600 hover:bg-white dark:hover:bg-white/10 rounded-xl transition-all active:scale-95"
                                                        title="Download Payout Statement"
                                                    >
                                                        <Download className="w-5 h-5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProjectReportGenerator;