import { useState, useEffect, useRef } from 'react';
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
    FiMoreHorizontal,
    FiLink,
    FiArchive,
} from 'react-icons/fi';
import { BsPinAngle, BsPinAngleFill } from 'react-icons/bs';
import {
    fetchChats,
    newChat,
    removeChat,
    renameChat,
    setActiveChatId,
    setSearchQuery,
    clearAllChats,
    togglePinChat,
    toggleArchiveChat,
    generateShareLink,
} from '../redux/slices/chatSlice';
import { clearAllMessages } from '../redux/slices/messageSlice';
import { logout } from '../redux/slices/authSlice';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const Sidebar = ({ isOpen, onClose }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { chats, activeChatId, loading, searchQuery } = useSelector((s) => s.chat);
    const { user } = useSelector((s) => s.auth);

    const [editingId, setEditingId] = useState(null);
    const [editTitle, setEditTitle] = useState('');
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null); // { id, title }
    const [openMenuId, setOpenMenuId] = useState(null); // ⋯ context menu
    const [collapsedSections, setCollapsedSections] = useState({}); // { 'Pinned': true, 'Today': false, ... }
    const menuRef = useRef(null);

    useEffect(() => {
        dispatch(fetchChats());
    }, [dispatch]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setOpenMenuId(null);
            }
            if (showUserMenu && !event.target.closest('.user-menu-container')) {
                setShowUserMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showUserMenu]);

    const filteredChats = chats.filter((c) =>
        c.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleNewChat = async () => {
        const result = await dispatch(newChat('New IntelliChat'));
        if (result.payload) {
            toast.success('New chat started');
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
        setOpenMenuId(null);
        setDeleteConfirm({ id: chat._id, title: chat.title });
    };

    const confirmDelete = () => {
        if (deleteConfirm) dispatch(removeChat(deleteConfirm.id));
        setDeleteConfirm(null);
    };

    const cancelDelete = () => setDeleteConfirm(null);

    const handlePin = (e, chat) => {
        e.stopPropagation();
        setOpenMenuId(null);
        dispatch(togglePinChat({ chatId: chat._id, pinned: !chat.pinned }));
    };

    const handleArchive = (e, chat) => {
        e.stopPropagation();
        setOpenMenuId(null);
        dispatch(toggleArchiveChat({ chatId: chat._id, archived: !chat.archived }));
    };

    const handleShare = async (e, chat) => {
        e.stopPropagation();
        setOpenMenuId(null);
        const result = await dispatch(generateShareLink(chat._id));
        if (result.payload?.shareUrl) {
            await navigator.clipboard.writeText(result.payload.shareUrl);
            toast.success('Share link copied!');
        }
    };

    const handleStartRename = (e, chat) => {
        e.stopPropagation();
        setOpenMenuId(null);
        setEditingId(chat._id);
        setEditTitle(chat.title);
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

    const toggleSection = (name) => {
        setCollapsedSections(prev => ({ ...prev, [name]: !prev[name] }));
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

    // Group chats — exclude archived, pinned float to top
    const groupChats = (chatList) => {
        const groups = { Chats: [] };

        chatList.forEach((chat) => {
            if (chat.archived || chat.pinned) return;
            groups['Chats'].push(chat);
        });

        return groups;
    };

    const pinnedChats = filteredChats.filter((c) => c.pinned && !c.archived);
    const archivedChats = filteredChats.filter((c) => c.archived);
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
                    <div className="relative group/search">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                        <input
                            type="text"
                            placeholder="Search chats..."
                            value={searchQuery}
                            onChange={(e) => dispatch(setSearchQuery(e.target.value))}
                            className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-8 py-2 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-white/20 transition-colors"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => dispatch(setSearchQuery(''))}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-white transition-colors"
                            >
                                <FiX className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Chat List */}
                <div className="flex-1 overflow-y-auto px-2 pb-2">
                    {/* Pinned section at top of the list */}
                    {pinnedChats.length > 0 && (
                        <div className="px-2 mb-2">
                            <button
                                onClick={() => toggleSection('Pinned')}
                                className="w-full flex items-center justify-between group/header px-2 py-1.5"
                            >
                                <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wider flex items-center gap-1">
                                    Pinned
                                </p>
                                <FiChevronDown className={`w-3 h-3 text-gray-500 transition-transform ${collapsedSections['Pinned'] ? '-rotate-90' : ''}`} />
                            </button>
                            <AnimatePresence>
                                {!collapsedSections['Pinned'] && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="relative"
                                    >
                                        {pinnedChats.map((chat) => (
                                            <motion.div
                                                key={`pinned-${chat._id}`}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -10 }}
                                                transition={{ duration: 0.15 }}
                                            >
                                                {editingId === chat._id ? (
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
                                                        className="group relative flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer transition-colors hover:bg-white/8"
                                                    >
                                                        <BsPinAngleFill className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                                        <span className="flex-1 text-sm text-gray-200 truncate">{chat.title}</span>

                                                        {/* ⋯ menu button */}
                                                        <div className={`${openMenuId === chat._id ? 'flex' : 'hidden group-hover:flex'} items-center flex-shrink-0 relative`}>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === chat._id ? null : chat._id); }}
                                                                className="p-1 text-gray-400 hover:text-white transition-colors rounded"
                                                            >
                                                                <FiMoreHorizontal className="w-3.5 h-3.5" />
                                                            </button>

                                                            <AnimatePresence>
                                                                {openMenuId === chat._id && (
                                                                    <motion.div
                                                                        ref={menuRef}
                                                                        initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                                                        exit={{ opacity: 0, scale: 0.95, y: -4 }}
                                                                        transition={{ duration: 0.1 }}
                                                                        className="absolute right-0 top-7 z-40 w-44 bg-[#2a2a2a] border border-white/10 rounded-xl shadow-2xl overflow-hidden"
                                                                        onClick={(e) => e.stopPropagation()}
                                                                    >
                                                                        <button onClick={(e) => handlePin(e, chat)} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-gray-200 hover:bg-white/10 transition-colors">
                                                                            {chat.pinned ? <BsPinAngleFill className="w-3.5 h-3.5 text-gray-400" /> : <BsPinAngle className="w-3.5 h-3.5" />}
                                                                            {chat.pinned ? 'Unpin' : 'Pin'}
                                                                        </button>
                                                                        <button onClick={(e) => handleArchive(e, chat)} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-gray-200 hover:bg-white/10 transition-colors">
                                                                            <FiArchive className="w-3.5 h-3.5" />
                                                                            {chat.archived ? 'Unarchive' : 'Archive'}
                                                                        </button>
                                                                        <button onClick={(e) => handleDeleteChat(e, chat)} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-red-400 hover:bg-white/10 transition-colors">
                                                                            <FiTrash2 className="w-3.5 h-3.5" />
                                                                            Delete
                                                                        </button>
                                                                        <div className="border-t border-white/10" />
                                                                        <button onClick={(e) => handleStartRename(e, chat)} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-gray-200 hover:bg-white/10 transition-colors">
                                                                            <FiEdit2 className="w-3.5 h-3.5" />
                                                                            Rename
                                                                        </button>
                                                                        <button onClick={(e) => handleShare(e, chat)} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-gray-200 hover:bg-white/10 transition-colors">
                                                                            <FiLink className="w-3.5 h-3.5" />
                                                                            Share link
                                                                        </button>
                                                                    </motion.div>
                                                                )}
                                                            </AnimatePresence>
                                                        </div>
                                                    </div>
                                                )}
                                            </motion.div>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}

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
                        const isCollapsed = collapsedSections[group];
                        return (
                            <div key={group} className="mb-2">
                                <button
                                    onClick={() => toggleSection(group)}
                                    className="w-full flex items-center justify-between group/header px-2 py-1.5"
                                >
                                    <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wider">
                                        {group}
                                    </p>
                                    <FiChevronDown className={`w-3 h-3 text-gray-500 transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
                                </button>
                                <AnimatePresence>
                                    {!isCollapsed && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="relative"
                                        >
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
                                    group relative flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer transition-colors
                                    ${!chat.pinned && (activeChatId === chat._id ? 'bg-white/15' : 'hover:bg-white/8')}
                                  `}
                                                        >
                                                            {chat.pinned
                                                                ? <BsPinAngleFill className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                                                : <FiMessageSquare className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />}
                                                            <span className="flex-1 text-sm text-gray-200 truncate">
                                                                {chat.title}
                                                            </span>
                                                            {/* ⋯ menu button */}
                                                            <div className={`${openMenuId === chat._id ? 'flex' : 'hidden group-hover:flex'} items-center flex-shrink-0 relative`}>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === chat._id ? null : chat._id); }}
                                                                    className="p-1 text-gray-400 hover:text-white transition-colors rounded"
                                                                >
                                                                    <FiMoreHorizontal className="w-3.5 h-3.5" />
                                                                </button>

                                                                <AnimatePresence>
                                                                    {openMenuId === chat._id && (
                                                                        <motion.div
                                                                            ref={menuRef}
                                                                            initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                                                            exit={{ opacity: 0, scale: 0.95, y: -4 }}
                                                                            transition={{ duration: 0.1 }}
                                                                            className="absolute right-0 top-7 z-40 w-44 bg-[#2a2a2a] border border-white/10 rounded-xl shadow-2xl overflow-hidden"
                                                                            onClick={(e) => e.stopPropagation()}
                                                                        >
                                                                            <button onClick={(e) => handlePin(e, chat)} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-gray-200 hover:bg-white/10 transition-colors">
                                                                                {chat.pinned ? <BsPinAngleFill className="w-3.5 h-3.5 text-gray-400" /> : <BsPinAngle className="w-3.5 h-3.5" />}
                                                                                {chat.pinned ? 'Unpin' : 'Pin'}
                                                                            </button>
                                                                            <button onClick={(e) => handleShare(e, chat)} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-gray-200 hover:bg-white/10 transition-colors">
                                                                                <FiLink className="w-3.5 h-3.5" />
                                                                                Share link
                                                                            </button>
                                                                            <button onClick={(e) => handleArchive(e, chat)} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-gray-200 hover:bg-white/10 transition-colors">
                                                                                <FiArchive className="w-3.5 h-3.5" />
                                                                                {chat.archived ? 'Unarchive' : 'Archive'}
                                                                            </button>
                                                                            <div className="border-t border-white/10" />
                                                                            <button onClick={(e) => handleStartRename(e, chat)} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-gray-200 hover:bg-white/10 transition-colors">
                                                                                <FiEdit2 className="w-3.5 h-3.5" />
                                                                                Rename
                                                                            </button>
                                                                            <button onClick={(e) => handleDeleteChat(e, chat)} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-red-400 hover:bg-white/10 transition-colors">
                                                                                <FiTrash2 className="w-3.5 h-3.5" />
                                                                                Delete
                                                                            </button>
                                                                        </motion.div>
                                                                    )}
                                                                </AnimatePresence>
                                                            </div>
                                                        </div>
                                                    )}
                                                </motion.div>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}

                    {/* Archived Section */}
                    {archivedChats.length > 0 && (
                        <div className="mt-4 border-t border-white/5 pt-2">
                            <button
                                onClick={() => toggleSection('Archived')}
                                className="w-full flex items-center justify-between group/header px-2 py-1.5"
                            >
                                <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wider flex items-center gap-1">
                                    <FiArchive className="w-3 h-3" /> Archived
                                </p>
                                <FiChevronDown className={`w-3 h-3 text-gray-500 transition-transform ${collapsedSections['Archived'] ? '-rotate-90' : ''}`} />
                            </button>
                            <AnimatePresence>
                                {!collapsedSections['Archived'] && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="relative"
                                    >
                                        {archivedChats.map((chat) => (
                                            <motion.div
                                                key={`archived-${chat._id}`}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -10 }}
                                                transition={{ duration: 0.15 }}
                                            >
                                                <div
                                                    onClick={() => handleSelectChat(chat._id)}
                                                    className="group relative flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer transition-colors hover:bg-white/8 opacity-70 hover:opacity-100"
                                                >
                                                    <FiArchive className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                                                    <span className="flex-1 text-sm text-gray-400 group-hover:text-gray-200 truncate">{chat.title}</span>

                                                    {/* ⋯ menu button */}
                                                    <div className={`${openMenuId === chat._id ? 'flex' : 'hidden group-hover:flex'} items-center flex-shrink-0 relative`}>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === chat._id ? null : chat._id); }}
                                                            className="p-1 text-gray-400 hover:text-white transition-colors rounded"
                                                        >
                                                            <FiMoreHorizontal className="w-3.5 h-3.5" />
                                                        </button>

                                                        <AnimatePresence>
                                                            {openMenuId === chat._id && (
                                                                <motion.div
                                                                    ref={menuRef}
                                                                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                                                                    transition={{ duration: 0.1 }}
                                                                    className="absolute right-0 top-7 z-40 w-44 bg-[#2a2a2a] border border-white/10 rounded-xl shadow-2xl overflow-hidden"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    <button onClick={(e) => handleArchive(e, chat)} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-gray-200 hover:bg-white/10 transition-colors">
                                                                        <FiArchive className="w-3.5 h-3.5" />
                                                                        Unarchive
                                                                    </button>
                                                                    <button onClick={(e) => handleDeleteChat(e, chat)} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-red-400 hover:bg-white/10 transition-colors">
                                                                        <FiTrash2 className="w-3.5 h-3.5" />
                                                                        Delete
                                                                    </button>
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                </div>



                {/* User Menu */}

                <div className="flex-shrink-0 p-2 border-t border-white/10 relative user-menu-container">
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
