import mongoose, { Schema } from "mongoose";
const subSchema = new Schema({
  messageImage: Boolean, //true = Image, false = message
  value: String
});
const MessageSchema = new Schema(
  {
    parentmessageId:mongoose.Types.ObjectId,
    chatId: String,
    ownerId: mongoose.Types.ObjectId,
    message: [subSchema],
  },
  { timestamps: true }
);

const MessageModel = mongoose.model("messagemodels", MessageSchema);

export default MessageModel;
