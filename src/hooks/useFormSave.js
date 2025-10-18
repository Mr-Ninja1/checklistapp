import { useRef, useState, useEffect } from 'react';
import formStorage from '../utils/formStorage';
import { removeFormHistory } from '../utils/formHistory';

/**
 * Unified useFormSave hook
 * Supports two calling styles:
 *  - useFormSave({ buildPayload, draftId, clearOnSubmit })
 *  - useFormSave(getPayloadFn, { formType, draftId, clearOnSubmit })
 *
 * Returned API includes both scheduleAutoSave and autoSaveDraft (aliases)
 */
export default function useFormSave(a, b = {}) {
  // normalize arguments
  let getPayload;
  let options = {};
  if (typeof a === 'function') {
    getPayload = a;
    options = b || {};
  } else if (typeof a === 'object' && a !== null) {
    getPayload = a.buildPayload;
    options = { draftId: a.draftId, clearOnSubmit: a.clearOnSubmit, formType: a.formType, waitForSave: a.waitForSave };
  } else {
    throw new Error('useFormSave: invalid arguments');
  }

  const { formType = 'form', draftId, waitForSave = true } = options;
  const stableDraftId = draftId || `${formType}_draft`;
  // Helper: call the provided buildPayload/getPayload safely and catch runtime errors
  const safeGetPayload = (status = 'draft') => {
    try {
      // getPayload may be the buildPayload function or a wrapper
      return typeof getPayload === 'function' ? getPayload(status) : {};
    } catch (err) {
      // Log a helpful message with form context for debugging in dev
      console.error(`useFormSave: buildPayload threw for formType='${formType}' status='${status}'`, err);
      // Surface a friendly notification to the caller via the hook state if mounted
      if (mounted.current) {
        setNotificationMessage(`Save failed: form serializer error`);
        setShowNotification(true);
      }
      // Return a minimal safe payload to avoid crashes in storage layer
      return { formType, title: formType, date: new Date().toLocaleDateString(), metadata: {}, formData: [], layoutHints: {}, savedAt: Date.now() };
    }
  };
  const autoSaveTimer = useRef(null);
  const inFlightSave = useRef(false);
  const safetyTimer = useRef(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const mounted = useRef(true);
  useEffect(() => () => { mounted.current = false; }, []);

  const scheduleAutoSave = (delay = 1500) => {
    if (!mounted.current) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(async () => {
      if (!mounted.current) return;
      if (inFlightSave.current) return; // avoid overlapping saves
      inFlightSave.current = true;
      try {
        const payload = safeGetPayload('draft');
        // Use saveDraft for autosave so we do not add a history entry on every keystroke
        if (formStorage.saveDraft) await formStorage.saveDraft(stableDraftId, payload);
        else await formStorage.saveForm(stableDraftId, payload);
      } catch (e) {
        console.error('useFormSave auto-save failed', e);
      } finally {
        inFlightSave.current = false;
      }
    }, delay);
  };

  // alias for older callers
  const autoSaveDraft = (...args) => scheduleAutoSave(...args);

  const handleSaveDraft = async () => {
    // Save draft silently (do not show fullscreen saving overlay). Keep a small
    // notification to confirm the draft save but avoid toggling isSaving so
    // modal backdrops won't appear during typical autosave flows.
    if (!mounted.current) return;
    if (inFlightSave.current) return; // avoid overlapping
    inFlightSave.current = true;
    try {
      const payload = safeGetPayload('draft');
      const id = `${formType}_${Date.now()}`;
      await formStorage.saveForm(id, payload);
      // Intentionally silent for drafts/autosave: do not set isSaving or showNotification.
    } catch (e) {
      console.error('useFormSave handleSaveDraft failed', e);
    } finally {
      inFlightSave.current = false;
    }
  };

  const handleSubmit = async (onClear) => {
  // mark saving and ensure we always clear the saving flag in finally
  setIsSaving(true);
  // start a safety timeout to avoid the saving overlay getting stuck if
  // some storage op hangs or an unexpected code path prevents the finally
  // block from clearing the flag. We'll clear this timer in the finally block.
  try { if (safetyTimer.current) clearTimeout(safetyTimer.current); } catch (e) {}
  safetyTimer.current = setTimeout(() => {
    console.warn('useFormSave: safety timer clearing isSaving flag after timeout');
    try { if (mounted.current) setIsSaving(false); } catch (e) { /* ignore */ }
    safetyTimer.current = null;
  }, 15000); // 15s safety
    try {
      // wait for any in-flight autosave/save to finish before submitting, but don't wait forever
      const waitForInFlight = async (timeoutMs = 5000) => {
        const start = Date.now();
        while (inFlightSave.current && Date.now() - start < timeoutMs) {
          // eslint-disable-next-line no-await-in-loop
          await new Promise(r => setTimeout(r, 50));
        }
        if (inFlightSave.current) {
          console.warn('useFormSave: in-flight save did not finish within timeout, proceeding with submit');
        }
      };
      await waitForInFlight(5000);
  const payload = safeGetPayload('submitted');
      const id = `${formType}_${Date.now()}`;

      // Start saving. Wait a short while for quick saves to finish so the
      // user sees the saving indicator for slow saves, but avoid blocking the
      // app for too long. By default we wait for the save to finish; some
      // forms can opt-out by setting `waitForSave: false` in options.
      inFlightSave.current = true;
      // start save
      const savePromise = formStorage.saveForm(id, payload)
        .catch(e => { console.error('useFormSave: background save failed', e); })
        .finally(() => { inFlightSave.current = false; });

      // Wait briefly for quick saves to finish (1200ms). If the save completes
      // within this window the UX will feel immediate.
      const shortWait = new Promise(r => setTimeout(() => r('timeout'), 1200));
      const saveResult = await Promise.race([
        savePromise.then(() => 'done').catch(() => 'done'),
        shortWait
      ]);

      if (waitForSave) {
        if (saveResult === 'timeout') {
          console.warn('useFormSave: save did not finish quickly; will wait up to MAX_SAVE_WAIT_MS for completion');
        }
        // Wait for the save to fully settle before proceeding with cleanup,
        // but only up to a maximum timeout so the UI doesn't get stuck
        // forever if the storage layer hangs.
        const MAX_SAVE_WAIT_MS = 10000; // 10s
        const saveSettled = await Promise.race([
          savePromise.then(() => 'done').catch(() => 'done'),
          new Promise(r => setTimeout(() => r('timeout'), MAX_SAVE_WAIT_MS))
        ]);
        if (saveSettled === 'timeout') {
          console.warn('useFormSave: save did not finish within MAX_SAVE_WAIT_MS; proceeding and letting save continue in background');
        }
      } else {
        // Fast-submit mode: we don't await the full save. If the short wait
        // timed out, clear the saving indicator quickly and let the save
        // continue in the background. This makes submit feel instant.
        if (saveResult === 'timeout') {
          // allow a tiny grace so the user sees the spinner briefly
          await new Promise(r => setTimeout(r, 250));
        }
        // proceed without awaiting savePromise; errors will be logged by the promise
      }

      // try to remove stable draft and its history entry; failures here shouldn't block submit success path
      try {
        await formStorage.deleteForm(stableDraftId);
      } catch (e) {
        console.warn('useFormSave: failed to delete stable draft', e);
      }
      try {
        await removeFormHistory(f => f.meta && f.meta.formId === stableDraftId);
      } catch (e) {
        console.warn('useFormSave: failed to remove draft from history', e);
      }

      // clear form via provided callback if available
      if (typeof options.clearOnSubmit === 'function') {
        try { options.clearOnSubmit(); } catch (e) { console.warn('clearOnSubmit failed', e); }
      }

      if (mounted.current) {
        setNotificationMessage('Form submitted');
        setShowNotification(true);
      }
    } catch (e) {
      console.error('useFormSave handleSubmit failed', e);
      if (mounted.current) {
        setNotificationMessage('Failed to submit form');
        setShowNotification(true);
      }
    } finally {
      inFlightSave.current = false;
      // clear the safety timer if still present
      try { if (safetyTimer.current) { clearTimeout(safetyTimer.current); safetyTimer.current = null; } } catch (e) {}
      // clear saving indicator promptly so LoadingOverlay doesn't get stuck
      if (mounted.current) setIsSaving(false);
    }
  };

  // clear timers on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = null;
      inFlightSave.current = false;
      try { if (safetyTimer.current) { clearTimeout(safetyTimer.current); safetyTimer.current = null; } } catch (e) {}
    };
  }, []);

  return {
    isSaving,
    showNotification,
    notificationMessage,
    setShowNotification,
    setNotificationMessage,
    // autosave helpers (both names supported)
    scheduleAutoSave,
    autoSaveDraft,
    // actions
    handleSaveDraft,
    handleSubmit,
  };
}
