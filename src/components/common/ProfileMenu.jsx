import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export default function ProfileMenu({ profileImage }) {
  const { logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const closeOutside = (event) => {
      if (!menuRef.current?.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener("click", closeOutside);
    return () => document.removeEventListener("click", closeOutside);
  }, []);

  async function handleLogout() {
    if (!window.confirm("로그아웃 하시겠습니까?")) return;
    await logout();
  }

  return (
    <div
      ref={menuRef}
      className={`profile-menu ${isOpen ? "is-open" : ""}`}
    >
      <button
        className="profile-link profile-link-button"
        type="button"
        aria-label="프로필 메뉴 열기"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        <img
          id="header-profile-image"
          src={profileImage}
          alt="로그인 사용자 프로필"
        />
      </button>
      <nav className="profile-dropdown" aria-label="프로필 메뉴">
        <Link to="/mypage" onClick={() => setIsOpen(false)}>
          회원정보수정
        </Link>
        <Link to="/mypage/password" onClick={() => setIsOpen(false)}>
          비밀번호수정
        </Link>
        <button type="button" onClick={handleLogout}>
          로그아웃
        </button>
      </nav>
    </div>
  );
}
