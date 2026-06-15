import { motion } from 'framer-motion';
import { useDispatch } from 'react-redux';
import { newChat } from '../redux/slices/chatSlice';

const suggestions = [
    { icon: '✍️', title: 'Help me write', subtitle: 'a cover letter for a product manager role' },
    { icon: '💡', title: 'Explain a concept', subtitle: 'like I\'m a beginner: how does blockchain work?' },
    { icon: '🐞', title: 'Debug my code', subtitle: 'I have a React useEffect issue...' },
    { icon: '📋', title: 'Summarize this', subtitle: 'paste any text to get a quick summary' },
];

const WelcomeScreen = ({ onSelectSuggestion }) => {
    const dispatch = useDispatch();

    const handleSuggestion = async (subtitle) => {
        const result = await dispatch(newChat('New IntelliChat'));
        if (result.payload) {
            onSelectSuggestion(subtitle);
        }
    };

    return (
        <div className="flex-1 flex flex-col items-center justify-center px-4 pb-8">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="mt-12 mb-8"
            >
                <img src="/src/assets/logos/logo_1.png" alt="IntelliChat Logo" className="w-15 h-15 object-contain shadow-2xl shadow-blue-500/20" />
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="text-center mb-10"
            >
                <h1 className="text-3xl font-semibold text-white mb-2">
                    How can I help you today?
                </h1>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl"
            >
                {suggestions.map((s, i) => (
                    <button
                        key={i}
                        onClick={() => handleSuggestion(`${s.title}: ${s.subtitle}`)}
                        className="flex flex-col items-start gap-1 p-4 bg-[#2f2f2f] hover:bg-[#3a3a3a] rounded-2xl border border-white/8 text-left transition-all hover:border-white/15 group"
                    >
                        <span className="text-xl">{s.icon}</span>
                        <span className="text-sm font-medium text-white">{s.title}</span>
                        <span className="text-xs text-gray-400 line-clamp-1">{s.subtitle}</span>
                    </button>
                ))}
            </motion.div>
        </div>
    );
};

export default WelcomeScreen;