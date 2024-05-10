import { NextFunction, Request, Response } from "express";
import mongoose, { MongooseError } from "mongoose";
import userModel from "./user.model";
import multer from "multer";
import path from "path";
import CryptoJS from "crypto-js";
import "dotenv/config";
import jwt from "jsonwebtoken";
import { validationResult } from "express-validator";
import HttpException from "../../modules/HttpException";
export default class UserController {
  public storageAvatar = multer.diskStorage({
    destination(req, file, callback) {
      callback(null, "./public/avatars");
    },
    filename(req: any, file, callback) {
      callback(
        null,
        `${
          req.body.username !== undefined
          ? req.body.username
          : req.user.data.username
        }_${
          req.body.email !== undefined ? req.body.email : req.user.data.email
        }_${
          req.body.pNumber !== undefined
            ? req.body.pNumber
            : req.user.data.pNumber
        }${path.extname(file.originalname)}`.toLowerCase()
      );
    },
  });
  public upload = multer({
    storage: this.storageAvatar,
  });
  
  // Register
  public Register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const extension = ["image/jpg", "image/jpeg", "image/png", "image/gif"];
      const getValidator: any = validationResult(req);
      const avatarDir: String = req.file
        ? `/avatars/${req.file.filename}`
        : "/guest.jpg";

      if (extension.includes(req.file.mimetype) === false) {
        throw new HttpException(
          200,
          "Wrong file! Only accept JPEG, JPG, PNG and GIF"
        );
      }

