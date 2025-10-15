import "./db.js"
import cors from 'cors'
import express from 'express'
const app = express();
const port = 3000
import roomCreate from "./model/createRoom.js";

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post("/api/addCreateRoomInfo",async(req,res)=>{
    const {groupName,adminName,membersCount,roomCode} = req.body
    const room = new roomCreate({groupName,adminName,membersCount,roomCode});
    await room.save();
    res.status(201).json({ message: "Room created successfully" });
})

app.listen(port,()=>{
    console.log(`Listening to port ${port}`)
})