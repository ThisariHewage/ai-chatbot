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
                    <div className="w-8 h-8 rounded-full bg-[#19c37d] flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" />
                        </svg>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-300 mb-2">
                    {isUser ? 'You' : 'ChatGPT'}
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