import { NextFunction, Request, Response } from "express";
import HttpException from "../../modules/HttpException";
import mongoose from "mongoose";
import fs from "fs";
import multer from "multer";
import ChatModel from "./chat.model";
import MessageModel from "./message.model";
import UserModel from "../userController/user.model";
import path from "path";
import CryptoJS from "crypto-js";

export default class ChatController {
  public storageMessage = multer.diskStorage({
    destination(req, file, callback) {
      callback(null, `./public/chats/${req.body.chatId}`);
    },
    filename(req: any, file, callback) {
      callback(
        null,
        `${
          req.user.data._id
        }_${
          req.body.chatId
        }_${
          new mongoose.Types.ObjectId()
        }${path.extname(file.originalname)}`.toLowerCase()
      );
    },
  });
  public uploadMultiple = multer({
    storage: this.storageMessage,
  });

  //   Get paginate chats
  public GetPaginateChats = async (
    req: any,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const user = req.user.data
      const paginate = {
        page: Number(req.query.page) || 0,
        pageSize: Number(req.query.size) || 20,
      };
      const data = await ChatModel.find({members:user._id})
        .sort({ updatedAt: 1 })
        .skip(paginate.page * paginate.pageSize)
        .limit(paginate.pageSize);
      const totalChats = await ChatModel.countDocuments();
      const totalPages =
        Math.floor(totalChats / paginate.pageSize) +
        (totalChats % paginate.pageSize > 0 ? 1 : 0);
      return res.status(200).json({
        success: true,
        code: res.statusCode,
        message: "Get paginate chat",
        data: {
          data: data,
          paginate: [
            {
              page: paginate.page,
              pageSize: paginate.pageSize,
              total: totalChats,
              totalPage: totalPages,
            },
          ],
        },
      });
    } catch (error: any) {
      return res.status(200).json({
        success: false,
        code: res.statusCode,
        type: error.name,
        message: error.message,
      });
    }
  };

  //   Get paginate message
  public GetPaginateMessage = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const paginate = {
        page: Number(req.query.page) || 0,
        pageSize: Number(req.query.size) || 50,
      };
      const data = await MessageModel.find({ chatId: req.query.chatId })
        .sort({ createdAt: 1 })
        .skip(paginate.page * paginate.pageSize)
        .limit(paginate.pageSize);
      const totalMessages = await MessageModel.countDocuments();
      const totalPages =
        Math.floor(totalMessages / paginate.pageSize) +
        (totalMessages % paginate.pageSize > 0 ? 1 : 0);
      return res.status(200).json({
        success: true,
        code: res.statusCode,
        message: "Add new user",
        data: {
          data: data,
          paginate: [
            {
              page: paginate.page,
              pageSize: paginate.pageSize,
              total: totalMessages,
              totalPage: totalPages,
            },
          ],
        },
      });
    } catch (error: any) {
      return res.status(200).json({
        success: false,
        code: res.statusCode,
        type: error.name,
        message: error.message,
      });
    }
  };

  //   Create new chat
  public CreateNewChat = async (
    req: any,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const user_creator = req.user.data;
      if (hasDuplicates(req.body.users)) {
        throw new HttpException(200, "has user duplicate");
      }
      if (req.body.chatType && req.body.users.length > 1) {
        throw new HttpException(200, "Something go wrong");
      }
      const list_users_id = [];
      for (const user of req.body.users) {
        const result = await UserModel.findOne({ pNumber: user });
        if (!result) {
          throw new HttpException(200, "Not found user");
        }
        if (result._id === user_creator._id) {
          throw new HttpException(200, "member cannot be owner");
        }
        list_users_id.push(result._id);
      }
      if (req.body.chatType) {
        list_users_id.push(user_creator._id);
      }
      const request = {
        members: list_users_id,
        chatName: req.body.chatName ? req.body.chatName : null,
        owner: req.body.chatType ? list_users_id : [user_creator._id],
        chatId: CryptoJS.PBKDF2(
          "Secret Passphrase",
          String(new mongoose.Types.ObjectId()),
          {
            keySize: 512 / 32,
            iterations: 1000,
          }
        ).toString(CryptoJS.enc.Hex),
        chatType: req.body.chatType,
      };
      const dir = path.join(__dirname, `../../../public/chats/${request.chatId}`);
      if(!fs.existsSync(dir)){
        if (req.body.chatType) {
            const result = await ChatModel.findOne({ owner: request.owner });
            if (result) {
              throw new HttpException(200, "already have that chat");
            } else {
              fs.mkdirSync(dir);
            }
          } else {
            fs.mkdirSync(dir);
          }
      }
      
      const result = await ChatModel.create(request);
      return res.status(200).json({
        success: true,
        code: res.statusCode,
        message: "Created new chat",
        data: result,
      });
    } catch (error: any) {
      return res.status(200).json({
        success: false,
        code: res.statusCode,
        type: error.name,
        message: error.message,
      });
    }
  };

  //   create new message
  public CreateNewMessage = async (
    req: any,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const user_creator = req.user.data;
        const files = req.files
        if(!await UserModel.findById(user_creator._id)){
            throw new HttpException(200,'Not found user')
        }
        if(!await ChatModel.findOne({chatId:req.body.chatId})){
            throw new HttpException(200,'Not found chat channel')
        }
        const messages = []
        for(const item of files){
            messages.push({messageImage:true,value:`/chats/${item.filename}`})
        }
        messages.push({messageImage:false,value:req.body.message?req.body.message:null})
        const request = {
            message:messages,
            ownerId:user_creator._id,
            chatId:req.body.chatId
        }
        const result = await MessageModel.create(request)
        return res.status(200).json({
            success: true,
            code: res.statusCode,
            message: "Created new message",
            data: result,
          });
    } catch (error: any) {
      return res.status(200).json({
        success: false,
        code: res.statusCode,
        type: error.name,
        message: error.message,
      });
    }
  };
}
const hasDuplicates = (array: any[]): boolean => {
  for (let i = 0; i < array.length; ++i) {
    if (array.indexOf(array[i], i + 1) !== -1) {
      return true;
    }
  }
  return false;
};
