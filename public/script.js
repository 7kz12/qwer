const socket = io();
let username;
let currentChat = "public";

// Login and register
document.getElementById("loginBtn").addEventListener("click", login);
document.getElementById("registerBtn").addEventListener("click", register);

function login() {
  username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  fetch("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        showChat(data.publicMessages, data.privateMessages);
        socket.emit("login", username);
      } else {
        alert(data.error);
      }
    });
}

function register() {
  username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  fetch("/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        login(); // Automatically log in after registration
      } else {
        alert(data.error);
      }
    });
}

// Show chat interface
function showChat(publicMessages) {
  document.getElementById("login").style.display = "none";
  document.getElementById("chat").style.display = "flex";

  const messageLog = document.getElementById("messageLog");
  messageLog.innerHTML = "";

  publicMessages.forEach((msg) => {
    const msgDiv = document.createElement("div");
    msgDiv.textContent = `${msg.from}: ${msg.message}`;
    messageLog.appendChild(msgDiv);
  });
}

// Send a message
document.getElementById("sendMessageBtn").addEventListener("click", () => {
  const message = document.getElementById("messageInput").value;
  if (message.trim()) {
    socket.emit("sendMessage", { to: currentChat, message });
    document.getElementById("messageInput").value = "";
  }
});

// Receive public messages
socket.on("publicMessage", ({ from, message }) => {
  const messageLog = document.getElementById("messageLog");
  const msgDiv = document.createElement("div");
  msgDiv.textContent = `${from}: ${message}`;
  messageLog.appendChild(msgDiv);
});

// Receive private messages
socket.on("privateMessage", ({ from, message }) => {
  const messageLog = document.getElementById("messageLog");
  const msgDiv = document.createElement("div");
  msgDiv.textContent = `Private from ${from}: ${message}`;
  messageLog.appendChild(msgDiv);
});

// Update user list
socket.on("userList", (users) => {
  const userList = document.getElementById("userList");
  userList.innerHTML = "";

  users.forEach((user) => {
    if (user !== username) {
      const userItem = document.createElement("li");
      userItem.textContent = user;
      userItem.addEventListener("click", () => {
        currentChat = user;
        document.getElementById("chatTitle").textContent = `Chat with ${user}`;
      });
      userList.appendChild(userItem);
    }
  });
});