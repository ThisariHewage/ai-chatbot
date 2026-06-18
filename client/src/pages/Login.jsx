import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { login, clearError } from '../components/redux/slices/authSlice';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import toast from 'react-hot-toast';

const Login = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { loading, error, isAuthenticated } = useSelector((s) => s.auth);

    const [form, setForm] = useState({ email: '', password: '' });
    const [showPass, setShowPass] = useState(false);

    useEffect(() => {
        if (isAuthenticated) {
            const pendingShareToken = localStorage.getItem('pendingShareToken');
            if (pendingShareToken) {
                localStorage.removeItem('pendingShareToken');
                navigate(`/share/${pendingShareToken}`);
                return;
            }
            navigate('/');
        }
        return () => dispatch(clearError());
    }, [isAuthenticated, navigate, dispatch]);

    const handleChange = (e) =>
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.email || !form.password) return;

        const result = await dispatch(login(form));
        if (login.fulfilled.match(result)) {
            toast.success(`Welcome back, ${result.payload.user.name}! 👋`);
        } else if (login.rejected.match(result)) {
            toast.error(result.payload || 'Login failed');
        }
    };

    return (
        <div className="min-h-screen bg-[#212121] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-sm"
            >
                <div className="text-center mb-8 flex flex-col items-center">
                    <div className="w-15 h-15 overflow-hidden mb-4 shadow-xl border border-white/10">
                        <img src="/src/assets/logos/logo_1.png" alt="IntelliChat Logo" className="w-full h-full object-cover" />
                    </div>
                    <h1 className="text-2xl font-semibold text-white">Welcome back</h1>
                </div>

                {/* Error Alert */}
                <AnimatePresence mode="wait">
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center justify-center text-center"
                        >
                            {error}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="relative">
                        <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="email"
                            name="email"
                            placeholder="Email address"
                            value={form.email}
                            onChange={handleChange}
                            required
                            className="w-full bg-[#2f2f2f] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-white/30 transition-colors"
                        />
                    </div>

                    <div className="relative">
                        <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type={showPass ? 'text' : 'password'}
                            name="password"
                            placeholder="Password"
                            value={form.password}
                            onChange={handleChange}
                            required
                            className="w-full bg-[#2f2f2f] border border-white/10 rounded-xl pl-10 pr-10 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-white/30 transition-colors"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPass((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                        >
                            {showPass ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                        </button>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-white text-black font-medium py-3 rounded-xl text-sm hover:bg-gray-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                    >
                        {loading ? 'Logging in...' : 'Continue'}
                    </button>
                </form>

                <p className="text-center text-sm text-gray-400 mt-6">
                    Don't have an account?{' '}
                    <Link to="/register" className="text-white hover:underline">
                        Sign up
                    </Link>
                </p>
            </motion.div>
        </div>
    );
};

export default Login;
