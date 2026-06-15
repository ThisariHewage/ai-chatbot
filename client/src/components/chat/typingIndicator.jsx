import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

const TypingIndicator = ({ content }) => {
    const isStreaming = content && content.length > 0;

    return (
        <div className="flex gap-4 px-4 py-6 bg-[#2a2a2a]/50">
            {/* AI Avatar */}
            <div className="flex-shrink-0 mt-0.5">
                <div className="w-8 h-8 rounded-full bg-[#19c37d] flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729z" />
                    </svg>
                </div>
            </div>

            <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-300 mb-2">ChatGPT</div>

                {isStreaming ? (
                    // Render streamed markdown in real-time
                    <div className="prose-chat">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                                code({ node, inline, className, children, ...props }) {
                                    if (inline) {
                                        return <code className={className} {...props}>{children}</code>;
                                    }
                                    const language = className?.replace('language-', '') || 'text';
                                    return (
                                        <div className="my-2 rounded-lg overflow-hidden">
                                            <div className="bg-[#1e1e2e] px-4 py-2 text-xs text-gray-400">{language}</div>
                                            <SyntaxHighlighter
                                                style={oneDark}
                                                language={language}
                                                PreTag="div"
                                                customStyle={{ margin: 0, borderRadius: 0, fontSize: '13px' }}
                                            >
                                                {String(children).replace(/\n$/, '')}
                                            </SyntaxHighlighter>
                                        </div>
                                    );
                                },
                            }}
                        >
                            {content}
                        </ReactMarkdown>
                        {/* Blinking cursor */}
                        <span className="inline-block w-0.5 h-4 bg-white ml-0.5 animate-pulse" />
                    </div>
                ) : (
                    // Waiting dots
                    <div className="flex items-center gap-1.5 h-6">
                        <span className="typing-dot" />
                        <span className="typing-dot" />
                        <span className="typing-dot" />
                    </div>
                )}
            </div>
        </div>
    );
};

export default TypingIndicator;