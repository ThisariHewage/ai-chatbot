import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { FiCopy, FiCheck, FiUser } from 'react-icons/fi';
import { motion } from 'framer-motion';

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
    const [copied, setCopied] = useState(false);
    const isUser = message.role === 'user';

    const handleCopy = () => {
        navigator.clipboard.writeText(message.content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={`flex gap-4 px-4 py-6 group ${isUser ? '' : 'bg-[#2a2a2a]/50'}`}
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
                <div className="text-sm font-semibold text-gray-300 mb-2">
                    {isUser ? 'You' : 'IntelliChat'}
                </div>
                <div className="prose-chat">
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
                </div>

                {/* Copy button */}
                <button
                    onClick={handleCopy}
                    className="mt-2 flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors opacity-0 group-hover:opacity-100"
                >
                    {copied ? (
                        <><FiCheck className="w-3 h-3 text-green-400" /><span className="text-green-400">Copied!</span></>
                    ) : (
                        <><FiCopy className="w-3 h-3" /><span>Copy</span></>
                    )}
                </button>
            </div>
        </motion.div>
    );
};

export default MessageBubble;