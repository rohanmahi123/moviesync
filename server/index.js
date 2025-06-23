// server/index.js
const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const path = require("path");
const multer = require("multer");

const PORT = process.env.PORT || 3000;

// Upload setup
const storage = multer.diskStorage({
  destination: path.join(__dirname, "../uploads"),
  filename: (req, file, cb) => cb(null, "video.mp4")
});
const upload = multer({ storage });

// Serve uploaded videos
app.use("/video", express.static(path.join(__dirname, "../uploads")));

// Serve static frontend
app.use(express.static(path.join(__dirname, "../public")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// Upload endpoint
app.post("/upload", upload.single("video"), (req, res) => {
  res.send("Uploaded");
});

// Socket.io setup (your peer + sync logic here)
io.on("connection", (socket) => {
  // socket logic
});

http.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
