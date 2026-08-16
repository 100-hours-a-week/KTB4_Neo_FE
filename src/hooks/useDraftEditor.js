import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "../api/client";
import {
  autosaveDraft,
  createDraft,
  deleteDraft,
  getActiveDraft,
  publishDraft,
  saveDraft,
} from "../api/draftApi";

const EMPTY_CONTENT = { title: "", postBody: "", postImage: "" };
const CONFLICT_CODES = new Set([
  "draft_version_conflict",
  "draft_content_conflict",
]);

function contentOf(value = EMPTY_CONTENT) {
  return {
    title: value.title || "",
    postBody: value.postBody || "",
    postImage: value.postImage || "",
  };
}

function isMeaningful(content) {
  return Boolean(
    content.title.trim() ||
      content.postBody.trim() ||
      content.postImage.trim(),
  );
}

function sameContent(left, right) {
  return (
    left.title === right.title &&
    left.postBody === right.postBody &&
    left.postImage === right.postImage
  );
}

function requestBody(snapshot) {
  return {
    title: snapshot.title,
    postBody: snapshot.postBody,
    postImage: snapshot.postImage || null,
    contentVersion: snapshot.contentVersion,
  };
}

export const DRAFT_SAVE_STATUS = Object.freeze({
  IDLE: "idle",
  EDITING: "editing",
  WAITING: "waiting",
  SAVING: "saving",
  AUTOSAVED: "autosaved",
  RDB_SAVED: "rdb-saved",
  CONFLICT: "conflict",
  ERROR: "error",
});

