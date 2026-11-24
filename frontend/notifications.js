
const API_URL = "http://localhost:5001/api";

const token = localStorage.getItem("token");

if (!token) {
    window.location.href = "login.html";
}

const notificationsList = document.getElementById("notificationsList");
const notificationMessage = document.getElementById("notificationMessage");
const notificationBadge = document.getElementById("notificationBadge");
const markAllReadButton = document.getElementById("markAllReadButton");

// LOGOUT
document.getElementById("logoutButton")?.addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "login.html";
});

// OPEN RELATED PAGE
function openNotification(notification) {

    if (notification.type === "follow") {
        const senderId = notification.sender?._id;

        if (senderId) {
            window.location.href =
                "profile.html?id=" + encodeURIComponent(senderId);
        }

    } else if (
        notification.type === "like" ||
        notification.type === "comment"
    ) {
        if (notification.post) {
            window.location.href =
                "index.html?post=" +
                encodeURIComponent(notification.post);
        }
    }
}

// LOAD NOTIFICATIONS
async function loadNotifications() {
    try {
        const response = await fetch(
            `${API_URL}/notifications`,
            {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Failed to load notifications.");
        }

        notificationsList.innerHTML = "";

        const unreadCount = data.unreadCount || 0;

        notificationBadge.textContent =
            unreadCount > 0 ? `(${unreadCount})` : "";

        const notifications = data.notifications || [];

        if (notifications.length === 0) {
            notificationsList.textContent = "No notifications yet.";
            return;
        }

        notifications.forEach(notification => {

            const card = document.createElement("div");
            card.className = "notification-card";

            if (!notification.isRead) {
                card.classList.add("unread");
            }

            const message = document.createElement("p");
            message.textContent = notification.message;

            const sender = document.createElement("small");
            sender.textContent =
                "From: " + (notification.sender?.username || "Unknown user");

            const date = document.createElement("small");
            date.textContent = new Date(
                notification.createdAt
            ).toLocaleString();

            const status = document.createElement("span");
            status.textContent = notification.isRead ? "Read" : "Unread";

            card.appendChild(message);
            card.appendChild(sender);
            card.appendChild(document.createElement("br"));
            card.appendChild(date);
            card.appendChild(document.createElement("br"));
            card.appendChild(status);

            // OPEN NOTIFICATION BUTTON
            const openButton = document.createElement("button");
            openButton.textContent =
                notification.type === "follow"
                    ? "View Profile"
                    : "View Post";

            openButton.addEventListener("click", async () => {

                if (!notification.isRead) {
                    await markAsRead(notification._id, false);
                }

                openNotification(notification);
            });

            card.appendChild(document.createElement("br"));
            card.appendChild(openButton);

            // MARK AS READ BUTTON
            if (!notification.isRead) {
                const button = document.createElement("button");

                button.textContent = "Mark as Read";

                button.addEventListener("click", () => {
                    markAsRead(notification._id);
                });

                card.appendChild(button);
            }

            notificationsList.appendChild(card);
        });

    } catch (error) {
        notificationMessage.textContent = error.message;
    }
}

// MARK ONE NOTIFICATION AS READ
async function markAsRead(id, reload = true) {
    try {
        const response = await fetch(
            `${API_URL}/notifications/${id}/read`,
            {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Could not update notification.");
        }

        if (reload) {
            await loadNotifications();
        }

    } catch (error) {
        alert(error.message);
    }
}

// MARK ALL NOTIFICATIONS AS READ
if (markAllReadButton) {
    markAllReadButton.addEventListener("click", async () => {
        try {
            const response = await fetch(
                `${API_URL}/notifications/read-all`,
                {
                    method: "PUT",
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Could not update notifications.");
            }

            notificationMessage.textContent = data.message;

            await loadNotifications();

        } catch (error) {
            notificationMessage.textContent = error.message;
        }
    });
}

// INITIAL LOAD
loadNotifications();
