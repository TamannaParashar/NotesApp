import mongoose from "mongoose";
const url = process.env.MONGO_URL

mongoose.connect(url,{
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const db = mongoose.connection

db.on("connected",()=>{
    console.log("Connected to database")
});
db.on("disconnected",()=>{
    console.log("Disconnected from database")
});