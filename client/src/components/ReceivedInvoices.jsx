import { useState, useEffect } from 'react';
import api from '../api';
import { Download, FileText, CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react';
import { generateInvoicePDF } from './pdfGenerator';
import { formatCurrency } from '../utils/formatCurrency';
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
                                    <p className={`font-bold text-lg ${TEXT_HEADLINE}`}>{formatCurrency(invoice.totalAmount)}</p>
                                </div>
                                <button
                                    onClick={() => generateInvoicePDF(invoice)}
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
