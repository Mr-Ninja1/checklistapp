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
    options = { draftId: a.draftId, clearOnSubmit: a.clearOnSubmit, formType: a.formType };
  } else {
    throw new Error('useFormSave: invalid arguments');
  }

  const { formType = 'form', draftId } = options;
  const stableDraftId = draftId || `${formType}_draft`;
  const autoSaveTimer = useRef(null);
  const inFlightSave = useRef(false);
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
        const payload = getPayload('draft');
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
      const payload = getPayload('draft');
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
      const payload = getPayload('submitted');
      const id = `${formType}_${Date.now()}`;

      // Start saving but don't block the UI indefinitely. We'll wait a short time
      // for the save to complete; if it doesn't, proceed and let the save finish
      // in the background. Attach a finally to clear the inFlight flag when done.
      inFlightSave.current = true;
      const savePromise = formStorage.saveForm(id, payload)
        .catch(e => { console.error('useFormSave: background save failed', e); })
        .finally(() => { inFlightSave.current = false; });

      // wait up to 800ms for the save to complete to give a snappy submit UX
      const shortWait = new Promise(r => setTimeout(() => r(null), 800));
      const saveResult = await Promise.race([savePromise, shortWait]);
      if (saveResult === null) {
        console.warn('useFormSave: save did not finish quickly; continuing while saving in background');
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
      // always clear isSaving after a short grace period to allow notification UI to show
      setTimeout(() => { if (mounted.current) setIsSaving(false); }, 400);
    }
  };

  // clear timers on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = null;
      inFlightSave.current = false;
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
