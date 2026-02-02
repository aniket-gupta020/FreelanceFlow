import { useState, useEffect } from 'react';
import api from '../api';
import { toast } from 'react-hot-toast';
import { useNavigate, Link } from 'react-router-dom';
import { LayoutDashboard, User, Mail, Lock, ArrowRight, Eye, EyeOff, Sun, Moon, KeyRound } from 'lucide-react';

const GLASS_CLASSES = "bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-xl";
const INPUT_GROUP = "relative flex items-center";
const INPUT_ICON = "absolute left-3 w-5 h-5 text-gray-400 dark:text-gray-500";
const INPUT_CLASSES = "w-full pl-10 p-3 bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition-all dark:text-white";
const LABEL_CLASSES = "block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1";

const Register = () => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
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

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Validation
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      setLoading(false);
      return;
    }

    try {
      await api.post('/auth/register', { name, email, password });
      toast.success("OTP Sent! Please check your email.");
      setStep(2);
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Error registering user";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.post('/auth/verify-otp', { email, otp });

      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));

      toast.success("Registration Successful!");
      navigate('/');
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Invalid or Expired OTP";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 dark:from-gray-900 dark:via-black dark:to-gray-900 transition-colors duration-500 flex items-center justify-center p-4 select-none relative">

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

        <div className="absolute -top-10 -right-10 w-32 h-32 bg-pink-500/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-violet-500/30 rounded-full blur-3xl"></div>

        <div className="text-center mb-8 relative z-10">
          <div className="inline-flex p-3 rounded-2xl bg-violet-100 dark:bg-white/10 text-violet-600 dark:text-yellow-400 mb-4 shadow-inner">
            <LayoutDashboard className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
            {step === 1 ? "Get Started" : "Verify Email"}
          </h1>
          <p className="text-slate-500 dark:text-gray-400 mt-2">
            {step === 1 ? "Join FreelanceFlow today" : `Enter the OTP sent to ${email}`}
          </p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleRegister} className="space-y-5 relative z-10">
            <div>
              <label className={LABEL_CLASSES}>Full Name</label>
              <div className={INPUT_GROUP}>
                <User className={INPUT_ICON} />
                <input
                  type="text"
                  required
                  className={INPUT_CLASSES}
                  placeholder="Mr. Aniket"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

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
                />
              </div>
            </div>

            <div>
              <label className={LABEL_CLASSES}>Password</label>
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



            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-violet-600 hover:bg-violet-700 dark:bg-yellow-500 dark:hover:bg-yellow-600 text-white dark:text-black font-bold rounded-xl transition-all shadow-lg shadow-violet-500/30 flex items-center justify-center gap-2 mt-4"
            >
              {loading ? 'Sending OTP...' : 'Register & Verify'}
              {!loading && <ArrowRight className="w-5 h-5" />}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-5 relative z-10">
            <div>
              <label className={LABEL_CLASSES}>One-Time Password (OTP)</label>
              <div className={INPUT_GROUP}>
                <KeyRound className={INPUT_ICON} />
                <input
                  type="text"
                  required
                  className={INPUT_CLASSES}
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-violet-600 hover:bg-violet-700 dark:bg-yellow-500 dark:hover:bg-yellow-600 text-white dark:text-black font-bold rounded-xl transition-all shadow-lg shadow-violet-500/30 flex items-center justify-center gap-2 mt-4"
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
              {!loading && <ArrowRight className="w-5 h-5" />}
            </button>

            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full text-center text-sm text-slate-500 dark:text-gray-400 hover:underline"
            >
              Incorrect Email? Go Back
            </button>
          </form>
        )}

        <p className="text-center mt-8 text-slate-600 dark:text-gray-400 relative z-10">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-violet-600 dark:text-yellow-400 hover:underline">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;