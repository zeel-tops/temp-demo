(function () {
  'use strict';

  // localStorage key under which the todo list is persisted.
  const STORAGE_KEY = 'todos.vanilla';

  const form = document.getElementById('todo-form');
  const input = document.getElementById('todo-input');
  const list = document.getElementById('todo-list');
  const itemsLeft = document.getElementById('items-left');
  const clearCompletedBtn = document.getElementById('clear-completed');
  const filterButtons = document.querySelectorAll('.filter');

  // Initialize state from localStorage so todos survive page reloads.
  let todos = loadTodos();
  let filter = 'all';

  // Read the persisted todos JSON from localStorage and parse it.
  // Falls back to an empty list if nothing is stored or the data is corrupt.
  function loadTodos() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.warn('Failed to load todos from localStorage:', err);
      return [];
    }
  }

  // Serialize the current todos array and write it to localStorage.
  // Called after every mutation so storage stays in sync with the UI.
  function saveTodos() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    } catch (err) {
      console.warn('Failed to save todos to localStorage:', err);
    }
  }

  function createId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function addTodo(text) {
    const trimmed = text.trim();
    if (!trimmed) return;
    todos.push({ id: createId(), text: trimmed, completed: false });
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

  function updateTodoText(id, text) {
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

  function getFilteredTodos() {
    if (filter === 'active') return todos.filter((t) => !t.completed);
    if (filter === 'completed') return todos.filter((t) => t.completed);
    return todos;
  }

  function startEditing(li, todo) {
    const textEl = li.querySelector('.todo-text');
    const editInput = document.createElement('input');
    editInput.type = 'text';
    editInput.className = 'todo-edit';
    editInput.value = todo.text;

    const finish = (commit) => {
      if (commit) {
        updateTodoText(todo.id, editInput.value);
      } else {
        render();
      }
    };

    editInput.addEventListener('blur', () => finish(true));
    editInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        editInput.blur();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        finish(false);
      }
    });

    li.replaceChild(editInput, textEl);
    editInput.focus();
    editInput.setSelectionRange(editInput.value.length, editInput.value.length);
  }

  function renderTodoItem(todo) {
    const li = document.createElement('li');
    li.className = 'todo-item' + (todo.completed ? ' completed' : '');
    li.dataset.id = todo.id;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'todo-checkbox';
    checkbox.checked = todo.completed;
    checkbox.setAttribute('aria-label', 'Mark as ' + (todo.completed ? 'incomplete' : 'complete'));
    checkbox.addEventListener('change', () => toggleTodo(todo.id));

    const text = document.createElement('span');
    text.className = 'todo-text';
    text.textContent = todo.text;
    text.title = 'Double-click to edit';
    text.addEventListener('dblclick', () => startEditing(li, todo));

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'todo-delete';
    deleteBtn.setAttribute('aria-label', 'Delete todo');
    deleteBtn.textContent = '×';
    deleteBtn.addEventListener('click', () => deleteTodo(todo.id));

    li.appendChild(checkbox);
    li.appendChild(text);
    li.appendChild(deleteBtn);
    return li;
  }

  function render() {
    list.innerHTML = '';
    const visible = getFilteredTodos();

    if (visible.length === 0) {
      const empty = document.createElement('li');
      empty.className = 'empty';
      empty.textContent =
        filter === 'completed'
          ? 'No completed todos.'
          : filter === 'active'
          ? 'Nothing active — nice!'
          : 'No todos yet. Add one above.';
      list.appendChild(empty);
    } else {
      const fragment = document.createDocumentFragment();
      visible.forEach((todo) => fragment.appendChild(renderTodoItem(todo)));
      list.appendChild(fragment);
    }

    const remaining = todos.filter((t) => !t.completed).length;
    itemsLeft.textContent = remaining + (remaining === 1 ? ' item left' : ' items left');

    const hasCompleted = todos.some((t) => t.completed);
    clearCompletedBtn.style.visibility = hasCompleted ? 'visible' : 'hidden';

    filterButtons.forEach((btn) => {
      const active = btn.dataset.filter === filter;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
    });
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    addTodo(input.value);
    input.value = '';
    input.focus();
  });

  clearCompletedBtn.addEventListener('click', clearCompleted);

  filterButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      filter = btn.dataset.filter;
      render();
    });
  });

  render();
})();
