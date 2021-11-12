import { log } from "@helper/logger";
import {
  APIGatewayAuthorizerResult,
  APIGatewayTokenAuthorizerWithContextHandler,
} from "aws-lambda";
import * as JWT from "jsonwebtoken";
import { Response } from "@helper/http-api/response";
import { getEnv } from "@helper/environment";
import * as jwt from "jsonwebtoken";
import { connectDB } from "@services/db_connection";
import * as bcrypt from "bcryptjs";
import { DynamoClient } from "@services/dynamodb-client";

import { GetItemCommand } from "@aws-sdk/client-dynamodb";

export const authenticationJWT = async (event) => {
  await connectDB;
  log("AUTHORIZER: ", event);

  const token = event.authorizationToken.toString().replace("Bearer ", "");
  log("TOKEN: ", token);
  try {
    let user = jwt.verify(token, getEnv("TOKEN_KEY"));
    log("USER: ", user);
    if (!(await isUserInDB(user))) {
      throw new Error("Unauthorized");
    }
    return generatePolicy("user", "Allow", "*", {
      //@ts-ignore
      user: user.email,
      body: event.body,
    });
  } catch (err) {
    return generatePolicy("user", "Deny", "*", {});
  }
};

export function generatePolicy<C extends APIGatewayAuthorizerResult["context"]>(
  principalId: string,
  effect: "Allow" | "Deny",
  resource: string,
  context: C
): APIGatewayAuthorizerResult & { context: C } {
  const authResponse: APIGatewayAuthorizerResult & { context: C } = {
    principalId,
    policyDocument: {
      Version: "2012-10-17",
      Statement: [
        {
          Action: "execute-api:Invoke",
          Effect: effect,
          Resource: resource,
        },
      ],
    },
    context,
  };

  return authResponse;
}

async function isUserInDB(user): Promise<boolean> {
  const params = {
    TableName: getEnv("USERS_TABLE_NAME"),
    Key: {
      email: {
        S: user.email,
      },
      data: {
        S: "user",
      },
    },
  };
  const GetItem = new GetItemCommand(params);
  const userFindResult = await DynamoClient.send(GetItem);
  if (userFindResult.Item == null) return false;
  const passwordFromDB = userFindResult.Item.password.S;

  if (bcrypt.compareSync(user.password, passwordFromDB!)) {
    return true;
  }
  return false;
}
