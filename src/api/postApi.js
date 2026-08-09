import { apiRequest } from "./client";

export const getPosts = (page = 0, size = 10) => {
  const searchParams = new URLSearchParams({
    page: String(page),
    size: String(size),
  });

  return apiRequest(`/posts?${searchParams}`, {
    errorMessage: "게시글을 불러오는 중 오류가 발생했습니다.",
  });
};

export const getPost = (postId) =>
  apiRequest(`/posts/${postId}`, {
    errorMessage: "게시글 정보를 불러오지 못했습니다.",
  });

function writePost(path, method, data, errorMessage) {
  return apiRequest(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    errorMessage,
  });
}

export const updatePost = (postId, data) =>
  writePost(
    `/posts/${postId}`,
    "PUT",
    data,
    "게시글 수정에 실패했습니다.",
  );

export const deletePost = (postId) =>
  apiRequest(`/posts/${postId}`, {
    method: "DELETE",
    errorMessage: "게시글 삭제에 실패했습니다.",
  });

export const togglePostLike = (postId, liked) =>
  apiRequest(`/posts/${postId}/likes`, {
    method: liked ? "DELETE" : "POST",
    errorMessage: "좋아요 처리에 실패했습니다.",
  });
