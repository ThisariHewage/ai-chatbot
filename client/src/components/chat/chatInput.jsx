import { useState, useRef, useEffect } from 'react';
import { FiSend, FiStopCircle } from 'react-icons/fi';

const ChatInput = ({ onSend, disabled, isStreaming }) => {
    const [input, setInput] = useState('');
    const textareaRef = useRef(null);

    // Auto-resize textarea
    useEffect(() => {
        const ta = textareaRef.current;
        if (!ta) return;
        ta.style.height = 'auto';
        ta.style.height = Math.min(ta.scrollHeight, 200) + 'px';
    }, [input]);

    const handleSend = () => {
        const trimmed = input.trim();
        if (!trimmed || disabled) return;
        onSend(trimmed);
        setInput('');
        // Reset height
        if (textareaRef.current) textareaRef.current.style.height = 'auto';
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex-shrink-0 px-4 pb-4 pt-2">
            <div className="max-w-3xl mx-auto">
                <div className="relative flex items-end bg-[#2f2f2f] rounded-2xl border border-white/10 focus-within:border-white/20 transition-colors shadow-lg">
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Message IntelliChat..."
                        disabled={disabled}
                        rows={1}
                        className="flex-1 bg-transparent text-white placeholder-gray-500 text-sm resize-none py-3.5 px-4 focus:outline-none max-h-[200px] overflow-y-auto disabled:opacity-50"
                        style={{ lineHeight: '1.6' }}
                    />

                    <div className="flex items-center px-2 pb-2">
                        <button
                            onClick={handleSend}
                            disabled={!input.trim() || disabled}
                            className={`
                w-8 h-8 rounded-lg flex items-center justify-center transition-all
                ${input.trim() && !disabled
                                    ? 'bg-white text-black hover:bg-gray-100'
                                    : 'bg-white/10 text-gray-500 cursor-not-allowed'
                                }
              `}
                        >
                            {isStreaming ? (
                                <FiStopCircle className="w-4 h-4" />
                            ) : (
                                <FiSend className="w-4 h-4" />
                            )}
                        </button>
                    </div>
                </div>

                <p className="text-center text-[11px] text-gray-600 mt-2">
                    IntelliChat clone can make mistakes. Consider checking important information.
                </p>
            </div>
        </div>
    );
};

export default ChatInput;