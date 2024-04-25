import mongoose, { Schema } from "mongoose";

const UserSchema = new Schema(
  {
    fullname: String,
    username: {
      type: String,
    },
    password: String,
    email: {
      type: String,
    },
    pNumber: {
      type: String,
    },
    avatar: String,
  },
  { timestamps: true }
);

const UserModel = mongoose.model("usermodels", UserSchema);

export default UserModel;