export function useDraftEditor() {
  const [draftId, setDraftId] = useState(null);
  const [formValues, setFormValues] = useState(EMPTY_CONTENT);
  const [formRevision, setFormRevision] = useState(0);
  const [pendingDraft, setPendingDraft] = useState(null);
  const [status, setStatus] = useState(DRAFT_SAVE_STATUS.IDLE);
  const [savedAt, setSavedAt] = useState(null);
  const [rdbSavedAt, setRdbSavedAt] = useState(null);
  const [error, setError] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExplicitSaving, setIsExplicitSaving] = useState(false);
  const [isConflictResolving, setIsConflictResolving] = useState(false);

  const snapshotRef = useRef({ ...EMPTY_CONTENT, contentVersion: 0 });
  const versionedContentRef = useRef(EMPTY_CONTENT);
  const draftIdRef = useRef(null);
  const debounceRef = useRef(null);
  const transientRef = useRef(null);
  const createPromiseRef = useRef(null);
  const autosavePromiseRef = useRef(null);
  const retrySnapshotRef = useRef(null);
  const conflictErrorRef = useRef(null);
  const blockedRef = useRef(false);
  const mountedRef = useRef(false);
  const uploadingRef = useRef(false);

  const clearDebounce = useCallback(() => {
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
  }, []);

  const clearTransient = useCallback(() => {
    if (transientRef.current) {
      window.clearTimeout(transientRef.current);
      transientRef.current = null;
    }
  }, []);

  const showTransientStatus = useCallback(
    (nextStatus) => {
      clearTransient();
      setStatus(nextStatus);
      transientRef.current = window.setTimeout(() => {
        if (!mountedRef.current) return;
        setStatus((current) =>
          current === nextStatus ? DRAFT_SAVE_STATUS.IDLE : current,
        );
      }, 2000);
    },
    [clearTransient],
  );

  const handleRequestError = useCallback(
    (requestError, retrySnapshot = null) => {
      setError(requestError);
      if (CONFLICT_CODES.has(requestError?.code)) {
        conflictErrorRef.current = requestError;
        blockedRef.current = true;
        clearDebounce();
        setStatus(DRAFT_SAVE_STATUS.CONFLICT);
        return;
      }
      retrySnapshotRef.current = retrySnapshot;
      showTransientStatus(DRAFT_SAVE_STATUS.ERROR);
    },
    [clearDebounce, showTransientStatus],
  );

  const resetLocalDraft = useCallback(() => {
    clearDebounce();
    clearTransient();
    blockedRef.current = false;
    draftIdRef.current = null;
    snapshotRef.current = { ...EMPTY_CONTENT, contentVersion: 0 };
    versionedContentRef.current = EMPTY_CONTENT;
    retrySnapshotRef.current = null;
    conflictErrorRef.current = null;
    setDraftId(null);
    setPendingDraft(null);
    setFormValues(EMPTY_CONTENT);
    setFormRevision((current) => current + 1);
    setStatus(DRAFT_SAVE_STATUS.IDLE);
    setSavedAt(null);
    setRdbSavedAt(null);
    setError(null);
    setIsConflictResolving(false);
  }, [clearDebounce, clearTransient]);

  const applyServerDraft = useCallback((draft) => {
    const content = contentOf(draft);
    const version = Number(draft.contentVersion) || 0;
    draftIdRef.current = draft.draftId;
    snapshotRef.current = { ...content, contentVersion: version };
    versionedContentRef.current = content;
    blockedRef.current = false;
    retrySnapshotRef.current = null;
    conflictErrorRef.current = null;
    setDraftId(draft.draftId);
    setFormValues(content);
    setFormRevision((current) => current + 1);
    setPendingDraft(null);
    setSavedAt(draft.updatedAt || null);
    setRdbSavedAt(draft.rdbSavedAt || null);
    setError(null);
    setStatus(DRAFT_SAVE_STATUS.IDLE);
  }, []);

  const ensureDraft = useCallback(
    async (snapshot) => {
      if (draftIdRef.current) return draftIdRef.current;
      if (createPromiseRef.current) return createPromiseRef.current;
      if (!isMeaningful(snapshot)) {
        throw new ApiError("draft_empty_content", { status: 400 });
      }

      createPromiseRef.current = createDraft(requestBody(snapshot))
        .then((created) => {
          if (!mountedRef.current) return created.draftId;
          const createdContent = contentOf(created);
          const createdVersion = Number(created.contentVersion) || 0;
          draftIdRef.current = created.draftId;
          setDraftId(created.draftId);
          setRdbSavedAt(created.rdbSavedAt || null);

          if (
            createdVersion > snapshot.contentVersion ||
            (createdVersion === snapshot.contentVersion &&
              !sameContent(createdContent, snapshot))
          ) {
            const code =
              createdVersion > snapshot.contentVersion
                ? "draft_version_conflict"
                : "draft_content_conflict";
            throw new ApiError(code, { status: 409, data: created });
          }
          return created.draftId;
        })
        .finally(() => {
          createPromiseRef.current = null;
        });

      return createPromiseRef.current;
    },
    [],
  );

  const createRequestSnapshot = useCallback(() => {
    const current = snapshotRef.current;
    const content = contentOf(current);

    if (
      current.contentVersion >= 1 &&
      sameContent(content, versionedContentRef.current)
    ) {
      return { ...current };
    }

    const snapshot = {
      ...content,
      contentVersion: Math.max(1, current.contentVersion + 1),
    };
    snapshotRef.current = snapshot;
    versionedContentRef.current = content;
    return { ...snapshot };
  }, []);

  const runAutosave = useCallback(
    async (forcedSnapshot = null) => {
      const current = forcedSnapshot || snapshotRef.current;
      if (
        blockedRef.current ||
        uploadingRef.current ||
        !isMeaningful(current)
      ) {
        return null;
      }
      const snapshot = forcedSnapshot || createRequestSnapshot();

      clearDebounce();
      retrySnapshotRef.current = snapshot;
      setError(null);
      setStatus(DRAFT_SAVE_STATUS.SAVING);

      const request = (async () => {
        const id = await ensureDraft(snapshot);
        const response = await autosaveDraft(id, requestBody(snapshot));

        if (!mountedRef.current) return response;
        const current = snapshotRef.current;
        if (
          Number(response.contentVersion) === current.contentVersion &&
          sameContent(current, snapshot)
        ) {
          retrySnapshotRef.current = null;
          setSavedAt(response.updatedAt || new Date().toISOString());
          showTransientStatus(DRAFT_SAVE_STATUS.AUTOSAVED);
        } else {
          setStatus(DRAFT_SAVE_STATUS.WAITING);
        }
        return response;
      })();

      autosavePromiseRef.current = request;
      try {
        return await request;
      } catch (requestError) {
        if (mountedRef.current) handleRequestError(requestError, snapshot);
        return null;
      } finally {
        if (autosavePromiseRef.current === request) {
          autosavePromiseRef.current = null;
        }
      }
    },
    [
      clearDebounce,
      createRequestSnapshot,
      ensureDraft,
      handleRequestError,
      showTransientStatus,
    ],
  );

  const scheduleAutosave = useCallback(() => {
    clearDebounce();
    if (
      blockedRef.current ||
      uploadingRef.current ||
      !isMeaningful(snapshotRef.current) ||
      sameContent(snapshotRef.current, versionedContentRef.current)
    ) {
      setStatus(DRAFT_SAVE_STATUS.IDLE);
      return;
    }
    setStatus(DRAFT_SAVE_STATUS.WAITING);
    debounceRef.current = window.setTimeout(() => {
      debounceRef.current = null;
      runAutosave();
    }, 2000);
  }, [clearDebounce, runAutosave]);

  const updateContent = useCallback(
    (nextContent) => {
      const content = contentOf(nextContent);
      if (sameContent(snapshotRef.current, content)) return;
      snapshotRef.current = {
        ...content,
        contentVersion: snapshotRef.current.contentVersion,
      };
      retrySnapshotRef.current = null;
      setFormValues(content);
      setError(null);
      setStatus(DRAFT_SAVE_STATUS.EDITING);
      scheduleAutosave();
    },
    [scheduleAutosave],
  );

  const setImageUploading = useCallback(
    (uploading) => {
      uploadingRef.current = uploading;
      setIsImageUploading(uploading);
      if (uploading) clearDebounce();
      else scheduleAutosave();
    },
    [clearDebounce, scheduleAutosave],
  );

  const saveNow = useCallback(async () => {
    if (isExplicitSaving || isPublishing || isDeleting) return null;
    if (!isMeaningful(snapshotRef.current) || uploadingRef.current) return null;
    const snapshot = createRequestSnapshot();
    clearDebounce();
    setIsExplicitSaving(true);
    setError(null);
    try {
      if (autosavePromiseRef.current) await autosavePromiseRef.current;
      if (blockedRef.current) {
        throw (
          conflictErrorRef.current ||
          new ApiError("draft_version_conflict", { status: 409 })
        );
      }
      const id = await ensureDraft(snapshot);
      const response = await saveDraft(id, requestBody(snapshot));
      if (!mountedRef.current) return response;
      setRdbSavedAt(response.rdbSavedAt || null);
      if (
        Number(response.contentVersion) ===
          snapshotRef.current.contentVersion &&
        sameContent(snapshotRef.current, snapshot)
      ) {
        setSavedAt(response.updatedAt || null);
        showTransientStatus(DRAFT_SAVE_STATUS.RDB_SAVED);
      } else {
        scheduleAutosave();
      }
      return response;
    } catch (requestError) {
      if (mountedRef.current) handleRequestError(requestError, snapshot);
      throw requestError;
    } finally {
      if (mountedRef.current) setIsExplicitSaving(false);
    }
  }, [
    clearDebounce,
    createRequestSnapshot,
    ensureDraft,
    handleRequestError,
    isDeleting,
    isExplicitSaving,
    isPublishing,
    scheduleAutosave,
    showTransientStatus,
  ]);

  const publish = useCallback(async () => {
    if (isPublishing || isDeleting || uploadingRef.current) return null;
    if (!isMeaningful(snapshotRef.current)) return null;
    const snapshot = createRequestSnapshot();
    clearDebounce();
    setIsPublishing(true);
    setError(null);
    try {
      if (autosavePromiseRef.current) await autosavePromiseRef.current;
      if (blockedRef.current) {
        throw (
          conflictErrorRef.current ||
          new ApiError("draft_version_conflict", { status: 409 })
        );
      }
      blockedRef.current = true;
      const id = await ensureDraft(snapshot);
      const response = await publishDraft(id, requestBody(snapshot));
      if (mountedRef.current) resetLocalDraft();
      return response;
    } catch (requestError) {
      blockedRef.current = CONFLICT_CODES.has(requestError?.code);
      if (mountedRef.current) handleRequestError(requestError, snapshot);
      throw requestError;
    } finally {
      if (mountedRef.current) setIsPublishing(false);
    }
  }, [
    clearDebounce,
    createRequestSnapshot,
    ensureDraft,
    handleRequestError,
    isDeleting,
    isPublishing,
    resetLocalDraft,
  ]);

  const remove = useCallback(async () => {
    if (isDeleting) return false;
    clearDebounce();
    blockedRef.current = true;
    setIsDeleting(true);
    try {
      if (draftIdRef.current) await deleteDraft(draftIdRef.current);
      if (mountedRef.current) resetLocalDraft();
      return true;
    } catch (requestError) {
      blockedRef.current = false;
      if (mountedRef.current) handleRequestError(requestError);
      throw requestError;
    } finally {
      if (mountedRef.current) setIsDeleting(false);
    }
  }, [clearDebounce, handleRequestError, isDeleting, resetLocalDraft]);

  const discardPendingDraft = useCallback(async () => {
    if (!pendingDraft || isDeleting) return false;
    setIsDeleting(true);
    try {
      await deleteDraft(pendingDraft.draftId);
      if (mountedRef.current) resetLocalDraft();
      return true;
    } catch (requestError) {
      if (mountedRef.current) handleRequestError(requestError);
      throw requestError;
    } finally {
      if (mountedRef.current) setIsDeleting(false);
    }
  }, [handleRequestError, isDeleting, pendingDraft, resetLocalDraft]);

  const dismissPendingDraft = useCallback(() => {
    if (mountedRef.current) setPendingDraft(null);
  }, []);

  const resolveConflictWithLocal = useCallback(async () => {
    if (isConflictResolving) return null;
    setIsConflictResolving(true);
    clearDebounce();

    try {
      const latestDraft = await getActiveDraft();
      if (!latestDraft) {
        resetLocalDraft();
        return null;
      }

      const localContent = contentOf(snapshotRef.current);
      const rebasedSnapshot = {
        ...localContent,
        contentVersion: Number(latestDraft.contentVersion) + 1,
      };

      draftIdRef.current = latestDraft.draftId;
      snapshotRef.current = rebasedSnapshot;
      versionedContentRef.current = contentOf(latestDraft);
      blockedRef.current = false;
      conflictErrorRef.current = null;
      retrySnapshotRef.current = rebasedSnapshot;

      setDraftId(latestDraft.draftId);
      setError(null);

      return await runAutosave(rebasedSnapshot);
    } finally {
      if (mountedRef.current) setIsConflictResolving(false);
    }
  }, [clearDebounce, isConflictResolving, resetLocalDraft, runAutosave]);

  const reloadServerDraft = useCallback(async () => {
    const active = await getActiveDraft();
    if (!active) {
      resetLocalDraft();
      return null;
    }
    applyServerDraft(active);
    return active;
  }, [applyServerDraft, resetLocalDraft]);

  const retryAutosave = useCallback(() => {
    const retrySnapshot = retrySnapshotRef.current;
    if (!retrySnapshot || blockedRef.current) return Promise.resolve(null);
    return runAutosave({ ...retrySnapshot });
  }, [runAutosave]);

  useEffect(() => {
    mountedRef.current = true;
    let active = true;
    getActiveDraft()
      .then((draft) => {
        if (active && draft) setPendingDraft(draft);
      })
      .catch((requestError) => {
        if (active) handleRequestError(requestError);
      })
      .finally(() => {
        if (active) setIsInitializing(false);
      });

    return () => {
      active = false;
      mountedRef.current = false;
      clearDebounce();
      clearTransient();
    };
  }, [clearDebounce, clearTransient, handleRequestError]);

  return {
    draftId,
    formValues,
    formRevision,
    pendingDraft,
    status,
    savedAt,
    rdbSavedAt,
    error,
    isInitializing,
    isImageUploading,
    isPublishing,
    isDeleting,
    isExplicitSaving,
    isConflictResolving,
    updateContent,
    setImageUploading,
    resumePendingDraft: () => applyServerDraft(pendingDraft),
    dismissPendingDraft,
    discardPendingDraft,
    resolveConflictWithLocal,
    saveNow,
    publish,
    remove,
    retryAutosave,
    reloadServerDraft,
  };
}
