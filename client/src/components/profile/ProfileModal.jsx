import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiX, FiUser, FiMail, FiCalendar, FiTrash2, FiShield, FiMessageCircle } from 'react-icons/fi';
import { logout } from '../redux/slices/authSlice';
import { deleteAccount } from '../../services/api';
import toast from 'react-hot-toast';

const ProfileModal = ({ onClose }) => {
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

    const modalVariants = {
        hidden: { scale: 0.95, opacity: 0, y: 20 },
        visible: {
            scale: 1,
            opacity: 1,
            y: 0,
            transition: { type: 'spring', stiffness: 350, damping: 25 }
        },
        exit: {
            scale: 0.95,
            opacity: 0,
            y: 20,
            transition: { duration: 0.15 }
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.05, delayChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { y: 15, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { type: 'spring', stiffness: 300, damping: 24 }
        }
    };

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto"
            onClick={onClose}
        >
            {/* Modal Box */}
            <motion.div
                variants={modalVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-lg glass rounded-[28px] border border-white/10 overflow-hidden shadow-2xl my-8"
            >
                {/* Top Ambient Light Indicator */}
                <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors z-20"
                    aria-label="Close profile"
                >
                    <FiX className="w-5 h-5" />
                </button>

                <div className="p-6 sm:p-8 max-h-[85vh] overflow-y-auto custom-scrollbar">
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="space-y-6"
                    >
                        {/* Profile Header */}
                        <motion.div variants={itemVariants} className="flex flex-col items-center text-center mt-2">
                            {/* Avatar */}
                            <div className="relative group mb-4">
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/30 to-purple-500/30 blur-xl rounded-full scale-125 group-hover:from-blue-500/40 group-hover:to-purple-500/40 transition-all" />
                                <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-xl border-2 border-white/20">
                                    <span className="text-2xl font-bold text-white">{getInitials(user?.name)}</span>
                                </div>
                                <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-green-500 border-[3px] border-[#1e1e1e] flex items-center justify-center">
                                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                </div>
                            </div>

                            <h2 className="text-2xl font-bold text-white tracking-tight mb-1">{user?.name}</h2>
                            <p className="text-sm text-gray-400 font-medium">{user?.email}</p>

                            {/* Stats Grid */}
                            <div className="flex items-center gap-6 mt-5 pt-5 border-t border-white/10 w-full justify-center">
                                <div className="text-center">
                                    <p className="text-lg font-bold text-white">{chats?.length || 0}</p>
                                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mt-0.5">Chats</p>
                                </div>
                                <div className="w-px h-6 bg-white/10" />
                                <div className="text-center">
                                    <p className="text-lg font-bold text-white">{formatDate(user?.createdAt).split(',')[0]?.split(' ')[0] || '—'}</p>
                                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mt-0.5">Joined</p>
                                </div>
                                <div className="w-px h-6 bg-white/10" />
                                <div className="text-center">
                                    <p className="text-lg font-bold text-green-400">Active</p>
                                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mt-0.5">Status</p>
                                </div>
                            </div>
                        </motion.div>

                        <div className="h-px bg-white/5" />

                        {/* Account Details */}
                        <motion.div variants={itemVariants} className="space-y-3">
                            <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest px-1">Account Details</h3>
                            <div className="grid grid-cols-1 gap-2.5">
                                {[
                                    { icon: FiUser, label: 'Full Name', value: user?.name },
                                    { icon: FiMail, label: 'Email Address', value: user?.email },
                                    { icon: FiCalendar, label: 'Member Since', value: formatDate(user?.createdAt) },
                                    { icon: FiMessageCircle, label: 'Total Conversations', value: `${chats?.length || 0} chats` },
                                    { icon: FiShield, label: 'Account Status', value: 'Active', valueColor: 'text-green-400' },
                                ].map(({ icon: Icon, label, value, valueColor }) => (
                                    <div key={label} className="flex items-center gap-3.5 p-3.5 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 hover:bg-white/8 transition-all group cursor-default">
                                        <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors flex-shrink-0">
                                            <Icon className="w-4 h-4 text-gray-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">{label}</p>
                                            <p className={`text-sm font-medium mt-0.5 truncate ${valueColor || 'text-white'}`}>{value}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        <div className="h-px bg-white/5" />

                        {/* Danger Zone */}
                        <motion.div variants={itemVariants} className="space-y-3">
                            <h3 className="text-[11px] font-bold text-red-500/70 uppercase tracking-widest px-1">Danger Zone</h3>
                            <div className="p-4 bg-red-500/5 rounded-2xl border border-red-500/10">
                                <div className="flex items-start gap-3.5">
                                    <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
                                        <FiTrash2 className="w-4.5 h-4.5 text-red-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-white mb-0.5">Delete Account</p>
                                        <p className="text-xs text-gray-500 mb-3.5 leading-relaxed">
                                            Permanently delete your account and all associated data. This action cannot be undone.
                                        </p>
                                        <button
                                            onClick={handleDeleteAccount}
                                            disabled={deleting}
                                            className="flex items-center gap-2 px-4 py-2 bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 rounded-xl text-red-400 text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <FiTrash2 className="w-3.5 h-3.5" />
                                            {deleting ? 'Deleting...' : 'Delete my account'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
};

export default ProfileModal;
