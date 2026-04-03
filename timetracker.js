const API_BASE = "http://localhost:5000/api/time";

const token = localStorage.getItem("token");
const user = JSON.parse(localStorage.getItem("user")) || {};

const userWelcome = document.getElementById("userWelcome");
const timerDisplay = document.getElementById("timerDisplay");
const timerStatus = document.getElementById("timerStatus");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const messageBox = document.getElementById("messageBox");

const totalSessionsEl = document.getElementById("totalSessions");
const totalMinutesEl = document.getElementById("totalMinutes");
const totalPointsEl = document.getElementById("totalPoints");
const sessionList = document.getElementById("sessionList");

let timerInterval = null;
let startTime = null;
let isRunning = false;

// ================= GET USER-SPECIFIC STORAGE KEYS =================
function getUserStorageKeys() {
  const userEmail = user.email;
  if (!userEmail) {
    return {
      pointsKey: "timeTrackerPoints_guest",
      historyKey: "timeTrackerHistory_guest"
    };
  }

  return {
    pointsKey: `timeTrackerPoints_${userEmail}`,
    historyKey: `timeTrackerHistory_${userEmail}`
  };
}

// ================= AUTH CHECK =================
if (!token) {
  alert("Please login first.");
  window.location.href = "login.html";
}

// Show user name (only if element exists)
if (userWelcome) {
  userWelcome.textContent = `Welcome, ${user.name || user.email || "User"}`;
}

// ================= MESSAGE HELPER =================
function showMessage(message, color = "#0f172a") {
  if (!messageBox) return;
  messageBox.textContent = message;
  messageBox.style.color = color;
}

// ================= FORMAT TIME =================
function formatTimeFromSeconds(totalSeconds) {
  const hrs = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const mins = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const secs = String(totalSeconds % 60).padStart(2, "0");
  return `${hrs}:${mins}:${secs}`;
}

// ================= SAVE DAILY + TOTAL POINTS (USER-SPECIFIC) =================
function saveDailyPoints(pointsToAdd) {
  const { pointsKey, historyKey } = getUserStorageKeys();

  const today = new Date().toISOString().split("T")[0];
  let trackerHistory = JSON.parse(localStorage.getItem(historyKey)) || {};

  trackerHistory[today] = (trackerHistory[today] || 0) + pointsToAdd;

  localStorage.setItem(historyKey, JSON.stringify(trackerHistory));

  const totalPoints = Object.values(trackerHistory).reduce((sum, val) => sum + Number(val || 0), 0);

  localStorage.setItem(pointsKey, String(totalPoints));

  console.log("User:", user.email);
  console.log("Today Points:", trackerHistory[today]);
  console.log("Total Points:", totalPoints);
}

// ================= RECALCULATE TOTAL FROM HISTORY =================
function recalculateTotalPoints() {
  const { pointsKey, historyKey } = getUserStorageKeys();

  const trackerHistory = JSON.parse(localStorage.getItem(historyKey)) || {};
  const totalPoints = Object.values(trackerHistory).reduce((sum, val) => sum + Number(val || 0), 0);

  localStorage.setItem(pointsKey, String(totalPoints));
  return totalPoints;
}

// ================= SYNC TODAY POINTS FROM BACKEND =================
function syncTodayPointsFromBackend(todayPointsFromBackend) {
  const { pointsKey, historyKey } = getUserStorageKeys();

  const today = new Date().toISOString().split("T")[0];
  let trackerHistory = JSON.parse(localStorage.getItem(historyKey)) || {};

  trackerHistory[today] = Number(todayPointsFromBackend || 0);

  localStorage.setItem(historyKey, JSON.stringify(trackerHistory));

  const totalPoints = Object.values(trackerHistory).reduce((sum, val) => sum + Number(val || 0), 0);
  localStorage.setItem(pointsKey, String(totalPoints));

  console.log("User:", user.email);
  console.log("Synced Today Points from Backend:", trackerHistory[today]);
  console.log("Synced Total Points for Home:", totalPoints);
}

// ================= START LOCAL TIMER UI =================
function startLocalTimer(fromDate = new Date()) {
  startTime = new Date(fromDate);
  isRunning = true;

  if (timerStatus) timerStatus.textContent = "Running";
  if (startBtn) startBtn.disabled = true;
  if (stopBtn) stopBtn.disabled = false;

  clearInterval(timerInterval);

  timerInterval = setInterval(() => {
    const now = new Date();
    const diffSeconds = Math.floor((now - startTime) / 1000);
    if (timerDisplay) {
      timerDisplay.textContent = formatTimeFromSeconds(diffSeconds);
    }
  }, 1000);

  const now = new Date();
  const diffSeconds = Math.floor((now - startTime) / 1000);
  if (timerDisplay) {
    timerDisplay.textContent = formatTimeFromSeconds(diffSeconds);
  }
}

// ================= STOP LOCAL TIMER UI =================
function stopLocalTimer() {
  isRunning = false;
  clearInterval(timerInterval);
  timerInterval = null;

  if (timerStatus) timerStatus.textContent = "Not Running";
  if (startBtn) startBtn.disabled = false;
  if (stopBtn) stopBtn.disabled = true;
  if (timerDisplay) timerDisplay.textContent = "00:00:00";
}

