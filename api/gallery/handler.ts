import { GalleryManager } from "./gallery.manager";
import { createResponse } from "@helper/http-api/response";
import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { errorHandler } from "@helper/http-api/error-handler";
import { log } from "@helper/logger";
// import { connectDB } from "@services/db_connection";
import * as multipartParser from "lambda-multipart-parser";
import { getEnv } from "@helper/environment";
import { s3Client } from "@services/s3Client";
import * as crypto from "crypto";

import {
  paginateListObjectsV2,
  S3Client,
  S3ClientConfig,
  ListObjectsCommand,
  PutObjectCommand,
  HeadObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import {
  GetItemCommand,
  PutItemCommand,
  PutItemInput,
  PutItemOutput,
  QueryCommand,
  ScanCommand,
} from "@aws-sdk/client-dynamodb";
import { GalleryService } from "./gallery.service";
import { DynamoClient } from "@services/dynamodb-client";
import { startsWith } from "sequelize/types/lib/operators";

// const s3Config: S3ClientConfig = {
//   region: getEnv("REGION"),
// };

// export const client = new S3Client(s3Config);
// const s3Opts = {
//   Bucket: getEnv("USERS_TABLE_NAME"),
//   Prefix: "public-images/",
//   Delimiter: "/",
// };

export const getGallery = async (event) => {
  const query = event.queryStringParameters;
  log(query);
  const manager = new GalleryManager();
  const service = new GalleryService();
  const token = await event.multiValueHeaders.Authorization.toString().replace(
    "Bearer ",
    ""
  );
  const email = await manager.getEmailFromToken(token);
  const images = await service.getGalleryObjects(query, email);
  log("IMAGES: ", images);
  const readyImages = await service.formatGalleryObject(images);
  log("READY IMAGES: ", readyImages);

  if (query.page && query.limit) {
    const toSendImages = await manager.sendGalleryObject(
      await service.getPagedImages(readyImages, query.page, query.limit)
    );
    log("WITH QUERY: ", toSendImages);
    return createResponse(toSendImages.statusCode, toSendImages.content);
  } else {
    const toSendImages = await manager.sendGalleryObject(readyImages);
    return createResponse(toSendImages.statusCode, toSendImages.content);
  }
  // if (!query.filter) {
  //   const params = {
  //     TableName: getEnv("USERS_TABLE_NAME"),
  //     ProjectionExpression: "#URL",
  //     ExpressionAttributeNames: {
  //       "#d": "data",
  //       "#URL": "URL",
  //     },
  //     ExpressionAttributeValues: {
  //       ":data": {
  //         S: "image_",
  //       },
  //     },
  //     FilterExpression: "begins_with(#d, :data)",
  //   };

  //   const GetItem = new ScanCommand(params);

  //   const img = await DynamoClient.send(GetItem);
  //   log(img);
  //   return JSON.stringify(img);
  // } else {
  //   const email = "asergeev@flo.team";
  //   const params = {
  //     TableName: getEnv("USERS_TABLE_NAME"),
  //     ProjectionExpression: "#URL",
  //     ExpressionAttributeNames: {
  //       "#e": "email",
  //       "#d": "data",
  //       "#URL": "URL",
  //     },
  //     ExpressionAttributeValues: {
  //       ":email": {
  //         S: email,
  //       },
  //       ":data": {
  //         S: "image_",
  //       },
  //     },
  //     KeyConditionExpression: "#e = :email AND begins_with ( #d, :data )",
  //   };

  //   const GetItem = new QueryCommand(params);
  //   const img = await DynamoClient.send(GetItem);

  // return createResponse(images.statusCode, images.content);

  // log(event.queryStringParameters);
  // try {
  //   const query = event.queryStringParameters;
  //   if (query.filter) {
  //     const token = event.multiValueHeaders.Authorization.toString().replace(
  //       "Bearer ",
  //       ""
  //     );
  //     const manager = new GalleryManager();
  //     const email = await manager.getEmailFromToken(token);
  //     log(email);
  //     const params = {
  //       TableName: getEnv("USERS_TABLE_NAME"),
  //       Key: {
  //         email: {
  //           S: email,
  //         },
  //       },
  //     };
  //     const GetItem = new GetItemCommand(params);
  //     const userFindResult = await DynamoClient.send(GetItem);
  //     const usersImages = userFindResult?.Item?.images.SS;
  //     // usersImages?.forEach((img) => {});
  //     log(usersImages);
  //   } else {
  //     const photos: string[] = [];
  //     const command = new ListObjectsCommand({
  //       Bucket: getEnv("BUCKET"),
  //     });
  //     const images = await client.send(command);
  //     log(images.Contents?.length);
  //     for (let i = 0; i < images?.Contents?.length!; i++) {
  //       photos.push(images.Contents![i].Key!);
  //       log(images.Contents![i].Key);
  //     }
  //   }
  ////////
  // const response = await client.send(command);
  // const contents = response.Contents;
  // contents?.forEach((el) => {
  //   if (el.Size !== 0) {
  //     log(el);
  //   }
  // });
  //////////////////
  // log(JSON.stringify(event.body));
  // const command = new PutObjectCommand(Bucket:  getEnv("USERS_TABLE_NAME"),
  //   Key: 'name', Body: "")
  // for (let i = 0; i < 3; i++) {
  //   if (contents[i].Size != 0) log(contents[i].Size);
  // }
  // log(response.Contents);
  // const queryParameters = event.queryStringParameters;
  // //@ts-ignore
  // const token = event.multiValueHeaders.Authorization.toString().replace(
  //   "Bearer ",
  //   ""
  // );
  // log(token);
  // const manager = new GalleryManager();
  // const email = await manager.getEmailFromToken(token);
  // const result = await manager.sendUsersImage(queryParameters, email);
  // log(result);
  // return createResponse(result.statusCode, result.content);
  // } catch (err) {
  //   return errorHandler(err);
  // }
};

export const upload = async (event) => {
  const payload = await multipartParser.parse(event);

  // @ts-ignore
  const token = await event.multiValueHeaders.Authorization.toString().replace(
    "Bearer ",
    ""
  );
  log(payload.files);
  const manager = new GalleryManager(payload, token);
  const service = new GalleryService();
  const email = await manager.getEmailFromToken(token);
  const result = await service.saveImageInDB(payload, email);

  return createResponse(result.statusCode, result.content);
};
