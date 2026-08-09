const API_BASE_URL = "http://localhost:8080";
const DEFAULT_PROFILE_IMAGE = "./assets/images/default-profile.svg";
const DEFAULT_POST_IMAGE = "./assets/images/default-post.svg";

function getAccessToken() {
  return localStorage.getItem("accessToken");
}

function clearAuthStorage() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("userId");
  localStorage.removeItem("loginUserId");
}

function redirectToLogin() {
  if (!window.location.pathname.endsWith("/login.html")) {
    window.location.href = "./login.html";
  }
}

async function refreshAccessToken() {
  const response = await fetch(`${API_BASE_URL}/users/refresh`, {
    method: "POST",
    credentials: "include",
  });

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    clearAuthStorage();

    const message = result?.message;

    if (message === "refresh_token_expired") {
      alert("로그인 시간이 만료되었습니다. 다시 로그인해주세요.");
    }

    redirectToLogin();
    throw new Error(message || "unauthorized_user");
  }

  const newAccessToken = result.data?.accessToken || result.accessToken;
  localStorage.setItem("accessToken", newAccessToken);

  return newAccessToken;
}

function getLoginUserId() {
  return localStorage.getItem("userId") || localStorage.getItem("loginUserId");
}

function requireLogin() {
  const accessToken = getAccessToken();

  if (!accessToken) {
    window.location.href = "./login.html";
    throw new Error("unauthorized_user");
  }

  return accessToken;
}

function resolveImageUrl(imageUrl, fallbackUrl = "") {
  if (!imageUrl) return fallbackUrl;
  if (/^(https?:|data:|blob:)/.test(imageUrl)) return imageUrl;
  if (imageUrl.startsWith("./") || imageUrl.startsWith("../")) return imageUrl;
  if (imageUrl.startsWith("/")) return `${API_BASE_URL}${imageUrl}`;
  return `${API_BASE_URL}/${imageUrl}`;
}

function buildApiUrl(path) {
  if (/^https?:\/\//.test(path)) return path;
  if (path.startsWith("/")) return `${API_BASE_URL}${path}`;
  return `${API_BASE_URL}/${path}`;
}

async function uploadImageFile(file) {
  if (!file) return "";

  const formData = new FormData();
  formData.append("image", file);

  const image = await apiRequest("/uploads/images", {
    method: "POST",
    body: formData,
    errorMessage: "이미지 업로드에 실패했습니다.",
  });

  return image.imageUrl;
}

async function authFetch(url, options = {}) {
  const accessToken = getAccessToken();

  let response = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.headers || {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  });

  if (response.status !== 401) {
    return response;
  }

  const newAccessToken = await refreshAccessToken();

  return fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${newAccessToken}`,
    },
  });
}

async function apiRequest(path, options = {}) {
  const {
    auth = true,
    errorMessage = "요청에 실패했습니다.",
    ...fetchOptions
  } = options;

  const requestUrl = buildApiUrl(path);
  const response = auth
    ? await authFetch(requestUrl, fetchOptions)
    : await fetch(requestUrl, {
        ...fetchOptions,
        credentials: "include",
      });
  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(result?.message || errorMessage);
  }

  return result?.data ?? result;
}
