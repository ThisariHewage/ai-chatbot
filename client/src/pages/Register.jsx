import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { register, clearError } from '../components/redux/slices/authSlice';
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';

const Register = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { loading, isAuthenticated } = useSelector((s) => s.auth);

    const [form, setForm] = useState({ name: '', email: '', password: '' });
    const [showPass, setShowPass] = useState(false);

    useEffect(() => {
        if (isAuthenticated) navigate('/');
        return () => dispatch(clearError());
    }, [isAuthenticated, navigate, dispatch]);

    const handleChange = (e) =>
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.name || !form.email || !form.password) return;
        dispatch(register(form));
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
                    <h1 className="text-2xl font-semibold text-white">Create an account</h1>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="relative">
                        <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            name="name"
                            placeholder="Full name"
                            value={form.name}
                            onChange={handleChange}
                            required
                            minLength={2}
                            className="w-full bg-[#2f2f2f] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-white/30 transition-colors"
                        />
                    </div>

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
                            placeholder="Password (min. 6 characters)"
                            value={form.password}
                            onChange={handleChange}
                            required
                            minLength={6}
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
                        {loading ? 'Creating account...' : 'Create account'}
                    </button>
                </form>

                <p className="text-center text-sm text-gray-400 mt-6">
                    Already have an account?{' '}
                    <Link to="/login" className="text-white hover:underline">
                        Log in
                    </Link>
                </p>
            </motion.div>
        </div>
    );
};

export default Register;