import axios from 'axios';
import httpStatus from 'http-status';
import { createContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SERVER_URL from '../environment';

// ─── Module-scoped auth state (NOT localStorage) ────────────────────────────
let accessToken = null;
let refreshPromise = null;
let activeSocket = null;

let authFailureHandler = () => {
  window.location.href = '/auth';
};

export const setAuthFailureHandler = (handler) => {
  authFailureHandler = handler;
};

export const getAccessToken = () => accessToken;

export const registerSocket = (socket) => {
  activeSocket = socket;
};

export const unregisterSocket = () => {
  activeSocket = null;
};

// ─── Singleton axios instance ────────────────────────────────────────────────
export const client = axios.create({
  baseURL: `${SERVER_URL}/api/v1`,
  withCredentials: true,
});

client.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// ─── Refresh with mutex (singleton promise) ──────────────────────────────────
export const refreshAccessToken = async () => {
  if (refreshPromise) return refreshPromise;

  refreshPromise = client
    .post('/users/refresh')
    .then((response) => {
      const newToken = response?.data?.accessToken;
      if (!newToken) throw new Error('No access token in refresh response');
      accessToken = newToken;
      return newToken;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
};

// ─── Response interceptor: 401 → refresh once → retry or force logout ───────
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (originalRequest.url === '/users/refresh' || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401) {
      originalRequest._retry = true;

      try {
        const newToken = await refreshAccessToken();
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return client(originalRequest);
      } catch (refreshError) {
        accessToken = null;
        authFailureHandler();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// ─── React context ───────────────────────────────────────────────────────────
export const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useNavigate();

  // Wire auth-failure handler to React Router navigation
  useEffect(() => {
    setAuthFailureHandler(() => {
      accessToken = null;
      setIsAuthenticated(false);
      router('/auth');
    });
  }, [router]);

  // Startup auth check — rehydrate session via refresh cookie
  useEffect(() => {
    const rehydrate = async () => {
      try {
        await refreshAccessToken();
        setIsAuthenticated(true);
      } catch {
        accessToken = null;
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };
    rehydrate();
  }, []);

  const handleRegister = async (name, username, password) => {
    const response = await client.post('/users/register', {
      name,
      username,
      password,
    });
    if (response.status === httpStatus.CREATED) {
      return response.data.message;
    }
  };

  const handleLogin = async (username, password) => {
    const response = await client.post('/users/login', {
      username,
      password,
    });
    if (response.status === httpStatus.OK) {
      accessToken = response.data.accessToken;
      setIsAuthenticated(true);
      router('/home');
    }
  };

  const getHistoryOfUser = async () => {
    const response = await client.get('/users/get_all_activity');
    return response.data;
  };

  const addToUserHistory = async (meetingCode) => {
    const response = await client.post('/users/add_to_activity', {
      meeting_code: meetingCode,
    });
    return response;
  };

  const handleLogout = async () => {
    try {
      await client.post('/users/logout');
    } catch {
      // Best-effort server-side cleanup
    } finally {
      if (activeSocket) {
        activeSocket.disconnect();
        activeSocket = null;
      }
      accessToken = null;
      setIsAuthenticated(false);
      router('/auth');
    }
  };

  const data = {
    isAuthenticated,
    isLoading,
    handleRegister,
    handleLogin,
    handleLogout,
    getHistoryOfUser,
    addToUserHistory,
  };

  return <AuthContext.Provider value={data}>{children}</AuthContext.Provider>;
};
