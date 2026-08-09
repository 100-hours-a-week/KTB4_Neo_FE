import { useEffect, useRef } from "react";

export default function CommentForm({
                                        value,
                                        mode,
                                        isSubmitting,
                                        onChange,
                                        onSubmit,
                                        onCancelMode,
                                    }) {
    const textareaRef = useRef(null);

    useEffect(() => {
        if (mode.type === "create") return;

        const textarea = textareaRef.current;
        if (!textarea) return;

        textarea.scrollIntoView({
            behavior: "smooth",
            block: "center",
        });

        textarea.focus();
    }, [
        mode.type,
        mode.commentId,
        mode.parentCommentId,
    ]);

    const placeholder =
        mode.type === "edit"
            ? `${mode.isReply ? "대댓글" : "댓글"}을 수정해주세요.`
            : mode.type === "reply"
                ? "대댓글을 남겨주세요."
                : "댓글을 남겨주세요.";

    const buttonText = isSubmitting
        ? mode.type === "edit"
            ? "수정 중..."
            : "등록 중..."
        : mode.type === "edit"
            ? `${mode.isReply ? "대댓글" : "댓글"} 수정`
            : mode.type === "reply"
                ? "대댓글 등록"
                : "댓글 등록";

    return (
        <form className="comment-form" onSubmit={onSubmit}>
            {mode.type !== "create" && (
                <div className="comment-mode-row">
          <span>
            {mode.type === "edit" ? "수정 중" : "답글 작성 중"}
          </span>

                    <button type="button" onClick={onCancelMode}>
                        취소
                    </button>
                </div>
            )}

            <textarea
                ref={textareaRef}
                value={value}
                placeholder={placeholder}
                onChange={onChange}
            />

            <div className="comment-submit-row">
                <button
                    className="primary-button"
                    type="submit"
                    disabled={!value.trim() || isSubmitting}
                >
                    {buttonText}
                </button>
            </div>
        </form>
    );
}