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
const roomMessages = {};
const bannedWordsData = {};

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
    if(room.isLocked){
      return res.status(403).json({message:"Room has been locked"});
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

app.post("/api/removeMember", async (req, res) => {
  const { roomCode, memberName, adminName } = req.body;

  try {
    const roomData = await roomCreate.findOne({ roomCode });
    if (!roomData) return res.status(404).json({ message: "Room not found" });
    if (roomData.adminName !== adminName) {
      return res.status(403).json({ message: "Only admin can remove members" });
    }
    const memberSocketId = Object.keys(users).find(
      (key) => users[key]?.name === memberName && users[key]?.roomCode === roomCode
    );
    if (!memberSocketId) return res.status(404).json({ message: "Member not found in room" });
    io.sockets.sockets.get(memberSocketId)?.leave(roomCode);
    io.to(memberSocketId).emit("removed_from_room", {
      message: "You have been removed by admin",
      name: memberName
    });
    io.to(roomCode).emit("notification", `${memberName} has been removed by admin`);

    // Update activeRooms count
    if (activeRooms[roomCode] > 0) activeRooms[roomCode] -= 1;
    delete users[memberSocketId];

    res.json({ message: `${memberName} removed successfully` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Add or update banned words
app.post("/api/setBannedWords", async (req, res) => {
  const { roomCode, target, words } = req.body;
  if (!bannedWordsData[roomCode]) bannedWordsData[roomCode] = { all: [], members: {} };

  if (target === "all") {
    bannedWordsData[roomCode].all = [...new Set([...bannedWordsData[roomCode].all, ...words])];
  } else {
    if (!bannedWordsData[roomCode].members[target]) bannedWordsData[roomCode].members[target] = [];
    bannedWordsData[roomCode].members[target] = [...new Set([...bannedWordsData[roomCode].members[target], ...words])];
  }

  io.to(roomCode).emit("notification", `🚫 Banned words updated for ${target}`);
  res.json({ success: true });
});

// Remove banned words (withdraw restrictions)
app.post("/api/removeBannedWords", async (req, res) => {
  const { roomCode, target } = req.body;
  if (!bannedWordsData[roomCode]) return res.status(404).json({ message: "Room not found" });

  if (target === "all") bannedWordsData[roomCode].all = [];
  else delete bannedWordsData[roomCode].members[target];

  io.to(roomCode).emit("notification", `✅ Restrictions withdrawn for ${target}`);
  res.json({ success: true });
});

app.post("/api/toggleLock", async (req, res) => {
  try {
    const { roomCode, isLocked } = req.body;
    const room = await roomCreate.findOne({ roomCode });
    if (!room) return res.status(404).json({ message: "Room not found" });

    room.isLocked = isLocked;
    await room.save();

    io.to(roomCode).emit("notification", `Admin has ${isLocked ? "locked" : "unlocked"} the room`);
    res.json({ message: "Room lock status updated", isLocked });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


io.on("connection", (socket) => {
  console.log("User connected:", socket.id)

  // Join Room
  socket.on("joinRoom", ({ roomCode, memberName }) => {
    socket.join(roomCode)
    users[socket.id] = { name: memberName, roomCode }

    // Notify others
    socket.to(roomCode).emit("notification", `${memberName} has joined the room`)
    console.log(`${memberName} joined room ${roomCode}`)

    const currentMembers = Object.values(users)
  .filter(u => u.roomCode === roomCode)
  .map(u => u.name);
io.to(roomCode).emit("update_members", currentMembers);

  })

  // Handle Chat Message
  socket.on("chat_message", ({ roomCode, message }) => {
  const sender = users[socket.id]?.name || "Anonymous";

  // Get banned words for this room
  const bannedRoom = bannedWordsData[roomCode] || { all: [], members: {} };
  const userBanned = bannedRoom.members[sender] || [];
  const combinedBanned = [...new Set([...bannedRoom.all, ...userBanned])];

  // Check for any banned word in message
  const lowerMsg = message.toLowerCase();
  if (combinedBanned.some(word => lowerMsg.includes(word))) {
    socket.emit("notification", "🚫 Your message contains a banned word and was not sent.");
    return;
  }

  const msgData = {
    id: Date.now() + Math.random(),
    message,
    username: sender,
    userId: socket.id,
    timestamp: new Date().toISOString(),
  };

  if (!roomMessages[roomCode]) roomMessages[roomCode] = [];
  roomMessages[roomCode].push(msgData);

  socket.emit("chat_message", { ...msgData, isSelf: true });
  socket.to(roomCode).emit("chat_message", msgData);

  setTimeout(() => {
    roomMessages[roomCode] = roomMessages[roomCode].filter(msg => msg.id !== msgData.id);
    io.to(roomCode).emit("delete_message", msgData.id);
  }, 60000);
});

  // Handle Disconnect
  socket.on("disconnect", () => {
    const user = users[socket.id]
    if (user && user.roomCode) {
      socket.to(user.roomCode).emit("notification",`${user.name} has left the room`)
      if (activeRooms[user.roomCode] > 0) {
      activeRooms[user.roomCode] -= 1
    }
    }
    delete users[socket.id]
    console.log("User disconnected:", socket.id)
  })
})

server.listen(port, () => console.log(`Server running on port ${port}`))