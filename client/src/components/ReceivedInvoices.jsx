import { useState, useEffect } from 'react';
import api from '../api';
import { Download, FileText, CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { toast } from 'react-hot-toast';

const GLASS_CLASSES = "bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-xl";
const TEXT_HEADLINE = "text-slate-800 dark:text-white";
const TEXT_SUB = "text-slate-600 dark:text-gray-400";
const BUTTON_BASE = "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 shadow-md active:scale-95";

export default function ReceivedInvoices() {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                const parsed = JSON.parse(storedUser);
                setUser(parsed.user || parsed);
            } catch (e) {
                console.error("Error parsing user", e);
            }
        }
        fetchInvoices();
    }, []);

    const fetchInvoices = async () => {
        try {
            const res = await api.get('/invoices');
            // The API returns all invoices related to the user (both sent and received)
            // We need to filter for invoices where the current user is the client (Received)
            // Note: We need the user ID to filter.
            const storedUser = JSON.parse(localStorage.getItem('user'));
            const currentUser = storedUser.user || storedUser;

            const received = res.data.filter(inv => {
                const clientId = inv.client?._id || inv.client;
                return String(clientId) === String(currentUser._id);
            });

            setInvoices(received);
        } catch (err) {
            console.error('Error fetching invoices:', err);
        } finally {
            setLoading(false);
        }
    };

    const generatePDF = (invoice) => {
        try {
            const doc = new jsPDF();

            // -- HEADER --
            doc.setFillColor(124, 58, 237); // Violet
            doc.rect(0, 0, 210, 40, 'F');

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(26);
            doc.setFont("helvetica", "bold");
            doc.text("INVOICE", 20, 28);

            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.text(`#${invoice.invoiceNumber || invoice._id.substring(0, 6).toUpperCase()}`, 190, 28, { align: 'right' });

            // -- BILLING DETAILS --
            let yPos = 60;

            doc.setTextColor(51, 65, 85); // Slate 700

            // FROM (Freelancer)
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.text("FROM:", 20, yPos);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(11);
            doc.text(invoice.freelancer?.name || "Freelancer", 20, yPos + 6);
            doc.setFontSize(9);
            doc.text(invoice.freelancer?.email || "", 20, yPos + 11);

            // TO (Client - You)
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.text("TO:", 120, yPos);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(11);
            doc.text(invoice.client?.name || user?.name || "Client", 120, yPos + 6);
            doc.setFontSize(9);
            doc.text(invoice.client?.email || user?.email || "", 120, yPos + 11);

            // DATES
            yPos += 30;
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.text("Issue Date:", 20, yPos);
            doc.setFont("helvetica", "normal");
            doc.text(new Date(invoice.createdAt).toLocaleDateString(), 50, yPos);

            doc.setFont("helvetica", "bold");
            doc.text("Due Date:", 120, yPos);
            doc.setFont("helvetica", "normal");
            doc.text(invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A', 150, yPos);

            // -- ITEMS TABLE --
            yPos += 15;

            const tableColumn = ["Description", "Hours", "Rate", "Amount"];
            const tableRows = [];

            if (invoice.items && invoice.items.length > 0) {
                invoice.items.forEach(item => {
                    const itemData = [
                        item.description,
                        item.hours ? item.hours.toFixed(2) : "-",
                        item.hourlyRate ? `Rs. ${item.hourlyRate.toFixed(2)}` : "-",
                        `Rs. ${item.amount.toFixed(2)}`
                    ];
                    tableRows.push(itemData);
                });
            }

            doc.autoTable({
                startY: yPos,
                head: [tableColumn],
                body: tableRows,
                theme: 'grid',
                headStyles: { fillColor: [124, 58, 237], textColor: 255, fontStyle: 'bold' },
                styles: { fontSize: 9, cellPadding: 3 },
            });

            // -- TOTALS --
            const finalY = doc.lastAutoTable.finalY + 10;

            doc.setFontSize(11);
            doc.setFont("helvetica", "bold");
            doc.text(`Total Amount: Rs. ${invoice.totalAmount.toFixed(2)}`, 190, finalY, { align: 'right' });

            if (invoice.status === 'paid') {
                doc.setTextColor(22, 163, 74); // Green
                doc.text("PAID", 190, finalY + 10, { align: 'right' });
            } else {
                doc.setTextColor(220, 38, 38); // Red
                doc.text("UNPAID", 190, finalY + 10, { align: 'right' });
            }

            // -- FOOTER --
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text("Generated by FreelanceFlow", 105, 290, { align: 'center' });

            doc.save(`Invoice_${invoice.invoiceNumber || invoice._id}.pdf`);
            toast.success("Invoice downloaded successfully");
        } catch (err) {
            console.error("Error generating PDF", err);
            toast.error("Failed to generate PDF");
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'paid': return <CheckCircle className="w-4 h-4 text-emerald-500" />;
            case 'overdue': return <AlertTriangle className="w-4 h-4 text-rose-500" />;
            default: return <AlertCircle className="w-4 h-4 text-blue-500" />;
        }
    };

    return (
        <div className={`${GLASS_CLASSES} rounded-3xl p-6`}>
            <div className="flex items-center gap-3 mb-4">
                <FileText className="w-5 h-5 text-indigo-500" />
                <h3 className={`text-xl font-bold ${TEXT_HEADLINE}`}>Received Invoices</h3>
            </div>

            {loading ? (
                <p className={`${TEXT_SUB} text-sm`}>Loading...</p>
            ) : invoices.length === 0 ? (
                <p className={`${TEXT_SUB} text-sm`}>No invoices received yet.</p>
            ) : (
                <div className="space-y-3">
                    {invoices.map(invoice => (
                        <div key={invoice._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white/20 dark:bg-white/5 rounded-xl border border-white/10 gap-3">
                            <div className="flex items-start gap-3">
                                <div className={`mt-1 p-2 rounded-lg ${invoice.status === 'paid' ? 'bg-emerald-100 dark:bg-emerald-500/20' :
                                        invoice.status === 'overdue' ? 'bg-rose-100 dark:bg-rose-500/20' :
                                            'bg-blue-100 dark:bg-blue-500/20'
                                    }`}>
                                    {getStatusIcon(invoice.status)}
                                </div>
                                <div>
                                    <h4 className={`font-bold ${TEXT_HEADLINE}`}>
                                        {invoice.invoiceNumber || `INV-${invoice._id.substring(0, 6).toUpperCase()}`}
                                    </h4>
                                    <p className="text-sm text-slate-500 dark:text-gray-400">
                                        From: <span className="font-medium text-slate-700 dark:text-gray-300">{invoice.freelancer?.name || 'Unknown'}</span>
                                    </p>
                                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                                        <span>Due: {new Date(invoice.dueDate || invoice.createdAt).toLocaleDateString()}</span>
                                        <span>•</span>
                                        <span className={`font-bold ${invoice.status === 'paid' ? 'text-emerald-600' : 'text-slate-600 dark:text-gray-400'
                                            }`}>
                                            {invoice.status.toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto mt-2 sm:mt-0">
                                <div className="text-right">
                                    <p className={`font-bold text-lg ${TEXT_HEADLINE}`}>₹{invoice.totalAmount.toFixed(2)}</p>
                                </div>
                                <button
                                    onClick={() => generatePDF(invoice)}
                                    className={`${BUTTON_BASE} bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20`}
                                    title="Download PDF"
                                >
                                    <Download className="w-4 h-4" />
                                    <span className="hidden sm:inline">Download</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