// ================= HANDLE AUTH ERRORS =================
function handleAuthError(message) {
  alert(message || "Session expired. Please login again.");
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "login.html";
}

// ================= FETCH TODAY STATS =================
async function fetchTodayStats() {
  try {
    const response = await fetch(`${API_BASE}/today`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (response.status === 401) {
      handleAuthError(data.message);
      return;
    }

    if (!data.success) {
      showMessage(data.message || "Failed to fetch stats", "red");
      return;
    }

    const todaySessions = Number(data.totalSessions || 0);
    const todayMinutes = Number(data.totalMinutes || 0);
    const todayPoints = Number(data.totalPoints || 0);

    if (totalSessionsEl) totalSessionsEl.textContent = todaySessions;
    if (totalMinutesEl) totalMinutesEl.textContent = todayMinutes;
    if (totalPointsEl) totalPointsEl.textContent = todayPoints;

    syncTodayPointsFromBackend(todayPoints);

    renderSessions(data.sessions || []);
  } catch (error) {
    console.error("Today stats fetch error:", error);
    showMessage("Server error while fetching today's stats", "red");
  }
}

// ================= FETCH ACTIVE SESSION FROM BACKEND =================
async function fetchActiveSession() {
  try {
    const response = await fetch(`${API_BASE}/active`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (response.status === 401) {
      handleAuthError(data.message);
      return;
    }

    if (!data.success) {
      showMessage(data.message || "Failed to check active session", "red");
      stopLocalTimer();
      return;
    }

    if (data.running && data.session?.startTime) {
      startLocalTimer(data.session.startTime);
      showMessage("Running session restored from server", "#0071f8");
    } else {
      stopLocalTimer();
    }
  } catch (error) {
    console.error("Active session fetch error:", error);
    showMessage("Server error while checking active session", "red");
    stopLocalTimer();
  }
}

// ================= RENDER SESSIONS =================
function renderSessions(sessions) {
  if (!sessionList) return;

  if (!sessions.length) {
    sessionList.innerHTML = `<p class="empty-text">No sessions completed today.</p>`;
    return;
  }

  sessionList.innerHTML = "";

  sessions.forEach((session, index) => {
    const completedAt = session.endTime
      ? new Date(session.endTime).toLocaleString()
      : new Date(session.createdAt).toLocaleString();

    const sessionItem = document.createElement("div");
    sessionItem.classList.add("session-item");

    sessionItem.innerHTML = `
      <strong>Session ${index + 1}</strong>
      <p>Duration: ${session.durationMinutes} minute(s)</p>
      <p>Points Earned: ${session.pointsEarned}</p>
      <p>Completed At: ${completedAt}</p>
    `;

    sessionList.appendChild(sessionItem);
  });
}

// ================= START TIMER API =================
async function startTimer() {
  if (isRunning) {
    showMessage("Timer is already running", "orange");
    return;
  }

  try {
    if (startBtn) startBtn.disabled = true;

    const response = await fetch(`${API_BASE}/start`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (response.status === 401) {
      handleAuthError(data.message);
      return;
    }

    if (!data.success) {
      showMessage(data.message || "Unable to start timer", "red");
      if (startBtn) startBtn.disabled = false;
      return;
    }

    const backendStartTime = data.session.startTime;

    startLocalTimer(backendStartTime);
    showMessage("Timer started successfully", "green");
  } catch (error) {
    console.error("Start timer error:", error);
    showMessage("Server error while starting timer", "red");
    if (startBtn) startBtn.disabled = false;
  }
}

// ================= STOP TIMER API =================
async function stopTimer() {
  if (!isRunning) {
    showMessage("No running timer found", "orange");
    return;
  }

  try {
    if (stopBtn) stopBtn.disabled = true;

    const response = await fetch(`${API_BASE}/stop`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (response.status === 401) {
      handleAuthError(data.message);
      return;
    }

    if (!data.success) {
      showMessage(data.message || "Unable to stop timer", "red");
      if (stopBtn) stopBtn.disabled = false;
      return;
    }

    const earnedPoints = Number(data.session?.pointsEarned || 0);
    saveDailyPoints(earnedPoints);

    stopLocalTimer();

    showMessage(
      `Timer stopped! Duration: ${data.session.durationMinutes} min | Points: ${earnedPoints}`,
      "green"
    );

    await fetchTodayStats();
    await fetchActiveSession();
  } catch (error) {
    console.error("Stop timer error:", error);
    showMessage("Server error while stopping timer", "red");
    if (stopBtn) stopBtn.disabled = false;
  }
}

// ================= INIT TOTAL POINTS FOR HOME PAGE =================
function initTotalPointsStorage() {
  const { pointsKey } = getUserStorageKeys();

  recalculateTotalPoints();

  if (localStorage.getItem(pointsKey) === null) {
    localStorage.setItem(pointsKey, "0");
  }
}

// ================= EVENTS =================
if (startBtn) startBtn.addEventListener("click", startTimer);
if (stopBtn) stopBtn.addEventListener("click", stopTimer);

// ================= INIT =================
async function initTimeTracker() {
  initTotalPointsStorage();
  await fetchTodayStats();
  await fetchActiveSession();
}

initTimeTracker();