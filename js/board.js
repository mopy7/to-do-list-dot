import { loadBoard, saveBoard } from "./storage.js";

const COLUMN_IDS = ["todo", "in-progress", "done"];
const PRIORITY_LEVELS = ["low", "medium", "high"];
const PRIORITY_LABELS = {
  low: "Low",
  medium: "Medium",
  high: "High",
};
const DEFAULT_PRIORITY = "medium";
const DND_MIME = "application/x-kanban-task";
const MAX_TITLE_LENGTH = 120;
const DROP_SETTLE_DURATION_MS = 180;

export function initBoard() {
  const form = document.querySelector("[data-task-form]");
  const input = document.querySelector("[data-task-input]");
  const columnSelect = document.querySelector("[data-task-column]");
  const prioritySelect = document.querySelector("[data-task-priority]");
  const boardElement = document.querySelector(".board");
  const taskLists = getTaskListMap();
  const taskCounts = getTaskCountMap();

  if (!form || !input || !columnSelect || !prioritySelect || !boardElement) {
    return;
  }
  if (!hasAllColumns(taskLists) || !hasAllColumns(taskCounts)) {
    return;
  }

  let board = loadBoard();
  let draggingTaskId = "";
  let draggingSourceColumn = "";
  const editState = { taskId: "", columnId: "" };
  renderBoard(board, taskLists, taskCounts, editState);

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const title = input.value.trim().slice(0, MAX_TITLE_LENGTH);
    const columnId = parseColumnId(columnSelect.value);
    const priority = normalizePriority(prioritySelect.value);
    if (!title) {
      input.focus();
      return;
    }

    board[columnId].unshift({
      id: createTaskId(),
      title,
      priority,
    });

    saveBoard(board);
    renderBoard(board, taskLists, taskCounts, editState);

    form.reset();
    columnSelect.value = columnId;
    prioritySelect.value = DEFAULT_PRIORITY;
    input.focus();
  });

  boardElement.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const cancelButton = target.closest("[data-cancel-edit]");
    if (cancelButton) {
      setEditingTask(editState);
      renderBoard(board, taskLists, taskCounts, editState);
      return;
    }

    const editButton = target.closest("[data-edit-task]");
    if (editButton) {
      const taskCard = editButton.closest("[data-task-id]");
      if (!(taskCard instanceof HTMLElement)) {
        return;
      }

      const taskId = taskCard.dataset.taskId;
      const preferredColumn = taskCard.dataset.taskColumn;
      if (!taskId) {
        return;
      }

      const taskReference = findTaskReference(board, taskId, preferredColumn);
      if (!taskReference) {
        return;
      }

      setEditingTask(editState, taskReference.task.id, taskReference.columnId);
      renderBoard(board, taskLists, taskCounts, editState);
      focusTaskEditor(taskReference.task.id);
      return;
    }

    const deleteButton = target.closest("[data-delete-task]");
    if (!deleteButton) {
      return;
    }

    const taskCard = deleteButton.closest("[data-task-id]");
    if (!(taskCard instanceof HTMLElement)) {
      return;
    }

    const taskId = taskCard.dataset.taskId;
    const preferredColumn = taskCard.dataset.taskColumn;
    if (!taskId) {
      return;
    }

    const taskReference = findTaskReference(board, taskId, preferredColumn);
    if (!taskReference) {
      return;
    }

    board[taskReference.columnId].splice(taskReference.index, 1);
    if (editState.taskId === taskId) {
      setEditingTask(editState);
    }

    saveBoard(board);
    renderBoard(board, taskLists, taskCounts, editState);
  });

  boardElement.addEventListener("submit", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLFormElement)) {
      return;
    }
    if (!target.matches("[data-edit-form]")) {
      return;
    }

    event.preventDefault();

    const taskId =
      typeof target.dataset.editForm === "string"
        ? target.dataset.editForm.trim()
        : "";
    const preferredColumn =
      typeof target.dataset.editColumn === "string"
        ? target.dataset.editColumn.trim()
        : "";
    const editInput = target.querySelector("[data-edit-input]");
    const editPriority = target.querySelector("[data-edit-priority]");
    if (!(editInput instanceof HTMLInputElement)) {
      return;
    }

    const nextTitle = editInput.value.trim().slice(0, MAX_TITLE_LENGTH);
    const nextPriority =
      editPriority instanceof HTMLSelectElement
        ? normalizePriority(editPriority.value)
        : DEFAULT_PRIORITY;
    if (!nextTitle) {
      editInput.focus();
      return;
    }

    const taskReference = findTaskReference(board, taskId, preferredColumn);
    if (!taskReference) {
      setEditingTask(editState);
      renderBoard(board, taskLists, taskCounts, editState);
      return;
    }

    taskReference.task.title = nextTitle;
    taskReference.task.priority = nextPriority;
    saveBoard(board);
    setEditingTask(editState);
    renderBoard(board, taskLists, taskCounts, editState);
  });

  for (const columnId of COLUMN_IDS) {
    const listElement = taskLists[columnId];
    if (!listElement) {
      continue;
    }

    listElement.addEventListener("dragenter", (event) => {
      const targetColumn = listElement.dataset.taskList;
      if (!targetColumn || !isDropAllowed(targetColumn, draggingSourceColumn)) {
        return;
      }
      event.preventDefault();
      listElement.classList.add("is-drop-target");
    });

    listElement.addEventListener("dragover", (event) => {
      const targetColumn = listElement.dataset.taskList;
      if (!targetColumn || !isDropAllowed(targetColumn, draggingSourceColumn)) {
        return;
      }
      event.preventDefault();
      listElement.classList.add("is-drop-target");
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = "move";
      }
    });

    listElement.addEventListener("dragleave", (event) => {
      const relatedTarget = event.relatedTarget;
      if (relatedTarget instanceof Node && listElement.contains(relatedTarget)) {
        return;
      }
      listElement.classList.remove("is-drop-target");
    });

    listElement.addEventListener("drop", (event) => {
      event.preventDefault();
      clearDropTargets(taskLists);

      const targetColumn = listElement.dataset.taskList;
      if (!targetColumn || !COLUMN_IDS.includes(targetColumn)) {
        return;
      }

      const payload = readDragPayload(
        event.dataTransfer,
        draggingTaskId,
        draggingSourceColumn
      );
      if (!payload) {
        return;
      }
      if (payload.sourceColumn === targetColumn) {
        return;
      }

      const movedTask = detachTask(board, payload.taskId, payload.sourceColumn);
      if (!movedTask) {
        return;
      }

      board[targetColumn].unshift(movedTask);
      if (editState.taskId === movedTask.id) {
        editState.columnId = targetColumn;
      }

      saveBoard(board);
      renderBoard(board, taskLists, taskCounts, editState);
      applyDropSettleAnimation(taskLists, targetColumn, movedTask.id);
    });
  }

  boardElement.addEventListener("dragstart", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }
    if (target.closest("button, input, select, textarea, form")) {
      return;
    }

    const taskCard = target.closest("[data-task-id]");
    if (!(taskCard instanceof HTMLElement)) {
      return;
    }

    const taskId = taskCard.dataset.taskId;
    const sourceColumn = taskCard.dataset.taskColumn;
    if (!taskId || !sourceColumn || !COLUMN_IDS.includes(sourceColumn)) {
      return;
    }
    if (!event.dataTransfer) {
      return;
    }

    draggingTaskId = taskId;
    draggingSourceColumn = sourceColumn;

    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", taskId);
    event.dataTransfer.setData(
      DND_MIME,
      JSON.stringify({
        taskId,
        sourceColumn,
      })
    );

    requestAnimationFrame(() => {
      taskCard.classList.add("is-dragging");
      taskCard.classList.add("is-lifted");
    });
  });

  boardElement.addEventListener("dragend", (event) => {
    const target = event.target;
    if (target instanceof HTMLElement) {
      target.classList.remove("is-dragging");
      target.classList.remove("is-lifted");
    }

    draggingTaskId = "";
    draggingSourceColumn = "";
    clearDropTargets(taskLists);
  });
}

