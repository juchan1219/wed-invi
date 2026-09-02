import { clamp01 } from "./scrollMath";

const STORY_HISTORY_KEY = "__wedInviStory";
const STORY_STORAGE_KEY = "__wedInviStoryProgress";
const STORY_HISTORY_VERSION = 1;

type StoryHistoryEntry = {
  version: typeof STORY_HISTORY_VERSION;
  path: string;
  progress: number;
};

function routeKey(target: Window) {
  return `${target.location.pathname}${target.location.search}`;
}

function historyRecord(target: Window) {
  const current = target.history.state;
  return current && typeof current === "object" && !Array.isArray(current)
    ? { ...current } as Record<string, unknown>
    : {};
}

function isCurrentStoryEntry(target: Window, entry: StoryHistoryEntry | undefined): entry is StoryHistoryEntry {
  return entry?.version === STORY_HISTORY_VERSION
    && entry.path === routeKey(target)
    && Number.isFinite(entry.progress)
    && entry.progress >= 0
    && entry.progress <= 1;
}

function readStoredProgress(target: Window) {
  try {
    const value = target.sessionStorage.getItem(STORY_STORAGE_KEY);
    const entry = value ? JSON.parse(value) as StoryHistoryEntry : undefined;
    return isCurrentStoryEntry(target, entry) ? entry.progress : null;
  } catch {
    return null;
  }
}

function writeStoredEntry(target: Window, entry: StoryHistoryEntry | null) {
  try {
    if (entry) target.sessionStorage.setItem(STORY_STORAGE_KEY, JSON.stringify(entry));
    else target.sessionStorage.removeItem(STORY_STORAGE_KEY);
  } catch {
    // History state remains the fallback when storage is unavailable.
  }
}

export function writeStoryProgress(target: Window, progress: number | null) {
  const next = historyRecord(target);
  const current = next[STORY_HISTORY_KEY] as StoryHistoryEntry | undefined;

  if (progress === null) {
    writeStoredEntry(target, null);
    if (!(STORY_HISTORY_KEY in next)) return;
    delete next[STORY_HISTORY_KEY];
  } else {
    const entry: StoryHistoryEntry = {
      version: STORY_HISTORY_VERSION,
      path: routeKey(target),
      progress: Number(clamp01(progress).toFixed(5)),
    };
    writeStoredEntry(target, entry);
    if (
      current?.version === entry.version
      && current.path === entry.path
      && current.progress === entry.progress
    ) return;
    next[STORY_HISTORY_KEY] = entry;
  }

  target.history.replaceState(next, "", target.location.href);
}

export function readReloadStoryProgress(target: Window) {
  const navigation = target.performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
  if (navigation?.type !== "reload" && navigation?.type !== "back_forward") return null;

  const storedProgress = readStoredProgress(target);
  if (storedProgress !== null) return storedProgress;

  const entry = historyRecord(target)[STORY_HISTORY_KEY] as StoryHistoryEntry | undefined;
  return isCurrentStoryEntry(target, entry) ? entry.progress : null;
}
