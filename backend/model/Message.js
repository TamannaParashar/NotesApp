import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    roomCode: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true
    },
    userId: {
        type: String,
        required: true
    },
    timestamp: {
        type: String,
        required: true
    }
});

const Message = mongoose.model("Message", messageSchema);
export default Message;
