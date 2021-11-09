import { GalleryManager } from "./gallery.manager";
import { createResponse } from "@helper/http-api/response";
import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { errorHandler } from "@helper/http-api/error-handler";
import { log } from "@helper/logger";
// import { connectDB } from "@services/db_connection";
import * as multipartParser from "lambda-multipart-parser";
import { getEnv } from "@helper/environment";
import {
  paginateListObjectsV2,
  S3Client,
  S3ClientConfig,
  ListObjectsCommand,
  PutObjectCommand,
  HeadObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { GalleryService } from "./gallery.service";

const s3Config: S3ClientConfig = {
  region: getEnv("REGION"),
};

export const client = new S3Client(s3Config);
const s3Opts = {
  Bucket: getEnv("USERS_TABLE_NAME"),
  Prefix: "public-images/",
  Delimiter: "/",
};

export const getGallery = async (event) => {
  try {
    const command = new ListObjectsCommand(s3Opts);
    const response = await client.send(command);
    const contents = response.Contents;
    contents?.forEach((el) => {
      if (el.Size !== 0) {
        log(el);
      }
    });
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
  } catch (err) {
    return errorHandler(err);
  }
};

export const upload = async (event) => {
  const payload = await multipartParser.parse(event);

  // @ts-ignore
  const token = await event.multiValueHeaders.Authorization.toString().replace(
    "Bearer ",
    ""
  );
  const manager = new GalleryManager(payload, token);
  const service = new GalleryService();
  const email = await manager.getEmailFromToken(token);
  const result = await service.saveImageInDB(payload, email);
  return createResponse(result.statusCode, result.content);
  // log(email);
  // const command = new GetObjectCommand({
  //   Bucket: getEnv("BUCKET"),
  //   Key: `${email}/${payload.files[0].filename}`,
  // });
  // try {
  //   await client.send(command);
  //   log("image is uploaded lol");
  // } catch (err) {
  //   return "err";
  // }

  // const command = new PutObjectCommand({
  //   Bucket: "gallery-images-bucket",
  //   Body: payload.files[0].content,
  //   Key: `${email}/${payload.files[0].filename}`,
  //   ACL: "public-read",
  // });
  // const response = await client.send(command);
  // log(response);

  // if (await manager.isExist(payload.files[0].filename)) {
  //   const response = {
  //     statusCode: 309,
  //     content: "Image already exists",
  //   };
  //   return createResponse(response.statusCode, response.content);
  // }
  // const result = await manager.saveImages();
  // return createResponse(result.statusCode, result.content);
};
