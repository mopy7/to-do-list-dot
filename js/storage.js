const BOARD_STORAGE_KEY = "kanban-board-v1";
const COLUMN_IDS = ["todo", "in-progress", "done"];
const PRIORITY_LEVELS = ["low", "medium", "high"];
const DEFAULT_PRIORITY = "medium";

export function createEmptyBoard() {
  return {
    todo: [],
    "in-progress": [],
    done: [],
  };
}

export function loadBoard() {
  const raw = localStorage.getItem(BOARD_STORAGE_KEY);
  if (!raw) {
    return createEmptyBoard();
  }

  try {
    const parsed = JSON.parse(raw);
    return sanitizeBoard(parsed);
  } catch {
    return createEmptyBoard();
  }
}

export function saveBoard(board) {
  const sanitized = sanitizeBoard(board);
  localStorage.setItem(BOARD_STORAGE_KEY, JSON.stringify(sanitized));
}

function sanitizeBoard(value) {
  const nextBoard = createEmptyBoard();
  if (!value || typeof value !== "object") {
    return nextBoard;
  }

  for (const columnId of COLUMN_IDS) {
    const rawTasks = Array.isArray(value[columnId]) ? value[columnId] : [];
    nextBoard[columnId] = rawTasks
      .map(sanitizeTask)
      .filter((task) => task !== null);
  }
  return nextBoard;
}

function sanitizeTask(value) {
  if (!value || typeof value !== "object") {
    return null;
  }
  const id = typeof value.id === "string" ? value.id.trim() : "";
  const title = typeof value.title === "string" ? value.title.trim() : "";
  const priority = normalizePriority(value.priority);
  if (!id || !title) {
    return null;
  }
  return { id, title: title.slice(0, 120), priority };
}

function normalizePriority(value) {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : "";
  return PRIORITY_LEVELS.includes(normalized) ? normalized : DEFAULT_PRIORITY;
}
