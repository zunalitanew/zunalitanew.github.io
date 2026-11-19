import { isPostFilename } from "./archive.js";

const STORAGE_KEY = "zunalita-reading-list-v1";

export function getSavedPosts() {
  let serialized;
  try {
    serialized = window.localStorage.getItem(STORAGE_KEY);
  } catch (error) {
    throw new Error(`The reading list is unavailable: ${error.message}`);
  }
  if (!serialized) return [];

  let saved;
  try {
    saved = JSON.parse(serialized);
  } catch {
    throw new Error("The saved reading list couldn't be read.");
  }
  if (!Array.isArray(saved) || saved.some((filename) => !isPostFilename(filename))) {
    throw new Error("The saved reading list contains an invalid entry.");
  }
  return [...new Set(saved)];
}

export function toggleSavedPost(filename) {
  if (!isPostFilename(filename)) throw new Error("That story name is not valid.");
  const saved = getSavedPosts();
  const isSaved = saved.includes(filename);
  const next = isSaved
    ? saved.filter((item) => item !== filename)
    : [...saved, filename];

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch (error) {
    throw new Error(`The reading list couldn't be saved: ${error.message}`);
  }
  return !isSaved;
}

export function removeSavedPost(filename) {
  const next = getSavedPosts().filter((item) => item !== filename);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch (error) {
    throw new Error(`The reading list couldn't be updated: ${error.message}`);
  }
  return next;
}

export function clearSavedPosts() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    throw new Error(`The reading list couldn't be cleared: ${error.message}`);
  }
}
