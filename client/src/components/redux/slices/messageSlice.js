import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getMessages } from '../../../services/api';

export const fetchMessages = createAsyncThunk(
    'message/fetchAll',
    async (chatId, { rejectWithValue }) => {
        try {
            const { data } = await getMessages(chatId);
            return { chatId, messages: data.messages };
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to load messages');
        }
    }
);

const messageSlice = createSlice({
    name: 'message',
    initialState: {
        // Keyed by chatId for cache
        messagesByChat: {},
        loading: false,
        streamingContent: '',
        isStreaming: false,
        error: null,
    },
    reducers: {
        startStreaming: (state) => {
            state.isStreaming = true;
            state.streamingContent = '';
        },
        appendStreamDelta: (state, action) => {
            state.streamingContent += action.payload;
            state.isStreaming = true;
        },
        finalizeStream: (state, action) => {
            const { chatId, userMessage, assistantMessage } = action.payload;
            if (!state.messagesByChat[chatId]) {
                state.messagesByChat[chatId] = [];
            }
            // Remove optimistic user message, add both confirmed messages
            state.messagesByChat[chatId] = state.messagesByChat[chatId].filter(
                (m) => !m._optimistic
            );
            state.messagesByChat[chatId].push(userMessage, assistantMessage);
            state.streamingContent = '';
            state.isStreaming = false;
        },
        addOptimisticMessage: (state, action) => {
            const { chatId, message } = action.payload;
            if (!state.messagesByChat[chatId]) {
                state.messagesByChat[chatId] = [];
            }
            state.messagesByChat[chatId].push({ ...message, _optimistic: true });
        },
        setStreamError: (state) => {
            state.isStreaming = false;
            state.streamingContent = '';
        },
        clearMessages: (state, action) => {
            delete state.messagesByChat[action.payload];
        },
        clearAllMessages: (state) => {
            state.messagesByChat = {};
        },
        removeMessagesAfter: (state, action) => {
            const { chatId, messageId } = action.payload;
            const messages = state.messagesByChat[chatId];
            if (!messages) return;

            const index = messages.findIndex((m) => m._id === messageId);
            if (index !== -1) {
                state.messagesByChat[chatId] = messages.slice(0, index + 1);
            }
        },
        updateMessageInChat: (state, action) => {
            const { chatId, messageId, content } = action.payload;
            const messages = state.messagesByChat[chatId];
            if (!messages) return;

            const message = messages.find((m) => m._id === messageId);
            if (message) {
                message.content = content;
            }
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchMessages.pending, (state) => { state.loading = true; })
            .addCase(fetchMessages.fulfilled, (state, action) => {
                state.loading = false;
                state.messagesByChat[action.payload.chatId] = action.payload.messages;
            })
            .addCase(fetchMessages.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const {
    startStreaming,
    appendStreamDelta,
    finalizeStream,
    addOptimisticMessage,
    setStreamError,
    clearMessages,
    clearAllMessages,
    removeMessagesAfter,
    updateMessageInChat,
} = messageSlice.actions;

export default messageSlice.reducer;