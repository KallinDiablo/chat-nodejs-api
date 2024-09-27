import { NextFunction, Request, Response } from "express";
import HttpException from "../../modules/HttpException";
import mongoose from "mongoose";
import fs from "fs";
import multer from "multer";
import MessageModel from "./message.model";
import UserModel from "../userController/user.model";
import path from "path";
import CryptoJS from "crypto-js";
import ChatModel from "./chat.model";
import formidable from "formidable";

export default class ChatController {
  public storageMessage = multer.diskStorage({
    destination(req, file, callback) {
      callback(null, `./public/chats/${req.body.chatId}`);
    },
    filename(req: any, file, callback) {
      callback(
        null,
        `${req.user.data._id}_${
          req.body.chatId
        }_${new mongoose.Types.ObjectId()}${path.extname(
          file.originalname
        )}`.toLowerCase()
      );
    },
  });
  public upload = multer({
    storage: this.storageMessage,
  });

  //   Get paginate chats
  public GetPaginateChats = async (
    req: any,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const user = req.user.data;
      const paginate = {
        page: Number(req.query.page) || 0,
        pageSize: Number(req.query.size) || 20,
      };
      // const data = (await ChatModel
      //   .find({ members: user._id })
      //   .sort({ updatedAt: 1 })
      //   .skip(paginate.page * paginate.pageSize)
      //   .limit(paginate.pageSize)).map(
      //     (e)=>({
      //       members: e.members,
      //       chatName: e.chatType?(async()=>{return (await UserModel.findById(GetNotAtSame(e.members,user._id)[0])).fullname}):e.chatName,
      //       owner: e.owner,
      //       chatId: e.chatId,
      //       chatImage: e.chatType?(async()=>{return (await UserModel.findById(GetNotAtSame(e.members,user._id)[0])).avatar}):e.chatImage,
      //       chatType: e.chatType
      //     })
      //   );
      const data = await ChatModel.aggregate([
        {
          $lookup: {
            from: "usermodels", // Name of the User collection
            localField: "members", // Field in the Chat collection
            foreignField: "_id", // Field in the User collection
            as: "user",
          },
        },
        {
          $project: {
            _id: 1,
            chatType: 1,
            members: 1,
            owner: 1,
            chatId: 1,
            chatName: {
              $cond: {
                if: { $eq: ["$chatType", true] },
                then: { $arrayElemAt: ["$user.fullname", 0] }, 
                else: "$chatName", 
              },
            },
            chatImage: {
              $cond: {
                if: { $eq: ["$chatType", true] },
                then: { $arrayElemAt: ["$user.avatar", 0] },
                else: "$chatImage", 
              },
            },
          },
        },
      ]);
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

  //   Create new personal chat
  public CreateNewPersonalChat = async (
    req: any,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const user_creator = req.user.data;
      const user_request = await UserModel.findById(req.body.user);
      if (!user_request) {
        throw new HttpException(200, "User not found");
      }
      const request: any = {
        chatImage: null,
        chatName: null,
        members: [user_creator._id, req.body.user],
        owner: [user_creator._id, req.body.user],
        chatId: CryptoJS.PBKDF2(
          "Secret Passphrase",
          String(new mongoose.Types.ObjectId()),
          {
            keySize: 512 / 32,
            iterations: 1000,
          }
        ).toString(CryptoJS.enc.Hex),
        chatType: true,
      };
      if (
        await ChatModel.findOne({ members: request.members, chatType: true })
      ) {
        throw new HttpException(200, "this chat already existed");
      }
      const result = await ChatModel.create(request);
      return res.status(200).json({
        success: true,
        code: res.statusCode,
        message: "Create new personalchat",
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

  //  create new group chat
  public CreateNewGroupChat = async (
    req: any,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const extension = ["image/jpg", "image/jpeg", "image/png", "image/gif"];
      if (!req.body.chatName) {
        throw new HttpException(200, "Group name can not be null");
      }
      if (req.file && extension.includes(req.file.mimetype) === false) {
        throw new HttpException(
          200,
          "Wrong file! Only accept JPEG, JPG, PNG and GIF"
        );
      }
      const user_creator = req.user.data;
      const request = {
        members: user_creator._id,
        chatName: req.body.chatName,
        owner: user_creator._id,
        chatId: CryptoJS.PBKDF2(
          "Secret Passphrase",
          String(new mongoose.Types.ObjectId()),
          {
            keySize: 512 / 32,
            iterations: 1000,
          }
        ).toString(CryptoJS.enc.Hex),
        chatImage: req.file ? `chats/${req.file.filename}` : "/group.jpg",
        chatType: false,
      };
      const dir = path.join(
        __dirname,
        `../../../public/chats/${request.chatId}`
      );
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
      }

      const result = await ChatModel.create(request);

      return res.status(200).json({
        success: true,
        code: res.statusCode,
        message: "Created new group chat",
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
      const files = req.files;
      if (!(await UserModel.findById(user_creator._id))) {
        throw new HttpException(200, "Not found user");
      }
      if (!(await ChatModel.findOne({ chatId: req.body.chatId }))) {
        throw new HttpException(200, "Not found chat channel");
      }
      const messages = [];
      for (const item of files) {
        messages.push({ messageImage: true, value: `/chats/${item.filename}` });
      }
      messages.push({
        messageImage: false,
        value: req.body.message ? req.body.message : null,
      });
      const request = {
        message: messages,
        ownerId: user_creator._id,
        chatId: req.body.chatId,
      };
      const result = await MessageModel.create(request);

      const chat = await ChatModel.updateOne(
        { chatId: req.body.chatId },
        { updatedAt: Date.now() }
      );
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
const GetNotAtSame = (array1: any[], array2: any[]): any[] => {
  return array1.filter((value) => !array2.includes(value));
};