function renderBoard(board, taskLists, taskCounts, editState) {
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
      fragment.appendChild(createTaskCard(task, columnId, editState));
    }
    listElement.appendChild(fragment);
  }
}

function createTaskCard(task, columnId, editState) {
  const isEditing = editState.taskId === task.id && editState.columnId === columnId;
  if (isEditing) {
    return createTaskEditorCard(task, columnId);
  }

  const priority = normalizePriority(task.priority);

  const card = document.createElement("article");
  card.className = "task-card";
  card.draggable = true;
  card.dataset.taskId = task.id;
  card.dataset.taskColumn = columnId;

  const content = document.createElement("div");
  content.className = "task-main";

  const title = document.createElement("p");
  title.className = "task-title";
  title.textContent = task.title;

  const badge = document.createElement("span");
  badge.className = `task-priority-badge is-${priority}`;
  badge.textContent = PRIORITY_LABELS[priority];

  const actions = document.createElement("div");
  actions.className = "task-actions";

  const editButton = document.createElement("button");
  editButton.type = "button";
  editButton.className = "task-action-btn";
  editButton.dataset.editTask = "true";
  editButton.setAttribute("aria-label", `Edit task: ${task.title}`);
  editButton.textContent = "Edit";

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "task-action-btn task-delete";
  deleteButton.dataset.deleteTask = "true";
  deleteButton.setAttribute("aria-label", `Delete task: ${task.title}`);
  deleteButton.textContent = "Delete";

  content.append(title, badge);
  actions.append(editButton, deleteButton);
  card.append(content, actions);
  return card;
}

