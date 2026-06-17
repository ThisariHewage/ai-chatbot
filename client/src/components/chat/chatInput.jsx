import { useState, useRef, useEffect, useCallback } from 'react';
import { FiSend, FiStopCircle, FiPaperclip, FiX, FiFile, FiMic } from 'react-icons/fi';
import toast from 'react-hot-toast';

const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'audio/webm',
    'audio/mpeg',
    'audio/mp4',
    'audio/ogg',
    'audio/wav',
    'audio/x-wav',
];

const ChatInput = ({ onSend, disabled, isStreaming }) => {
    const [input, setInput] = useState('');
    const [files, setFiles] = useState([]);
    const [isRecording, setIsRecording] = useState(false);
    const textareaRef = useRef(null);
    const fileInputRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const recordingChunksRef = useRef([]);
    const recordingStreamRef = useRef(null);

    const stopRecordingStream = useCallback(() => {
        recordingStreamRef.current?.getTracks().forEach((track) => track.stop());
        recordingStreamRef.current = null;
    }, []);

    const formatFileSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const addFiles = useCallback((incomingFiles) => {
        if (incomingFiles.length === 0) return;

        setFiles((prev) => {
            const availableSlots = MAX_FILES - prev.length;
            if (availableSlots <= 0) {
                toast.error(`You can attach up to ${MAX_FILES} files.`);
                return prev;
            }

            const accepted = [];
            const rejected = [];

            for (const file of incomingFiles) {
                if (!ACCEPTED_TYPES.includes(file.type)) {
                    rejected.push(`${file.name}: unsupported file type`);
                } else if (file.size > MAX_FILE_SIZE) {
                    rejected.push(`${file.name}: max ${formatFileSize(MAX_FILE_SIZE)}`);
                } else {
                    accepted.push(file);
                }
            }

            if (rejected.length > 0) {
                toast.error(rejected[0]);
            }

            if (accepted.length > availableSlots) {
                toast.error(`Only ${availableSlots} more file${availableSlots === 1 ? '' : 's'} can be attached.`);
            }

            return [...prev, ...accepted.slice(0, availableSlots)];
        });
    }, []);

    // Auto-resize textarea
    useEffect(() => {
        const ta = textareaRef.current;
        if (!ta) return;
        ta.style.height = 'auto';
        ta.style.height = Math.min(ta.scrollHeight, 200) + 'px';
    }, [input]);

    useEffect(() => {
        return () => {
            if (mediaRecorderRef.current?.state === 'recording') {
                mediaRecorderRef.current.stop();
            }
            stopRecordingStream();
        };
    }, [stopRecordingStream]);

    const handleSend = () => {
        const trimmed = input.trim();
        if ((!trimmed && files.length === 0) || disabled) return;
        const hasAudio = files.some((file) => file.type.startsWith('audio/'));
        onSend(trimmed || (hasAudio ? '(voice message)' : '(attached files)'), files);
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
            addFiles(pastedFiles);
        }
    };

    const handleFileSelect = (e) => {
        const selected = Array.from(e.target.files);
        if (selected.length === 0) return;
        addFiles(selected);
        e.target.value = '';
    };

    const removeFile = (index) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const startRecording = async () => {
        if (disabled || isRecording || files.length >= MAX_FILES) return;

        if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            recordingChunksRef.current = [];
            recordingStreamRef.current = stream;

            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    recordingChunksRef.current.push(event.data);
                }
            };

            recorder.onstop = () => {
                const blob = new Blob(recordingChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
                recordingChunksRef.current = [];
                stopRecordingStream();

                if (blob.size === 0) return;

                const extension = blob.type.includes('ogg') ? 'ogg' : 'webm';
                const file = new File([blob], `voice-message-${Date.now()}.${extension}`, {
                    type: blob.type || 'audio/webm',
                });

                addFiles([file]);
            };

            mediaRecorderRef.current = recorder;
            recorder.start();
            setIsRecording(true);
        } catch {
            stopRecordingStream();
            setIsRecording(false);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current?.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
        setIsRecording(false);
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
                                ) : file.type.startsWith('audio/') ? (
                                    <div className="w-10 h-10 rounded bg-red-500/20 flex items-center justify-center">
                                        <FiMic className="w-5 h-5 text-red-300" />
                                    </div>
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
                            disabled={disabled || files.length >= MAX_FILES}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            title={`Attach files (max ${MAX_FILES}, ${formatFileSize(MAX_FILE_SIZE)} each)`}
                        >
                            <FiPaperclip className="w-4 h-4" />
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept="image/jpeg,image/png,image/gif,image/webp,application/pdf,text/plain,.doc,.docx,audio/webm,audio/mpeg,audio/mp4,audio/ogg,audio/wav"
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
                            onClick={isRecording ? stopRecording : startRecording}
                            disabled={disabled || files.length >= MAX_FILES}
                            className={`mr-1 w-8 h-8 rounded-lg flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed ${isRecording
                                ? 'bg-red-500 text-white hover:bg-red-600'
                                : 'text-gray-400 hover:text-white hover:bg-white/10'
                                }`}
                            title={isRecording ? 'Stop recording' : 'Record voice message'}
                        >
                            {isRecording ? (
                                <FiStopCircle className="w-4 h-4" />
                            ) : (
                                <FiMic className="w-4 h-4" />
                            )}
                        </button>
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
