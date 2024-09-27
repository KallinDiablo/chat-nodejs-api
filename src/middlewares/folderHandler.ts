import { Request, Response, NextFunction } from "express";
import fs from "fs";
import path from "path";
import UserModel from "../controllers/userController/user.model";
import ChatModel from "../controllers/chatController/chat.model";
import MessageModel from "../controllers/chatController/message.model";
const folderMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const publicDir = path.join(__dirname, "../../public");
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir);
  }
  const publicAvatarDir = path.join(__dirname, "../../public/avatars");
  if (!fs.existsSync(publicAvatarDir)) {
    fs.mkdirSync(publicAvatarDir);
  }
  const publicChatDir = path.join(__dirname, "../../public/chats");
  if (!fs.existsSync(publicChatDir)) {
    fs.mkdirSync(publicChatDir);
  }
  const avatarNameGetFromMongo = (await UserModel.find()).map((e) => e.avatar);
  const ChatFolderGetFromMongo = (await ChatModel.find()).map((e) => (`${e.chatId}`));
  const ChatImageGetFromMongo = (await ChatModel.find()).filter(e=>{return e.chatType=false}).map((e) => (`${e.chatImage}`));
  const FileNameGetFromMongo = (await MessageModel.find()).map((e) => ({
    chatId: e.chatId,
    message: e.message
      .toObject()
      .filter((a: any) => {
        return a.messageImage === true;
      })
      .map((a: any) => a.value),
  }));
  const listAvatarFile = fs
    .readdirSync(publicAvatarDir)
    .map((e) => `/avatars/${e}`);
  const listChatDir = fs.readdirSync(publicChatDir);
  const notExistDbAvatar = getNotOnDbValues(
    listAvatarFile,
    avatarNameGetFromMongo
  );
  const notExistChatDir = getNotOnDbValues(listChatDir, ChatFolderGetFromMongo).map((e) => `/chats/${e}`);
  if (notExistDbAvatar) {
    for (const item of notExistDbAvatar) {
      fs.unlinkSync(path.join(__dirname, "../../public", item));
    }
  }
  if (notExistChatDir) {
    for (const item of notExistChatDir) {
      fs.rmSync(path.join(__dirname, "../../public", item),{ recursive: true });
    }
  }
  if (FileNameGetFromMongo) {
    for (const item of FileNameGetFromMongo) {
      for (const folder of ChatFolderGetFromMongo) {
        if (item.chatId === folder) {
          const listFileLocal = fs
            .readdirSync(path.join(publicChatDir, `/${folder}`))
            .map((e) => `/chats/${e}`);
          const notExistDbMessageFile = getNotOnDbValues(
            listFileLocal,
            item.message
          );
          notExistDbMessageFile.forEach((e) => {
            fs.unlinkSync(
              path.join(__dirname, `../../public/chats/${folder}`, e)
            );
          });
        }
      }
    }
  }
  next(); // Call the next middleware or route handler
};
const getNotOnDbValues = (array1: string[], array2: string[]): string[] => {
  return array1.filter((value) => !array2.includes(value));
};
export default folderMiddleware;
