import { connectDB } from "@services/db_connection";
import { getEnv } from "@helper/environment";
import { log } from "@helper/logger";
import * as path from "path";
import * as fs from "fs";
import { QueryParameters, GalleryResponse } from "./gallery.interfaces";
import { DynamoClient } from "../../services/dynamodb-client";
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
import { GalleryManager } from "./gallery.manager";
import { s3Client } from "@services/s3Client";
import { AnyDocument } from "dynamoose/dist/Document";
export class GalleryService {
  private readonly FOLDER_PATH: string = path.resolve(
    path.join(__dirname, "../../../../images")
  );
  private readonly manager: GalleryManager;

  constructor() {
    this.manager = new GalleryManager();
  }

  async getPagesNumber(queryParameters: QueryParameters): Promise<number> {
    log(queryParameters);
    let limit = Number(queryParameters.limit);
    const counts = await this.getTotal();
    const finalResult = Math.ceil(counts / limit);
    return finalResult;
  }

  async getTotal() {
    const params = {
      Bucket: getEnv("IMAGES_BUCKET_NAME"),
    };
    const command = new ListObjectsCommand(params);
    const response = await s3Client.send(command);
    let total = 0;
    for (let i = 0; i < response?.Contents?.length!; i++) {
      total++;
    }
    log(total);
    return total;
  }

  async getPagedImages(images, pageNumber, limit) {
    limit = Number(limit);
    pageNumber = Number(pageNumber);
    const photos = [] as any;
    for (
      let i = (pageNumber - 1) * limit;
      //@ts-ignore
      i < limit + (pageNumber - 1) * limit && i < images.length;
      i++
    ) {
      photos.push(images[i]);
      log(images[i] + " : " + i);
    }
    return {
      objects: await photos,
      total: await this.manager.getPagesNumber(await this.getTotal(), limit),
    };
  }

  async formatGalleryObject(images) {
    // const images = await imgs;
    log("IN FORMAT FUNC: ", images);
    // let photos = [] as any;
    // for (let i = 0; i < images.Items?.length!; i++) {
    //   photos.push(images.Items![i].URL.S);
    //   // log(images.Items![i].URL.S);
    // }
    let urls = await images.map(async (el) => {
      // return await el.Items!.URL.S;
      return await el;
    });
    const photos = await Promise.all(urls);
    const resolvedImages = photos.map((el: any) => el.URL.S);
    log("PHOTOS: ", resolvedImages);
    return resolvedImages;
  }

  /// UPLOAD
  // async formatJPEG(filename) {
  //   const regex = /.jpeg/;
  //   const jpg = ".jpg";
  //   if (filename.match(regex)) {
  //     log("Filename: ", filename);
  //     log("CHANGE: ", filename.replace(".jpeg", jpg));
  //     // return filename.replace(".jpeg", jpg);
  //   }
  // }

  async getGalleryObjects(query, email) {
    // await this.getPagesNumber(query);
    // await this.getTotal();
    log(query, "IN FUNCTION");
    if (query.filter != "true") {
      const params = {
        TableName: getEnv("USERS_TABLE_NAME"),
        ProjectionExpression: "#URL",
        ExpressionAttributeNames: {
          "#d": "data",
          "#URL": "URL",
        },
        ExpressionAttributeValues: {
          ":data": {
            S: "image_",
          },
        },
        FilterExpression: "begins_with(#d, :data)",
      };

      const GetItem = new ScanCommand(params);

      const img = await DynamoClient.send(GetItem);
      log(img);
      return img.Items;
    } else {
      const params = {
        TableName: getEnv("USERS_TABLE_NAME"),
        ProjectionExpression: "#URL",
        ExpressionAttributeNames: {
          "#e": "email",
          "#d": "data",
          "#URL": "URL",
        },
        ExpressionAttributeValues: {
          ":email": {
            S: email,
          },
          ":data": {
            S: "image_",
          },
        },
        KeyConditionExpression: "#e = :email AND begins_with ( #d, :data )",
      };

      const GetItem = new QueryCommand(params);
      const img = await DynamoClient.send(GetItem);
      log("IMG: ", img);
      return img.Items;
    }
  }

  async saveImageInDB(payload, email) {
    const result = await this.manager.isExist(payload, email);
    log(payload.files[0].contentType);
    // this.formatJPEG(payload.files[0].filename);
    if (!result) {
      const command = new PutObjectCommand({
        Bucket: getEnv("IMAGES_BUCKET_NAME"),
        // Body: payload.files[0].content,
        Body: payload.files[0].content,
        Key: `${email}/${payload.files[0].filename}`,
        ACL: "public-read",
        ContentType: payload.files[0].contentType,
      });
      const response = await s3Client.send(command);
      log(response);
      const res = await this.manager.isExist(payload, email);
      log("IS EXIST: ", res);
      if (!res) {
        return {
          statusCode: 404,
          content: "Something went wrong. Try again later",
        };
      } else {
        log("is about to save img to db");

        await this.manager.saveImageToDB(
          payload.files[0],
          `${email}/${payload.files[0].filename}`,
          email
        );
        return {
          statusCode: 200,
          content: "Image is successfully uploaded",
        };
      }
    } else {
      log("is about to save img to db");
      await this.manager.saveImageToDB(
        payload.files[0],
        `${email}/${payload.files[0].filename}`,
        email
      );
      return {
        statusCode: 309,
        content: "Image already exists",
      };
    }
  }
}
