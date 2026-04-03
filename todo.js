const inputBox = document.getElementById("input-box");
const listcontainer = document.getElementById("list-container");
const timeInput = document.getElementById("time");
const submit = document.getElementById("submit");

const API_BASE_URL = "http://localhost:5000";
const token = localStorage.getItem("token");

// Check login
if (!token) {
  alert("Please login first to use To-Do List.");
  window.location.href = "login.html";
}

// Load tasks when page opens
document.addEventListener("DOMContentLoaded", () => {
  fetchTodos();
});

// Add task on Enter key
inputBox.addEventListener("keypress", function (e) {
  if (e.key === "Enter") {
    addTask();
  }
});

// Add task function
async function addTask() {
  const title = inputBox.value.trim();
  const timeValue = timeInput.value;

  if (title === "") {
    alert("You must write something!");
    return;
  }

  // Time ko title ke saath same UI style me store karenge
  const finalTitle = timeValue ? `${timeValue} ${title}` : title;

  try {
    submit.disabled = true;
    submit.innerText = "Adding...";

    const response = await fetch(`${API_BASE_URL}/api/todos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: finalTitle,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to add task");
    }

    inputBox.value = "";
    timeInput.value = "";

    fetchTodos(); // Refresh list from backend
  } catch (error) {
    console.error("Add Task Error:", error);
    alert(error.message || "Something went wrong while adding task.");
  } finally {
    submit.disabled = false;
    submit.innerText = "Add";
  }
}

// Fetch all todos
async function fetchTodos() {
  try {
    listcontainer.innerHTML = "<li>Loading tasks...</li>";

    const response = await fetch(`${API_BASE_URL}/api/todos`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch tasks");
    }

    renderTodos(data);
  } catch (error) {
    console.error("Fetch Todos Error:", error);

    if (error.message.toLowerCase().includes("token") || error.message.toLowerCase().includes("invalid")) {
      alert("Session expired. Please login again.");
      localStorage.removeItem("token");
      window.location.href = "login.html";
      return;
    }

    listcontainer.innerHTML = "<li>Failed to load tasks.</li>";
  }
}

// Render todos in same old UI style
function renderTodos(todos) {
  listcontainer.innerHTML = "";

  if (!todos || todos.length === 0) {
    listcontainer.innerHTML = "<li>No tasks yet. Add your first task 🚀</li>";
    return;
  }

  todos.forEach((todo) => {
    const li = document.createElement("li");
    li.textContent = todo.title;
    li.setAttribute("data-id", todo._id);

    if (todo.completed) {
      li.classList.add("checked");
    }

    const span = document.createElement("span");
    span.innerHTML = "\u00d7"; // ×
    span.setAttribute("data-id", todo._id);

    li.appendChild(span);
    listcontainer.appendChild(li);
  });
}

// Toggle complete / delete using event delegation
listcontainer.addEventListener("click", async function (e) {
  const li = e.target.closest("li");
  if (!li) return;

  const todoId = li.getAttribute("data-id");

  // Ignore click on empty state / loading text
  if (!todoId) return;

  // Delete task
  if (e.target.tagName === "SPAN") {
    await deleteTodo(todoId);
    return;
  }

  // Toggle complete
  if (e.target.tagName === "LI") {
    const isCompleted = li.classList.contains("checked");
    await updateTodo(todoId, !isCompleted);
  }
}, false);

// Update todo completion
async function updateTodo(todoId, completedStatus) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/todos/${todoId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        completed: completedStatus,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to update task");
    }

    fetchTodos();
  } catch (error) {
    console.error("Update Todo Error:", error);
    alert(error.message || "Something went wrong while updating task.");
  }
}

// Delete todo
async function deleteTodo(todoId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/todos/${todoId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to delete task");
    }

    fetchTodos();
  } catch (error) {
    console.error("Delete Todo Error:", error);
    alert(error.message || "Something went wrong while deleting task.");
  }
}