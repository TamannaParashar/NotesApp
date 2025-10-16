import "./db.js"
import cors from 'cors'
import express from 'express'
const app = express();
const port = 3000
import roomCreate from "./model/createRoom.js";
import { Server } from "socket.io";
import http from "http"

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const activeRooms = {}
const users = {}

app.post("/api/addCreateRoomInfo",async(req,res)=>{
    const {groupName,adminName,membersCount,roomCode} = req.body
    const room = new roomCreate({groupName,adminName,membersCount,roomCode});
    await room.save();
    res.status(201).json({ message: "Room created successfully" });
})

app.post("/api/joinRoom", async (req, res) => {
  try {
    const { roomCode, name } = req.body;
    const room = await roomCreate.findOne({ roomCode });
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }
    if (!activeRooms[roomCode]) {
      activeRooms[roomCode] = 0;
    }
    if (activeRooms[roomCode] >= room.membersCount - 1) {
      return res.status(400).json({ message: "Room is full" });
    }
    activeRooms[roomCode] += 1;
    res.status(201).json({message: "Successfully joined the room"})
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/getRoomInfo",async(req,res)=>{
    const { roomCode } = req.query;
    const data = await roomCreate.findOne({roomCode})
    res.json({grpName:data.groupName,adminName:data.adminName,roomCode:data.roomCode})
})

io.on("connection", (socket) => {
  console.log("User connected:", socket.id)

  // Join Room
  socket.on("joinRoom", ({ roomCode, memberName }) => {
    socket.join(roomCode)
    users[socket.id] = { name: memberName, roomCode }

    // Notify others
    socket.to(roomCode).emit("notification", `${memberName} has joined the room`)
    console.log(`${memberName} joined room ${roomCode}`)
  })

  // Handle Chat Message
  socket.on("chat_message", ({ roomCode, message }) => {
    const sender = users[socket.id]?.name || "Anonymous"
    const msgData = {
      message,
      username: sender,
      userId: socket.id,
      timestamp: new Date().toISOString(),
    }

    // Send only once:
    socket.emit("chat_message", { ...msgData, isSelf: true })
    socket.to(roomCode).emit("chat_message", msgData)
  })

  // Handle Disconnect
  socket.on("disconnect", () => {
    const user = users[socket.id]
    if (user && user.roomCode) {
      socket.to(user.roomCode).emit(
        "notification",
        `${user.name} has left the room`
      )
      if (activeRooms[user.roomCode] > 0) {
      activeRooms[user.roomCode] -= 1
    }
    }
    delete users[socket.id]
    console.log("User disconnected:", socket.id)
  })
})

server.listen(port, () => console.log(`Server running on port ${port}`))