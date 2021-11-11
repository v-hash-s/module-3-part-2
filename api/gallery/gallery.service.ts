import { connectDB } from "@services/db_connection";
import { getEnv } from "@helper/environment";
import { log } from "@helper/logger";
import * as path from "path";
import * as fs from "fs";
import { QueryParameters, GalleryResponse } from "./gallery.interfaces";
import { DynamoClient } from "../../services/dynamodb-client";
import { client } from "./handler";
import { S3Service } from "../../services/s3.service";
import {
  paginateListObjectsV2,
  S3Client,
  S3ClientConfig,
  ListObjectsCommand,
  PutObjectCommand,
  HeadObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { GalleryManager } from "./gallery.manager";
import { s3Client } from "@services/s3Client";
export class GalleryService {
  private readonly FOLDER_PATH: string = path.resolve(
    path.join(__dirname, "../../../../images")
  );
  private readonly manager: GalleryManager;

  constructor() {
    this.manager = new GalleryManager();
  }
  // async sendGalleryObject(
  //   queryParameters: QueryParameters
  // ): Promise<GalleryResponse> {
  //   const galleryResponse = {
  //     objects: await this.getPhotosArray(
  //       queryParameters.page,
  //       queryParameters.limit
  //     ),
  //     total: await this.getPagesNumber(queryParameters),
  //   };

  //   log("GALLERY Response: ", galleryResponse);

  //   return galleryResponse;
  // }

  // async getPagesNumber(queryParameters: QueryParameters): Promise<number> {
  //   let limit = Number(queryParameters.limit);
  //   // const counts = await ImageModel.count();
  //   // const finalResult = Math.ceil(counts / limit);

  //   return finalResult;
  // }

  // async getTotal(queryParameters: QueryParameters): Promise<number> {
  //   const total = await this.getPagesNumber(queryParameters);
  //   return total;
  // }

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
      log(res);
      if (!res) {
        return {
          statusCode: 404,
          content: "Something went wrong. Try again later",
        };
      } else {
        return {
          statusCode: 200,
          content: "Image is successfully uploaded",
        };
      }
    } else {
      return {
        statusCode: 309,
        content: "Image already exists",
      };
    }
  }
}
