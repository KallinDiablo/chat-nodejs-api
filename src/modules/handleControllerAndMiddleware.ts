import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import path from "path";
import AppController from "./AppController";
import { Server as SocketServer } from "socket.io";
import {createServer, Server} from 'http'
import cors from 'cors'
import 'dotenv/config'

export default class handleControllerAndMiddleware {
  public app: express.Application;
  public port: Number;
  public http: Server;
  public io: SocketServer;

  constructor(controllers:AppController[], port:Number) {
    this.app = express();
    this.port = port;

    this.http = createServer(this.app)
    this.io= new SocketServer(this.http,{
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    })


    this.initializeMiddlewares();
    this.initializeControllers(controllers);
  }
  private initializeControllers(controllers:AppController[]) {
    controllers.forEach((controller) => {
      this.app.use("/", controller.router);
    });
  }
  private initializeMiddlewares() {
    // mongoose.connect('mongodb://127.0.0.1:27017/chat-app');
    mongoose.connect(process.env.MONGODB_CONNECTION_STRING_LOCALHOST as string);
    this.app.use(bodyParser.urlencoded({ extended: false }));
    this.app.use(bodyParser.json());
    this.app.use(cors)
    this.app.use("/static", express.static(path.join(__dirname, "../../public")));
    // this.app.use(this.exceptionHandler.NotFound404)
    // this.app.use(this.exceptionHandler.ErrorHandler)
  }

  public listen() {
    this.app.listen(this.port, () => {
      console.log(`App listening on the port ${this.port}`);
    });
  }
}
