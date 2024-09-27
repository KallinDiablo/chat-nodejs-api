import AppRouter from "../modules/AppRouter";
import express from "express";
import ChatController from "../controllers/chatController/chat.controller";
import AuthProvider from "../middlewares/authenHandler";
import { body } from "express-validator";

export default class ChatRoutes extends AppRouter{
    public chatController = new ChatController();
  constructor(pathAPI: String, router?: express.Router) {
    super(pathAPI, router);

    this.router = router ? express.Router() : express.Router();
    this.pathAPI = pathAPI;

    this.intializeRoutes();
  }
  public intializeRoutes(){
    this.router.post(
        `${this.pathAPI}/createNewPersonalChat`,
        AuthProvider.requireAuth(),
        this.chatController.CreateNewPersonalChat
    )
    this.router.post(
      `${this.pathAPI}/createNewGroupChat`,
      AuthProvider.requireAuth(),
      this.chatController.upload.single('file'),
      this.chatController.CreateNewGroupChat
  )
    this.router.post(
        `${this.pathAPI}/createNewMessage`,
        AuthProvider.requireAuth(),
        this.chatController.upload.array('files'),
        this.chatController.CreateNewMessage
    )
    this.router.get(
      `${this.pathAPI}/getPaginateChats`,
        AuthProvider.requireAuth(),
        this.chatController.GetPaginateChats
    )
    this.router.get(
      `${this.pathAPI}/getPaginateMessages`,
        AuthProvider.requireAuth(),
        this.chatController.GetPaginateMessage
    )
  }
}