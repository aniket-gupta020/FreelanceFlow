import React, { useMemo, useState } from 'react';
import { Download, PieChart, Calculator, FileText, Users } from 'lucide-react';
import { toast } from 'react-hot-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const GLASS_CLASSES = "bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-xl";
const INPUT_CLASSES = "w-full p-3 bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition-all dark:text-white";
const LABEL_CLASSES = "block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1";

const ProjectReportGenerator = ({ project, timeLogs }) => {
    // 1. Date State
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setMonth(d.getMonth() - 1);
        return d.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

    // State to store the calculated report
    const [generatedReport, setGeneratedReport] = useState(null);

    // 2. 🧮 CALCULATION LOGIC (Based on LOGS, not Applicants)
    const handleCalculate = () => {
        if (!startDate || !endDate) return toast.error("Please select a date range");
        if (!timeLogs || timeLogs.length === 0) return toast("No time logs found for this project", { icon: 'ℹ️' });

        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        // Group logs by User ID
        const userMap = {};

        timeLogs.forEach(log => {
            // Check Date Range
            const logDate = new Date(log.startTime);
            if (logDate < start || logDate > end) return;

            // Safety check: if user was deleted but log exists
            if (!log.user) return;

            const userId = log.user._id || log.user;
            const userName = log.user.name || 'Unknown User';
            const userEmail = log.user.email || 'No Email';

            // 💰 GET RATE DIRECTLY FROM LOG (This fixes your 0 rate issue)
            const rate = log.user.defaultHourlyRate || 0;
            const hours = log.durationHours || 0;

            if (!userMap[userId]) {
                userMap[userId] = {
                    id: userId,
                    name: userName,
                    email: userEmail,
                    rate: rate,
                    totalHours: 0,
                    totalCost: 0,
                    logsCount: 0,
                    logs: [] // Store logs for the PDF
                };
            }

            userMap[userId].totalHours += hours;
            userMap[userId].totalCost += (hours * rate);
            userMap[userId].logsCount += 1;
            userMap[userId].logs.push(log);
        });

        const reportArray = Object.values(userMap);

        if (reportArray.length === 0) {
            toast("No logs found in this date range", { icon: 'ℹ️' });
            setGeneratedReport([]);
        } else {
            setGeneratedReport(reportArray);
            toast.success("Reports generated!");
        }
    };

    // 3. 📄 PDF GENERATION
    const generatePDF = (userData) => {
        const doc = new jsPDF();

        // Header
        doc.setFontSize(22);
        doc.setTextColor(139, 92, 246); // Violet
        doc.text("FreelanceFlow Project Report", 14, 20);

        // Details
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text(`Project: ${project.title}`, 14, 35);
        doc.text(`Freelancer: ${userData.name}`, 14, 42);
        doc.text(`Period: ${startDate} to ${endDate}`, 14, 49);

        // Summary Box
        doc.setFillColor(245, 245, 245);
        doc.rect(14, 55, 180, 25, 'F');

        doc.setFontSize(10);
        doc.text("Total Hours", 20, 62);
        doc.setFontSize(14);
        doc.text(`${userData.totalHours.toFixed(2)} hrs`, 20, 70);

        doc.setFontSize(10);
        doc.text("Total Cost", 80, 62);
        doc.setFontSize(14);
        doc.text(`Rs. ${userData.totalCost.toFixed(2)}`, 80, 70);

        doc.setFontSize(10);
        doc.text("Hourly Rate", 140, 62);
        doc.setFontSize(14);
        doc.text(`Rs. ${userData.rate}/hr`, 140, 70);

        // Table
        const tableBody = userData.logs.map(log => [
            new Date(log.startTime).toLocaleDateString(),
            log.description || 'No description',
            `${log.durationHours.toFixed(2)} hrs`
        ]);

        doc.autoTable({
            startY: 90,
            head: [['Date', 'Description', 'Hours']],
            body: tableBody,
            theme: 'grid',
            headStyles: { fillColor: [100, 100, 100] }
        });

        doc.save(`Report_${userData.name}.pdf`);
        toast.success("PDF Downloaded!");
    };

    return (
        <div className={`${GLASS_CLASSES} p-8 rounded-3xl mb-8 border-t-4 border-t-violet-500`}>

            {/* Header Section */}
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg text-violet-600 dark:text-violet-400">
                    <PieChart className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">Project Reports</h3>
                    <p className="text-sm text-slate-600 dark:text-gray-400">Calculate costs based on logged time.</p>
                </div>
            </div>

            {/* Date Selection */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end mb-8">
                <div>
                    <label className={LABEL_CLASSES}>Start Date</label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className={`${INPUT_CLASSES} dark:[color-scheme:dark]`}
                    />
                </div>
                <div>
                    <label className={LABEL_CLASSES}>End Date</label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className={`${INPUT_CLASSES} dark:[color-scheme:dark]`}
                    />
                </div>
                <div>
                    <button
                        onClick={handleCalculate}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-slate-900 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black rounded-xl font-bold transition-all shadow-lg active:scale-95"
                    >
                        <Calculator className="w-4 h-4" /> Calculate Report
                    </button>
                </div>
            </div>

            {/* Results Table */}
            {generatedReport && (
                <div className="animate-in fade-in slide-in-from-top-4">
                    <div className="flex items-center gap-2 mb-3 text-slate-600 dark:text-gray-400">
                        <Users className="w-5 h-5" />
                        <span className="font-medium">Freelancer Breakdown</span>
                    </div>

                    {generatedReport.length === 0 ? (
                        <div className="text-center p-8 bg-white/30 dark:bg-white/5 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 text-slate-500">
                            No logs found in this date range.
                        </div>
                    ) : (
                        <div className="overflow-hidden rounded-2xl border border-white/20 dark:border-white/5 bg-white/20 dark:bg-black/20">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-white/40 dark:bg-white/5 text-slate-700 dark:text-gray-300">
                                    <tr>
                                        <th className="p-4 font-bold text-sm">Freelancer</th>
                                        <th className="p-4 font-bold text-sm text-right">Hours</th>
                                        <th className="p-4 font-bold text-sm text-right hidden sm:table-cell">Rate</th>
                                        <th className="p-4 font-bold text-sm text-right">Cost</th>
                                        <th className="p-4 font-bold text-sm text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/20 dark:divide-white/5">
                                    {generatedReport.map((user) => (
                                        <tr key={user.id} className="hover:bg-white/30 dark:hover:bg-white/5 transition-colors">
                                            <td className="p-4">
                                                <div className="font-bold text-slate-800 dark:text-white">{user.name}</div>
                                                <div className="text-xs text-slate-500">{user.email}</div>
                                            </td>
                                            <td className="p-4 text-right font-mono text-slate-700 dark:text-gray-300">
                                                {user.totalHours.toFixed(2)}h
                                            </td>
                                            <td className="p-4 text-right font-mono text-slate-500 dark:text-gray-400 text-sm hidden sm:table-cell">
                                                ₹{user.rate}/h
                                            </td>
                                            <td className="p-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                                                ₹{user.totalCost.toFixed(2)}
                                            </td>
                                            <td className="p-4 text-center">
                                                <button
                                                    onClick={() => generatePDF(user)}
                                                    className="inline-flex items-center justify-center p-2 bg-violet-100 hover:bg-violet-200 dark:bg-violet-900/30 dark:hover:bg-violet-900/50 text-violet-600 dark:text-violet-400 rounded-lg transition-colors shadow-sm"
                                                    title="Download PDF"
                                                >
                                                    <Download className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ProjectReportGenerator;