      const newUser = {
        _id: new mongoose.Types.ObjectId(),
        fullname: req.body.fullname,
        username: req.body.username,
        password: CryptoJS.PBKDF2(
          "Secret Passphrase",
          String(req.body.password),
          {
            keySize: 512 / 32,
            iterations: 1000,
          }
        ).toString(CryptoJS.enc.Base64),
        email: req.body.email,
        pNumber: req.body.pNumber,
        avatar: avatarDir,
      };
      if (getValidator.isEmpty() === false) {
        const listError: any[] = getValidator.errors
          .map((a: any) => ({ path: a.path, message: a.msg }))
          .filter((obj: any, index: any, self: any) => {
            return self.findIndex((o: any) => o.path === obj.path) === index;
          });
        return res.status(200).json({
          success: false,
          code: res.statusCode,
          type: "Validate Error",
          message: listError,
        });
      }
      const mongoUnique: string[] = [];
      if (await CheckExist("username", req.body.username)) {
        mongoUnique.push("Username existed");
      }
      if (await CheckExist("email", req.body.email)) {
        mongoUnique.push("Email existed");
      }
      if (await CheckExist("pNumber", req.body.pNumber)) {
        mongoUnique.push("Phone number existed");
      }
      if (mongoUnique.length === 0) {
        const result = await userModel.create(newUser);
        return res.status(200).json({
          success: true,
          code: res.statusCode,
          message: "Add new user",
          data: result,
        });
      } else {
        throw new MongooseError(mongoUnique.toString());
      }
    } catch (error: any) {
      return res.status(200).json({
        success: false,
        code: res.statusCode,
        type: error.name,
        message: error.message,
      });
    }
  };

  //Log in
  public LogIn = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const getValidator: any = validationResult(req);

      if (getValidator.isEmpty() === false) {
        const listError: any[] = getValidator.errors
          .map((a: any) => ({ path: a.path, message: a.msg }))
          .filter((obj: any, index: any, self: any) => {
            return self.findIndex((o: any) => o.path === obj.path) === index;
          });
        return res.status(200).json({
          success: false,
          code: res.statusCode,
          type: "Validate Error",
          message: listError,
        });
      }
      const newLogIn = {
        username: req.body.username,
        password: CryptoJS.PBKDF2(
          "Secret Passphrase",
          String(req.body.password),
          {
            keySize: 512 / 32,
            iterations: 1000,
          }
        ).toString(CryptoJS.enc.Base64),
      };
      const data = await userModel.findOne(newLogIn);
      if (data === null) {
        throw new HttpException(200, "Username or password wrong");
      }
      const result = jwt.sign({ data: data }, process.env.ACCESS_TOKEN_SECRET, {
        algorithm: "HS256",
        expiresIn: "2y",
      });
      return res.status(200).json({
        success: true,
        code: res.statusCode,
        message: "Login",
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

  // Get personal profile by Token
  public PersonalProfileByToken = async (
    req: any,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const user = req.user;
      return res.status(200).json({
        success: true,
        code: res.statusCode,
        message: "Get Personal profile",
        data: {
          fullname: user.data.fullname,
          email: user.data.email,
          pNumber: user.data.pNumber,
          avatar: user.data.avatar,
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

  // Get personal profile by Token
  public PersonalProfileById = async (req: any, res: Response) => {
    try {
      const id = req.query.id;
      const data = await userModel.findById(id);
      if (data === null) {
        throw new HttpException(200, "User not found");
      }
      return res.status(200).json({
        success: true,
        code: res.statusCode,
        message: "Get Personal profile",
        data: {
          fullname: data.fullname,
          email: data.email,
          pNumber: data.pNumber,
          avatar: data.avatar,
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

  // Get Another profile
  public AnotherProfile = async (req: any, res: Response) => {
    try {
      const dataWaitingForGet = {
        pNumber: req.query.pNumber,
      };
      const data = await userModel.findOne(dataWaitingForGet);
      if (data === null) {
        throw new HttpException(200, "User not found");
      }
      if (data._id == req.user.data._id) {
        throw new HttpException(200, "Get profile error");
      }
      return res.status(200).json({
        success: true,
        code: res.statusCode,
        message: "Get User profile",
        data: {
          fullname: data.fullname,
          email: data.email,
          pNumber: data.pNumber,
          avatar: data.avatar,
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
  // Change avatar
  public ChangeAvatar = async (req: any, res: Response) => {
    try {
      const extension = ["image/jpg", "image/jpeg", "image/png", "image/gif"];
      const user = req.user.data;
      const avatarDir: String = req.file
        ? `/avatars/${req.file.filename}`
        : "/guest.jpg";
      if (extension.includes(req.file.mimetype) === false) {
        throw new HttpException(
          200,
          "Wrong file! Only accept JPEG, JPG, PNG and GIF"
        );
      }
      const result = await userModel.findOneAndUpdate(
        { _id: user._id },
        { avatar: avatarDir }
      );
      if (result === null) {
        throw new HttpException(200, "User not found");
      }
      const data = await userModel.findById(user._id);
      const refreshtoken = jwt.sign(
        { data: data },
        process.env.ACCESS_TOKEN_SECRET,
        {
          algorithm: "HS256",
          expiresIn: "2y",
        }
      );
      return res.status(200).json({
        success: true,
        code: res.statusCode,
        message: "Updated avatar",
        data: refreshtoken,
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
  // Edit profile
  public EditProfile = async (req: any, res: Response) => {
    try {
      const user = req.user.data;
      const dataset = {
        fullname: req.body.fullname ? req.body.fullname : user.fullname,
        email: req.body.email ? req.body.email : user.email,
        pNumber: req.body.pNumber ? req.body.pNumber : user.pNumber,
      };
      console.log(req.body);
      const mongoUnique: string[] = [];
      if (
        (await CheckExist("fullname", req.body.fullname)) &&
        req.body.fullname !== user.fullname
      ) {
        mongoUnique.push("Username existed");
      }
      if (
        (await CheckExist("email", req.body.email)) &&
        req.body.email !== user.email
      ) {
        mongoUnique.push("Email existed");
      }
      if (
        (await CheckExist("pNumber", req.body.pNumber)) &&
        req.body.pNumber !== user.pNumber
      ) {
        mongoUnique.push("Phone number existed");
      }
      if (mongoUnique.length === 0) {
        const result = await userModel.findOneAndUpdate(
          { email: user.email },
          dataset
        );
        if (result === null) {
          throw new HttpException(200, "User not found");
        }
        const data = await userModel.findOne({ email: user.email });

        const refreshtoken = jwt.sign(
          { data: data },
          process.env.ACCESS_TOKEN_SECRET,
          {
            algorithm: "HS256",
            expiresIn: "2y",
          }
        );
        return res.status(200).json({
          success: true,
          code: res.statusCode,
          message: "Updated profile",
          data: refreshtoken,
        });
      } else {
        throw new MongooseError(mongoUnique.toString());
      }
    } catch (error: any) {
      return res.status(200).json({
        success: false,
        code: res.statusCode,
        type: error.name,
        message: error.message,
      });
    }
  };
  // Edit profile
  public ChangePassword = async (req: any, res: Response) => {
    try {
      const getValidator: any = validationResult(req);
      if (getValidator.isEmpty() === false) {
        const listError: any[] = getValidator.errors
          .map((a: any) => ({ path: a.path, message: a.msg }))
          .filter((obj: any, index: any, self: any) => {
            return self.findIndex((o: any) => o.path === obj.path) === index;
          });
        return res.status(200).json({
          success: false,
          code: res.statusCode,
          type: "Validate Error",
          message: listError,
        });
      }
      const user = req.user.data;
      const listPassword = {
        oldPassword: CryptoJS.PBKDF2(
          "Secret Passphrase",
          String(req.body.oldPassword),
          {
            keySize: 512 / 32,
            iterations: 1000,
          }
        ).toString(CryptoJS.enc.Base64),
        newPassword: req.body.newPassword,
        newRepassword: req.body.newRepassword,
      };
      if (listPassword.oldPassword != user.password) {
        throw new HttpException(200, "Old password wrong");
      }
      if (listPassword.newRepassword != listPassword.newPassword) {
        throw new HttpException(
          200,
          "Confirm password and new password are different"
        );
      }
      const password = CryptoJS.PBKDF2(
        "Secret Passphrase",
        String(listPassword.newPassword),
        {
          keySize: 512 / 32,
          iterations: 1000,
        }
      ).toString(CryptoJS.enc.Base64);
      const result = await userModel.findOneAndUpdate(
        { _id: user._id },
        { password }
      );
      if (result === null) {
        throw new HttpException(200, "User not found");
      }
      const data = await userModel.findById(user._id);

      const refreshtoken = jwt.sign(
        { data: data },
        process.env.ACCESS_TOKEN_SECRET,
        {
          algorithm: "HS256",
          expiresIn: "2y",
        }
      );
      return res.status(200).json({
        success: true,
        code: res.statusCode,
        message: "Updated profile",
        data: refreshtoken,
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
  // Add friend

  public AddFriend = async (req: any, res: Response) => {
    try {
      const user = req.user.data;
    } catch (error: any) {
      return res.status(200).json({
        success: false,
        code: res.statusCode,
        type: error.name,
        message: error.message,
      });
    }
  };
  // Remove friend
  private async RemoveFriend(req: any, res: Response) {
    try {
    } catch (error: any) {
      return res.status(200).json({
        success: false,
        code: res.statusCode,
        type: error.name,
        message: error.message,
      });
    }
  }
}
const CheckExist = async (position: string, object: any) => {
  const store: any = {};
  store[position] = object;
  if ((await userModel.exists(store)) !== null) {
    return true;
  } else {
    return false;
  }
};
