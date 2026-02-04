import { useState } from 'react';
import { jsPDF } from 'jspdf';
import { toast } from 'react-hot-toast';
import { FileText, Download, Calculator, Calendar, IndianRupee } from 'lucide-react';

const GLASS_CLASSES = "bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-xl";
const INPUT_CLASSES = "w-full p-3 bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition-all dark:text-white";
const LABEL_CLASSES = "block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1";

const ProjectReportGenerator = ({ project, timeLogs, clientName }) => {
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setMonth(d.getMonth() - 1);
        return d.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [reportData, setReportData] = useState(null);

    const handleCalculate = () => {
        if (!startDate || !endDate) return toast.error("Please select a date range");

        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        const filteredLogs = timeLogs.filter(log => {
            const logDate = new Date(log.startTime);
            return logDate >= start && logDate <= end;
        });

        if (filteredLogs.length === 0) {
            setReportData(null);
            return toast("No logs found in this range", { icon: 'ℹ️' });
        }

        const totalHours = filteredLogs.reduce((acc, log) => acc + (log.durationHours || 0), 0);
        // Assuming project.client.defaultHourlyRate exists, or fallback to 0
        const hourlyRate = project.client?.defaultHourlyRate || 0;
        const totalCost = totalHours * hourlyRate;

        setReportData({
            logs: filteredLogs,
            totalHours,
            totalCost,
            hourlyRate,
            period: { start: startDate, end: endDate }
        });
        toast.success("Report calculated!");
    };

    const generatePDF = () => {
        if (!reportData) return;

        const doc = new jsPDF();

        // Header
        doc.setFontSize(22);
        doc.setTextColor(139, 92, 246); // Violet color
        doc.text("FreelanceFlow Project Report", 14, 20);

        // Project Details
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text(`Project: ${project.title}`, 14, 35);
        doc.text(`Client: ${clientName || 'Unknown'}`, 14, 42);
        doc.text(`Date Range: ${reportData.period.start} to ${reportData.period.end}`, 14, 49);

        // Summary Box
        doc.setDrawColor(200, 200, 200);
        doc.setFillColor(245, 245, 245);
        doc.rect(14, 55, 180, 25, 'FD');

        doc.setFontSize(10);
        doc.text("Total Hours", 20, 62);
        doc.setFontSize(14);
        doc.text(`${reportData.totalHours.toFixed(2)} hrs`, 20, 70);

        doc.setFontSize(10);
        doc.text("Total Cost", 80, 62);
        doc.setFontSize(14);
        doc.text(`Rs. ${reportData.totalCost.toFixed(2)}`, 80, 70);

        doc.setFontSize(10);
        doc.text("Hourly Rate", 140, 62);
        doc.setFontSize(14);
        doc.text(`Rs. ${reportData.hourlyRate}/hr`, 140, 70);

        // Logs Table Header
        let yPos = 95;
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text("Time Logs", 14, yPos);
        yPos += 10;

        doc.setFontSize(10);
        doc.setFillColor(230, 230, 230);
        doc.rect(14, yPos - 5, 180, 8, 'F');
        doc.setFont(undefined, 'bold');
        doc.text("Date", 16, yPos);
        doc.text("Description", 50, yPos);
        doc.text("Hours", 170, yPos, { align: 'right' });
        doc.setFont(undefined, 'normal');

        yPos += 10;

        // Logs
        reportData.logs.forEach((log) => {
            if (yPos > 280) {
                doc.addPage();
                yPos = 20;
            }
            const dateStr = new Date(log.startTime).toLocaleDateString();
            const desc = log.description || 'No description';
            const hours = log.durationHours?.toFixed(2) || '0.00';

            doc.text(dateStr, 16, yPos);
            // Truncate description if too long for simple list
            const truncDesc = desc.length > 60 ? desc.substring(0, 57) + '...' : desc;
            doc.text(truncDesc, 50, yPos);
            doc.text(hours, 170, yPos, { align: 'right' });
            yPos += 8;
        });

        // Footer
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Generated on ${new Date().toLocaleString()}`, 14, 290);

        doc.save(`Project_Report_${project.title.replace(/\s+/g, '_')}.pdf`);
        toast.success("PDF Downloaded!");
    };

    return (
        <div className={`${GLASS_CLASSES} p-8 rounded-3xl mb-8`}>
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg text-violet-600 dark:text-violet-400">
                    <FileText className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">Project Report</h3>
                    <p className="text-sm text-slate-600 dark:text-gray-400">Generate PDF reports for client billing</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end mb-6">
                <div className="md:col-span-1">
                    <label className={LABEL_CLASSES}>Client</label>
                    <div className="p-3 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-slate-700 dark:text-gray-300 font-medium truncate">
                        {clientName || 'No Client Assigned'}
                    </div>
                </div>
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
                        disabled={!clientName}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-slate-900 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Calculator className="w-4 h-4" /> Calculate
                    </button>
                </div>
            </div>

            {reportData && (
                <div className="bg-white/50 dark:bg-black/20 rounded-2xl p-6 border border-white/50 dark:border-white/5 animate-in fade-in slide-in-from-top-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                                <Clock className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 dark:text-gray-400 font-bold uppercase">Total Hours</p>
                                <p className="text-xl font-bold text-slate-800 dark:text-white">{reportData.totalHours.toFixed(2)}h</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
                                <IndianRupee className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 dark:text-gray-400 font-bold uppercase">Total Cost</p>
                                <p className="text-xl font-bold text-slate-800 dark:text-white">₹{reportData.totalCost.toFixed(2)}</p>
                            </div>
                        </div>
                        <div className="flex items-center justify-end">
                            <button
                                onClick={generatePDF}
                                className="flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold shadow-lg shadow-violet-500/20 transition-all hover:scale-105 active:scale-95"
                            >
                                <Download className="w-5 h-5" /> Download PDF
                            </button>
                        </div>
                    </div>

                    <div className="text-xs text-center text-slate-500 dark:text-gray-400">
                        Showing {reportData.logs.length} logs from {new Date(reportData.period.start).toLocaleDateString()} to {new Date(reportData.period.end).toLocaleDateString()}
                    </div>
                </div>
            )}
        </div>
    );
};

// Helper icon if not imported above
function Clock({ className }) {
    return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>;
}

export default ProjectReportGenerator;
