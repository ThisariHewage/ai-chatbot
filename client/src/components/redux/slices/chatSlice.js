import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
    getAllChats,
    createChat,
    deleteChat,
    updateChat,
    deleteAllChats,
} from '../../../services/api';
import toast from 'react-hot-toast';

// ─── Async Thunks ─────────────────────────────────────────────────────────────
export const fetchChats = createAsyncThunk(
    'chat/fetchAll',
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await getAllChats();
            return data.chats;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to load chats');
        }
    }
);

export const newChat = createAsyncThunk(
    'chat/create',
    async (title = 'New Chat', { rejectWithValue }) => {
        try {
            const { data } = await createChat({ title });
            return data.chat;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to create chat');
        }
    }
);

export const removeChat = createAsyncThunk(
    'chat/delete',
    async (chatId, { rejectWithValue }) => {
        try {
            await deleteChat(chatId);
            return chatId;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to delete chat');
        }
    }
);

export const renameChat = createAsyncThunk(
    'chat/rename',
    async ({ chatId, title }, { rejectWithValue }) => {
        try {
            const { data } = await updateChat(chatId, { title });
            return data.chat;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to rename chat');
        }
    }
);

export const clearAllChats = createAsyncThunk(
    'chat/clearAll',
    async (_, { rejectWithValue }) => {
        try {
            await deleteAllChats();
            return true;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to clear chats');
        }
    }
);

// ─── Slice ────────────────────────────────────────────────────────────────────
const chatSlice = createSlice({
    name: 'chat',
    initialState: {
        chats: [],
        activeChatId: null,
        loading: false,
        error: null,
        searchQuery: '',
    },
    reducers: {
        setActiveChatId: (state, action) => {
            state.activeChatId = action.payload;
        },
        setSearchQuery: (state, action) => {
            state.searchQuery = action.payload;
        },
        updateChatTitle: (state, action) => {
            const { chatId, title } = action.payload;
            const chat = state.chats.find((c) => c._id === chatId);
            if (chat) chat.title = title;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchChats.pending, (state) => { state.loading = true; })
            .addCase(fetchChats.fulfilled, (state, action) => {
                state.loading = false;
                state.chats = action.payload;
            })
            .addCase(fetchChats.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });

        builder
            .addCase(newChat.fulfilled, (state, action) => {
                state.chats.unshift(action.payload);
                state.activeChatId = action.payload._id;
            })
            .addCase(newChat.rejected, (_, action) => {
                toast.error(action.payload);
            });

        builder
            .addCase(removeChat.fulfilled, (state, action) => {
                state.chats = state.chats.filter((c) => c._id !== action.payload);
                if (state.activeChatId === action.payload) {
                    state.activeChatId = state.chats[0]?._id || null;
                }
                toast.success('Chat deleted');
            })
            .addCase(removeChat.rejected, (_, action) => {
                toast.error(action.payload);
            });

        builder
            .addCase(renameChat.fulfilled, (state, action) => {
                const idx = state.chats.findIndex((c) => c._id === action.payload._id);
                if (idx !== -1) state.chats[idx] = action.payload;
                toast.success('Chat renamed');
            })
            .addCase(renameChat.rejected, (_, action) => {
                toast.error(action.payload);
            });

        builder
            .addCase(clearAllChats.fulfilled, (state) => {
                state.chats = [];
                state.activeChatId = null;
                toast.success('All chats cleared');
            })
            .addCase(clearAllChats.rejected, (_, action) => {
                toast.error(action.payload);
            });
    },
});

export const { setActiveChatId, setSearchQuery, updateChatTitle } = chatSlice.actions;
export default chatSlice.reducer;