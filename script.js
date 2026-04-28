(function () {
    'use strict';

    const STORAGE_KEY = 'todos.vanilla';

    const form = document.querySelector('#todo-form');
    const input = document.querySelector('#todo-input');
    const list = document.querySelector('#todo-list');
    const itemsLeft = document.querySelector('#items-left');
    const clearCompletedBtn = document.querySelector('#clear-completed');
    const filterButtons = document.querySelectorAll('.filter');

    let todos = loadTodos();
    let currentFilter = 'all';

    function loadTodos() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            const parsed = raw ? JSON.parse(raw) : [];
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            return [];
        }
    }

    function saveTodos() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
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
        if (!trimmed) {
            deleteTodo(id);
            return;
        }
        const todo = todos.find((t) => t.id === id);
        if (!todo) return;
        todo.text = trimmed;
        saveTodos();
        render();
    }

    function clearCompleted() {
        todos = todos.filter((t) => !t.completed);
        saveTodos();
        render();
    }

    function getVisibleTodos() {
        if (currentFilter === 'active') return todos.filter((t) => !t.completed);
        if (currentFilter === 'completed') return todos.filter((t) => t.completed);
        return todos;
    }

    function buildTodoElement(todo) {
        const li = document.createElement('li');
        li.className = 'todo-item' + (todo.completed ? ' completed' : '');
        li.dataset.id = todo.id;

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = todo.completed;
        checkbox.setAttribute('aria-label', 'Mark "' + todo.text + '" as ' + (todo.completed ? 'incomplete' : 'complete'));
        checkbox.addEventListener('change', () => toggleTodo(todo.id));

        const span = document.createElement('span');
        span.className = 'todo-text';
        span.textContent = todo.text;
        span.title = 'Double-click to edit';
        span.addEventListener('dblclick', () => startEdit(li, todo));

        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'delete-btn';
        deleteBtn.setAttribute('aria-label', 'Delete "' + todo.text + '"');
        deleteBtn.textContent = '×';
        deleteBtn.addEventListener('click', () => deleteTodo(todo.id));

        li.appendChild(checkbox);
        li.appendChild(span);
        li.appendChild(deleteBtn);
        return li;
    }

    function startEdit(li, todo) {
        const editInput = document.createElement('input');
        editInput.type = 'text';
        editInput.className = 'todo-edit';
        editInput.value = todo.text;
        editInput.maxLength = 200;

        const span = li.querySelector('.todo-text');
        li.replaceChild(editInput, span);
        editInput.focus();
        editInput.setSelectionRange(editInput.value.length, editInput.value.length);

        let committed = false;
        const commit = () => {
            if (committed) return;
            committed = true;
            updateTodoText(todo.id, editInput.value);
        };

        editInput.addEventListener('blur', commit);
        editInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                editInput.blur();
            } else if (e.key === 'Escape') {
                committed = true;
                render();
            }
        });
    }

    function render() {
        list.innerHTML = '';
        const visible = getVisibleTodos();

        if (visible.length === 0) {
            const empty = document.createElement('li');
            empty.className = 'empty-state';
            empty.textContent =
                todos.length === 0
                    ? 'Nothing here yet. Add your first todo above.'
                    : 'No ' + currentFilter + ' todos.';
            list.appendChild(empty);
        } else {
            const fragment = document.createDocumentFragment();
            visible.forEach((todo) => fragment.appendChild(buildTodoElement(todo)));
            list.appendChild(fragment);
        }

        const remaining = todos.filter((t) => !t.completed).length;
        itemsLeft.textContent = remaining + (remaining === 1 ? ' item left' : ' items left');

        const hasCompleted = todos.some((t) => t.completed);
        clearCompletedBtn.disabled = !hasCompleted;

        filterButtons.forEach((btn) => {
            btn.classList.toggle('active', btn.dataset.filter === currentFilter);
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
            currentFilter = btn.dataset.filter;
            render();
        });
    });

    render();
})();
