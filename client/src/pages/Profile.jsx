import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiUser, FiMail, FiCalendar, FiTrash2 } from 'react-icons/fi';
import { logout } from '../redux/slices/authSlice';
import { deleteAccount } from '../services/api';
import toast from 'react-hot-toast';

const Profile = () => {
    const { user } = useSelector((s) => s.auth);
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
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric',
        });
    };

    return (
        <div className="min-h-screen bg-[#212121] text-white">
            <div className="max-w-lg mx-auto px-4 py-8">
                {/* Back */}
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8 text-sm"
                >
                    <FiArrowLeft className="w-4 h-4" />
                    Back to chat
                </button>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                >
                    <h1 className="text-2xl font-semibold">My Profile</h1>

                    {/* Avatar */}
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                            <FiUser className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <p className="text-lg font-medium">{user?.name}</p>
                            <p className="text-sm text-gray-400">{user?.email}</p>
                        </div>
                    </div>

                    {/* Info cards */}
                    <div className="space-y-3">
                        {[
                            { icon: FiUser, label: 'Full Name', value: user?.name },
                            { icon: FiMail, label: 'Email Address', value: user?.email },
                            { icon: FiCalendar, label: 'Member Since', value: formatDate(user?.createdAt) },
                        ].map(({ icon: Icon, label, value }) => (
                            <div key={label} className="flex items-center gap-3 p-4 bg-[#2f2f2f] rounded-xl border border-white/10">
                                <Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                <div>
                                    <p className="text-xs text-gray-500">{label}</p>
                                    <p className="text-sm text-white mt-0.5">{value}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Danger zone */}
                    <div className="pt-4 border-t border-white/10">
                        <p className="text-sm font-medium text-red-400 mb-3">Danger Zone</p>
                        <button
                            onClick={handleDeleteAccount}
                            disabled={deleting}
                            className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm transition-colors disabled:opacity-60"
                        >
                            <FiTrash2 className="w-4 h-4" />
                            {deleting ? 'Deleting...' : 'Delete my account'}
                        </button>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Profile;