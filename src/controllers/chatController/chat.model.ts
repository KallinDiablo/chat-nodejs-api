import mongoose, { Schema } from "mongoose";

const ChatSchema = new Schema(
  {
    parentMessage:mongoose.Types.ObjectId,
    members: [mongoose.Types.ObjectId],
    chatName: String,
    owner: [mongoose.Types.ObjectId],
    chatId: String,
    chatType: Boolean, //True = private , false = public
  },
  { timestamps: true }
);

const ChatModel = mongoose.model("chatmodels", ChatSchema);

export default ChatModel;
