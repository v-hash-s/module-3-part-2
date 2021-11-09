import { connectDB } from "@services/db_connection";
import { log } from "@helper/logger";
import * as path from "path";
import * as fs from "fs";
import { QueryParameters, GalleryResponse } from "./gallery.interfaces";
import { DynamoClient } from "../../services/dynamodb-client";
export class GalleryService {
  private readonly FOLDER_PATH: string = path.resolve(
    path.join(__dirname, "../../../../images")
  );
  async sendGalleryObject(
    queryParameters: QueryParameters
  ): Promise<GalleryResponse> {
    const galleryResponse = {
      objects: await this.getPhotosArray(
        queryParameters.page,
        queryParameters.limit
      ),
      total: await this.getPagesNumber(queryParameters),
    };

    log("GALLERY Response: ", galleryResponse);

    return galleryResponse;
  }

  async getPagesNumber(queryParameters: QueryParameters): Promise<number> {
    let limit = Number(queryParameters.limit);
    const counts = await ImageModel.count();
    const finalResult = Math.ceil(counts / limit);

    return finalResult;
  }

  async getTotal(queryParameters: QueryParameters): Promise<number> {
    const total = await this.getPagesNumber(queryParameters);
    return total;
  }

  async getPhotosArray(
    pageNumber: number | string | undefined,
    limit: number | string | undefined
  ): Promise<string[]> {
    log("Page num: ", pageNumber);
    log("limit: ", limit);
    const arr = await this.getValue();
    const photos: string[] = [];
    limit = Number(limit);
    pageNumber = Number(pageNumber);

    for (
      let i = (pageNumber - 1) * limit;
      //@ts-ignore
      i < limit + (pageNumber - 1) * limit && i < arr.length;
      i++
    ) {
      photos.push(arr[i]._doc.path);
      log(arr[i]._doc.path + " : " + i);
    }

    return photos;
  }

  async getValue(): Promise<Object> {
    const arr = await ImageModel.find({}, { path: 1, _id: 0 }).exec();
    return arr;
  }

  async saveImageInDB(uploadedImage, user): Promise<void> {}

  // async saveImageLocally(
  //   uploadedImage: string,
  //   uploadedContent: Buffer
  // ): Promise<void> {
  //   fs.writeFile(
  //     path.join(this.FOLDER_PATH, uploadedImage),
  //     uploadedContent,
  //     { encoding: null },
  //     (err: any) => {
  //       if (err) console.error(err);
  //     }
  //   );
  // }
}
