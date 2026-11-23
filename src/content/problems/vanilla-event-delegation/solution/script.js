/**
 * Todo list wiring. This file is complete and read-only: it uses YOUR
 * onClickMatching() helper from delegate.js for every list interaction.
 * Two listeners on #task-list handle every task, including tasks added later.
 */
import { onClickMatching } from './delegate.js';

const input = document.getElementById('new-task');
const addButton = document.getElementById('add-task');
const list = document.getElementById('task-list');
const status = document.getElementById('status');
let nextId = list.children.length + 1;

function createTask(text) {
  const item = document.createElement('li');
  item.className = 'task';
  item.dataset.id = String(nextId++);

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'task-toggle';
  toggle.setAttribute('aria-pressed', 'false');
  toggle.textContent = text; // textContent, never innerHTML: user input is not markup

  const remove = document.createElement('button');
  remove.type = 'button';
  remove.className = 'task-delete';
  remove.setAttribute('aria-label', `Delete ${text}`);
  const icon = document.createElement('span');
  icon.className = 'icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = '×';
  remove.append(icon);

  item.append(toggle, remove);
  return item;
}

function addTask() {
  const text = input.value.trim();
  if (!text) return;
  list.append(createTask(text));
  input.value = '';
  input.focus();
  status.textContent = `Added "${text}".`;
}

addButton.addEventListener('click', addTask);
input.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') addTask();
});

// Delegated: one listener for every current and future delete button.
onClickMatching(list, '.task-delete', (button) => {
  const item = button.closest('.task');
  const text = item.querySelector('.task-toggle').textContent;
  // Keep keyboard users in the list: focus the next task, else the previous, else the input.
  const neighbour = item.nextElementSibling || item.previousElementSibling;
  item.remove();
  (neighbour ? neighbour.querySelector('.task-delete') : input).focus();
  status.textContent = `Deleted "${text}".`;
});

// Delegated: one listener for every current and future toggle button.
onClickMatching(list, '.task-toggle', (toggle) => {
  const done = toggle.getAttribute('aria-pressed') !== 'true';
  toggle.setAttribute('aria-pressed', String(done));
});
