import { clamp01 } from "./scrollMath";

const STORY_HISTORY_KEY = "__wedInviStory";
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

export function writeStoryProgress(target: Window, progress: number | null) {
  const next = historyRecord(target);
  const current = next[STORY_HISTORY_KEY] as StoryHistoryEntry | undefined;

  if (progress === null) {
    if (!(STORY_HISTORY_KEY in next)) return;
    delete next[STORY_HISTORY_KEY];
  } else {
    const entry: StoryHistoryEntry = {
      version: STORY_HISTORY_VERSION,
      path: routeKey(target),
      progress: Number(clamp01(progress).toFixed(5)),
    };
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
  if (navigation?.type !== "reload") return null;

  const entry = historyRecord(target)[STORY_HISTORY_KEY] as StoryHistoryEntry | undefined;
  if (
    entry?.version !== STORY_HISTORY_VERSION
    || entry.path !== routeKey(target)
    || !Number.isFinite(entry.progress)
    || entry.progress < 0
    || entry.progress > 1
  ) return null;
  return entry.progress;
}
