import { apiRequest } from "./client";

function jsonOptions(method, body) {
  return {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

export function loginUser(credentials) {
  return apiRequest("/users/login", {
    auth: false,
    ...jsonOptions("POST", credentials),
    errorMessage: "입력하신 회원정보를 찾을 수 없습니다.",
  });
}

export function signupUser(user) {
  return apiRequest("/users/signup", {
    auth: false,
    ...jsonOptions("POST", user),
    errorMessage: "회원가입에 실패했습니다.",
  });
}

export function logoutUser() {
  return apiRequest("/users/logout", {
    method: "POST",
    errorMessage: "로그아웃에 실패했습니다.",
  });
}
