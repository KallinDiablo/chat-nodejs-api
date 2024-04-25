import jwt from "jsonwebtoken";
import { Response, NextFunction } from "express";

export default class AuthProvider {
  static sign(user: any) {
    return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET);
  }

  static requireAuth() {
    return async (req: any, res: Response, next: NextFunction) => {
      try {
        const token: any =
          req.headers["x-access-token"] || req.header("Authorization");
        const decoded: any = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        req.user = decoded;
        return next();
      } catch (err) {
        if (err.httpCode) res.status(err.httpCode);

        res.json({
          success: false,
          code: res.statusCode,
          type: err.code || "AUTHENTICATION_ERROR",
          message: err.code ? err.message : "Invalid or Expired Token",
        });
      }
    };
  }
}
