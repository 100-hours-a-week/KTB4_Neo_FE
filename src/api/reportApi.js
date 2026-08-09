import { apiRequest } from "./client";

export const getReportTypes = () =>
  apiRequest("/reports/types", {
    errorMessage: "신고 유형을 불러오지 못했습니다.",
  });

export const reportPost = (postId, data) =>
  apiRequest(`/posts/${postId}/reports`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    errorMessage: "신고 접수에 실패했습니다.",
  });
