import { useEffect, useState } from 'react';
import api from '../api';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Link } from 'react-router-dom';
import { Lock, TrendingUp } from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';

const GLASS_CLASSES = "bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-xl";

export default function FinancialDashboard({ user }) {
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


  const minOutstanding = outstandingData.length > 0
    ? Math.min(...outstandingData.map(d => d.amount))
    : 0;
  const maxOutstanding = outstandingData.length > 0
    ? Math.max(...outstandingData.map(d => d.amount))
    : 0;


  const minRevenue = revenueData.length > 0
    ? Math.min(...revenueData.map(d => d.amount))
    : 0;
  const maxRevenue = revenueData.length > 0
    ? Math.max(...revenueData.map(d => d.amount))
    : 0;

  return (
    <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
      {revenueData.length > 0 && (
        <div className={`${GLASS_CLASSES} rounded-3xl p-6`}>
          <div className="mb-2">
            <h3 className="text-base font-semibold text-slate-800 dark:text-white">Monthly Revenue</h3>
            <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">Last {revenueData.length} months</p>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
              <XAxis
                dataKey="month"
                stroke="#94a3b8"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#94a3b8"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  fontSize: '12px'
                }}
                labelStyle={{ color: '#1e293b', fontWeight: 600 }}
                formatter={(value) => [formatCurrency(value), 'Revenue']}
              />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="#8b5cf6"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6, fill: '#8b5cf6' }}
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-200 dark:border-white/10">
            <div>
              <p className="text-xs text-slate-500 dark:text-gray-400 mb-1">Minimum</p>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{formatCurrency(minRevenue).replace('₹', '₹ ')}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 dark:text-gray-400 mb-1">Maximum</p>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{formatCurrency(maxRevenue).replace('₹', '₹ ')}</p>
            </div>
          </div>
        </div>
      )}

      {outstandingData.length > 0 && (
        <div className={`${GLASS_CLASSES} rounded-3xl p-6`}>
          <div className="mb-2">
            <h3 className="text-base font-semibold text-slate-800 dark:text-white">Outstanding Payments</h3>
            <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">By client</p>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={outstandingData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
              <XAxis
                dataKey="client"
                stroke="#94a3b8"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#94a3b8"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  fontSize: '12px'
                }}
                labelStyle={{ color: '#1e293b', fontWeight: 600 }}
                formatter={(value) => [formatCurrency(value), 'Outstanding']}
              />
              <Bar
                dataKey="amount"
                radius={[6, 6, 0, 0]}
                maxBarSize={80}
              >
                {outstandingData.map((entry, index) => {
                  const colors = ['#fbbf24', '#ef4444', '#f59e0b', '#fb923c', '#fcd34d', '#fb7185'];
                  return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-200 dark:border-white/10">
            <div>
              <p className="text-xs text-slate-500 dark:text-gray-400 mb-1">Minimum</p>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{formatCurrency(minOutstanding).replace('₹', '₹ ')}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 dark:text-gray-400 mb-1">Maximum</p>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{formatCurrency(maxOutstanding).replace('₹', '₹ ')}</p>
            </div>
          </div>
        </div>
      )}

      {revenueData.length === 0 && outstandingData.length === 0 && (
        <div className={`${GLASS_CLASSES} rounded-3xl p-8 text-center lg:col-span-2`}>
          <p className="text-slate-600 dark:text-gray-400">No invoices yet. Create and submit invoices to see financial data.</p>
        </div>
      )}

      {/* Advanced Forecasting Teaser (Pro Feature) */}
      {(user?.subscription !== 'pro' && user?.plan !== 'pro') && (
        <div className={`lg:col-span-2 ${GLASS_CLASSES} rounded-3xl p-6 relative overflow-hidden`}>
          <div className="absolute inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-md z-10 flex flex-col items-center justify-center text-center p-6">
            <div className="p-4 bg-orange-100 dark:bg-orange-500/20 rounded-full mb-4">
              <Lock className="w-8 h-8 text-orange-600 dark:text-orange-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Unlock Financial Forecasting</h3>
            <p className="text-slate-600 dark:text-gray-400 mb-6 max-w-md">
              Upgrade to Pro to see 6-month revenue value projections and cash flow analysis.
            </p>
            <Link
              to="/subscription"
              className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-xl font-bold shadow-lg hover:shadow-orange-500/20 active:scale-95 transition-all"
            >
              Unlock Analytics
            </Link>
          </div>

          <div className="opacity-50 pointer-events-none filter blur-sm select-none">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              <h3 className="font-bold text-slate-800 dark:text-white">Revenue Forecast</h3>
            </div>
            <div className="h-40 w-full bg-gradient-to-t from-emerald-500/20 to-transparent rounded-xl flex items-end justify-between px-4 pb-2">
              {[40, 60, 45, 70, 65, 80].map((h, i) => (
                <div key={i} className="w-8 bg-emerald-500/30 rounded-t-lg" style={{ height: `${h}%` }}></div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
