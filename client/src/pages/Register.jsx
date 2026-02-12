import { useState, useEffect } from 'react';
import api from '../api';
import { toast } from 'react-hot-toast';
import { useNavigate, Link } from 'react-router-dom';
import { LayoutDashboard, User, Mail, Lock, ArrowRight, Eye, EyeOff, Sun, Moon } from 'lucide-react';

const GLASS_CLASSES = "bg-white/60 dark:bg-black/40 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-xl shadow-orange-500/10";
const INPUT_GROUP = "relative flex items-center";
const INPUT_ICON = "absolute left-3 w-5 h-5 text-gray-400 dark:text-gray-500";
const INPUT_CLASSES = "w-full pl-10 p-3 bg-white/50 dark:bg-black/20 border border-orange-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all dark:text-white";
const LABEL_CLASSES = "block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1";

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mobile, setMobile] = useState('+91 ');
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
    const nameRegex = /^[a-zA-Z\s]+$/;
    const mobileRegex = /^[0-9+\(\)\s-]+$/;

    if (!nameRegex.test(name) || name.length < 2) {
      toast.error("Invalid Name. Please use letters only.");
      setLoading(false);
      return;
    }

    if (mobile) {
      const digitsOnly = mobile.replace(/\D/g, '');
      // Strict check for India (starts with 91)
      if (digitsOnly.startsWith('91')) {
        if (digitsOnly.length !== 12) { // 91 + 10 digits = 12
          toast.error("For India (+91), please enter exactly 10 digits.");
          setLoading(false);
          return;
        }
      } else {
        // Generic validation for other codes
        if (digitsOnly.length < 11 || digitsOnly.length > 15) {
          toast.error("Invalid Mobile Number. Min 10 digits + Country Code required.");
          setLoading(false);
          return;
        }
      }
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      setLoading(false);
      return;
    }

    try {
      const res = await api.post('/auth/register', { name, email, password, mobile });

      // Store token and user data
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));

      toast.success("Registration Successful! Welcome to FreelanceFlow.");
      navigate('/');
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Error registering user";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-yellow-100 to-orange-50 dark:from-gray-900 dark:via-black dark:to-gray-900 transition-colors duration-500 flex items-center justify-center p-4 select-none relative">

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
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
            Get Started
          </h1>
          <p className="text-slate-500 dark:text-gray-400 mt-2">
            Join FreelanceFlow today
          </p>
        </div>

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
                onChange={(e) => {
                  const val = e.target.value;
                  if (/^[a-zA-Z\s]*$/.test(val)) {
                    setName(val);
                  }
                }}
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
                placeholder="mail.akguptaji@gmail.com"
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

          <div>
            <label className={LABEL_CLASSES}>Mobile Number</label>
            <div className={INPUT_GROUP}>
              <User className={INPUT_ICON} />
              <input
                type="text"
                className={INPUT_CLASSES}
                placeholder="+91 9876543210"
                value={mobile}
                onChange={(e) => {
                  const val = e.target.value;
                  // Allow + at start, then numbers, spaces, - and ()
                  if (/^[+]?[0-9\s-()]*$/.test(val)) {
                    setMobile(val);
                  }
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 dark:bg-yellow-500 dark:hover:bg-yellow-600 text-white dark:text-black font-bold rounded-xl transition-all shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2 mt-4"
          >
            {loading ? 'Creating Account...' : 'Register'}
            {!loading && <ArrowRight className="w-5 h-5" />}
          </button>
        </form>

        <p className="text-center mt-8 text-slate-600 dark:text-gray-400 relative z-10">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-orange-600 dark:text-yellow-400 hover:underline">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;