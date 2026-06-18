import { isValidElement } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

const StreamCodeBlock = ({ children, className }) => {
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
};

const TypingIndicator = ({ content }) => {
    const isStreaming = content && content.length > 0;

    return (
        <div className="flex gap-4 px-4 py-6 bg-[#2a2a2a]/50">
            {/* AI Avatar */}
            <div className="flex-shrink-0 mt-0.5">
                <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center border border-white/10 shadow-sm bg-[#2f2f2f]">
                    <img
                        src="/src/assets/logos/logo_1.png"
                        alt="IntelliChat"
                        className="w-full h-full object-cover"
                    />
                </div>
            </div>

            <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-300 mb-2">IntelliChat</div>

                {isStreaming ? (
                    // Render streamed markdown in real-time
                    <div className="prose-chat">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                                p({ children }) {
                                    return <div className="markdown-paragraph">{children}</div>;
                                },
                                pre({ children }) {
                                    // During streaming, render a simple pre block instead of heavy SyntaxHighlighter
                                    // This significantly improves performance during high-speed streaming
                                    return (
                                        <div className="my-2 p-4 bg-[#1e1e2e] rounded-lg overflow-x-auto">
                                            <pre className="text-gray-300 text-sm whitespace-pre-wrap">{children}</pre>
                                        </div>
                                    );
                                },
                                code({ className, children, ...props }) {
                                    return <code className={className} {...props}>{children}</code>;
                                },
                            }}
                        >
                            {content}
                        </ReactMarkdown>
                        {/* Blinking cursor */}
                        <span className="inline-block w-0.5 h-4 bg-blue-500 ml-0.5 animate-pulse" />
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
