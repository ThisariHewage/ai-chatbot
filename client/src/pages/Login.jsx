import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { login, clearError } from '../components/redux/slices/authSlice';
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight } from 'react-icons/fi';
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
            setTimeout(() => {
                dispatch(clearError());
            }, 5000);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { type: 'spring', stiffness: 300, damping: 24 }
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 relative overflow-hidden font-sans">
            {/* Animated Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[120px] animate-mesh" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/10 blur-[120px] animate-mesh" style={{ animationDelay: '-5s' }} />
                <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] rounded-full bg-blue-400/5 blur-[100px] animate-mesh" style={{ animationDelay: '-10s' }} />
                <div className="mesh-gradient absolute inset-0 opacity-30" />
            </div>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="w-full max-w-md relative z-10"
            >
                <div className="glass rounded-[32px] p-8 md:p-10 border border-white/10 overflow-hidden relative">
                    {/* Top Accent Line */}
                    <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

                    <motion.div variants={itemVariants} className="text-center mb-10 flex flex-col items-center">
                        <div className="relative group mb-6">
                            <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full group-hover:bg-blue-500/30 transition-colors" />
                            <div className="relative w-20 h-20 rounded-2xl overflow-hidden shadow-2xl border border-white/20 p-2 bg-[#1a1a1a]/80 backdrop-blur-md">
                                <img src="/src/assets/logos/logo_1.png" alt="IntelliChat Logo" className="w-full h-full object-cover" />
                            </div>
                        </div>
                        <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Welcome back</h1>
                        <p className="text-gray-400 font-medium">Continue your journey with IntelliChat</p>
                    </motion.div>

                    <AnimatePresence mode="wait">
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium flex items-center gap-3"
                            >
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <motion.div variants={itemVariants} className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-400 ml-1 uppercase tracking-wider">Email Address</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-blue-400 transition-colors">
                                    <FiMail className="w-5 h-5" />
                                </div>
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="Enter your email"
                                    value={form.email}
                                    onChange={handleChange}
                                    required
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white placeholder-gray-500 text-[15px] focus:outline-none focus:border-blue-500/50 focus:bg-white/10 focus:ring-4 focus:ring-blue-500/10 transition-all"
                                />
                            </div>
                        </motion.div>

                        <motion.div variants={itemVariants} className="space-y-1.5">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Password</label>
                                <button type="button" className="text-[11px] font-bold text-blue-400 hover:text-blue-300 transition-colors uppercase tracking-widest">Forgot?</button>
                            </div>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-blue-400 transition-colors">
                                    <FiLock className="w-5 h-5" />
                                </div>
                                <input
                                    type={showPass ? 'text' : 'password'}
                                    name="password"
                                    placeholder="••••••••"
                                    value={form.password}
                                    onChange={handleChange}
                                    required
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-12 py-4 text-white placeholder-gray-500 text-[15px] focus:outline-none focus:border-blue-500/50 focus:bg-white/10 focus:ring-4 focus:ring-blue-500/10 transition-all font-mono"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass((v) => !v)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors p-1"
                                >
                                    {showPass ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                                </button>
                            </div>
                        </motion.div>

                        <motion.button
                            variants={itemVariants}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-4 rounded-2xl text-[15px] shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all flex items-center justify-center gap-2 group mt-4 relative overflow-hidden"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span>Sign in</span>
                                    <FiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </motion.button>
                    </form>

                    <motion.div variants={itemVariants} className="mt-10 text-center">
                        <p className="text-gray-400 text-[15px]">
                            New to IntelliChat?{' '}
                            <Link to="/register" className="text-blue-400 font-bold hover:text-blue-300 transition-colors ml-1 inline-flex items-center gap-1 group">
                                Create account
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 scale-0 group-hover:scale-100 transition-transform" />
                            </Link>
                        </p>
                    </motion.div>
                </div>
            </motion.div>

            {/* Bottom Credits */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[11px] text-gray-600 uppercase tracking-[0.2em] font-bold"
            >
                Powering the future of human-AI collaboration
            </motion.div>
        </div>
    );
};

export default Login;
