import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { AuthManager } from "./auth.manager";
import { errorHandler } from "../../helper/http-api/error-handler";
import { createResponse } from "../../helper/http-api/response";
import { Response, Token } from "./auth.interfaces";

export const signUp: APIGatewayProxyHandlerV2<Response> = async (event) => {
  try {
    const user = JSON.parse(event.body!);
    const manager = new AuthManager();
    const result = await manager.signUp(user);
    return createResponse(result.statusCode, result.content);
  } catch (err) {
    return errorHandler(err);
  }
};

export const login: APIGatewayProxyHandlerV2<Token> = async (event) => {
  try {
    const user = JSON.parse(event.body!);
    const manager = new AuthManager();
    const result = await manager.sendResponseToUser(user);

    return createResponse(result.statusCode, result.content);
  } catch (error) {
    return errorHandler(error);
  }
};
