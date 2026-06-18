import axios from 'axios';

const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
    timeout: 30000,
});

// Attach JWT token to every request
API.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Handle 401 globally (token expired, etc.)
API.interceptors.response.use(
    (response) => response,
    (error) => {
        // Skip redirect for login/register requests to allow error messages to show
        const isAuthRequest = error.config?.url?.includes('/auth/login') ||
            error.config?.url?.includes('/auth/register');

        if (error.response?.status === 401 && !isAuthRequest) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// ─── Auth ──────────────────────────────────────────────────────────────────────
export const registerUser = (data) => API.post('/auth/register', data);
export const loginUser = (data) => API.post('/auth/login', data);
export const getProfile = () => API.get('/auth/profile');
export const deleteAccount = () => API.delete('/auth/delete');

// ─── Chats ─────────────────────────────────────────────────────────────────────
export const createChat = (data) => API.post('/chat/create', data);
export const getAllChats = () => API.get('/chat/all');
export const getChatById = (id) => API.get(`/chat/${id}`);
export const updateChat = (id, data) => API.put(`/chat/${id}`, data);
export const deleteChat = (id) => API.delete(`/chat/${id}`);
export const deleteAllChats = () => API.delete('/chat/clear');
export const pinChat = (id, pinned) => API.put(`/chat/${id}`, { pinned });
export const archiveChat = (id, archived) => API.put(`/chat/${id}`, { archived });
export const shareChatLink = (id) => API.post(`/chat/${id}/share`);
export const getSharedChat = (token) => API.get(`/chat/share/${token}`);
export const continueSharedChat = (token) => API.post(`/chat/share/${token}/continue`);


// ─── Messages ─────────────────────────────────────────────────────────────────
export const getMessages = (chatId) => API.get(`/message/${chatId}`);

const getStreamErrorMessage = async (response, fallback) => {
    try {
        const contentType = response.headers.get('content-type') || '';

        if (contentType.includes('application/json')) {
            const data = await response.json();
            return data.message || data.detail || fallback;
        }

        const text = await response.text();
        return text || fallback;
    } catch {
        return fallback;
    }
};

// Streaming fetch for AI responses (uses native fetch for SSE)
export const sendMessageStream = async (
    chatId,
    content,
    onDelta,
    onDone,
    onError,
    files = []
) => {
    const token = localStorage.getItem('token');
    const baseURL = import.meta.env.VITE_API_URL || '/api';

    try {
        let fetchOptions;

        if (files.length > 0) {
            // Use FormData for file uploads
            const formData = new FormData();
            formData.append('chatId', chatId);
            formData.append('content', content);
            files.forEach((file) => formData.append('files', file));

            fetchOptions = {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            };
        } else {
            // Plain JSON for text-only messages
            fetchOptions = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ chatId, content }),
            };
        }

        const response = await fetch(`${baseURL}/message/send`, fetchOptions);

        if (!response.ok) {
            throw new Error(await getStreamErrorMessage(response, 'Failed to send message'));
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n\n').filter(Boolean);

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const jsonStr = line.slice(6);
                    try {
                        const parsed = JSON.parse(jsonStr);
                        if (parsed.error) {
                            onError(parsed.error);
                            return;
                        }
                        if (parsed.done) {
                            onDone(parsed);
                        } else if (parsed.delta) {
                            onDelta(parsed.delta);
                        }
                    } catch {
                        // Incomplete JSON chunk, skip
                    }
                }
            }
        }
    } catch (error) {
        onError(error.message || 'Connection error');
    }
};

// Streaming fetch for editing and re-generating (uses native fetch)
export const editMessageStream = async (
    messageId,
    content,
    onDelta,
    onDone,
    onError
) => {
    const token = localStorage.getItem('token');
    const baseURL = import.meta.env.VITE_API_URL || '/api';

    try {
        const response = await fetch(`${baseURL}/message/${messageId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ content }),
        });

        if (!response.ok) {
            throw new Error(await getStreamErrorMessage(response, 'Failed to update message'));
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n\n').filter(Boolean);

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const jsonStr = line.slice(6);
                    try {
                        const parsed = JSON.parse(jsonStr);
                        if (parsed.error) {
                            onError(parsed.error);
                            return;
                        }
                        if (parsed.done) {
                            onDone(parsed);
                        } else if (parsed.delta) {
                            onDelta(parsed.delta);
                        }
                    } catch {
                        // Incomplete JSON chunk, skip
                    }
                }
            }
        }
    } catch (error) {
        onError(error.message || 'Connection error');
    }
};

export default API;
