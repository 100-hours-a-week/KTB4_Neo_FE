import { useEffect, useRef, useState } from "react";
import { getReportTypes, reportPost } from "../../api/reportApi";

export default function ReportModal({ isOpen, postId, onClose }) {
  const [types, setTypes] = useState([]);
  const [selectedType, setSelectedType] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const firstInputRef = useRef(null);
  const cancelRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const submitPendingRef = useRef(false);
  const mountedRef = useRef(false);
  onCloseRef.current = onClose;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return undefined;
    let cancelled = false;
    const previousFocus = document.activeElement;
    document.body.classList.add("modal-open");
    setTypes([]);
    setSelectedType("");
    setReason("");
    setError("");
    setIsLoading(true);
    cancelRef.current?.focus();

    getReportTypes()
      .then((data) => {
        if (cancelled) return;
        const list = Array.isArray(data)
          ? data
          : data?.reportTypes || data?.types || [];
        setTypes(list);
        if (!list.length) {
          setError("* 신고 유형을 불러오지 못했습니다.");
        }
      })
      .catch((requestError) => {
        if (!cancelled) setError(`* ${requestError.message}`);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    const closeOnEscape = (event) => {
      if (event.key === "Escape" && !submitPendingRef.current) {
        onCloseRef.current();
      }
    };
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      cancelled = true;
      document.body.classList.remove("modal-open");
      document.removeEventListener("keydown", closeOnEscape);
      previousFocus?.focus();
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && types.length) firstInputRef.current?.focus();
  }, [isOpen, types]);

  if (!isOpen) return null;

  async function submit(event) {
    event.preventDefault();
    if (submitPendingRef.current || isLoading) return;
    if (!selectedType) {
      setError("* 신고 유형을 선택해주세요.");
      return;
    }

    submitPendingRef.current = true;
    setIsSubmitting(true);
    try {
      await reportPost(postId, {
        reportType: selectedType,
        reason: reason.trim(),
      });
      if (!mountedRef.current) return;
      window.alert("신고가 접수되었습니다.");
      onCloseRef.current();
    } catch (requestError) {
      if (mountedRef.current) {
        setError(`* ${requestError.message}`);
      }
    } finally {
      submitPendingRef.current = false;
      if (mountedRef.current) setIsSubmitting(false);
    }
  }

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !submitPendingRef.current
        ) {
          onCloseRef.current();
        }
      }}
    >
      <form className="report-modal" onSubmit={submit}>
        <h2 id="report-modal-title">게시글 신고하기</h2>
        <p className="report-description">
          신고 유형을 선택하고 상세 사유를 입력해주세요.
        </p>
        <fieldset className="report-type-group">
          <legend>신고 유형</legend>
          {isLoading && <p>신고 유형을 불러오는 중입니다.</p>}
          {types.map((type, index) => {
            const value =
              typeof type === "string"
                ? type
                : type.value || type.name || type.code || type.reportType;
            const label =
              typeof type === "string"
                ? type
                : type.label || type.description || value;
            return (
              <label key={value}>
                <input
                  ref={index === 0 ? firstInputRef : undefined}
                  type="radio"
                  name="reportType"
                  value={value}
                  checked={selectedType === value}
                  onChange={(event) => {
                    setSelectedType(event.target.value);
                    setError("");
                  }}
                />{" "}
                {label}
              </label>
            );
          })}
        </fieldset>
        <label className="report-reason-label" htmlFor="report-reason">
          상세 사유
        </label>
        <textarea
          id="report-reason"
          value={reason}
          placeholder="상세 사유를 입력해주세요."
          onChange={(event) => setReason(event.target.value)}
        />
        <p className="helper-text" aria-live="polite">
          {error ||
            (selectedType
              ? "* 상세 사유를 입력하면 신고 처리에 도움이 됩니다."
              : "* 신고 유형을 선택해주세요.")}
        </p>
        <div className="confirm-modal-actions">
          <button
            ref={cancelRef}
            className="modal-button cancel-button"
            type="button"
            disabled={isSubmitting}
            onClick={() => onCloseRef.current()}
          >
            취소
          </button>
          <button
            className="modal-button report-submit-button"
            type="submit"
            disabled={isLoading || !types.length || isSubmitting}
          >
            {isSubmitting ? "신고 중..." : "신고하기"}
          </button>
        </div>
      </form>
    </div>
  );
}
