import { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMenu, FiEdit } from 'react-icons/fi';
import Sidebar from '../components/layout/Sidebar';
import MessageBubble from '../components/chat/MessageBubble';
import TypingIndicator from '../components/chat/TypingIndicator';
import ChatInput from '../components/chat/ChatInput';
import WelcomeScreen from '../components/chat/WelcomeScreen';
import ProfileModal from '../components/profile/ProfileModal';
import { fetchMessages, appendStreamDelta, finalizeStream, addOptimisticMessage, setStreamError, startStreaming } from '../components/redux/slices/messageSlice';
import { newChat, updateChatTitle } from '../components/redux/slices/chatSlice';
import { sendMessageStream } from '../services/api';
import toast from 'react-hot-toast';

const ChatPage = () => {
    const dispatch = useDispatch();
    const { activeChatId } = useSelector((s) => s.chat);
    const { messagesByChat, isStreaming, streamingContent, loading } = useSelector((s) => s.message);

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [pendingMessage, setPendingMessage] = useState(null);
    const [showProfile, setShowProfile] = useState(false);

    const messagesEndRef = useRef(null);
    const messages = activeChatId ? (messagesByChat[activeChatId] || []) : [];
    const hasLoadedActiveChat = activeChatId
        ? Object.prototype.hasOwnProperty.call(messagesByChat, activeChatId)
        : false;
    const showChatLoading = activeChatId && !hasLoadedActiveChat;

    // Scroll to bottom whenever messages or stream changes (throttled)
    const scrollTimeoutRef = useRef(null);
    const scrollToBottom = useCallback((smooth = true, force = false) => {
        if (!force && scrollTimeoutRef.current) return;

        if (force && scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current);
            scrollTimeoutRef.current = null;
        }

        const doScroll = () => {
            messagesEndRef.current?.scrollIntoView({
                behavior: smooth ? 'smooth' : 'auto',
                block: 'end'
            });
            scrollTimeoutRef.current = null;
        };

        if (force) {
            doScroll();
        } else {
            scrollTimeoutRef.current = setTimeout(doScroll, 100);
        }
    }, []);

    useEffect(() => {
        // Use instant scroll when switching chats or for the very first message
        const isSwitchingChat = messages.length > 0 && !isStreaming;
        const isFirstMessage = messages.length === 1 && !isStreaming;

        scrollToBottom(!(isSwitchingChat || isFirstMessage), (isSwitchingChat || isFirstMessage));

        return () => {
            if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
        };
    }, [activeChatId, messages.length === 0, scrollToBottom]); // Trigger on chat change or initial message load

    // Also scroll during streaming or when messages are added
    useEffect(() => {
        if (messages.length > 0) {
            scrollToBottom(true, false);
        }
    }, [messages.length, streamingContent, scrollToBottom]);

    // Load messages when switching chats
    useEffect(() => {
        if (activeChatId && !messagesByChat[activeChatId]) {
            dispatch(fetchMessages(activeChatId));
        }
    }, [activeChatId, messagesByChat, dispatch]);

    const handleSend = async (content, files = []) => {
        let chatId = activeChatId;

        // If no active chat, create one first
        if (!chatId) {
            const result = await dispatch(newChat('New IntelliChat'));
            if (!result.payload) {
                toast.error('Failed to create chat');
                return;
            }
            chatId = result.payload._id;
        }

        // Build optimistic attachments from File objects
        const optimisticAttachments = files.map((f) => ({
            url: URL.createObjectURL(f),
            filename: f.name,
            fileType: f.type.startsWith('image/')
                ? 'image'
                : f.type.startsWith('audio/')
                    ? 'audio'
                    : 'file',
            size: f.size,
            _blob: true,
        }));

        // Add optimistic user message immediately
        const tempUserMsg = {
            _id: `temp-${Date.now()}`,
            chatId,
            role: 'user',
            content,
            attachments: optimisticAttachments,
            createdAt: new Date().toISOString(),
            _optimistic: true,
        };
        dispatch(addOptimisticMessage({ chatId, message: tempUserMsg }));
        dispatch(startStreaming());

        // Stream AI response
        await sendMessageStream(
            chatId,
            content,
            (delta) => {
                dispatch(appendStreamDelta(delta));
            },
            (payload) => {
                dispatch(finalizeStream({
                    chatId,
                    userMessage: payload.userMessage,
                    assistantMessage: payload.assistantMessage,
                }));
                // Update chat title in sidebar if it was auto-generated
                if (payload.userMessage?.chatId) {
                    dispatch(updateChatTitle({
                        chatId,
                        title: content.length > 40 ? content.substring(0, 40) + '...' : content,
                    }));
                }
            },
            (error) => {
                dispatch(setStreamError());
                toast.error(error || 'Failed to get response');
            },
            files
        );
    };

    // Called from WelcomeScreen suggestion click
    const handleSuggestion = (text) => {
        setPendingMessage(text);
    };

    useEffect(() => {
        if (pendingMessage && activeChatId) {
            handleSend(pendingMessage);
            setPendingMessage(null);
        }
    }, [pendingMessage, activeChatId]);

    return (
        <div className="flex h-screen bg-[#212121] overflow-hidden">
            {/* Sidebar */}
            <Sidebar 
                isOpen={sidebarOpen} 
                onClose={() => setSidebarOpen(false)} 
                onProfileClick={() => setShowProfile(true)}
            />

            {/* Main */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <header className="flex-shrink-0 h-14 flex items-center justify-between px-4 border-b border-white/8">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setSidebarOpen((v) => !v)}
                            className="md:hidden p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                        >
                            <FiMenu className="w-5 h-5" />
                        </button>
                        <span className="text-sm font-medium text-gray-300">
                            {activeChatId ? 'IntelliChat' : 'New IntelliChat'}
                        </span>
                    </div>

                    <button
                        onClick={async () => {
                            const result = await dispatch(newChat('New IntelliChat'));
                            if (result.payload) {
                                toast.success('New chat started');
                            }
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors text-sm"
                    >
                        <FiEdit className="w-4 h-4" />
                        <span className="hidden sm:inline">New IntelliChat</span>
                    </button>
                </header>

                {/* Messages area */}
                <div className="flex-1 overflow-y-auto">
                    {showChatLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        </div>
                    ) : messages.length === 0 && !isStreaming ? (
                        <WelcomeScreen onSelectSuggestion={handleSuggestion} />
                    ) : (
                        <div className="max-w-3xl mx-auto">
                            {loading && messages.length === 0 && (
                                <div className="flex items-center justify-center py-20">
                                    <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                </div>
                            )}

                            {messages.map((msg) => (
                                <MessageBubble key={msg._id} message={msg} />
                            ))}

                            {isStreaming && (
                                <TypingIndicator content={streamingContent} />
                            )}

                            <div ref={messagesEndRef} className="h-8" />
                        </div>
                    )}
                </div>

                {/* Input */}
                <ChatInput
                    onSend={handleSend}
                    disabled={isStreaming}
                    isStreaming={isStreaming}
                />
            </div>

            {/* Profile Modal */}
            <AnimatePresence>
                {showProfile && (
                    <ProfileModal onClose={() => setShowProfile(false)} />
                )}
            </AnimatePresence>
        </div>
    );
};

export default ChatPage;
