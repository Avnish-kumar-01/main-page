const loginForm = document.getElementById("loginForm");
const message = document.getElementById("message");

loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    try {
        const response = await fetch(" https://smart-dashboard-3.onrender.com/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            // Save token
            localStorage.setItem("token", data.token);

            message.style.color = "green";
            message.textContent = "Login successful! Redirecting...";

            setTimeout(() => {
                window.location.href = "index.html";
            }, 1000);
        } else {
            message.style.color = "red";
            message.textContent = data.message || "Login failed";
        }

    } catch (error) {
        console.error("Login error:", error);
        message.style.color = "red";
        message.textContent = "Server error. Please try again.";
    }
});
