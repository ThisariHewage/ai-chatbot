import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { FiCopy, FiCheck, FiUser, FiEdit2, FiX, FiCheckCircle } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch } from 'react-redux';
import { editMessageStream } from '../../services/api';
import {
    appendStreamDelta,
    finalizeStream,
    setStreamError,
    removeMessagesAfter,
    updateMessageInChat,
} from '../redux/slices/messageSlice';

// Code block with language label + copy button
const CodeBlock = ({ children, className }) => {
    const [copied, setCopied] = useState(false);
    const language = className?.replace('language-', '') || 'text';
    const code = String(children).replace(/\n$/, '');

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="relative group my-2 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between bg-[#1e1e2e] px-4 py-2 text-xs text-gray-400">
                <span>{language}</span>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 hover:text-white transition-colors"
                >
                    {copied ? (
                        <><FiCheck className="w-3.5 h-3.5 text-green-400" /><span className="text-green-400">Copied!</span></>
                    ) : (
                        <><FiCopy className="w-3.5 h-3.5" /><span>Copy code</span></>
                    )}
                </button>
            </div>
            <SyntaxHighlighter
                style={oneDark}
                language={language}
                PreTag="div"
                customStyle={{
                    margin: 0,
                    borderRadius: 0,
                    fontSize: '13px',
                    lineHeight: '1.6',
                }}
            >
                {code}
            </SyntaxHighlighter>
        </div>
    );
};

const MessageBubble = ({ message }) => {
    const dispatch = useDispatch();
    const [copied, setCopied] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(message.content);
    const [isSaving, setIsSaving] = useState(false);
    const textareaRef = useRef(null);

    const isUser = message.role === 'user';

    useEffect(() => {
        if (isEditing && textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [isEditing]);

    const handleCopy = () => {
        navigator.clipboard.writeText(message.content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleEdit = () => {
        setIsEditing(true);
        setEditContent(message.content);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setEditContent(message.content);
    };

    const handleSave = async () => {
        if (!editContent.trim() || editContent === message.content) {
            setIsEditing(false);
            return;
        }

        setIsSaving(true);
        try {
            // Optimistically update and clear subsequent messages
            dispatch(updateMessageInChat({
                chatId: message.chatId,
                messageId: message._id,
                content: editContent
            }));
            dispatch(removeMessagesAfter({
                chatId: message.chatId,
                messageId: message._id
            }));

            await editMessageStream(
                message._id,
                editContent,
                (delta) => dispatch(appendStreamDelta(delta)),
                (res) => dispatch(finalizeStream({
                    chatId: message.chatId,
                    userMessage: res.userMessage,
                    assistantMessage: res.assistantMessage
                })),
                (err) => {
                    console.error(err);
                    dispatch(setStreamError());
                }
            );

            setIsEditing(false);
        } catch (error) {
            console.error('Failed to save edit:', error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={`flex gap-4 px-4 py-6 group relative ${isUser ? '' : 'bg-[#2a2a2a]/50'}`}
        >
            {/* Avatar */}
            <div className="flex-shrink-0 mt-0.5">
                {isUser ? (
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                        <FiUser className="w-4 h-4 text-white" />
                    </div>
                ) : (
                    <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center border border-white/10 shadow-sm bg-[#2f2f2f]">
                        <img src="/src/assets/logos/logo_1.png" alt="IntelliChat" className="w-full h-full object-cover" />
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-semibold text-gray-300">
                        {isUser ? 'You' : 'IntelliChat'}
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {isEditing ? (
                        <motion.div
                            key="editing"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="w-full"
                        >
                            <textarea
                                ref={textareaRef}
                                value={editContent}
                                onChange={(e) => {
                                    setEditContent(e.target.value);
                                    e.target.style.height = 'auto';
                                    e.target.style.height = e.target.scrollHeight + 'px';
                                }}
                                className="w-full bg-[#2f2f2f] border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-white/30 transition-colors resize-none mb-3"
                                rows={1}
                                disabled={isSaving}
                            />
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-black text-xs font-medium rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                                >
                                    {isSaving ? 'Regenerating...' : <><FiCheckCircle className="w-3.5 h-3.5" /> Save & Submit</>}
                                </button>
                                <button
                                    onClick={handleCancel}
                                    disabled={isSaving}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2f2f2f] text-gray-300 text-xs font-medium rounded-lg hover:bg-[#3f3f3f] transition-colors"
                                >
                                    <FiX className="w-3.5 h-3.5" /> Cancel
                                </button>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="markdown"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="prose-chat"
                        >
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    code({ node, inline, className, children, ...props }) {
                                        if (inline) {
                                            return (
                                                <code className={className} {...props}>
                                                    {children}
                                                </code>
                                            );
                                        }
                                        return <CodeBlock className={className}>{children}</CodeBlock>;
                                    },
                                }}
                            >
                                {message.content}
                            </ReactMarkdown>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Actions button */}
                {!isEditing && (
                    <div className="mt-2 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={handleCopy}
                            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
                        >
                            {copied ? (
                                <><FiCheck className="w-3 h-3 text-green-400" /><span className="text-green-400">Copied!</span></>
                            ) : (
                                <><FiCopy className="w-3 h-3" /><span>Copy</span></>
                            )}
                        </button>
                        {isUser && (
                            <button
                                onClick={handleEdit}
                                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors border-l border-white/10 pl-3"
                            >
                                <FiEdit2 className="w-3 h-3" /><span>Edit</span>
                            </button>
                        )}
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default MessageBubble;
