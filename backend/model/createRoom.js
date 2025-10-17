import mongoose from "mongoose";

const roomInfo = new mongoose.Schema({
    groupName:{
        type:String,
        unique:true,
        required:true
    },
    adminName:{
        type:String,
        required:true
    },
    membersCount:{
        type:Number,
        required:true
    },
    roomCode:{
        type:Number,
        required:true
    },
    isLocked:{
        type:Boolean,
        default:false
    }
})

const roomCreate = mongoose.model("roomCreate",roomInfo);
export default roomCreate