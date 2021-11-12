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

  async createUser(user: User): Promise<void> {
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
  }

  async hashPassword(password: string): Promise<string> {
    const saltRounds = getEnv("SALT_ROUNDS");
    const salt = await this.getSalt(Number(saltRounds));
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
  }

  async getSalt(saltRounds: number): Promise<string> {
    const salt = await bcrypt.genSalt(saltRounds);
    return salt;
  }
}
