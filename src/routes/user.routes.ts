import AppRouter from "../modules/AppRouter";
import express from "express";
import UserController from "../controllers/userController/user.controller";
import AuthProvider from "../middlewares/authenHandler";
import { body } from "express-validator";

export default class UserRoutes extends AppRouter {
  public userController = new UserController();
  constructor(pathAPI: String, router?: express.Router) {
    super(pathAPI, router);

    this.router = router ? express.Router() : express.Router();
    this.pathAPI = pathAPI;

    this.intializeRoutes();
  }
  public intializeRoutes() {
    this.router.post(
      `${this.pathAPI}/register`,
      this.userController.upload.single("avatar"),
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
      this.userController.Register
    );
    this.router.post(
      `${this.pathAPI}/login`,
      [
        body("username").notEmpty().withMessage("Username is required"),
        body("password")
          .notEmpty()
          .withMessage("Password is required")
          .isLength({ min: 8 })
          .withMessage("Password cannot be shorter than 8 letters"),
      ],
      this.userController.LogIn
    );
    this.router.get(
      `${this.pathAPI}/personalProfileByToken`,
      AuthProvider.requireAuth(),
      this.userController.PersonalProfileByToken
    );
    this.router.get(
      `${this.pathAPI}/personalProfileById`,
      AuthProvider.requireAuth(),
      this.userController.PersonalProfileById
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
      this.userController.AnotherProfile
    );
    this.router.patch(
      `${this.pathAPI}/changeAvatar`,
      AuthProvider.requireAuth(),
      this.userController.upload.single("avatar"),
      this.userController.ChangeAvatar
    );
    this.router.post(
      `${this.pathAPI}/editProfile`,
      AuthProvider.requireAuth(),
      this.userController.EditProfile
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
        body("newRepassword")
          .notEmpty()
          .withMessage("Confirm password is required")
          .isLength({ min: 8 })
          .withMessage("Confirm password cannot be shorter than 8 letters"),
      ],
      AuthProvider.requireAuth(),
      this.userController.ChangePassword
    );
    this.router.get(
      `${this.pathAPI}/searchUser`,
      AuthProvider.requireAuth(),
      this.userController.SearchUsers
    );
  }
}
