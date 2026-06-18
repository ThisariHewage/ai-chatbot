import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiUser, FiMail, FiCalendar, FiTrash2, FiShield, FiMessageCircle } from 'react-icons/fi';
import { logout } from '../components/redux/slices/authSlice';
import { deleteAccount } from '../services/api';
import toast from 'react-hot-toast';

const Profile = () => {
    const { user } = useSelector((s) => s.auth);
    const { chats } = useSelector((s) => s.chat);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [deleting, setDeleting] = useState(false);

    const handleDeleteAccount = async () => {
        if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) return;
        try {
            setDeleting(true);
            await deleteAccount();
            dispatch(logout());
            navigate('/login');
            toast.success('Account deleted successfully');
        } catch {
            toast.error('Failed to delete account');
        } finally {
            setDeleting(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric',
        });
    };

    const getInitials = (name) => {
        if (!name) return '?';
        return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.08, delayChildren: 0.15 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0, opacity: 1,
            transition: { type: 'spring', stiffness: 300, damping: 24 }
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white relative overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-5%] right-[-5%] w-[35%] h-[35%] rounded-full bg-blue-600/8 blur-[120px] animate-mesh" />
                <div className="absolute bottom-[-5%] left-[-5%] w-[35%] h-[35%] rounded-full bg-purple-600/8 blur-[120px] animate-mesh" style={{ animationDelay: '-7s' }} />
                <div className="mesh-gradient absolute inset-0 opacity-20" />
            </div>

            <div className="relative z-10 max-w-xl mx-auto px-4 py-8">
                {/* Back Button */}
                <motion.button
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8 text-sm group"
                >
                    <FiArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back to chat
                </motion.button>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="w-full max-w-md mx-auto"
                >
                    {/* Single Glass Card Container */}
                    <div className="glass rounded-[32px] p-8 md:p-10 border border-white/10 overflow-hidden relative">
                        {/* Top Accent Line */}
                        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

                        {/* Profile Header */}
                        <motion.div variants={itemVariants} className="flex flex-col items-center text-center mb-8">
                            {/* Avatar */}
                            <div className="relative group mb-5">
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/30 to-purple-500/30 blur-2xl rounded-full scale-150 group-hover:from-blue-500/40 group-hover:to-purple-500/40 transition-all" />
                                <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-2xl border-2 border-white/20">
                                    <span className="text-3xl font-bold text-white">{getInitials(user?.name)}</span>
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-green-500 border-[3px] border-[#1a1a1a] flex items-center justify-center">
                                    <div className="w-2 h-2 rounded-full bg-white" />
                                </div>
                            </div>

                            <h1 className="text-3xl font-bold text-white tracking-tight mb-2">{user?.name}</h1>
                            <p className="text-gray-400 font-medium">{user?.email}</p>

                            {/* Stats Row */}
                            <div className="flex items-center gap-6 mt-6 pt-6 border-t border-white/10 w-full justify-center">
                                <div className="text-center">
                                    <p className="text-xl font-bold text-white">{chats?.length || 0}</p>
                                    <p className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold mt-1">Chats</p>
                                </div>
                                <div className="w-px h-8 bg-white/10" />
                                <div className="text-center">
                                    <p className="text-xl font-bold text-white">{formatDate(user?.createdAt).split(',')[0]?.split(' ')[0] || '—'}</p>
                                    <p className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold mt-1">Joined</p>
                                </div>
                                <div className="w-px h-8 bg-white/10" />
                                <div className="text-center">
                                    <p className="text-xl font-bold text-green-400">Active</p>
                                    <p className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold mt-1">Status</p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Divider */}
                        <div className="h-px bg-white/5 mb-6" />

                        {/* Account Details Section */}
                        <motion.div variants={itemVariants} className="mb-8">
                            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 ml-1">Account Details</h2>
                            <div className="space-y-2">
                                {[
                                    { icon: FiUser, label: 'Full Name', value: user?.name },
                                    { icon: FiMail, label: 'Email Address', value: user?.email },
                                    { icon: FiCalendar, label: 'Member Since', value: formatDate(user?.createdAt) },
                                    { icon: FiMessageCircle, label: 'Total Conversations', value: `${chats?.length || 0} chats` },
                                    { icon: FiShield, label: 'Account Status', value: 'Active', valueColor: 'text-green-400' },
                                ].map(({ icon: Icon, label, value, valueColor }) => (
                                    <div key={label} className="flex items-center gap-4 p-4 bg-white/5 hover:bg-white/8 rounded-2xl border border-white/5 hover:border-white/10 transition-all group cursor-default">
                                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                                            <Icon className="w-5 h-5 text-gray-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">{label}</p>
                                            <p className={`text-[15px] font-medium mt-0.5 truncate ${valueColor || 'text-white'}`}>{value}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Divider */}
                        <div className="h-px bg-white/5 mb-6" />

                        {/* Danger Zone */}
                        <motion.div variants={itemVariants}>
                            <h2 className="text-xs font-bold text-red-500/70 uppercase tracking-widest mb-3 ml-1">Danger Zone</h2>
                            <div className="p-5 bg-red-500/5 rounded-2xl border border-red-500/10">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
                                        <FiTrash2 className="w-5 h-5 text-red-400" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-white mb-1">Delete Account</p>
                                        <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                                            Permanently delete your account and all associated data. This action cannot be undone.
                                        </p>
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={handleDeleteAccount}
                                            disabled={deleting}
                                            className="flex items-center gap-2 px-5 py-2.5 bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 rounded-xl text-red-400 text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <FiTrash2 className="w-4 h-4" />
                                            {deleting ? 'Deleting...' : 'Delete my account'}
                                        </motion.button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Profile;