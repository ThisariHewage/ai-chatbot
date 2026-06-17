import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { FiAlertCircle } from 'react-icons/fi';
import { continueSharedChat, getSharedChat } from '../services/api';
import { setActiveChatId } from '../components/redux/slices/chatSlice';

const continuingTokens = new Set();

const SharedChatPage = () => {
    const { token } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const continueConversation = async () => {
            if (continuingTokens.has(token)) return;
            continuingTokens.add(token);

            try {
                setLoading(true);
                setError('');

                await getSharedChat(token);

                if (!localStorage.getItem('token')) {
                    localStorage.setItem('pendingShareToken', token);
                    continuingTokens.delete(token);
                    navigate('/login', { replace: true });
                    return;
                }

                const { data } = await continueSharedChat(token);
                dispatch(setActiveChatId(data.chat._id));
                toast.success('Conversation opened');
                continuingTokens.delete(token);
                navigate('/', { replace: true });
            } catch (err) {
                continuingTokens.delete(token);
                setError(err.response?.data?.message || 'This shared conversation is unavailable.');
            } finally {
                setLoading(false);
            }
        };

        continueConversation();
    }, [dispatch, navigate, token]);

    return (
        <div className="min-h-screen bg-[#212121] text-white flex items-center justify-center px-4">
            <main className="w-full max-w-sm">
                {loading && (
                    <div className="flex flex-col items-center justify-center gap-4 py-24">
                        <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        <p className="text-sm text-gray-400">Opening conversation...</p>
                    </div>
                )}

                {!loading && error && (
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                        <div className="flex items-center gap-3">
                            <FiAlertCircle className="w-5 h-5 text-red-400" />
                            <h1 className="text-base font-semibold">Conversation not found</h1>
                        </div>
                        <p className="mt-2 text-sm text-gray-400">{error}</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default SharedChatPage;
