import mongoose, { Schema } from "mongoose"

const UserSchema = new Schema({
    fullname: String,
    email: String,
    pNumber: String,
    username: String,
    password: String,
    Country: String,
  }, {timestamps: true})
  
  const UserModel =  mongoose.model('User', UserSchema);
  
  export default UserModel;