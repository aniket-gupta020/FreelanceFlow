import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster, resolveValue, ToastIcon, toast } from 'react-hot-toast';
import { X } from 'lucide-react';
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PostProject from './pages/PostProject';
import EditProject from './pages/EditProject';
import Clients from './pages/Clients';
import TimeTracker from './pages/TimeTracker';
import Invoices from './pages/Invoices';
import InvoiceGenerator from './pages/InvoiceGenerator';
import Tasks from './pages/Tasks';
import Profile from './pages/Profile';

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-center">
        {(t) => (
          <div
            className="select-none"
            style={{
              transition: 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              opacity: t.visible ? 1 : 0,
              transform: t.visible ? 'translateY(0) scale(1)' : 'translateY(-20px) scale(0.9)',
              zIndex: 9999,
            }}
          >
            {t.type === 'custom' ? (
              resolveValue(t.message, t)
            ) : (
              <div
                onClick={() => toast.dismiss(t.id)}
                style={{
                  background: 'rgba(255, 255, 255, 0.40)',
                  backdropFilter: 'blur(12px)',
                  border: t.type === 'error' ? '1px solid rgba(239, 68, 68, 0.3)' : t.type === 'success' ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid rgba(255, 255, 255, 0.5)',
                  boxShadow: '0 10px 40px -10px rgba(0,0,0,0.2)',
                  color: '#333',
                  fontSize: '15px',
                  fontWeight: '600',
                  borderRadius: '16px',
                  padding: '12px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  minWidth: '300px',
                  maxWidth: '500px',
                  cursor: 'pointer'
                }}
              >
                <ToastIcon toast={t} />
                <p style={{ margin: 0, flex: 1, lineHeight: '1.4' }}>
                  {resolveValue(t.message, t)}
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toast.dismiss(t.id);
                  }}
                  className="bg-white/20 hover:bg-white/40 rounded-full p-1 transition-colors -mr-2"
                >
                  <X size={16} className="opacity-60 hover:opacity-100" />
                </button>
              </div>
            )}
          </div>
        )}
      </Toaster>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/time" element={<TimeTracker />} />
        <Route path="/invoices" element={<Invoices />} />
        <Route path="/invoices/create" element={<InvoiceGenerator />} />
        <Route path="/invoices/edit/:id" element={<InvoiceGenerator />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/post-project" element={<PostProject />} />
        <Route path="/edit-project/:id" element={<EditProject />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;