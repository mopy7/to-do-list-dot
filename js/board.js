import { loadBoard, saveBoard } from "./storage.js";

const COLUMN_IDS = ["todo", "in-progress", "done"];

export function initBoard() {
  const form = document.querySelector("[data-task-form]");
  const input = document.querySelector("[data-task-input]");
  const columnSelect = document.querySelector("[data-task-column]");
  const boardElement = document.querySelector(".board");
  const taskLists = getTaskListMap();
  const taskCounts = getTaskCountMap();

  if (!form || !input || !columnSelect || !boardElement) {
    return;
  }
  if (!hasAllColumns(taskLists) || !hasAllColumns(taskCounts)) {
    return;
  }

  let board = loadBoard();
  renderBoard(board, taskLists, taskCounts);

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const title = input.value.trim();
    const columnId = COLUMN_IDS.includes(columnSelect.value)
      ? columnSelect.value
      : "todo";
    if (!title) {
      input.focus();
      return;
    }

    board[columnId].unshift({
      id: createTaskId(),
      title,
    });

    saveBoard(board);
    renderBoard(board, taskLists, taskCounts);

    const nextColumn = columnId;
    form.reset();
    columnSelect.value = nextColumn;
    input.focus();
  });

  boardElement.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const deleteButton = target.closest("[data-delete-task]");
    if (!deleteButton) {
      return;
    }

    const taskCard = deleteButton.closest("[data-task-id]");
    if (!taskCard) {
      return;
    }

    const taskId = taskCard.dataset.taskId;
    const columnId = taskCard.dataset.taskColumn;
    if (!taskId || !columnId || !COLUMN_IDS.includes(columnId)) {
      return;
    }

    const previousLength = board[columnId].length;
    board[columnId] = board[columnId].filter((task) => task.id !== taskId);
    if (board[columnId].length === previousLength) {
      return;
    }

    saveBoard(board);
    renderBoard(board, taskLists, taskCounts);
  });
}

function renderBoard(board, taskLists, taskCounts) {
  for (const columnId of COLUMN_IDS) {
    const listElement = taskLists[columnId];
    const countElement = taskCounts[columnId];
    if (!listElement || !countElement) {
      continue;
    }

    listElement.replaceChildren();
    const tasks = Array.isArray(board[columnId]) ? board[columnId] : [];
    countElement.textContent = String(tasks.length);

    if (!tasks.length) {
      listElement.appendChild(createEmptyState());
      continue;
    }

    const fragment = document.createDocumentFragment();
    for (const task of tasks) {
      fragment.appendChild(createTaskCard(task, columnId));
    }
    listElement.appendChild(fragment);
  }
}

function createTaskCard(task, columnId) {
  const card = document.createElement("article");
  card.className = "task-card";
  card.dataset.taskId = task.id;
  card.dataset.taskColumn = columnId;

  const title = document.createElement("p");
  title.className = "task-title";
  title.textContent = task.title;

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "task-delete";
  deleteButton.dataset.deleteTask = "true";
  deleteButton.setAttribute("aria-label", `Delete task: ${task.title}`);
  deleteButton.textContent = "Delete";

  card.append(title, deleteButton);
  return card;
}

function createEmptyState() {
  const empty = document.createElement("p");
  empty.className = "task-empty";
  empty.textContent = "No tasks yet";
  return empty;
}

function getTaskListMap() {
  return {
    todo: document.querySelector('[data-task-list="todo"]'),
    "in-progress": document.querySelector('[data-task-list="in-progress"]'),
    done: document.querySelector('[data-task-list="done"]'),
  };
}

function getTaskCountMap() {
  return {
    todo: document.querySelector('[data-count="todo"]'),
    "in-progress": document.querySelector('[data-count="in-progress"]'),
    done: document.querySelector('[data-count="done"]'),
  };
}

function hasAllColumns(columnMap) {
  return COLUMN_IDS.every((columnId) => Boolean(columnMap[columnId]));
}

function createTaskId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}
