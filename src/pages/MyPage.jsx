import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { deleteUser, getUser, updateUser } from "../api/userApi";
import ConfirmModal from "../components/common/ConfirmModal";
import Header from "../components/common/Header";
import Toast from "../components/common/Toast";
import ProfileEditForm from "../components/user/ProfileEditForm";
import { useAuth } from "../contexts/AuthContext";

export default function MyPage() {
  const navigate = useNavigate();
  const { userId, clearLoginState, refreshCurrentUser } = useAuth();
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isUpdateComplete, setIsUpdateComplete] = useState(false);
  const [toast, setToast] = useState(null);
  const withdrawPendingRef = useRef(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    let cancelled = false;
    getUser(userId)
      .then((data) => {
        if (!cancelled) setUser(data);
      })
      .catch((requestError) => {
        if (!cancelled) setError(`* ${requestError.message}`);
      });
    return () => {
      cancelled = true;
      mountedRef.current = false;
    };
  }, [userId]);

  const closeToast = useCallback(() => setToast(null), []);

  async function submit(profile) {
    await updateUser(userId, profile);

    const updatedUser = await refreshCurrentUser();
    if (!mountedRef.current) return;

    setUser(updatedUser);
    setError("");
    setToast({ message: "회원 정보가 수정되었습니다." });

    setIsUpdateComplete(true);
  }

  async function withdraw() {
    if (withdrawPendingRef.current) return;
    withdrawPendingRef.current = true;
    setIsWithdrawing(true);
    try {
      await deleteUser(userId);
      clearLoginState();
      navigate("/login", { replace: true });
    } catch (requestError) {
      if (mountedRef.current) {
        setError(`* ${requestError.message}`);
        setIsWithdrawOpen(false);
      }
    } finally {
      withdrawPendingRef.current = false;
      if (mountedRef.current) setIsWithdrawing(false);
    }
  }

  return (
    <>
      <Header />
      <main className="page-main mypage-main">
        {error && <p className="helper-text">{error}</p>}
        {!error && !user && (
          <p className="helper-text">* 회원 정보를 불러오는 중입니다.</p>
        )}
        {user && (
          <ProfileEditForm
            key={user.userId}
            user={user}
            onSubmit={submit}
            onSubmitError={() =>
              setToast({
                message: "회원 정보 수정에 실패했습니다.",
                type: "error",
              })
            }
            onWithdraw={() => setIsWithdrawOpen(true)}
            isUpdateComplete={isUpdateComplete}
            onComplete={() => navigate("/posts")}
          />
        )}
      </main>
      <Toast
        message={toast?.message}
        type={toast?.type}
        onClose={closeToast}
      />
      <ConfirmModal
        isOpen={isWithdrawOpen}
        title="회원탈퇴 하시겠습니까?"
        message="확인을 누르면 계정이 삭제됩니다."
        onCancel={() => setIsWithdrawOpen(false)}
        onConfirm={withdraw}
        isConfirming={isWithdrawing}
        confirmLabel="탈퇴"
      />
    </>
  );
}
