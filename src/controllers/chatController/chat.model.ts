import mongoose, { Schema } from "mongoose";

const ChatSchema = new Schema(
  {
    members: [mongoose.Types.ObjectId],
    chatName: String,
    owner: [mongoose.Types.ObjectId],
    chatId: String,
    chatImage: String,
    chatType: Boolean
  },
  { timestamps: true }
);

const ChatModel = mongoose.model("chatmodels", ChatSchema);

export default ChatModel;
