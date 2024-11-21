const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const bodyParser = require("body-parser");
const os = require("os");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const PORT = 25565;

// Automatically get local IP address
const localIp = Object.values(os.networkInterfaces())
  .flat()
  .find((iface) => iface.family === "IPv4" && !iface.internal).address;

// Middleware
app.use(bodyParser.json());
app.use(express.static("public"));

// User database (in-memory storage for simplicity)
let users = {}; // { username: { password, friends: [], messages: [] } }
let onlineUsers = {}; // { socketId: username }

// Message history
let publicMessages = []; // Stores public messages

// Serve the client files
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

// User registration
app.post("/register", (req, res) => {
  const { username, password } = req.body;
  if (users[username]) {
    return res.status(400).json({ error: "Username already exists" });
  }
  users[username] = { password, friends: [], messages: [] };
  res.json({ success: true });
});

// User login
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (!users[username] || users[username].password !== password) {
    return res.status(400).json({ error: "Invalid username or password" });
  }
  res.json({ success: true, username, publicMessages, privateMessages: users[username].messages });
});

// WebSocket connections
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("login", (username) => {
    onlineUsers[socket.id] = username;
    io.emit("userList", Object.values(onlineUsers));
  });

  socket.on("sendMessage", ({ to, message }) => {
    const from = onlineUsers[socket.id];

    if (to === "public") {
      const newMessage = { from, message };
      publicMessages.push(newMessage);
      io.emit("publicMessage", newMessage);
    } else {
      const recipientSocket = Object.keys(onlineUsers).find(
        (id) => onlineUsers[id] === to
      );
      if (recipientSocket) {
        const newPrivateMessage = { from, to, message };
        users[to].messages.push(newPrivateMessage);
        users[from].messages.push(newPrivateMessage);
        io.to(recipientSocket).emit("privateMessage", newPrivateMessage);
        socket.emit("privateMessage", newPrivateMessage);
      }
    }
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected:", socket.id);
    delete onlineUsers[socket.id];
    io.emit("userList", Object.values(onlineUsers));
  });
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server running at http://${localIp}:${PORT}`);
});