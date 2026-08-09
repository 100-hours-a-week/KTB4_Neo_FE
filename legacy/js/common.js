function isValidEmail(email) {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email);
}

function isValidPassword(password) {
  const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,20}$/;
  return passwordPattern.test(password);
}

function formatCount(count) {
  if (!count) return "0";
  if (count >= 1000) return `${Math.floor(count / 1000)}k`;
  return String(count);
}

function formatRelativeTime(dateTime) {
  if (!dateTime) return "";

  const createdAt = new Date(dateTime);
  const diffMinutes = Math.max(0, Math.floor((Date.now() - createdAt.getTime()) / 60000));

  if (diffMinutes < 1) return "방금";
  if (diffMinutes < 60) return `${diffMinutes}분 전`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}시간 전`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}일 전`;

  const year = createdAt.getFullYear();
  const month = String(createdAt.getMonth() + 1).padStart(2, "0");
  const date = String(createdAt.getDate()).padStart(2, "0");
  const hours = String(createdAt.getHours()).padStart(2, "0");
  const minutes = String(createdAt.getMinutes()).padStart(2, "0");
  const seconds = String(createdAt.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${date} ${hours}:${minutes}:${seconds}`;
}

function clearLoginStorage() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("userId");
  localStorage.removeItem("loginUserId");
}

function setObjectUrlPreview(file, applyPreview) {
  const objectUrl = URL.createObjectURL(file);
  const previewImage = new Image();
  let revoked = false;

  function revokePreviewUrl() {
    if (revoked) return;
    URL.revokeObjectURL(objectUrl);
    revoked = true;
  }

  previewImage.addEventListener("load", () => revokePreviewUrl(), { once: true });
  previewImage.addEventListener("error", () => revokePreviewUrl(), { once: true });
  previewImage.src = objectUrl;
  applyPreview(objectUrl);

  return revokePreviewUrl;
}

document.addEventListener("DOMContentLoaded", () => {
  const profileMenu = document.querySelector(".profile-menu");
  const profileLink = document.querySelector(".profile-link");
  const headerProfileImage = document.querySelector("#header-profile-image");
  const logoutButton = document.querySelector("#logout-button");
  const backButton = document.querySelector(".back-button");

  async function loadHeaderProfileImage() {
    if (!headerProfileImage || !getAccessToken() || !getLoginUserId()) return;

    try {
      const user = await apiRequest(`/users/${getLoginUserId()}`, {
        errorMessage: "프로필 이미지를 불러오지 못했습니다.",
      });

      headerProfileImage.src = resolveImageUrl(user.profileImage, DEFAULT_PROFILE_IMAGE);
    } catch (error) {
      console.warn("header profile image request failed:", error.message);
    }
  }

  if (profileMenu && profileLink) {
    profileLink.addEventListener("click", (event) => {
      event.preventDefault();

      const isOpen = profileMenu.classList.toggle("is-open");
      profileLink.setAttribute("aria-expanded", String(isOpen));
    });

    document.addEventListener("click", (event) => {
      if (profileMenu.contains(event.target)) return;

      profileMenu.classList.remove("is-open");
      profileLink.setAttribute("aria-expanded", "false");
    });
  }

  if (backButton) {
    backButton.addEventListener("click", () => {
      const fallbackHref = backButton.dataset.backFallback || "./post-list.html";

      if (history.length > 1) {
        history.back();
        return;
      }

      window.location.href = fallbackHref;
    });
  }

  if (logoutButton) {
    logoutButton.addEventListener("click", async (event) => {
      event.preventDefault();

      const confirmed = confirm("로그아웃 하시겠습니까?");
      if (!confirmed) return;

      try {
        await apiRequest("/users/logout", {
          method: "POST",
          errorMessage: "로그아웃에 실패했습니다.",
        });
      } catch (error) {
        console.warn("logout request failed:", error.message);
      } finally {
        clearLoginStorage();
        window.location.href = "./login.html";
      }
    });
  }

  loadHeaderProfileImage();
});
