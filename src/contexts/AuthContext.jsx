/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { logoutUser } from "../api/authApi";
import {
  clearAuth,
  getAccessToken,
  getLoginUserId,
  saveAuth,
  setAccessTokenRefreshHandler,
  setUnauthorizedHandler,
} from "../api/client";
import { getUser } from "../api/userApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [auth, setAuth] = useState(() => ({
    accessToken: getAccessToken(),
    userId: getLoginUserId(),
  }));
  const [currentUser, setCurrentUser] = useState(null);

  const clearLoginState = useCallback(() => {
    clearAuth();
    setAuth({ accessToken: null, userId: null });
    setCurrentUser(null);
  }, []);

  const login = useCallback(({ accessToken, userId }) => {
    saveAuth({ accessToken, userId });
    setAuth({ accessToken, userId: String(userId) });
  }, []);

  const refreshCurrentUser = useCallback(async () => {
    if (!auth.userId || !auth.accessToken) return null;
    const user = await getUser(auth.userId);
    setCurrentUser(user);
    return user;
  }, [auth.accessToken, auth.userId]);

  const handleUnauthorized = useCallback(() => {
    clearLoginState();
    navigate("/login", {
      replace: true,
      state: { message: "로그인 시간이 만료되었습니다." },
    });
  }, [clearLoginState, navigate]);

  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.warn("logout request failed:", error.message);
    } finally {
      clearLoginState();
      navigate("/login", { replace: true });
    }
  }, [clearLoginState, navigate]);

  useEffect(() => {
    setUnauthorizedHandler(handleUnauthorized);
    return () => setUnauthorizedHandler(null);
  }, [handleUnauthorized]);

  useEffect(() => {
    function handleAccessTokenRefresh(accessToken) {
      setAuth((current) => ({
        ...current,
        accessToken,
      }));
    }

    setAccessTokenRefreshHandler(handleAccessTokenRefresh);

    return () => {
      setAccessTokenRefreshHandler(null);
    };
  }, []);

  useEffect(() => {
    if (!auth.accessToken || !auth.userId) {
      setCurrentUser(null);
      return undefined;
    }

    let cancelled = false;
    getUser(auth.userId)
      .then((user) => {
        if (!cancelled) setCurrentUser(user);
      })
      .catch((error) => {
        if (!cancelled) {
          console.warn("current user request failed:", error.message);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [auth.accessToken, auth.userId]);

  const value = useMemo(
    () => ({
      accessToken: auth.accessToken,
      userId: auth.userId,
      currentUser,
      isAuthenticated: Boolean(auth.accessToken),
      login,
      logout,
      clearLoginState,
      refreshCurrentUser,
      setCurrentUser,
    }),
    [
      auth,
      currentUser,
      login,
      logout,
      clearLoginState,
      refreshCurrentUser,
    ],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }
  return context;
}
