import "./db.js"
import cors from 'cors'
import express from 'express'
const app = express();
/* eslint-env node */
const port = process.env.PORT || 3000;
import roomCreate from "./model/createRoom.js";
import Message from "./model/Message.js";
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
const userMessageCounts = {};

app.post("/api/addCreateRoomInfo",async(req,res)=>{
    const {groupName,adminName,adminPassword,membersCount,roomCode} = req.body
    const room = new roomCreate({groupName,adminName,adminPassword,membersCount,roomCode});
    await room.save();
    res.status(201).json({ message: "Room created successfully" });
})

app.post("/api/joinRoom", async (req, res) => {
  try {
    const { roomCode, name, adminPassword } = req.body;
    const room = await roomCreate.findOne({ roomCode });
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }
    if(name === room.adminName) {
      if(adminPassword !== room.adminPassword) {
        return res.status(401).json({ message: "Name reserved for admin, or incorrect password" });
      }
    }
    if(name!==room.adminName){
    if(room.isLocked){
      return res.status(403).json({message:"Room has been locked"});
    }
    if (!activeRooms[roomCode]) {
      activeRooms[roomCode] = 0;
    }
    if (activeRooms[roomCode] >= room.membersCount) {
      return res.status(400).json({ message: "Room is full" });
    }
    activeRooms[roomCode] += 1;
  }
    res.status(201).json({message: "Successfully joined the room"})
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/getRoomInfo",async(req,res)=>{
    const { roomCode } = req.query;
    const data = await roomCreate.findOne({roomCode})
    res.json({grpName:data.groupName,adminName:data.adminName,roomCode:data.roomCode, messageLimit: data.messageLimit, isLocked: data.isLocked})
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

app.post("/api/setMessageLimit", async (req, res) => {
  try {
    const { roomCode, limit } = req.body;
    const room = await roomCreate.findOne({ roomCode });
    if (!room) return res.status(404).json({ message: "Room not found" });

    room.messageLimit = limit;
    await room.save();

    io.to(roomCode).emit("notification", `Admin has set the message limit to ${limit}`);
    res.json({ message: "Message limit updated", limit });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


io.on("connection", (socket) => {
  console.log("User connected:", socket.id)

  // Join Room
  socket.on("joinRoom", async ({ roomCode, memberName }) => {
    socket.join(roomCode)
    users[socket.id] = { name: memberName, roomCode }

    if (!userMessageCounts[roomCode]) userMessageCounts[roomCode] = {};
    if (userMessageCounts[roomCode][memberName] === undefined) userMessageCounts[roomCode][memberName] = 0;

    try {
      const history = await Message.find({ roomCode }).sort({ timestamp: 1 });
      const formattedHistory = history.map(msg => ({
        id: msg._id.toString(),
        message: msg.message,
        username: msg.username,
        userId: msg.userId,
        timestamp: msg.timestamp,
        isSelf: msg.username === memberName
      }));
      socket.emit("chat_history", formattedHistory);
    } catch (err) {
      console.error(err);
    }

    // Notify others
    socket.to(roomCode).emit("notification", `${memberName} has joined the room`)
    console.log(`${memberName} joined room ${roomCode}`)

    const currentMembers = Object.values(users)
  .filter(u => u.roomCode === roomCode)
  .map(u => u.name);
io.to(roomCode).emit("update_members", currentMembers);

  })

  // Handle Chat Message
  socket.on("chat_message", async ({ roomCode, message }) => {
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

  try {
    const room = await roomCreate.findOne({ roomCode });
    if (room && room.messageLimit > 0) {
      if (sender !== room.adminName) {
         const count = userMessageCounts[roomCode]?.[sender] || 0;
         if (count >= room.messageLimit) {
           socket.emit("notification", `🚫 You have reached the message limit of ${room.messageLimit}. Wait for admin to view messages.`);
           return;
         }
         userMessageCounts[roomCode][sender] = count + 1;
      }
    }
  } catch (err) {
    console.error(err);
  }

  try {
    const newMsg = new Message({
      roomCode,
      message,
      username: sender,
      userId: socket.id,
      timestamp: new Date().toISOString()
    });
    await newMsg.save();

    const finalMsgData = {
      id: newMsg._id.toString(),
      message: newMsg.message,
      username: newMsg.username,
      userId: newMsg.userId,
      timestamp: newMsg.timestamp,
    };

    if (!roomMessages[roomCode]) roomMessages[roomCode] = [];
    roomMessages[roomCode].push(finalMsgData);

    socket.emit("chat_message", { ...finalMsgData, isSelf: true });
    socket.to(roomCode).emit("chat_message", finalMsgData);
  } catch (err) {
    console.error("Error saving message", err);
  }
});

  socket.on("admin_seen", ({ roomCode }) => {
    if (userMessageCounts[roomCode]) {
      for (const user in userMessageCounts[roomCode]) {
        userMessageCounts[roomCode][user] = 0;
      }
    }
    io.to(roomCode).emit("notification", `👁️ Admin has viewed the messages. You can send messages again.`);
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