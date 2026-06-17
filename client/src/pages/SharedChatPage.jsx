import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FiAlertCircle, FiMessageSquare } from 'react-icons/fi';
import MessageBubble from '../components/chat/MessageBubble';
import { getSharedChat } from '../services/api';

const SharedChatPage = () => {
    const { token } = useParams();
    const [chat, setChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadSharedChat = async () => {
            try {
                setLoading(true);
                setError('');
                const { data } = await getSharedChat(token);
                setChat(data.chat);
                setMessages(data.messages || []);
            } catch (err) {
                setError(err.response?.data?.message || 'This shared conversation is unavailable.');
            } finally {
                setLoading(false);
            }
        };

        loadSharedChat();
    }, [token]);

    return (
        <div className="min-h-screen bg-[#212121] text-white overflow-y-auto">
            <header className="sticky top-0 z-10 border-b border-white/8 bg-[#212121]/95 backdrop-blur">
                <div className="max-w-3xl mx-auto flex items-center justify-between gap-4 px-4 py-3">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-200">
                            <FiMessageSquare className="w-4 h-4 text-gray-400" />
                            <span>Shared IntelliChat</span>
                        </div>
                        {chat && (
                            <p className="mt-1 text-xs text-gray-500 truncate">{chat.title}</p>
                        )}
                    </div>
                    <Link
                        to="/"
                        className="flex-shrink-0 rounded-lg px-3 py-1.5 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
                    >
                        Open app
                    </Link>
                </div>
            </header>

            <main className="max-w-3xl mx-auto">
                {loading && (
                    <div className="flex items-center justify-center py-24">
                        <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    </div>
                )}

                {!loading && error && (
                    <div className="mx-4 mt-10 rounded-2xl border border-white/10 bg-white/5 p-5">
                        <div className="flex items-center gap-3">
                            <FiAlertCircle className="w-5 h-5 text-red-400" />
                            <h1 className="text-base font-semibold">Conversation not found</h1>
                        </div>
                        <p className="mt-2 text-sm text-gray-400">{error}</p>
                    </div>
                )}

                {!loading && !error && messages.length === 0 && (
                    <div className="mx-4 mt-10 rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-gray-400">
                        This shared conversation has no messages yet.
                    </div>
                )}

                {!loading && !error && messages.map((message) => (
                    <MessageBubble key={message._id} message={message} readOnly />
                ))}
            </main>
        </div>
    );
};

export default SharedChatPage;
