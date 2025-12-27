// Utility for saving/loading draft objects to localStorage with safe guards
const KEY_COURSE = "obe_course_draft";
const KEY_CLOS = "obe_clos_draft";

const isLocalStorageAvailable = () => {
  try {
    const testKey = "_ls_test";
    window.localStorage.setItem(testKey, "1");
    window.localStorage.removeItem(testKey);
    return true;
  } catch (err) {
    console.warn("localStorage not available:", err);
    return false;
  }
};

const safeSet = (key, value) => {
  if (!isLocalStorageAvailable()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn("Failed to save draft:", err);
  }
};

const safeGet = (key) => {
  if (!isLocalStorageAvailable()) return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.warn("Failed to read draft:", err);
    return null;
  }
};

const safeRemove = (key) => {
  if (!isLocalStorageAvailable()) return;
  try {
    window.localStorage.removeItem(key);
  } catch (err) {
    console.warn("Failed to clear draft:", err);
  }
};

// Course draft helpers
export const saveCourseDraft = (courseObj) => safeSet(KEY_COURSE, courseObj);
export const getCourseDraft = () => safeGet(KEY_COURSE);
export const clearCourseDraft = () => safeRemove(KEY_COURSE);

// CLO draft helpers
export const saveClosDraft = (closArray) => safeSet(KEY_CLOS, closArray);
export const getClosDraft = () => safeGet(KEY_CLOS);
export const clearClosDraft = () => safeRemove(KEY_CLOS);

export default {
  saveCourseDraft,
  getCourseDraft,
  clearCourseDraft,
  saveClosDraft,
  getClosDraft,
  clearClosDraft,
};
