import { apiRequest } from "./client";

export const getUser = (userId) =>
  apiRequest(`/users/${userId}`, {
    errorMessage: "회원 정보를 불러오지 못했습니다.",
  });

export const updateUser = (userId, data) =>
  apiRequest(`/users/${userId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    errorMessage: "회원 정보 수정에 실패했습니다.",
  });

export const deleteUser = (userId) =>
  apiRequest(`/users/${userId}`, {
    method: "DELETE",
    errorMessage: "회원 탈퇴에 실패했습니다.",
  });

export const updatePassword = (userId, data) =>
  apiRequest(`/users/${userId}/password`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    errorMessage: "비밀번호 수정에 실패했습니다.",
  });
  