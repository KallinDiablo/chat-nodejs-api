import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import path from "path";
import AppController from "./AppController";
import { Socket, Server as SocketServer } from "socket.io";
import loggingMiddleware from '../middlewares/loggingHandler';
import {createServer, Server} from 'http'
import cors from 'cors'
import 'dotenv/config'
import Constraints from "../constraints/constraints";
import AppRouter from "./AppRouter";
import folderMiddleware from "../middlewares/folderHandler";

export default class handleControllerAndMiddleware {
  public app: express.Application;
  public port: Number;
  public http: Server;
  public io: SocketServer;
  public constraints = new Constraints()

  constructor(routers:AppRouter[], port:Number) {
    this.app = express();
    this.port = port;

    // this.http = createServer(this.app)
    // this.io= new SocketServer(this.http,{
    //   cors: {
    //     origin: "*",
    //     methods: ["GET", "POST"]
    //   }
    // })


    this.initializeMiddlewares();
    this.initializeRouters(routers);
  }
  private initializeRouters(routers:AppRouter[]) {
    routers.forEach((router) => {
      this.app.use("/", router.router);
    });
  }
  private initializeMiddlewares() {
    // mongoose.connect('mongodb://127.0.0.1:27017/chat-app');
    mongoose.connect(this.constraints.mongo_connection);
    this.app.use(bodyParser.urlencoded({ extended: false }));
    this.app.use(bodyParser.json());
    this.app.use(cors())
    this.app.use("/static", express.static(path.join(__dirname, "../../public")));
    this.app.use(loggingMiddleware)
    this.app.use(folderMiddleware)

    // this.io.use((socket: Socket, next) => {
    //   console.log(`New connection: ${socket.id}`);
    //   next();
    // });
    // this.io.on('connection', (socket: Socket) => {
    //   console.log(`User connected: ${socket.id}`);
    
    //   // Handle custom events
    //   socket.on('customEvent', (data) => {
    //     console.log('Received custom event:', data);
    //     // Add your logic here
    //   });
    // });
  }

  public listen() {
    this.app.listen(this.port, () => {
      console.log(`App listening on the port ${this.port}`);
    });
  }
}
