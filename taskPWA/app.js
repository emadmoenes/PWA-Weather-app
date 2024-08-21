let todos = [];
let db;
let editingId = null;

document
  .getElementById("add-btn")
  .addEventListener("click", handleAddOrEditTodo);

function openDB() {
  let request = indexedDB.open("todoDB", 1);

  request.onupgradeneeded = function (event) {
    db = event.target.result;
    let objectStore = db.createObjectStore("todos", {
      keyPath: "id",
      autoIncrement: true,
    });
    objectStore.createIndex("time", "time", { unique: false });
  };

  request.onsuccess = function (event) {
    db = event.target.result;
    renderTodos();
  };

  request.onerror = function (event) {
    console.error("Database error: " + event.target.errorCode);
  };
}

function handleAddOrEditTodo() {
  if (editingId !== null) {
    saveEditedTodo();
  } else {
    addTodo();
  }
}

function addTodo() {
  const todoInput = document.getElementById("todo-input");
  const todoTime = document.getElementById("todo-time");
  const todoText = todoInput.value.trim();
  const todoDateTime = new Date(todoTime.value).getTime();

  if (todoText !== "" && todoDateTime) {
    const newTodo = {
      text: todoText,
      time: todoDateTime,
      completed: false,
    };

    let transaction = db.transaction(["todos"], "readwrite");
    let objectStore = transaction.objectStore("todos");
    objectStore.add(newTodo);

    transaction.oncomplete = function () {
      todos.push(newTodo);
      renderTodos();
      clearForm();
    };

    transaction.onerror = function () {
      console.error("Transaction error");
    };
  }
}

function renderTodos() {
  const todoList = document.getElementById("todo-list");
  todoList.innerHTML = "";

  let transaction = db.transaction(["todos"], "readonly");
  let objectStore = transaction.objectStore("todos");
  let request = objectStore.openCursor();

  request.onsuccess = function (event) {
    let cursor = event.target.result;
    if (cursor) {
      const todo = cursor.value;
      const li = document.createElement("li");
      li.className = `todo-item ${todo.completed ? "completed" : ""}`;
      li.innerHTML = `
        <span>${todo.text}</span>
        <div class="actions">
          <button class="edit" onclick="editTodo(${cursor.key})">Edit</button>
          <button class="delete" onclick="deleteTodo(${cursor.key})">Delete</button>
        </div>
      `;
      todoList.appendChild(li);

      if (!todo.completed && new Date().getTime() >= todo.time) {
        notifyUser(todo.text);
        completeTodo(cursor.key);
      }

      cursor.continue();
    }
  };
}

function completeTodo(id) {
  let transaction = db.transaction(["todos"], "readwrite");
  let objectStore = transaction.objectStore("todos");
  let request = objectStore.get(id);

  request.onsuccess = function (event) {
    let todo = event.target.result;
    todo.completed = true;
    objectStore.put(todo);
    renderTodos();
  };
}

function deleteTodo(id) {
  let transaction = db.transaction(["todos"], "readwrite");
  let objectStore = transaction.objectStore("todos");
  objectStore.delete(id);

  transaction.oncomplete = function () {
    renderTodos();
  };
}

function editTodo(id) {
  let transaction = db.transaction(["todos"], "readonly");
  let objectStore = transaction.objectStore("todos");
  let request = objectStore.get(id);

  request.onsuccess = function (event) {
    let todo = event.target.result;

    document.getElementById("todo-input").value = todo.text;
    document.getElementById("todo-time").value = new Date(todo.time)
      .toISOString()
      .slice(0, 16);

    editingId = id;
    document.getElementById("add-btn").innerText = "Save";
  };
}

function saveEditedTodo() {
  const todoInput = document.getElementById("todo-input");
  const todoTime = document.getElementById("todo-time");
  const todoText = todoInput.value.trim();
  const todoDateTime = new Date(todoTime.value).getTime();

  if (todoText !== "" && todoDateTime) {
    let transaction = db.transaction(["todos"], "readwrite");
    let objectStore = transaction.objectStore("todos");

    let request = objectStore.get(editingId);
    request.onsuccess = function (event) {
      let todo = event.target.result;

      todo.text = todoText;
      todo.time = todoDateTime;
      todo.completed = false;

      let updateRequest = objectStore.put(todo);

      updateRequest.onsuccess = function () {
        renderTodos();
        clearForm();
      };

      updateRequest.onerror = function () {
        console.error("Update failed");
      };
    };
  }
}

function clearForm() {
  document.getElementById("todo-input").value = "";
  document.getElementById("todo-time").value = "";
  editingId = null;
  document.getElementById("add-btn").innerText = "Add";
}

function notifyUser(task) {
  if (Notification.permission === "granted") {
    new Notification("Task Due!", {
      body: `Your task "${task}" is due now.`,
      icon: "icon-192x192.png",
    });
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        new Notification("Task Due!", {
          body: `Your task "${task}" is due now.`,
          icon: "icon-192x192.png",
        });
      }
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  openDB();
  if ("Notification" in window && navigator.serviceWorker) {
    Notification.requestPermission();
  }
});

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
