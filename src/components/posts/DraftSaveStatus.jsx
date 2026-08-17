import { DRAFT_SAVE_STATUS } from "../../hooks/useDraftEditor";

function formatTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}

export default function DraftSaveStatus({
  status,
  savedAt,
  isPublishing,
  onRetry,
}) {
  let text = "";
  if (isPublishing) text = "게시글 저장 중..";
  else if (status === DRAFT_SAVE_STATUS.AUTOSAVED) {
    const time = formatTime(savedAt);
    text = `임시 저장 완료${time ? ` (${time})` : ""}`;
  } else if (status === DRAFT_SAVE_STATUS.ERROR) {
    text = "자동 저장 실패";
  }

  if (!text) return null;

  return (
    <span className="draft-save-status" role="status" aria-live="polite">
      {text}
      {status === DRAFT_SAVE_STATUS.ERROR && onRetry && (
        <button type="button" onClick={onRetry}>
          다시 시도
        </button>
      )}
    </span>
  );
}
