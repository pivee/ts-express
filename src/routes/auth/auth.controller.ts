import * as express from "express";
import * as bcrypt from "bcrypt";

import {
  getRepository
} from "typeorm";

import Controller from "../../interfaces/controller.interface";

import User from "../../entities/user.entity";

//------------------------------------------------
// #region ----------------------------------- //. 🔻 ⚙ Middlewares
//------------------------------------------------
import validationMiddleware from "../../middlewares/validation.middleware";
//------------------------------------------------
// #endregion ------------------------------------ 🔺 ⚙ Middlewares
//------------------------------------------------

//------------------------------------------------
// #region ----------------------------------- //. 🔻 🚧 Data Transfer Objects
//------------------------------------------------
import {
  RegisterDTO,
  LogInDTO
} from "./auth.dto";
//------------------------------------------------
// #endregion ------------------------------------ 🔺 🚧 Data Transfer Objects
//------------------------------------------------

import UserWithThatEmailAlreadyExistsException from "./UserWithThatEmailAlreadyExistsException";
import WrongCredentialsException from "./WrongCredentialsException";

class AuthController implements Controller {

  public path = `/auth`;
  public router = express.Router();

  private repo = getRepository(User);

  constructor() {

    this.intializeRoutes();

  }

  public intializeRoutes(): void {

    /*
     * Create: Register
     */
    this.router.post(
      `${this.path}/register`,
      validationMiddleware(RegisterDTO),
      this.registerUser
    );
    /*
     * Login
     */
    this.router.post(
      `${this.path}/login`,
      validationMiddleware(LogInDTO),
      this.logInUser
    );

  }

  private registerUser = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) => {

    const userData: RegisterDTO = request.body;

    if (
      await this.repo.findOne({
        email: userData.email,
      })
    ) {

      next(new UserWithThatEmailAlreadyExistsException(userData.email));

    } else {

      const hashedPassword = await bcrypt.hash(userData.password, 10);

      const user = this.repo.create({
        ...userData,
        password: hashedPassword,
      });

      await this.repo.save(user);

      delete user.password;

      response.send(user);

    }

  }

  private logInUser = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
  ) => {

    const logInData: LogInDTO = request.body;

    const user = await this.repo.findOne({
      email: logInData.email,
    });

    if (user) {

      const isPasswordOK = await bcrypt.compare(logInData.password, user.password);

      if (isPasswordOK) {

        delete user.password;

        response.send(user);

      } else {

        next(new WrongCredentialsException());

      }

    } else {

      next(new WrongCredentialsException());

    }

  }

}

export default AuthController;
