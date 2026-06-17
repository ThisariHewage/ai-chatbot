import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { FiAlertCircle, FiArrowRight, FiLock, FiMessageSquare } from 'react-icons/fi';
import { continueSharedChat, getSharedChat } from '../services/api';
import { setActiveChatId } from '../components/redux/slices/chatSlice';

const SharedChatPage = () => {
    const { token } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [chat, setChat] = useState(null);
    const [messageCount, setMessageCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [continuing, setContinuing] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadSharedChat = async () => {
            try {
                setLoading(true);
                setError('');
                const { data } = await getSharedChat(token);
                setChat(data.chat);
                setMessageCount(data.messageCount || 0);
            } catch (err) {
                setError(err.response?.data?.message || 'This shared conversation is unavailable.');
            } finally {
                setLoading(false);
            }
        };

        loadSharedChat();
    }, [token]);

    const handleContinue = async () => {
        if (!localStorage.getItem('token')) {
            localStorage.setItem('pendingShareToken', token);
            navigate('/login');
            return;
        }

        try {
            setContinuing(true);
            const { data } = await continueSharedChat(token);
            dispatch(setActiveChatId(data.chat._id));
            toast.success('Conversation copied to your chats');
            navigate('/');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to continue conversation');
        } finally {
            setContinuing(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#212121] text-white">
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

            <main className="max-w-3xl mx-auto px-4">
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

                {!loading && !error && (
                    <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-5 shadow-2xl">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                                <FiLock className="w-5 h-5 text-gray-300" />
                            </div>
                            <div className="min-w-0">
                                <h1 className="text-lg font-semibold text-white">Private shared conversation</h1>
                                <p className="mt-2 text-sm leading-6 text-gray-400">
                                    The full conversation is hidden on this link. Continue to copy it into your own chats and carry it forward from there.
                                </p>
                                <p className="mt-3 text-xs text-gray-500">
                                    {messageCount} {messageCount === 1 ? 'message' : 'messages'} will be added to your private copy.
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={handleContinue}
                            disabled={continuing}
                            className="mt-5 w-full flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-medium text-black hover:bg-gray-100 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                        >
                            {continuing ? 'Opening...' : 'Continue conversation'}
                            {!continuing && <FiArrowRight className="w-4 h-4" />}
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
};

export default SharedChatPage;
