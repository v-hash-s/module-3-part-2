import { GalleryService } from "./gallery.service";
import { getEnv } from "@helper/environment";
// import { log } from "@helper/logger";
import * as jwt from "jsonwebtoken";
import { DynamoClient } from "../../services/dynamodb-client";
import * as bcrypt from "bcryptjs";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { PutItemCommand } from "@aws-sdk/client-dynamodb";
import * as multipartParser from "lambda-multipart-parser";
import { s3Client } from "@services/s3Client";
import { String } from "aws-sdk/clients/cloudhsm";
import { GalleryResponse, Response } from "./gallery.interfaces";

export class GalleryManager {
  private readonly service: GalleryService;
  private readonly content?;
  private readonly filename?;
  private readonly token?;

  constructor(payload?, token?) {
    this.content = payload?.files[0]?.content;
    this.filename = payload?.files[0]?.filename;
    this.token = token;
  }

  async isExist(
    payload: multipartParser.MultipartRequest,
    email: string
  ): Promise<Boolean> {
    const command = new GetObjectCommand({
      Bucket: getEnv("IMAGES_BUCKET_NAME"),
      Key: `${email}/${payload.files[0].filename}`,
    });
    try {
      await s3Client.send(command);
      return true;
    } catch (err) {
      return false;
    }
  }

  cutEmail(filename: string, email: string): String {
    return filename.replace(`${email}/`, "");
  }

  async hashImage(image: string): Promise<string> {
    const saltRounds = getEnv("SALT_ROUNDS");
    const salt = await bcrypt.genSalt(Number(saltRounds));
    const hashedPassword = await bcrypt.hash(image, salt);
    return hashedPassword;
  }

  async saveImageToDB(
    file: multipartParser.MultipartRequest,
    filename: string,
    email: string
  ) {
    const params = {
      TableName: getEnv("USERS_TABLE_NAME"),
      Item: {
        email: { S: email },
        data: { S: `image_${await this.hashImage(filename)} ` },
        image: { S: this.cutEmail(filename, email) },
        metadata: {
          S: JSON.stringify({
            ContentType: file.contentType,
          }),
        },
        URL: {
          S: `https://gallery-images-bucket.s3.us-east-2.amazonaws.com/${email}/${await this.cutEmail(
            filename,
            email
          )}`,
        },
      },
    };
    return await DynamoClient.send(new PutItemCommand(params));
  }

  async sendGalleryObject(images): Promise<Response> {
    return {
      content: JSON.stringify(images),
      statusCode: 200,
    };
  }

  async getPagesNumber(total, limit) {
    limit = Number(limit);
    const finalResult = Math.ceil(total / limit);

    return finalResult;
  }

  async getEmailFromToken(token: string) {
    const email = jwt.verify(token, getEnv("TOKEN_KEY"));
    // @ts-ignore
    return email.email;
  }

  async returnGalleryResponse(galleryResponse): Promise<Response> {
    if (galleryResponse) {
      return {
        statusCode: 200,
        content: galleryResponse,
      };
    } else {
      return {
        statusCode: 404,
        content: { errorMessage: "Images not found" },
      };
    }
  }

  async returnResponse(isImageUploaded) {
    if (isImageUploaded) {
      return {
        content: "Image is successfully uploaded",
        statusCode: 200,
      };
    }
    return {
      content: "Error occured",
      statusCode: 500,
    };
  }
}
