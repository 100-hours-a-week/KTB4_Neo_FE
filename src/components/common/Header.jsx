import { useNavigate } from "react-router-dom";
import defaultProfileImage from "../../assets/images/default-profile.svg";
import { useAuth } from "../../contexts/AuthContext";
import { resolveImageUrl } from "../../utils/image";
import ProfileMenu from "./ProfileMenu";

export default function Header({
  showBackButton = false,
  backTo = "/posts",
  hideProfile = false,
}) {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const profileImage = resolveImageUrl(
    currentUser?.profileImage,
    defaultProfileImage,
  );

  function handleBack() {
    if (window.history.length > 1) navigate(-1);
    else navigate(backTo);
  }

  return (
    <header className="page-header">
      <div className="header-inner">
        <div className="header-left">
          {showBackButton && (
            <button
              className="back-button"
              type="button"
              aria-label="뒤로 가기"
              onClick={handleBack}
            />
          )}
        </div>
        <h1 className="service-title">취업 시장에서 살아남기</h1>
        <div className="header-right">
          {!hideProfile && <ProfileMenu profileImage={profileImage} />}
        </div>
      </div>
    </header>
  );
}