function createTaskEditorCard(task, columnId) {
  const priority = normalizePriority(task.priority);

  const card = document.createElement("article");
  card.className = "task-card is-editing";
  card.draggable = false;
  card.dataset.taskId = task.id;
  card.dataset.taskColumn = columnId;

  const editForm = document.createElement("form");
  editForm.className = "task-edit-form";
  editForm.dataset.editForm = task.id;
  editForm.dataset.editColumn = columnId;

  const fields = document.createElement("div");
  fields.className = "task-edit-fields";

  const editInput = document.createElement("input");
  editInput.type = "text";
  editInput.className = "task-edit-input";
  editInput.dataset.editInput = "true";
  editInput.maxLength = MAX_TITLE_LENGTH;
  editInput.value = task.title;
  editInput.required = true;

  const editPriority = document.createElement("select");
  editPriority.className = "task-edit-priority";
  editPriority.dataset.editPriority = "true";
  for (const level of PRIORITY_LEVELS) {
    editPriority.append(createPriorityOption(level, level === priority));
  }

  const actions = document.createElement("div");
  actions.className = "task-edit-actions";

  const saveButton = document.createElement("button");
  saveButton.type = "submit";
  saveButton.className = "task-action-btn";
  saveButton.textContent = "Save";

  const cancelButton = document.createElement("button");
  cancelButton.type = "button";
  cancelButton.className = "task-action-btn";
  cancelButton.dataset.cancelEdit = "true";
  cancelButton.textContent = "Cancel";

  fields.append(editInput, editPriority);
  actions.append(saveButton, cancelButton);
  editForm.append(fields, actions);
  card.append(editForm);
  return card;
}

