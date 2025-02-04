const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const http = require("http");
const { Server } = require("socket.io");
// Import các route
const authRoute = require("./routes/auth");
const adminRoute = require("./routes/admin");
const classRoute = require("./routes/class");
const questionRoute = require("./routes/question");
const quizRoute = require("./routes/quiz");
const resultRoute = require("./routes/result");
const studentRoute = require("./routes/student");
const userRoute = require("./routes/user");
const studentClass = require("./routes/studentClass");
const studentQuiz = require("./routes/studentQuiz");
const studentUser = require("./routes/studentUser");
const answer = require("./routes/answer");
const _ = require("lodash");
// const monitoringRoute = require("./routes/monitoring");
const createDefaultAdmin = require("./createDefaultAdmin"); // Thêm dòng này
dotenv.config();
const app = express();

// Kết nối MongoDB
mongoose
  .connect(process.env.MONGO_URL)
  .then(async () => {
    console.log("Connected to MongoDB");
    // Tạo admin mặc định sau khi kết nối database thành công
    await createDefaultAdmin();
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err);
    process.exit(1);
  });
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});
// Middleware
app.use(cookieParser());
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:3000", // hoặc origin của frontend của bạn
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Content-Range", "X-Content-Range"],
  })
);

// Routes
app.use("/v1/auth", authRoute);
app.use("/v1/admin", adminRoute);
app.use("/v1/admin/classes", classRoute);
app.use("/v1/admin/questions", questionRoute);
app.use("/v1/admin/quizzes", quizRoute);
app.use("/v1/admin/results", resultRoute);
app.use("/v1/admin/students", studentRoute);
app.use("/v1/admin/users", userRoute);

app.use("/v1/students", studentUser);
app.use("/v1/quizzes", studentQuiz);
app.use("/v1/classes", studentClass);
app.use("/v1/answer", answer);
// app.use("/v1/admin/monitoring", monitoringRoute);

// Error handling middleware
app.use((req, res, next) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal server error" });
});

// { roomId: { host: string, users: Set<string> } }
const rooms = new Map();

io.on("connection", (socket) => {
  console.log("Connected:", socket.id);
  socket.on("admin-end-exam", ({ userId }) => {
    console.log("user", userId);
    io.to(userId).emit("admin-end-your-exam");
  });
  // Host tạo phòng
  socket.on("create-room", (roomId) => {
    socket.join(roomId);
    rooms.set(roomId, {
      host: socket.id,
      users: new Set(),
    });
    console.log(`Host ${socket.id} created room ${roomId}`);
  });

  // User tham gia phòng
  socket.on("join-room", ({ roomId, username }) => {
    const room = rooms.get(roomId);
    if (!room) {
      socket.emit("room-error", "Room not found");
      return;
    }

    socket.join(roomId);
    room.users.add(socket.id);

    // Thông báo cho host
    io.to(room.host).emit("user-joined", {
      userId: socket.id,
      username, // Include the username
      users: Array.from(room.users),
    });
    // let blurTimeout;
    // const debouncedUserBlur = _.debounce(({ userId, userName }) => {
    //   // console.log("ssss", userId, userName);
    //   io.to(room.host).emit("user-has-blur", { userId, userName });
    // }, 1000);

    socket.on("user-blur", ({ userName }) => {
      // clearTimeout(blurTimeout);
      // console.log("eeeee", userId, userName);
      // blurTimeout = setTimeout(() => {
      // console.log("ssss", socket.id, userName);
      io.to(room.host).emit("user-has-blur", { userId: socket.id, userName });
      // }, 500);
    });

    // Thông báo cho user để bắt đầu quá trình kết nối
    socket.emit("user-connected");

    console.log(
      `User ${socket.id} joined room ${roomId} with username ${username}`
    );
    console.log("Current room state:", {
      host: room.host,
      users: Array.from(room.users),
    });
  });

  // WebRTC Signaling
  socket.on("offer", ({ target, sdp }) => {
    const room = findRoomBySocketId(socket.id);
    if (!room) return;

    // Chuyển offer đến host
    io.to(room.host).emit("offer", {
      caller: socket.id,
      sdp,
    });
    console.log(`Offer sent from ${socket.id} to host ${room.host}`);
  });

  socket.on("answer", ({ target, sdp }) => {
    const room = findRoomBySocketId(target);
    if (!room) return;

    // Chuyển answer đến user
    io.to(target).emit("answer", {
      answerer: socket.id,
      sdp,
    });
    console.log(`Answer sent from ${socket.id} to user ${target}`);
  });

  socket.on("ice-candidate", ({ target, candidate }) => {
    const room = findRoomBySocketId(socket.id);
    if (!room) {
      console.log("Room not found for ICE candidate");
      return;
    }

    // Log để debug
    console.log("Received ICE candidate from:", socket.id);
    console.log("Target:", target);
    console.log("Room host:", room.host);

    // Xác định người nhận (host hoặc user)
    const recipientId = room.host === socket.id ? target : room.host;

    console.log("Forwarding ICE candidate to:", recipientId);
    io.to(recipientId).emit("ice-candidate", {
      sender: socket.id,
      candidate,
    });
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    rooms.forEach((room, roomId) => {
      if (room.host === socket.id) {
        // Nếu host disconnect
        io.to(roomId).emit("host-left");
        rooms.delete(roomId);
        console.log(`Host ${socket.id} left room ${roomId}`);
      } else if (room.users.has(socket.id)) {
        // Nếu user disconnect
        room.users.delete(socket.id);
        io.to(room.host).emit("user-left", {
          userId: socket.id,
          users: Array.from(room.users),
        });
        console.log(`User ${socket.id} left room ${roomId}`);
      }
    });
  });
});

// Helper function to find room by socket id
function findRoomBySocketId(socketId) {
  for (const [roomId, room] of rooms.entries()) {
    if (room.host === socketId || room.users.has(socketId)) {
      return room;
    }
  }
  return null;
}

server.listen(5000, () => console.log("Server running on port 5000"));
// Server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
