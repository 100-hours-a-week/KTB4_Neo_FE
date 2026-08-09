import { apiRequest } from "./client";

const commentBodyOptions = (method, commentBody) => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ commentBody }),
});

export const getComments = (postId) =>
  apiRequest(`/posts/${postId}/comments`, {
    errorMessage: "댓글을 불러오지 못했습니다.",
  });

export const createComment = (postId, body) =>
  apiRequest(`/posts/${postId}/comments`, {
    ...commentBodyOptions("POST", body),
    errorMessage: "댓글 등록에 실패했습니다.",
  });

export const createReply = (commentId, body) =>
  apiRequest(`/comments/${commentId}/replies`, {
    ...commentBodyOptions("POST", body),
    errorMessage: "대댓글 등록에 실패했습니다.",
  });

export const updateComment = (commentId, body) =>
  apiRequest(`/comments/${commentId}`, {
    ...commentBodyOptions("PATCH", body),
    errorMessage: "댓글 수정에 실패했습니다.",
  });

export const deleteComment = (commentId) =>
  apiRequest(`/comments/${commentId}`, {
    method: "DELETE",
    errorMessage: "댓글 삭제에 실패했습니다.",
  });
