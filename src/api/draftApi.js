import { apiRequest } from "./client";

function writeDraft(path, method, snapshot, errorMessage) {
  return apiRequest(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(snapshot),
    errorMessage,
  });
}

export const getActiveDraft = () =>
  apiRequest("/posts/drafts/active", {
    errorMessage: "임시글을 불러오지 못했습니다.",
  });

export const createDraft = (snapshot) =>
  writeDraft(
    "/posts/drafts",
    "POST",
    snapshot,
    "임시글을 생성하지 못했습니다.",
  );

export const autosaveDraft = (draftId, snapshot) =>
  writeDraft(
    `/posts/drafts/${draftId}/autosave`,
    "PUT",
    snapshot,
    "임시글을 자동 저장하지 못했습니다.",
  );

export const saveDraft = (draftId, snapshot) =>
  writeDraft(
    `/posts/drafts/${draftId}`,
    "PUT",
    snapshot,
    "임시글을 저장하지 못했습니다.",
  );

export const publishDraft = (draftId, snapshot) =>
  writeDraft(
    `/posts/drafts/${draftId}/publish`,
    "POST",
    snapshot,
    "게시글을 발행하지 못했습니다.",
  );

export const deleteDraft = (draftId) =>
  apiRequest(`/posts/drafts/${draftId}`, {
    method: "DELETE",
    errorMessage: "임시글을 삭제하지 못했습니다.",
  });
