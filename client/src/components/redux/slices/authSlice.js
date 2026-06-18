import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { registerUser, loginUser, getProfile } from '../../../services/api';
import toast from 'react-hot-toast';

// ─── Async Thunks ─────────────────────────────────────────────────────────────
export const register = createAsyncThunk(
    'auth/register',
    async (userData, { rejectWithValue }) => {
        try {
            const { data } = await registerUser(userData);
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            return data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || 'Registration failed'
            );
        }
    }
);

export const login = createAsyncThunk(
    'auth/login',
    async (userData, { rejectWithValue }) => {
        try {
            const { data } = await loginUser(userData);
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            return data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || 'Login failed'
            );
        }
    }
);

export const fetchProfile = createAsyncThunk(
    'auth/fetchProfile',
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await getProfile();
            return data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || 'Failed to fetch profile'
            );
        }
    }
);

// ─── Initial State ────────────────────────────────────────────────────────────
const storedUser = localStorage.getItem('user');
const storedToken = localStorage.getItem('token');

const initialState = {
    user: storedUser ? JSON.parse(storedUser) : null,
    token: storedToken || null,
    isAuthenticated: !!storedToken,
    loading: false,
    error: null,
};

// ─── Slice ────────────────────────────────────────────────────────────────────
const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        logout: (state) => {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            toast.success('Logged out successfully');
        },
        clearError: (state) => {
            state.error = null;
        },
        updateUser: (state, action) => {
            state.user = { ...state.user, ...action.payload };
            localStorage.setItem('user', JSON.stringify(state.user));
        },
    },
    extraReducers: (builder) => {
        // Register
        builder
            .addCase(register.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(register.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload.user;
                state.token = action.payload.token;
                state.isAuthenticated = true;
            })
            .addCase(register.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });

        // Login
        builder
            .addCase(login.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(login.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload.user;
                state.token = action.payload.token;
                state.isAuthenticated = true;
            })
            .addCase(login.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });

        // Profile
        builder
            .addCase(fetchProfile.fulfilled, (state, action) => {
                state.user = action.payload.user;
                localStorage.setItem('user', JSON.stringify(action.payload.user));
            });
    },
});

export const { logout, clearError, updateUser } = authSlice.actions;
export default authSlice.reducer;