// public/main.js
const socket = io();
const video = document.getElementById("videoPlayer");
const fileInput = document.getElementById("videoFile");
const uploadBtn = document.getElementById("uploadBtn");

let myStream;
const peers = {};
const videoPath = "/video";

uploadBtn.onclick = async () => {
  const file = fileInput.files[0];
  if (!file) return alert("Please choose a video");

  const formData = new FormData();
  formData.append("video", file);

  const res = await fetch("/upload", {
    method: "POST",
    body: formData,
  });

  if (res.ok) {
    const fullURL = `${location.origin}/video/video.mp4`; // ✅ Use full ngrok path
    video.src = fullURL;
    video.load();

    socket.emit("sync", { type: "load", videoURL: fullURL });
  } else {
    alert("Upload failed");
  }
};

socket.on("sync", (data) => {
  if (data.type === "load" && data.videoURL) {
    video.src = data.videoURL;
    video.load();
  }
});


// WebRTC Video Call
navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
  myStream = stream;
  document.getElementById("cam1").srcObject = stream;

  socket.emit("join-room");

socket.on("all-users", (users) => {
  users.forEach((id) => {
    const peer = createPeer(id, stream, true); // connect to others
    peers[id] = peer;
  });
});

socket.on("user-joined", (id) => {
  const peer = createPeer(id, stream, true); // 🔁 everyone initiates
  peers[id] = peer;
  socket.emit("return-signal", { to: id });  // return signal
});

socket.on("return-signal", ({ to }) => {
  const peer = createPeer(to, stream, false); // receive connection
  peers[to] = peer;
});


  socket.on("signal", ({ from, data }) => {
    if (peers[from]) peers[from].signal(data);
  });
});

function createPeer(id, stream, initiator) {
  const peer = new SimplePeer({
    initiator,
    trickle: false,
    stream,
    config: {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" }  // ✅ Enables WebRTC via internet
      ]
    }
  });

  peer.on("signal", (data) => {
    socket.emit("signal", { to: id, data });
  });

  peer.on("stream", (remoteStream) => {
    const cams = [cam2, cam3];
    for (let cam of cams) {
      if (!cam.srcObject) {
        cam.srcObject = remoteStream;
        break;
      }
    }
  });

  return peer;
}

let isHost = false;

socket.on("assign-host", () => {
  isHost = true;
});

video.onplay = () => {
  if (isHost) socket.emit("sync", { type: "play", time: video.currentTime });
};
video.onpause = () => {
  if (isHost) socket.emit("sync", { type: "pause", time: video.currentTime });
};
video.ontimeupdate = () => {
  if (isHost && !video.paused) {
    socket.emit("sync", { type: "time", time: video.currentTime });
  }
};
