import { Request, Response, NextFunction } from "express";

const loggingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.url;
  const status = res.statusCode;
  console.log(`[${timestamp}] ${method} | ${status} | ${url} `);

  next(); // Call the next middleware or route handler
};

export default loggingMiddleware;
