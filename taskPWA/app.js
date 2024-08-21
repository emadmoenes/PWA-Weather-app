let todos = JSON.parse(localStorage.getItem("todos")) || [];

document.getElementById("add-btn").addEventListener("click", addTodo);

function addTodo() {
  const todoInput = document.getElementById("todo-input");
  const todoText = todoInput.value.trim();

  if (todoText !== "") {
    const newTodo = {
      id: Date.now(),
      text: todoText,
      isEditing: false,
    };

    todos.push(newTodo);
    localStorage.setItem("todos", JSON.stringify(todos));
    renderTodos();
    todoInput.value = "";
  }
}

function editTodo(id) {
  todos = todos.map((todo) => {
    if (todo.id === id) {
      todo.isEditing = !todo.isEditing;
    }
    return todo;
  });
  localStorage.setItem("todos", JSON.stringify(todos));
  renderTodos();
}

function updateTodoText(id, newText) {
  todos = todos.map((todo) => {
    if (todo.id === id) {
      todo.text = newText;
      todo.isEditing = false;
    }
    return todo;
  });
  localStorage.setItem("todos", JSON.stringify(todos));
  renderTodos();
}

function deleteTodo(id) {
  todos = todos.filter((todo) => todo.id !== id);
  localStorage.setItem("todos", JSON.stringify(todos));
  renderTodos();
}

function renderTodos() {
  const todoList = document.getElementById("todo-list");
  todoList.innerHTML = "";

  todos.forEach((todo) => {
    const li = document.createElement("li");
    li.className = "todo-item";
    li.innerHTML = `
            ${
              todo.isEditing
                ? `<input type="text" value="${todo.text}" onblur="updateTodoText(${todo.id}, this.value)">`
                : `<input type="text" value="${todo.text}" disabled>`
            }
            <div class="actions">
                <button class="edit" onclick="editTodo(${todo.id})">${
      todo.isEditing ? "Save" : "Edit"
    }</button>
                <button class="delete" onclick="deleteTodo(${
                  todo.id
                })">Delete</button>
            </div>
        `;
    todoList.appendChild(li);
  });
}

document.addEventListener("DOMContentLoaded", renderTodos);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", function () {
    navigator.serviceWorker.register("./sw.js").then(
      function (registration) {
        console.log(
          "ServiceWorker registration successful with scope: ",
          registration.scope
        );
      },
      function (err) {
        console.log("ServiceWorker registration failed: ", err);
      }
    );
  });
}
