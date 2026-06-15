import { useState, useRef, useEffect } from 'react';
import { FiSend, FiStopCircle, FiPaperclip, FiX, FiFile } from 'react-icons/fi';

const ChatInput = ({ onSend, disabled, isStreaming }) => {
    const [input, setInput] = useState('');
    const [files, setFiles] = useState([]);
    const textareaRef = useRef(null);
    const fileInputRef = useRef(null);

    // Auto-resize textarea
    useEffect(() => {
        const ta = textareaRef.current;
        if (!ta) return;
        ta.style.height = 'auto';
        ta.style.height = Math.min(ta.scrollHeight, 200) + 'px';
    }, [input]);

    const handleSend = () => {
        const trimmed = input.trim();
        if ((!trimmed && files.length === 0) || disabled) return;
        onSend(trimmed || '(attached files)', files);
        setInput('');
        setFiles([]);
        // Reset height
        if (textareaRef.current) textareaRef.current.style.height = 'auto';
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handlePaste = (e) => {
        const items = e.clipboardData?.items;
        if (!items) return;

        const pastedFiles = [];
        for (const item of items) {
            if (item.kind === 'file') {
                const file = item.getAsFile();
                if (file) pastedFiles.push(file);
            }
        }

        if (pastedFiles.length > 0) {
            e.preventDefault();
            setFiles((prev) => [...prev, ...pastedFiles].slice(0, 5));
        }
    };

    const handleFileSelect = (e) => {
        const selected = Array.from(e.target.files);
        if (selected.length === 0) return;
        setFiles((prev) => [...prev, ...selected].slice(0, 5)); // Max 5 files
        e.target.value = '';
    };

    const removeFile = (index) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const formatFileSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    return (
        <div className="flex-shrink-0 px-4 pb-4 pt-2">
            <div className="max-w-3xl mx-auto">
                {/* File Previews */}
                {files.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2 p-3 bg-[#2f2f2f] rounded-t-2xl border border-b-0 border-white/10">
                        {files.map((file, index) => (
                            <div
                                key={index}
                                className="relative group/file flex items-center gap-2 bg-[#1e1e1e] rounded-lg px-3 py-2 border border-white/10"
                            >
                                {file.type.startsWith('image/') ? (
                                    <img
                                        src={URL.createObjectURL(file)}
                                        alt={file.name}
                                        className="w-10 h-10 rounded object-cover"
                                    />
                                ) : (
                                    <div className="w-10 h-10 rounded bg-blue-500/20 flex items-center justify-center">
                                        <FiFile className="w-5 h-5 text-blue-400" />
                                    </div>
                                )}
                                <div className="flex flex-col min-w-0">
                                    <span className="text-xs text-white truncate max-w-[120px]">
                                        {file.name}
                                    </span>
                                    <span className="text-[10px] text-gray-500">
                                        {formatFileSize(file.size)}
                                    </span>
                                </div>
                                <button
                                    onClick={() => removeFile(index)}
                                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover/file:opacity-100 transition-opacity"
                                >
                                    <FiX className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <div className={`relative flex items-end bg-[#2f2f2f] ${files.length > 0 ? 'rounded-b-2xl border-t-0' : 'rounded-2xl'} border border-white/10 focus-within:border-white/20 transition-colors shadow-lg`}>
                    {/* Attach button */}
                    <div className="flex items-center pl-3 pb-2">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={disabled || files.length >= 5}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Attach files (max 5)"
                        >
                            <FiPaperclip className="w-4 h-4" />
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept="image/jpeg,image/png,image/gif,image/webp,application/pdf,text/plain,.doc,.docx"
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                    </div>

                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onPaste={handlePaste}
                        placeholder="Message IntelliChat..."
                        disabled={disabled}
                        rows={1}
                        className="flex-1 bg-transparent text-white placeholder-gray-500 text-sm resize-none py-3.5 px-2 focus:outline-none max-h-[200px] overflow-y-auto disabled:opacity-50"
                        style={{ lineHeight: '1.6' }}
                    />

                    <div className="flex items-center px-2 pb-2">
                        <button
                            onClick={handleSend}
                            disabled={(!input.trim() && files.length === 0) || disabled}
                            className={`
                w-8 h-8 rounded-lg flex items-center justify-center transition-all
                ${(input.trim() || files.length > 0) && !disabled
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