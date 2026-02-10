import { useEffect, useState } from 'react';
import api from '../api';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '../utils/formatCurrency';

const GLASS_CLASSES = "bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-xl";

export default function FinancialDashboard() {
  const [revenueData, setRevenueData] = useState([]);
  const [outstandingData, setOutstandingData] = useState([]);

  useEffect(() => {
    fetchFinancialData();
  }, []);

  const fetchFinancialData = async () => {
    try {
      const res = await api.get('/invoices');
      processData(res.data);
    } catch (err) {
      console.error('Error fetching financial data:', err);
    }
  };

  const processData = (allInvoices) => {
    // For financials, if API returns data in specific structure, we handle it here.
    // The API might return `{ received: [], sent: [] }`, so we extract the array.

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
                formatter={(value) => formatCurrency(value)}
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
                formatter={(value) => formatCurrency(value)}
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
