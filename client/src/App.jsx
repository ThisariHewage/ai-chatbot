import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import store from './components/redux/store';
import ProtectedRoute from './routes/ProtectedRoute';
import ChatPage from './pages/ChatPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import SharedChatPage from './pages/SharedChatPage';

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/share/:token" element={<SharedChatPage />} />

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<ChatPage />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#2f2f2f',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.1)',
              fontSize: '14px',
              borderRadius: '12px',
              zIndex: 9999,
            },
            success: {
              iconTheme: { primary: '#19c37d', secondary: '#fff' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#fff' },
            },
          }}
        />
      </BrowserRouter>
    </Provider>
  );
}

export default App;
