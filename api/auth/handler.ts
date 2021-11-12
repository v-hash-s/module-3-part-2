import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { AuthManager } from "./auth.manager";
import { AuthService } from "./auth.service";
import { errorHandler } from "../../helper/http-api/error-handler";
import { createResponse } from "../../helper/http-api/response";
import { log } from "@helper/logger";

export const signUp = async (event) => {
  try {
    const user = JSON.parse(event.body!);
    const manager = new AuthManager();
    const result = await manager.signUp(user);
    return createResponse(result.statusCode, result.content);
  } catch (err) {
    return errorHandler(err);
  }
};

export const login = async (event) => {
  try {
    const user = JSON.parse(event.body!);
    const manager = new AuthManager();
    const result = await manager.sendResponseToUser(user);

    return createResponse(result.statusCode, result.content);
  } catch (error) {
    return errorHandler(error);
  }
};
