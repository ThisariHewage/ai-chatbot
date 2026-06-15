import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiPlus,
    FiSearch,
    FiTrash2,
    FiEdit2,
    FiCheck,
    FiX,
    FiMessageSquare,
    FiLogOut,
    FiUser,
    FiChevronDown,
} from 'react-icons/fi';
import {
    fetchChats,
    newChat,
    removeChat,
    renameChat,
    setActiveChatId,
    setSearchQuery,
    clearAllChats,
} from '../redux/slices/chatSlice';
import { clearAllMessages } from '../redux/slices/messageSlice';
import { logout } from '../redux/slices/authSlice';
import { useNavigate } from 'react-router-dom';

const Sidebar = ({ isOpen, onClose }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { chats, activeChatId, loading, searchQuery } = useSelector((s) => s.chat);
    const { user } = useSelector((s) => s.auth);

    const [editingId, setEditingId] = useState(null);
    const [editTitle, setEditTitle] = useState('');
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null); // { id, title }

    useEffect(() => {
        dispatch(fetchChats());
    }, [dispatch]);

    const filteredChats = chats.filter((c) =>
        c.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleNewChat = async () => {
        const result = await dispatch(newChat('New IntelliChat'));
        if (result.payload) {
            navigate('/');
        }
        if (window.innerWidth < 768) onClose();
    };

    const handleSelectChat = (chatId) => {
        dispatch(setActiveChatId(chatId));
        navigate('/');
        if (window.innerWidth < 768) onClose();
    };

    const handleDeleteChat = (e, chat) => {
        e.stopPropagation();
        setDeleteConfirm({ id: chat._id, title: chat.title });
    };

    const confirmDelete = () => {
        if (deleteConfirm) dispatch(removeChat(deleteConfirm.id));
        setDeleteConfirm(null);
    };

    const cancelDelete = () => setDeleteConfirm(null);

    const handleStartRename = (e, chat) => {
        e.stopPropagation();
        setEditingId(chat._id);
        setEditTitle(chat.title);
    };

    const handleConfirmRename = (e) => {
        e.stopPropagation();
        if (editTitle.trim()) {
            dispatch(renameChat({ chatId: editingId, title: editTitle.trim() }));
        }
        setEditingId(null);
    };

    const handleCancelRename = (e) => {
        e.stopPropagation();
        setEditingId(null);
    };

    const handleLogout = () => {
        dispatch(logout());
        dispatch(clearAllMessages());
        navigate('/login');
    };

    const handleClearAll = () => {
        if (window.confirm('Clear all conversations? This cannot be undone.')) {
            dispatch(clearAllChats());
            dispatch(clearAllMessages());
        }
        setShowUserMenu(false);
    };

    // Group chats by date
    const groupChats = (chatList) => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today - 86400000);
        const week = new Date(today - 7 * 86400000);

        const groups = { Today: [], Yesterday: [], 'Previous 7 Days': [], Older: [] };

        chatList.forEach((chat) => {
            const d = new Date(chat.createdAt);
            if (d >= today) groups['Today'].push(chat);
            else if (d >= yesterday) groups['Yesterday'].push(chat);
            else if (d >= week) groups['Previous 7 Days'].push(chat);
            else groups['Older'].push(chat);
        });

        return groups;
    };

    const grouped = groupChats(filteredChats);

    return (
        <>
            {/* Mobile overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-20 md:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
          fixed md:relative z-30 md:z-auto
          h-full w-[260px] flex flex-col
          bg-[#171717] transition-transform duration-300
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
            >
                {/* Sidebar Header with Logo */}
                <div className="p-4 flex items-center gap-3 border-b border-white/5">
                    <img src="/src/assets/logos/logo_1.png" alt="IntelliChat Logo" className="w-8 h-8 object-contain rounded-lg" />
                    <span className="text-lg font-bold text-white tracking-tight">IntelliChat</span>
                </div>

                {/* New IntelliChat Button */}
                <div className="p-3 flex-shrink-0">
                    <button
                        onClick={handleNewChat}
                        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-white/10 text-white text-sm transition-colors group"
                    >
                        <FiPlus className="w-4 h-4 flex-shrink-0" />
                        <span>New IntelliChat</span>
                    </button>
                </div>

                {/* Search */}
                <div className="px-3 pb-2 flex-shrink-0">
                    <div className="relative">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                        <input
                            type="text"
                            placeholder="Search chats..."
                            value={searchQuery}
                            onChange={(e) => dispatch(setSearchQuery(e.target.value))}
                            className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-2 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-white/20 transition-colors"
                        />
                    </div>
                </div>

                {/* Chat List */}
                <div className="flex-1 overflow-y-auto px-2 pb-2">
                    {loading && (
                        <div className="flex items-center justify-center py-8">
                            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        </div>
                    )}

                    {!loading && filteredChats.length === 0 && (
                        <div className="text-center py-8 text-gray-500 text-sm">
                            {searchQuery ? 'No chats found' : 'No conversations yet'}
                        </div>
                    )}

                    {Object.entries(grouped).map(([group, items]) => {
                        if (items.length === 0) return null;
                        return (
                            <div key={group} className="mb-2">
                                <p className="text-[11px] text-gray-500 font-medium px-2 py-1.5 uppercase tracking-wider">
                                    {group}
                                </p>
                                <AnimatePresence>
                                    {items.map((chat) => (
                                        <motion.div
                                            key={chat._id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -10 }}
                                            transition={{ duration: 0.15 }}
                                        >
                                            {editingId === chat._id ? (
                                                // Rename input
                                                <div
                                                    className="flex items-center gap-1 px-2 py-2 rounded-lg bg-white/10"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <input
                                                        autoFocus
                                                        value={editTitle}
                                                        onChange={(e) => setEditTitle(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') handleConfirmRename(e);
                                                            if (e.key === 'Escape') handleCancelRename(e);
                                                        }}
                                                        className="flex-1 bg-transparent text-white text-sm outline-none min-w-0"
                                                    />
                                                    <button onClick={handleConfirmRename} className="text-green-400 hover:text-green-300 p-0.5">
                                                        <FiCheck className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button onClick={handleCancelRename} className="text-red-400 hover:text-red-300 p-0.5">
                                                        <FiX className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div
                                                    onClick={() => handleSelectChat(chat._id)}
                                                    className={`
                            group flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer transition-colors
                            ${activeChatId === chat._id ? 'bg-white/15' : 'hover:bg-white/8'}
                          `}
                                                >
                                                    <FiMessageSquare className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                                    <span className="flex-1 text-sm text-gray-200 truncate">
                                                        {chat.title}
                                                    </span>
                                                    {/* Action buttons - show on hover */}
                                                    <div className="hidden group-hover:flex items-center gap-0.5 flex-shrink-0">
                                                        <button
                                                            onClick={(e) => handleStartRename(e, chat)}
                                                            className="p-1 text-gray-400 hover:text-white transition-colors"
                                                        >
                                                            <FiEdit2 className="w-3 h-3" />
                                                        </button>
                                                        <button
                                                            onClick={(e) => handleDeleteChat(e, chat)}
                                                            className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                                                        >
                                                            <FiTrash2 className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                </div>

                {/* User Menu */}
                <div className="flex-shrink-0 p-2 border-t border-white/10 relative">
                    <button
                        onClick={() => setShowUserMenu((v) => !v)}
                        className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-white/10 transition-colors"
                    >
                        <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                            <FiUser className="w-3.5 h-3.5 text-white" />
                        </div>
                        <span className="flex-1 text-sm text-gray-200 truncate text-left">
                            {user?.name}
                        </span>
                        <FiChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                        {showUserMenu && (
                            <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 8 }}
                                className="absolute bottom-full left-2 right-2 mb-1 bg-[#2f2f2f] rounded-xl border border-white/10 overflow-hidden shadow-xl"
                            >
                                <button
                                    onClick={() => { navigate('/profile'); setShowUserMenu(false); }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-200 hover:bg-white/10 transition-colors"
                                >
                                    <FiUser className="w-4 h-4" />
                                    My Profile
                                </button>
                                <button
                                    onClick={handleClearAll}
                                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-200 hover:bg-white/10 transition-colors"
                                >
                                    <FiTrash2 className="w-4 h-4" />
                                    Clear conversations
                                </button>
                                <div className="border-t border-white/10" />
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-red-400 hover:bg-white/10 transition-colors"
                                >
                                    <FiLogOut className="w-4 h-4" />
                                    Log out
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </aside>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {deleteConfirm && (
                    <motion.div
                        key="delete-modal"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                        onClick={cancelDelete}
                    >
                        <motion.div
                            initial={{ scale: 0.92, opacity: 0, y: 10 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.92, opacity: 0, y: 10 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            className="bg-[#212121] border border-white/10 rounded-2xl p-5 w-full max-w-sm shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-9 h-9 rounded-full bg-red-500/15 flex items-center justify-center flex-shrink-0">
                                    <FiTrash2 className="w-4 h-4 text-red-400" />
                                </div>
                                <h3 className="text-white font-semibold text-base">Delete conversation?</h3>
                            </div>
                            <p className="text-gray-400 text-sm mb-5 leading-relaxed">
                                <span className="text-gray-200 font-medium">&ldquo;{deleteConfirm.title}&rdquo;</span> will be permanently deleted. This cannot be undone.
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={cancelDelete}
                                    className="flex-1 px-4 py-2 rounded-xl text-sm font-medium text-gray-300 bg-white/8 hover:bg-white/12 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="flex-1 px-4 py-2 rounded-xl text-sm font-medium text-white bg-red-500 hover:bg-red-600 transition-colors"
                                >
                                    Delete
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default Sidebar;