import express, { NextFunction, Request, Response } from "express";
import mongoose, { MongooseError } from "mongoose";
import userModel from "./user.model";
import multer from "multer";
import path from "path";
import CryptoJS from "crypto-js";
import "dotenv/config";
import jwt from "jsonwebtoken";
import { body, check, validationResult } from "express-validator";
import AppController from "../../modules/AppController";
import HttpException from "../../modules/HttpException";
import AuthProvider from "../../middlewares/authenHandler";
export default class UserController extends AppController {
  public storageAvatar = multer.diskStorage({
    destination(req, file, callback) {
      callback(null, "./public/avatars");
    },
    filename(req, file, callback) {
      callback(
        null,
        `${req.body.username}_${req.body.email}_${
          req.body.pNumber
        }${path.extname(file.originalname)}`
      );
    },
  });
  public upload = multer({
    storage: this.storageAvatar,
  });

  constructor(pathAPI: String, router?: express.Router) {
    super(pathAPI, router);

    this.router = router ? express.Router() : express.Router();
    this.pathAPI = pathAPI;

    this.intializeRoutes();
  }

  public intializeRoutes() {
    this.router.post(
      `${this.pathAPI}/register`,
      this.upload.single("avatarFile"),
      [
        body("fullname").notEmpty().withMessage("Fullname is required"),
        body("username").notEmpty().withMessage("Username is required"),
        body("password")
          .notEmpty()
          .withMessage("Password is required")
          .isLength({ min: 8 })
          .withMessage("Password cannot be shorter than 8 letters"),
        body("email")
          .notEmpty()
          .withMessage("Email is required")
          .isEmail()
          .withMessage("Not email format"),
        body("pNumber")
          .notEmpty()
          .withMessage("Phone number is required")
          .isMobilePhone("any")
          .withMessage("Not phone format"),
      ],
      this.Register
    );
    this.router.get(
      `${this.pathAPI}/login`,
      [
        body("username").notEmpty().withMessage("Username is required"),
        body("password")
          .notEmpty()
          .withMessage("Password is required")
          .isLength({ min: 8 })
          .withMessage("Password cannot be shorter than 8 letters"),
      ],
      this.LogIn
    );
    this.router.get(
      `${this.pathAPI}/personalProfile`,
      AuthProvider.requireAuth(),
      this.PersonalProfile
    );
    this.router.get(
      `${this.pathAPI}/userProfile`,
      [
        body("pNumber")
          .notEmpty()
          .withMessage("Phone number is required")
          .isMobilePhone("any")
          .withMessage("Not phone format"),
      ],
      AuthProvider.requireAuth(),
      this.AnotherProfile
    );
    this.router.patch(
      `${this.pathAPI}/changeAvatar`,
      this.upload.single("avatarFile"),
      AuthProvider.requireAuth(),
      this.ChangeAvatar
    );
    this.router.patch(
      `${this.pathAPI}/editProfile`,
      [
        body("fullname").notEmpty().withMessage("Fullname is required"),
        body("email")
          .notEmpty()
          .withMessage("Email is required")
          .isEmail()
          .withMessage("Not email format"),
        body("pNumber")
          .notEmpty()
          .withMessage("Phone number is required")
          .isMobilePhone("any")
          .withMessage("Not phone format"),
      ],
      AuthProvider.requireAuth(),
      this.EditProfile
    );
    this.router.patch(
      `${this.pathAPI}/changePassword`,
      [
        body("oldPassword")
          .notEmpty()
          .withMessage("Old password is required")
          .isLength({ min: 8 })
          .withMessage("Old password cannot be shorter than 8 letters"),
        body("newPassword")
          .notEmpty()
          .withMessage("New password is required")
          .isLength({ min: 8 })
          .withMessage("New password cannot be shorter than 8 letters"),
        body("NewRepassword")
          .notEmpty()
          .withMessage("Confirm new password is required")
          .isLength({ min: 8 })
          .withMessage("Confirm new password cannot be shorter than 8 letters"),
      ],
      AuthProvider.requireAuth(),
      this.ChangePassword
    );
  }
  // Register
  private async Register(req: Request, res: Response, next: NextFunction) {
    try {
      const getValidator: any = validationResult(req);
      const avatarDir: String = req.file
        ? `/avatars/${req.file.filename}`
        : "/avatars/guest.jpg";
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
      const mongoUnique: string[] = [];
      if (await CheckExist("username", req.body.username)) {
        mongoUnique.push("Username existed");
      }
      if (await CheckExist("password", req.body.password)) {
        mongoUnique.push("Password existed");
      }
      if (await CheckExist("email", req.body.email)) {
        mongoUnique.push("Email existed");
      }
      if (await CheckExist("pNumber", req.body.pNumber)) {
        mongoUnique.push("Phone number existed");
      }
      if (mongoUnique.length === 0) {
        switch (getValidator.isEmpty()) {
          case true:
            const result = await userModel.create(newUser);
            return res.json({
              success: true,
              code: res.statusCode,
              message: "Add new user",
              data: result,
            });
          case false: {
            const listError: any[] = [];
            for (const error of getValidator.errors) {
              listError.push({ message: error.msg });
            }
            return res.json({
              success: false,
              code: res.statusCode,
              type: "Validate Error",
              message: listError,
            });
          }
        }
      } else {
        throw new MongooseError(mongoUnique.toString());
      }
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        code: res.statusCode,
        type: error.name,
        message: error.message,
      });
    }
  }

  //Log in
  private async LogIn(req: Request, res: Response) {
    try {
      const getValidator: any = validationResult(req);
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
        throw new HttpException(500, "Username or password wrong");
      }
      const result = jwt.sign({ data: data }, process.env.ACCESS_TOKEN_SECRET, {
        algorithm: "HS256",
        expiresIn: "2y",
      });
      switch (getValidator.isEmpty()) {
        case true: {
          return res.json({
            success: true,
            code: res.statusCode,
            message: "Login",
            data: result,
          });
        }
        case false: {
          const listError: any[] = [];
          for (const error of getValidator.errors) {
            listError.push({ message: error.msg });
          }
          return res.json({
            success: false,
            code: res.statusCode,
            type: "Validate Error",
            message: listError,
          });
        }
      }
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        code: res.statusCode,
        type: error.name,
        message: error.message,
      });
    }
  }

  // Get personal profile
  private async PersonalProfile(req: any, res: Response) {
    try {
      const user = req.user;
      return res.json({
        success: true,
        code: res.statusCode,
        message: "Get Personal profile",
        data: {
          fullname: user.data.fullname,
          email: user.data.email,
          pNumber: user.data.pNumber,
          avatart: user.data.avatar,
        },
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        code: res.statusCode,
        type: error.name,
        message: error.message,
      });
    }
  }

  // Get Another profile
  private async AnotherProfile(req: any, res: Response) {
    try {
      const dataWaitingForGet = {
        pNumber: req.query.pNumber,
      };
      const data = await userModel.findOne(dataWaitingForGet);
      if (data === null) {
        throw new HttpException(500, "User not found");
      }
      if (data._id == req.user.data._id) {
        throw new HttpException(500, "Get profile error");
      }
      return res.json({
        success: true,
        code: res.statusCode,
        message: "Get User profile",
        data: {
          fullname: data.fullname,
          email: data.email,
          pNumber: data.pNumber,
          avatart: data.avatar,
        },
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        code: res.statusCode,
        type: error.name,
        message: error.message,
      });
    }
  }
  // Change avatar
  private async ChangeAvatar(req: any, res: Response) {
    try {
      const user = req.user.data;
      const avatarDir: String = req.file
        ? `/avatars/${req.file.filename}`
        : "/avatars/guest.jpg";
      const result = await userModel.updateOne(
        { _id: user._id },
        { avatar: avatarDir }
      );
      return res.json({
        success: true,
        code: res.statusCode,
        message: "Updated avatar",
        data: result,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        code: res.statusCode,
        type: error.name,
        message: error.message,
      });
    }
  }
  // Edit profile
  private async EditProfile(req: any, res: Response) {
    try {
      const user = req.user.data;
      const data = {
        fullname: req.body.fullname ? req.body.fullname : user.fullname,
        email: req.body.email ? req.body.email : user.email,
        pNumber: req.body.pNumber ? req.body.pNumber : user.pNumber,
      };
      const result = await userModel.updateOne({ _id: user._id }, data);
      return res.json({
        success: true,
        code: res.statusCode,
        message: "Updated profile",
        data: result,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        code: res.statusCode,
        type: error.name,
        message: error.message,
      });
    }
  }
  // Edit profile
  private async ChangePassword(req: any, res: Response) {
    try {
      const user = req.user.data;
      const data = {
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
      console.log(data);
      if (data.oldPassword != user.password) {
        throw new HttpException(500, "Old password wrong");
      }
      if (data.newRepassword != data.newPassword) {
        throw new HttpException(
          500,
          "Confirm new password and new password is different"
        );
      }
      const password = CryptoJS.PBKDF2(
        "Secret Passphrase",
        String(data.newPassword),
        {
          keySize: 512 / 32,
          iterations: 1000,
        }
      ).toString(CryptoJS.enc.Base64);
      const result = await userModel.updateOne({ _id: user._id }, { password });
      return res.json({
        success: true,
        code: res.statusCode,
        message: "Updated profile",
        data: result,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        code: res.statusCode,
        type: error.name,
        message: error.message,
      });
    }
  }
  // Add friend
  private async AddFriend(req: any, res: Response) {
    try {
      const user = req.user.data
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        code: res.statusCode,
        type: error.name,
        message: error.message,
      });
    }
  }
  // Remove friend
  private async RemoveFriend(req: any, res: Response) {
    try {
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        code: res.statusCode,
        type: error.name,
        message: error.message,
      });
    }
  }
}
async function CheckExist(position: string, object: any) {
  const store: any = {};
  store[position] = object;
  if ((await userModel.exists(store)) !== null) {
    return true;
  } else {
    return false;
  }
}
