// server/index.js
const express = require("express");
const http = require("http");
const multer = require("multer");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const MAX_USERS = 3;
let userSockets = [];

app.use(express.static(path.join(__dirname, "../public")));
app.use("/video", express.static(path.join(__dirname, "../uploads")));

// File upload
const storage = multer.diskStorage({
  destination: "./uploads",
  filename: (req, file, cb) => cb(null, "video.mp4"),
});
const upload = multer({ storage });

app.post("/upload", upload.single("video"), (req, res) => {
  res.status(200).send("Uploaded");
});

io.on("connection", (socket) => {
  userSockets.push(socket);

  // ✅ Assign host (first user)
  if (userSockets.length === 1) {
    socket.emit("assign-host");
  }


  userSockets.push(socket);

  socket.on("join-room", () => {
    const others = userSockets.filter((s) => s.id !== socket.id).map((s) => s.id);
    socket.emit("all-users", others);
    socket.broadcast.emit("user-joined", socket.id);
  });

  socket.on("signal", ({ to, data }) => {
    const target = userSockets.find((s) => s.id === to);
    if (target) target.emit("signal", { from: socket.id, data });
  });

  socket.on("sync", (data) => {
    socket.broadcast.emit("sync", data);
  });

  socket.on("disconnect", () => {
    userSockets = userSockets.filter((s) => s !== socket);
    socket.broadcast.emit("user-left", socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
