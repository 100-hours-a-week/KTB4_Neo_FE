import { useEffect, useRef, useState } from "react";
import FormField from "../form/FormField";
import ImageUploader from "../form/ImageUploader";

export default function PostForm({
  initialValues,
  title,
  submitLabel,
  onSubmit,
  resetKey,
  onContentChange,
  onUploadStateChange,
  onSaveDraft,
  onDeleteDraft,
  draftStatus,
  isDraftSaving = false,
  isDraftDeleting = false,
  isPublishing = false,
}) {
  const [form, setForm] = useState(initialValues);
  const formRef = useRef(initialValues);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const previewUrlRef = useRef("");
  const uploadIdRef = useRef(0);
  const submitPendingRef = useRef(false);
  const mountedRef = useRef(false);
  const resetValuesRef = useRef(initialValues);
  resetValuesRef.current = initialValues;
  formRef.current = form;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      uploadIdRef.current += 1;
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (resetKey === undefined) return;
    uploadIdRef.current += 1;
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = "";
    }
    formRef.current = resetValuesRef.current;
    setForm(resetValuesRef.current);
    setError("");
  }, [resetKey]);

  function change(event) {
    const { name, value } = event.target;
    const next = {
      ...formRef.current,
      [name]: name === "title" ? value.slice(0, 26) : value,
    };
    formRef.current = next;
    setForm(next);
    onContentChange?.({
      title: next.title,
      postBody: next.postBody,
      postImage: next.postImage,
    });
    setError("");
  }

  async function submit(event) {
    event.preventDefault();
    if (!form.title.trim() || !form.postBody.trim()) {
      setError("* 제목, 내용을 모두 작성해주세요.");
      return;
    }
    if (
      form.isUploading ||
      submitPendingRef.current ||
      isDraftDeleting ||
      isPublishing
    ) {
      return;
    }

    submitPendingRef.current = true;
    setIsSubmitting(true);
    try {
      await onSubmit({
        title: form.title.trim(),
        postBody: form.postBody.trim(),
        postImage: form.postImage || "",
      });
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
    <form className="post-form" noValidate onSubmit={submit}>
      <div className="post-form-title-row">
        <h2 className="page-title">{title}</h2>
        {onSaveDraft && (
          <div className="draft-title-actions">
            {onDeleteDraft && (
              <button
                className="draft-delete-button"
                type="button"
                disabled={isDraftDeleting || isPublishing}
                onClick={onDeleteDraft}
              >
                임시글 삭제
              </button>
            )}
            <button
              className="draft-save-button"
              type="button"
              disabled={
                form.isUploading ||
                isDraftSaving ||
                isDraftDeleting ||
                isPublishing
              }
              onClick={onSaveDraft}
            >
              {isDraftSaving ? "저장 중..." : "임시 저장"}
            </button>
          </div>
        )}
      </div>
      <FormField
        className="line-field"
        label="제목*"
        htmlFor="title"
      >
        <input
          id="title"
          name="title"
          value={form.title}
          maxLength={26}
          placeholder="제목을 입력해주세요. (최대 26글자)"
          onChange={change}
          disabled={isPublishing || isDraftDeleting}
        />
      </FormField>
      <FormField
        className="line-field"
        label="내용*"
        htmlFor="post-body"
      >
        <textarea
          id="post-body"
          name="postBody"
          value={form.postBody}
          placeholder="내용을 입력해주세요."
          onChange={change}
          disabled={isPublishing || isDraftDeleting}
        />
      </FormField>
      <div className="post-form-feedback-row">
        <p className="helper-text" aria-live="polite">
          {error ||
            (form.imageError ? `* ${form.imageError}` : "") ||
            (form.isUploading
              ? "* 이미지를 업로드하는 중입니다."
              : "* helper text")}
        </p>
        {draftStatus}
      </div>
      <ImageUploader
        id="post-image"
        currentImage={form.postImage}
        previewUrl={form.previewUrl}
        fileName={form.fileName}
        isUploading={form.isUploading}
        error={form.imageError}
        disabled={isPublishing || isDraftDeleting}
        onRemove={
          onContentChange && form.postImage
            ? () => {
                if (previewUrlRef.current) {
                  URL.revokeObjectURL(previewUrlRef.current);
                  previewUrlRef.current = "";
                }
                const next = {
                  ...formRef.current,
                  postImage: "",
                  previewUrl: "",
                  fileName: "",
                };
                formRef.current = next;
                setForm(next);
                onContentChange({
                  title: next.title,
                  postBody: next.postBody,
                  postImage: "",
                });
              }
            : undefined
        }
        onSelect={async (file) => {
          if (!file) return;
          const uploadId = uploadIdRef.current + 1;
          uploadIdRef.current = uploadId;
          if (previewUrlRef.current) {
            URL.revokeObjectURL(previewUrlRef.current);
          }
          const previewUrl = URL.createObjectURL(file);
          previewUrlRef.current = previewUrl;
          const uploadingForm = {
            ...formRef.current,
            previewUrl,
            fileName: file.name,
            isUploading: true,
            imageError: "",
          };
          formRef.current = uploadingForm;
          setForm(uploadingForm);
          onUploadStateChange?.(true);
          try {
            const imageUrl = await initialValues.upload(file);
            if (
              !mountedRef.current ||
              uploadId !== uploadIdRef.current
            ) {
              return;
            }
            const current = formRef.current;
            const next = {
              ...current,
              postImage: imageUrl,
              isUploading: false,
            };
            formRef.current = next;
            setForm(next);
            if (current.postImage !== imageUrl) {
              onContentChange?.({
                title: next.title,
                postBody: next.postBody,
                postImage: imageUrl,
              });
            }
            onUploadStateChange?.(false);
          } catch (uploadError) {
            if (
              !mountedRef.current ||
              uploadId !== uploadIdRef.current
            ) {
              return;
            }
            URL.revokeObjectURL(previewUrl);
            previewUrlRef.current = "";
            const failedForm = {
              ...formRef.current,
              previewUrl: "",
              fileName: "",
              isUploading: false,
              imageError: uploadError.message,
            };
            formRef.current = failedForm;
            setForm(failedForm);
            onUploadStateChange?.(false);
          }
        }}
      />
      <button
        className="primary-button"
        type="submit"
        disabled={
          !form.title.trim() ||
          !form.postBody.trim() ||
          form.isUploading ||
          isSubmitting ||
          isDraftDeleting ||
          isPublishing
        }
      >
        {isSubmitting || isPublishing ? "처리 중..." : submitLabel}
      </button>
    </form>
  );
}
