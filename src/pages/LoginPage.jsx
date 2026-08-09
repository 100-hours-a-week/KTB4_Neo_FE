import { Navigate, useNavigate, useLocation } from "react-router-dom";
import { loginUser } from "../api/authApi";
import LoginForm from "../components/auth/LoginForm";
import { useAuth } from "../contexts/AuthContext";
import { useEffect, useState } from "react";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, login } = useAuth();

  const [navigationMessage] = useState(() =>
    location.state?.message || "",
  );

  useEffect(() => {
    if (!location.state?.message) return;

    navigate(location.pathname, {
      replace: true,
      state: null,
    });
  }, [location.pathname, location.state, navigate]);

  if (isAuthenticated) return <Navigate to="/posts" replace />;

  async function submit(credentials) {
    const data = await loginUser(credentials);
    login(data);
    navigate("/posts", { replace: true });
  }

  return (
    <main className="page-main auth-main login-main">
      <LoginForm
          onSubmit={submit}
          navigationMessage={navigationMessage}
      />
    </main>
  );
}
