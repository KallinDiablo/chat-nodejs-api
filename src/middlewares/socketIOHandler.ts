import { Request, Response, NextFunction } from "express";
import { Socket, Server as SocketServer } from "socket.io";
import { createServer, Server } from "http";
const SocketMiddleware = (socket: Socket) => {
  console.log(`User connected: ${socket.id}`);

  // Handle custom events
  socket.on("customEvent", (data) => {
    console.log("Received custom event:", data);
    // Add your logic here
  });
};

export default SocketMiddleware;
