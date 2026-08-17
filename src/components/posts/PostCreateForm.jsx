import { useEffect, useMemo, useState } from "react";
import { uploadPostImage } from "../../api/uploadApi";
import { DRAFT_SAVE_STATUS, useDraftEditor } from "../../hooks/useDraftEditor";
import ConfirmModal from "../common/ConfirmModal";
import Toast from "../common/Toast";
import DraftSaveStatus from "./DraftSaveStatus";
import PostForm from "./PostForm";

const ERROR_MESSAGES = {
  draft_version_conflict:
    "서버에 더 최신 임시글이 있습니다. 서버 내용을 확인해주세요.",
  draft_content_conflict:
    "같은 버전의 임시글 내용이 서로 다릅니다. 다른 화면의 편집 내용을 확인해주세요.",
  draft_already_published: "이미 발행된 임시글입니다.",
  draft_not_found: "임시글을 찾을 수 없습니다.",
  draft_empty_content: "빈 내용은 임시 저장할 수 없습니다.",
  too_many_requests: "잠시 후 다시 시도해주세요.",
  unauthorized_user: "로그인이 필요합니다.",
  invalid_input: "입력 내용을 확인해주세요.",
};

function messageFor(error, fallback) {
  return ERROR_MESSAGES[error?.code] || error?.message || fallback;
}

export default function PostCreateForm({ onPublished, onDeleted }) {
  const draft = useDraftEditor();
  const [toast, setToast] = useState({ message: "", type: "success" });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);

  useEffect(() => {
    if (draft.status === DRAFT_SAVE_STATUS.CONFLICT) {
      setIsConflictModalOpen(true);
    }
  }, [draft.status]);

  const initialValues = useMemo(
    () => ({
      ...draft.formValues,
      previewUrl: "",
      fileName: "",
      isUploading: false,
      imageError: "",
      upload: uploadPostImage,
    }),
    [draft.formValues],
  );

  async function publish() {
    try {
      const post = await draft.publish();
      if (post?.postId) onPublished(post.postId);
    } catch (error) {
      const message = messageFor(error, "게시글 발행에 실패했습니다.");
      setToast({ message, type: "error" });
      throw new Error(message);
    }
  }

  async function saveNow() {
    try {
      await draft.saveNow();
      setToast({
        message: "임시글 저장이 완료되었습니다.",
        type: "success",
      });
    } catch (error) {
      setToast({
        message: messageFor(error, "임시글 저장에 실패했습니다."),
        type: "error",
      });
    }
  }

  async function discardPending() {
    try {
      await draft.discardPendingDraft();
      setToast({
        message:
          "임시 저장 게시글을 삭제합니다. 새 게시글을 작성합니다.",
        type: "success",
      });
    } catch (error) {
      setToast({
        message: messageFor(error, "임시글 삭제에 실패했습니다."),
        type: "error",
      });
    }
  }

  async function removeDraft() {
    try {
      await draft.remove();
      setIsDeleteModalOpen(false);
      onDeleted();
    } catch (error) {
      setToast({
        message: messageFor(error, "임시글 삭제에 실패했습니다."),
        type: "error",
      });
    }
  }

  async function loadServerDraft() {
    try {
      await draft.reloadServerDraft();
      setIsConflictModalOpen(false);
    } catch (error) {
      setToast({
        message: messageFor(error, "서버 임시글을 불러오지 못했습니다."),
        type: "error",
      });
    }
  }

  async function keepCurrentContent() {
    try {
      const response = await draft.resolveConflictWithLocal();
      if (response) {
        setIsConflictModalOpen(false);
      } else {
        setToast({
          message: "현재 내용을 다시 저장하지 못했습니다.",
          type: "error",
        });
      }
    } catch (error) {
      setToast({
        message: messageFor(error, "현재 내용을 다시 저장하지 못했습니다."),
        type: "error",
      });
    }
  }

  return (
    <>
      <PostForm
        initialValues={initialValues}
        resetKey={draft.formRevision}
        title="게시글 작성"
        submitLabel="완료"
        onSubmit={publish}
        onContentChange={draft.updateContent}
        onUploadStateChange={draft.setImageUploading}
        onSaveDraft={saveNow}
        onDeleteDraft={
          draft.draftId ? () => setIsDeleteModalOpen(true) : undefined
        }
        draftStatus={
          <DraftSaveStatus
            status={draft.status}
            savedAt={draft.savedAt}
            isPublishing={draft.isPublishing}
            onRetry={draft.retryAutosave}
          />
        }
        isDraftSaving={draft.isExplicitSaving}
        isDraftDeleting={draft.isDeleting || draft.isInitializing}
        isPublishing={draft.isPublishing}
      />

      <ConfirmModal
        isOpen={Boolean(draft.pendingDraft)}
        title="임시글 복구"
        message="임시 저장된 게시글이 존재합니다. 이어서 작성하시겠습니까 ?"
        cancelLabel="아니오"
        confirmLabel="예"
        isConfirming={draft.isDeleting}
        onDismiss={draft.dismissPendingDraft}
        onCancel={discardPending}
        onConfirm={draft.resumePendingDraft}
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="임시글 삭제"
        message="임시 저장된 게시글을 삭제하시겠습니까?"
        cancelLabel="취소"
        confirmLabel="삭제"
        isConfirming={draft.isDeleting}
        onCancel={() => setIsDeleteModalOpen(false)}
        onConfirm={removeDraft}
      />

      <ConfirmModal
        isOpen={isConflictModalOpen}
        title="임시글 충돌"
        message={messageFor(draft.error, "다른 화면에서 수정된 임시글이 있습니다.")}
        cancelLabel="현재 내용 유지"
        confirmLabel="서버 내용 불러오기"
        isConfirming={draft.isConflictResolving}
        onCancel={keepCurrentContent}
        onConfirm={loadServerDraft}
      />

      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: "", type: "success" })}
      />
    </>
  );
}
