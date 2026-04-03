document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("token");

    const loginLink = document.getElementById("loginLink");
    const logoutBtn = document.getElementById("logoutBtn");
    const userWelcome = document.getElementById("userWelcome");
    const homeTotalPoints = document.getElementById("homeTotalPoints");
    const loginCardLink = document.getElementById("loginCardLink");
    const loginCardText = document.getElementById("loginCardText");

    // ================= GET USER-SPECIFIC STORAGE KEYS =================
    function getUserStorageKeys(userEmail) {
        if (!userEmail) {
            return {
                pointsKey: null,
                historyKey: null
            };
        }

        return {
            pointsKey: `timeTrackerPoints_${userEmail}`,
            historyKey: `timeTrackerHistory_${userEmail}`
        };
    }

    // ================= GET TOTAL POINTS FOR SPECIFIC USER =================
    function getTotalPointsForHome(userEmail) {
        if (!userEmail) return 0;

        const { pointsKey, historyKey } = getUserStorageKeys(userEmail);

        let total = 0;

        const directPoints = parseInt(localStorage.getItem(pointsKey)) || 0;
        const trackerHistory = JSON.parse(localStorage.getItem(historyKey)) || {};

        const historyTotal = Object.values(trackerHistory).reduce((sum, val) => {
            return sum + Number(val || 0);
        }, 0);

        total = Math.max(directPoints, historyTotal);

        // sync back
        localStorage.setItem(pointsKey, String(total));

        console.log("Home Debug => user:", userEmail);
        console.log("Home Debug => directPoints:", directPoints);
        console.log("Home Debug => trackerHistory:", trackerHistory);
        console.log("Home Debug => historyTotal:", historyTotal);
        console.log("Home Debug => finalTotal:", total);

        return total;
    }

    // ================= SHOW 0 BY DEFAULT =================
    if (homeTotalPoints) {
        homeTotalPoints.textContent = "0";
    }

    // ================= DEFAULT UI (NOT LOGGED IN) =================
    function setLoggedOutUI() {
        if (userWelcome) userWelcome.style.display = "none";
        if (loginLink) loginLink.style.display = "inline-block";
        if (logoutBtn) logoutBtn.style.display = "none";

        if (loginCardLink) loginCardLink.href = "login.html";
        if (loginCardText) loginCardText.textContent = "LOGIN";

        // Logout hone par home page pe 0 show karo
        if (homeTotalPoints) homeTotalPoints.textContent = "0";
    }

    // ================= LOGGED IN UI =================
    function setLoggedInUI(user) {
        if (loginLink) loginLink.style.display = "none";
        if (logoutBtn) logoutBtn.style.display = "inline-block";

        if (userWelcome) {
            userWelcome.style.display = "inline-block";
            userWelcome.textContent = `Hi, ${user.name || user.email || "User"}`;
        }

        if (loginCardLink) loginCardLink.href = "profile.html";
        if (loginCardText) loginCardText.textContent = "PROFILE";
    }

    // ================= AUTH CHECK =================
    if (!token) {
        setLoggedOutUI();
    } else {
        try {
            const response = await fetch("http://localhost:5000/api/auth/protected", {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setLoggedInUI(data.user);

                // IMPORTANT: user data localStorage me save karo
                localStorage.setItem("user", JSON.stringify(data.user));

                // user-specific total show karo
                if (homeTotalPoints) {
                    const userEmail = data.user.email;
                    const totalPoints = getTotalPointsForHome(userEmail);
                    homeTotalPoints.textContent = totalPoints;
                }
            } else {
                localStorage.removeItem("token");
                localStorage.removeItem("profilePic");
                localStorage.removeItem("user");
                setLoggedOutUI();
            }

        } catch (error) {
            console.error("Home Auth Check Error:", error);
            setLoggedOutUI();
        }
    }

    // ================= LOGOUT =================
    if (logoutBtn) {
        logoutBtn.addEventListener("click", function () {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            localStorage.removeItem("profilePic");

            // Home page pe turant 0 dikhao
            if (homeTotalPoints) {
                homeTotalPoints.textContent = "0";
            }

            alert("Logged out successfully!");
            window.location.href = "login.html";
        });
    }
});