function createPriorityOption(priority, isSelected) {
  const option = document.createElement("option");
  option.value = priority;
  option.textContent = PRIORITY_LABELS[priority];
  option.selected = isSelected;
  return option;
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

function clearDropTargets(taskLists) {
  for (const columnId of COLUMN_IDS) {
    const listElement = taskLists[columnId];
    if (!listElement) {
      continue;
    }
    listElement.classList.remove("is-drop-target");
  }
}

function readDragPayload(dataTransfer, fallbackTaskId, fallbackSourceColumn) {
  let taskId = fallbackTaskId;
  let sourceColumn = fallbackSourceColumn;

  if (dataTransfer) {
    const rawPayload = dataTransfer.getData(DND_MIME);
    if (rawPayload) {
      try {
        const payload = JSON.parse(rawPayload);
        if (payload && typeof payload === "object") {
          const payloadTaskId =
            typeof payload.taskId === "string" ? payload.taskId.trim() : "";
          const payloadSourceColumn =
            typeof payload.sourceColumn === "string"
              ? payload.sourceColumn.trim()
              : "";
          if (payloadTaskId) {
            taskId = payloadTaskId;
          }
          if (COLUMN_IDS.includes(payloadSourceColumn)) {
            sourceColumn = payloadSourceColumn;
          }
        }
      } catch {
        // Ignore malformed drag payload and use fallback values.
      }
    }

    if (!taskId) {
      const textFallback = dataTransfer.getData("text/plain");
      if (typeof textFallback === "string" && textFallback.trim()) {
        taskId = textFallback.trim();
      }
    }
  }

  if (!taskId || !sourceColumn || !COLUMN_IDS.includes(sourceColumn)) {
    return null;
  }
  return { taskId, sourceColumn };
}

function detachTask(board, taskId, preferredColumn) {
  const orderedColumns = COLUMN_IDS.includes(preferredColumn)
    ? [preferredColumn, ...COLUMN_IDS.filter((id) => id !== preferredColumn)]
    : [...COLUMN_IDS];

  for (const columnId of orderedColumns) {
    const tasks = board[columnId];
    if (!Array.isArray(tasks)) {
      continue;
    }
    const taskIndex = tasks.findIndex((task) => task.id === taskId);
    if (taskIndex === -1) {
      continue;
    }
    const [task] = tasks.splice(taskIndex, 1);
    return task || null;
  }

  return null;
}

function findTaskReference(board, taskId, preferredColumn) {
  const orderedColumns = COLUMN_IDS.includes(preferredColumn)
    ? [preferredColumn, ...COLUMN_IDS.filter((id) => id !== preferredColumn)]
    : [...COLUMN_IDS];

  for (const columnId of orderedColumns) {
    const tasks = board[columnId];
    if (!Array.isArray(tasks)) {
      continue;
    }
    const index = tasks.findIndex((task) => task.id === taskId);
    if (index === -1) {
      continue;
    }
    return {
      task: tasks[index],
      columnId,
      index,
    };
  }

  return null;
}

function isDropAllowed(targetColumn, sourceColumn) {
  return COLUMN_IDS.includes(targetColumn) && targetColumn !== sourceColumn;
}

function setEditingTask(editState, taskId = "", columnId = "") {
  editState.taskId = taskId;
  editState.columnId = columnId;
}

function focusTaskEditor(taskId) {
  const taskCards = document.querySelectorAll("[data-task-id]");
  for (const card of taskCards) {
    if (!(card instanceof HTMLElement) || card.dataset.taskId !== taskId) {
      continue;
    }
    const input = card.querySelector("[data-edit-input]");
    if (!(input instanceof HTMLInputElement)) {
      return;
    }
    input.focus();
    input.select();
    return;
  }
}

function parseColumnId(value) {
  return COLUMN_IDS.includes(value) ? value : "todo";
}

function normalizePriority(value) {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : "";
  return PRIORITY_LEVELS.includes(normalized) ? normalized : DEFAULT_PRIORITY;
}

function applyDropSettleAnimation(taskLists, columnId, taskId) {
  const listElement = taskLists[columnId];
  if (!(listElement instanceof HTMLElement)) {
    return;
  }

  const taskCards = listElement.querySelectorAll("[data-task-id]");
  for (const card of taskCards) {
    if (!(card instanceof HTMLElement) || card.dataset.taskId !== taskId) {
      continue;
    }

    card.classList.remove("is-settling");
    requestAnimationFrame(() => {
      card.classList.add("is-settling");
      window.setTimeout(() => {
        card.classList.remove("is-settling");
      }, DROP_SETTLE_DURATION_MS);
    });
    return;
  }
}
