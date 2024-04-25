import express, {
  Request,
  Response,
  NextFunction,
  ErrorRequestHandler,
} from "express";
import { isHttpError } from "http-errors";
import HttpException from "../modules/HttpException";
export default class ExceptionHandler {
  NotFound404(req: Request, res: Response, next: NextFunction) {
    const err = new Error(`Not found ${req.url}`) as StatusError
    err['status'] = 404
    res.json({
      success: false,
      code: 404,
      message: err.message,
      data: null,
    })
    console.log(2222,err)
    console.log(333,res.statusCode)
    next(err);
  }
  ErrorHandler: ErrorRequestHandler = (
    err,
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    console.log(1111,err);
    return res.json({
      success: false,
      code: res.statusCode,
      message: err.message,
      data: null,
    });
  };
}
interface StatusError extends Error{
  status?: Number
}
