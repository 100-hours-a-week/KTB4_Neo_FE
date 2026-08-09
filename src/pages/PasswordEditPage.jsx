import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { updatePassword } from "../api/userApi";
import Header from "../components/common/Header";
import Toast from "../components/common/Toast";
import PasswordEditForm from "../components/user/PasswordEditForm";
import { useAuth } from "../contexts/AuthContext";

export default function PasswordEditPage() {
  const navigate = useNavigate();
  const { userId, clearLoginState } = useAuth();
  const [toast, setToast] = useState("");

  async function submit(passwords) {
    await updatePassword(userId, passwords);
    setToast("수정 완료");
  }

  const finish = useCallback(() => {
    clearLoginState();
    navigate("/login", { replace: true });
  }, [clearLoginState, navigate]);

  return (
    <>
      <Header />
      <main className="page-main password-main">
        <PasswordEditForm onSubmit={submit} />
      </main>
      <Toast message={toast} onClose={finish} />
    </>
  );
}
