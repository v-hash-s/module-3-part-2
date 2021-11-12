import { getEnv } from "@helper/environment";
import * as jwt from "jsonwebtoken";
import { User } from "./auth.interfaces";
import * as bcrypt from "bcryptjs";
import { PutItemCommand } from "@aws-sdk/client-dynamodb";
import { DynamoClient } from "@services/dynamodb-client";
import { log } from "@helper/logger";

export class AuthService {
  signJWTToken(userEmail: string): string {
    return jwt.sign({ email: userEmail }, getEnv("TOKEN_KEY"));
  }

  async createUser(user: User) {
    log("creating new");
    const params = {
      TableName: getEnv("USERS_TABLE_NAME"),
      Item: {
        email: { S: user.email },
        data: { S: "user" },
        password: { S: await this.hashPassword(user.password) },
      },
    };
    const PutItem = new PutItemCommand(params);
    const userPutResult = await DynamoClient.send(PutItem);
    log(userPutResult);
  }

  async hashPassword(password: string): Promise<string> {
    log("Pasword in function: ", password);
    const saltRounds = getEnv("SALT_ROUNDS");
    const salt = await this.getSalt(Number(saltRounds));
    const hashedPassword = await bcrypt.hash(password, salt);
    log("hashed password: ", hashedPassword);
    return hashedPassword;
  }

  async getSalt(saltRounds: number): Promise<string> {
    const salt = await bcrypt.genSalt(saltRounds);
    console.log("Salt: ", salt);
    return salt;
  }
}
