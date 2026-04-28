(function () {
  "use strict";

  const STORAGE_KEY = "todos.vanilla.v1";

  const form = document.querySelector("#todo-form");
  const input = document.querySelector("#todo-input");
  const list = document.querySelector("#todo-list");
  const countEl = document.querySelector("#todo-count");
  const clearCompletedBtn = document.querySelector("#clear-completed");
  const filterButtons = document.querySelectorAll(".filter");

  let todos = loadTodos();
  let filter = "all";

  function loadTodos() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function saveTodos() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  }

  function createTodo(text) {
    return {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      text: text.trim(),
      completed: false,
    };
  }

  function addTodo(text) {
    const trimmed = text.trim();
    if (!trimmed) return;
    todos.push(createTodo(trimmed));
    saveTodos();
    render();
  }

  function toggleTodo(id) {
    const todo = todos.find((t) => t.id === id);
    if (!todo) return;
    todo.completed = !todo.completed;
    saveTodos();
    render();
  }

  function deleteTodo(id) {
    todos = todos.filter((t) => t.id !== id);
    saveTodos();
    render();
  }

  function updateTodo(id, text) {
    const trimmed = text.trim();
    const todo = todos.find((t) => t.id === id);
    if (!todo) return;
    if (!trimmed) {
      deleteTodo(id);
      return;
    }
    todo.text = trimmed;
    saveTodos();
    render();
  }

  function clearCompleted() {
    todos = todos.filter((t) => !t.completed);
    saveTodos();
    render();
  }

  function setFilter(next) {
    filter = next;
    filterButtons.forEach((btn) => {
      const isActive = btn.dataset.filter === filter;
      btn.classList.toggle("active", isActive);
      btn.setAttribute("aria-selected", isActive ? "true" : "false");
    });
    render();
  }

  function getVisibleTodos() {
    if (filter === "active") return todos.filter((t) => !t.completed);
    if (filter === "completed") return todos.filter((t) => t.completed);
    return todos;
  }

  function startEditing(li, todo) {
    const textSpan = li.querySelector(".todo-text");
    const editInput = document.createElement("input");
    editInput.type = "text";
    editInput.value = todo.text;
    editInput.className = "todo-edit-input";
    editInput.maxLength = 200;

    li.replaceChild(editInput, textSpan);
    editInput.focus();
    editInput.setSelectionRange(editInput.value.length, editInput.value.length);

    let committed = false;
    const commit = () => {
      if (committed) return;
      committed = true;
      updateTodo(todo.id, editInput.value);
    };
    const cancel = () => {
      if (committed) return;
      committed = true;
      render();
    };

    editInput.addEventListener("blur", commit);
    editInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        editInput.blur();
      } else if (e.key === "Escape") {
        e.preventDefault();
        cancel();
      }
    });
  }

  function renderItem(todo) {
    const li = document.createElement("li");
    li.className = "todo-item" + (todo.completed ? " completed" : "");
    li.dataset.id = todo.id;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "todo-checkbox";
    checkbox.checked = todo.completed;
    checkbox.setAttribute("aria-label", "Mark as complete");
    checkbox.addEventListener("change", () => toggleTodo(todo.id));

    const text = document.createElement("span");
    text.className = "todo-text";
    text.textContent = todo.text;
    text.title = "Double-click to edit";
    text.addEventListener("dblclick", () => startEditing(li, todo));

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "todo-delete";
    deleteBtn.textContent = "Delete";
    deleteBtn.setAttribute("aria-label", "Delete todo");
    deleteBtn.addEventListener("click", () => deleteTodo(todo.id));

    li.appendChild(checkbox);
    li.appendChild(text);
    li.appendChild(deleteBtn);
    return li;
  }

  function render() {
    list.replaceChildren();
    const visible = getVisibleTodos();

    if (visible.length === 0) {
      const empty = document.createElement("li");
      empty.className = "todo-empty";
      empty.textContent =
        filter === "completed"
          ? "No completed todos."
          : filter === "active"
            ? "No active todos."
            : "No todos yet — add one above.";
      list.appendChild(empty);
    } else {
      const fragment = document.createDocumentFragment();
      visible.forEach((todo) => fragment.appendChild(renderItem(todo)));
      list.appendChild(fragment);
    }

    const remaining = todos.filter((t) => !t.completed).length;
    countEl.textContent = `${remaining} ${remaining === 1 ? "item" : "items"} left`;

    const hasCompleted = todos.some((t) => t.completed);
    clearCompletedBtn.disabled = !hasCompleted;
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    addTodo(input.value);
    input.value = "";
    input.focus();
  });

  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => setFilter(btn.dataset.filter));
  });

  clearCompletedBtn.addEventListener("click", clearCompleted);

  render();
})();
