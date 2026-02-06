import { useEffect, useState } from 'react';
import api from '../api';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const GLASS_CLASSES = "bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-xl";

const SAMPLE_INVOICES = [
  { _id: 's1', totalAmount: 15000, createdAt: new Date(new Date().getFullYear(), new Date().getMonth(), 5).toISOString(), client: { name: 'Tech Corp' } },
  { _id: 's2', totalAmount: 25000, createdAt: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 15).toISOString(), client: { name: 'Startup Inc' } },
  { _id: 's3', totalAmount: 8000, createdAt: new Date(new Date().getFullYear(), new Date().getMonth(), 20).toISOString(), client: { name: 'Tech Corp' } },
  { _id: 's4', totalAmount: 12000, createdAt: new Date(new Date().getFullYear(), new Date().getMonth() - 2, 10).toISOString(), client: { name: 'Design Studio' } }
];

export default function FinancialDashboard({ isSampleMode }) {
  const [revenueData, setRevenueData] = useState([]);
  const [outstandingData, setOutstandingData] = useState([]);

  useEffect(() => {
    if (isSampleMode) {
      processData(SAMPLE_INVOICES);
    } else {
      fetchFinancialData();
    }
  }, [isSampleMode]);

  const fetchFinancialData = async () => {
    try {
      const res = await api.get('/invoices');
      processData(res.data);
    } catch (err) {
      console.error('Error fetching financial data:', err);
    }
  };

  const processData = (allInvoices) => {
    // For financials, if using API it might be distinct structure, but usually it returns array.
    // Dashboard logic in FinancialDashboard.jsx line 19 says `res.data.received`.
    // My previous view of FinancialDashboard.jsx showed `res.data.received || []`.
    // But `SAMPLE_INVOICES` is just array.
    // If API returns `{ received: [], sent: [] }`, I should handle that.
    // Let's assume `allInvoices` passed to processData is the array we want (received).
    // So fetchFinancialData needs to extract `received`.

    const invoices = Array.isArray(allInvoices) ? allInvoices : (allInvoices.received || []);

    const monthlyRevenue = {};
    invoices.forEach(inv => {
      const date = new Date(inv.createdAt);
      const month = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      monthlyRevenue[month] = (monthlyRevenue[month] || 0) + (inv.totalAmount || 0);
    });

    const revData = Object.entries(monthlyRevenue).map(([month, amount]) => ({ month, amount }));
    setRevenueData(revData);

    const clientOutstanding = {};
    invoices.forEach(inv => {
      const clientName = inv.client?.name || 'Unknown';
      clientOutstanding[clientName] = (clientOutstanding[clientName] || 0) + (inv.totalAmount || 0);
    });

    const outData = Object.entries(clientOutstanding).map(([client, amount]) => ({ client, amount }));
    setOutstandingData(outData);
  };

  return (
    <div className="mt-8 space-y-6">
      {revenueData.length > 0 && (
        <div className={`${GLASS_CLASSES} rounded-3xl p-6`}>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Monthly Revenue</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid stroke="#e0e0e0" strokeDasharray="5 5" />
              <XAxis dataKey="month" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                formatter={(value) => `₹${value.toFixed(2)}`}
              />
              <Legend />
              <Line type="monotone" dataKey="amount" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: '#8b5cf6' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {outstandingData.length > 0 && (
        <div className={`${GLASS_CLASSES} rounded-3xl p-6`}>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Outstanding Payments by Client</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={outstandingData}>
              <CartesianGrid stroke="#e0e0e0" strokeDasharray="5 5" />
              <XAxis dataKey="client" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                formatter={(value) => `₹${value.toFixed(2)}`}
              />
              <Legend />
              <Bar dataKey="amount" fill="#ef4444" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {revenueData.length === 0 && outstandingData.length === 0 && (
        <div className={`${GLASS_CLASSES} rounded-3xl p-8 text-center`}>
          <p className="text-slate-600 dark:text-gray-400">No invoices yet. Create and submit invoices to see financial data.</p>
        </div>
      )}
    </div>
  );
}
