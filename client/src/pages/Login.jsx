import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useNavigate, Link } from 'react-router-dom';
import { LayoutDashboard, Mail, Lock, ArrowRight, Sun, Moon, Eye, EyeOff, KeyRound } from 'lucide-react';

const GLASS_CLASSES = "bg-white/60 dark:bg-black/40 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-xl shadow-orange-500/10";
const INPUT_GROUP = "relative flex items-center";
const INPUT_ICON = "absolute left-3 w-5 h-5 text-gray-400 dark:text-gray-500";
const INPUT_CLASSES = "w-full pl-10 p-3 bg-white/50 dark:bg-black/20 border border-orange-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all dark:text-white";
const LABEL_CLASSES = "block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1";

const BACKEND_URL = "https://freelanceflow-oy9e.onrender.com/api/auth";

const Login = () => {
  const [loginMethod, setLoginMethod] = useState('password');
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [darkMode, setDarkMode] = useState(() => {
    if (localStorage.getItem('theme')) return localStorage.getItem('theme') === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const navigate = useNavigate();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const toggleTheme = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    toast.success(`Switched to ${newMode ? 'Dark' : 'Light'} Mode`, {
      icon: newMode ? <Moon className="w-4 h-4 text-white" /> : <Sun className="w-4 h-4 text-orange-500" />,
      style: { borderRadius: '12px', background: newMode ? '#333' : '#fff', color: newMode ? '#fff' : '#000' }
    });
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${BACKEND_URL}/send-otp`, { email, type: 'login_otp' });
      toast.success("OTP Sent! Check your mail.");
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || "User not found");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let res;
      if (loginMethod === 'password') {
        res = await axios.post(`${BACKEND_URL}/login`, {
          email: email.trim().toLowerCase(),
          password: password
        });
      } else {
        res = await axios.post(`${BACKEND_URL}/login-via-otp`, {
          email: email.trim().toLowerCase(),
          otp: otp
        });
      }

      localStorage.setItem('user', JSON.stringify(res.data.user));
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
      }

      toast.success(`Welcome back, ${res.data.user.name}! 🚀`);
      navigate('/');

    } catch (err) {
      console.error("Login Error:", err);
      toast.error(err.response?.data?.message || "Invalid Credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-yellow-100 to-orange-50 dark:from-gray-900 dark:via-black dark:to-gray-900 transition-colors duration-500 flex items-center justify-center p-4 relative">

      <button
        onClick={toggleTheme}
        className="fixed bottom-6 left-6 p-4 rounded-full bg-white/30 dark:bg-black/30 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-2xl hover:scale-110 transition-transform z-50 group"
        title="Toggle Theme"
      >
        {darkMode ? (
          <Sun className="w-6 h-6 text-yellow-400 group-hover:rotate-90 transition-transform duration-500" />
        ) : (
          <Moon className="w-6 h-6 text-slate-700 group-hover:-rotate-12 transition-transform duration-500" />
        )}
      </button>

      <div className={`w-full max-w-md ${GLASS_CLASSES} rounded-3xl p-8 relative overflow-hidden`}>

        <div className="absolute -top-10 -right-10 w-32 h-32 bg-orange-500/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-yellow-500/30 rounded-full blur-3xl"></div>

        <div className="text-center mb-8 relative z-10">
          <div className="inline-flex p-3 rounded-2xl bg-orange-100 dark:bg-white/10 text-orange-600 dark:text-yellow-400 mb-4 shadow-inner">
            <LayoutDashboard className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Welcome Back</h1>
          <p className="text-slate-500 dark:text-gray-400 mt-2">Enter your details to access your account</p>
        </div>

        {/* Custom Toggle Switch */}
        <div className="relative z-10 flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-6">
          <button
            type="button"
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${loginMethod === 'password'
              ? 'bg-white dark:bg-gray-700 shadow text-orange-600 dark:text-white'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
              }`}
            onClick={() => { setLoginMethod('password'); setStep(1); }}
          >
            Password
          </button>
          <button
            type="button"
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${loginMethod === 'otp'
              ? 'bg-white dark:bg-gray-700 shadow text-orange-600 dark:text-white'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
              }`}
            onClick={() => setLoginMethod('otp')}
          >
            One-Time Password
          </button>
        </div>

        <form onSubmit={step === 1 && loginMethod === 'otp' ? handleSendOtp : handleSubmit} className="space-y-6 relative z-10">
          <div>
            <label className={LABEL_CLASSES}>Email Address</label>
            <div className={INPUT_GROUP}>
              <Mail className={INPUT_ICON} />
              <input
                type="email"
                required
                className={INPUT_CLASSES}
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={step === 2 && loginMethod === 'otp'}
              />
            </div>
          </div>

          {loginMethod === 'password' && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className={LABEL_CLASSES}>Password</label>
                <Link to="/forgot-password" className="text-xs font-semibold text-orange-600 dark:text-yellow-400 hover:underline">
                  Forgot Password?
                </Link>
              </div>
              <div className={INPUT_GROUP}>
                <Lock className={INPUT_ICON} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className={INPUT_CLASSES}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button type="button" onClick={() => setShowPassword(s => !s)} className="absolute right-3 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          )}

          {loginMethod === 'otp' && step === 2 && (
            <div>
              <label className={LABEL_CLASSES}>Enter OTP</label>
              <div className={INPUT_GROUP}>
                <KeyRound className={INPUT_ICON} />
                <input
                  type="text"
                  required
                  className={INPUT_CLASSES}
                  placeholder="6-digit code"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
              </div>
              <button type="button" onClick={() => setStep(1)} className="text-xs text-orange-600 hover:underline mt-2">
                Use a different email?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 dark:bg-yellow-500 dark:hover:bg-yellow-600 text-white dark:text-black font-bold rounded-xl transition-all shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2"
          >
            {loading ? 'Processing...' : (loginMethod === 'otp' && step === 1 ? 'Send OTP' : 'Sign In')}
            {!loading && <ArrowRight className="w-5 h-5" />}
          </button>
        </form>

        <p className="text-center mt-8 text-slate-600 dark:text-gray-400 relative z-10">
          Don't have an account?{' '}
          <Link to="/register" className="font-bold text-orange-600 dark:text-yellow-400 hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;