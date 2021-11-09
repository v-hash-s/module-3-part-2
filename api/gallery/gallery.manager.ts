import { GalleryService } from "./gallery.service";
// import ImageModel from "@models/MongoDB/image.model";
import { getEnv } from "@helper/environment";
import { log } from "@helper/logger";
import { connectDB } from "@services/db_connection";
import * as fs from "fs";
import * as jwt from "jsonwebtoken";
import * as util from "util";
const stat = util.promisify(fs.stat);
import * as path from "path";
import { DynamoClient } from "../../services/dynamodb-client";

export class GalleryManager {
  private readonly service: GalleryService;
  private readonly PATH_TO_IMAGES = path.resolve(
    path.join(__dirname, "../../../../images")
  );
  private readonly content?;
  private readonly filename?;
  private readonly token?;

  constructor(payload?, token?) {
    this.service = new GalleryService();
    this.content = payload?.files[0]?.content;
    this.filename = payload?.files[0]?.filename;
    this.token = token;
  }

  // async sendUsersImage(queryParameters, email) {
  //   let filter;
  //   if (queryParameters.filter == null) {
  //     filter = false;
  //     const galleryResponse = await this.service.sendGalleryObject(
  //       queryParameters
  //     );
  //     return this.returnGalleryResponse(galleryResponse);
  //   } else {
  //     log("EMAIL: ", email);
  //     const objects = await ImageModel.find(
  //       { owner: await email },
  //       { path: 1, _id: 0 }
  //     ).exec();
  //     log(objects);
  //     const images = objects.map((img: any) => {
  //       return img.path;
  //     });
  //     log(images);

  //     const galleryResponse = {
  //       objects: images,
  //     };
  //     log(galleryResponse);
  //     return this.returnGalleryResponse(galleryResponse);
  //   }
  // }
  async getEmailFromToken(token: string) {
    const email = jwt.verify(token, getEnv("TOKEN_KEY"));
    // @ts-ignore
    return email.email;
  }

  async returnGalleryResponse(galleryResponse) {
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
  // async isExist(image) {
  //   log(image);

  //   const params = {
  //     TableName: getEnv("USERS_TABLE_NAME"),
  //     Key: {
  //       images: {
  //         SS: image
  //       },
  //     },
  //   };
  //   const GetItem = new GetItemCommand(params);
  //   const userFindResult = await DynamoClient.send(GetItem);
  //   log(userFindResult);
  //   if (userFindResult.Item === undefined) return false;
  //   log("USER FIND RESULT: ", userFindResult?.Item?.password?.S);
  //   const passwordFromDB = await userFindResult?.Item?.password?.S;
  //   // bcrypt.compareSync(user.password, userFindResult.Item.S.password);
  //   if (bcrypt.compareSync(user.password, passwordFromDB)) {
  //     log(bcrypt.compareSync(user.password, passwordFromDB));
  //     return true;
  //   }
  //   return false;
  // }
  // }

  // async isExist(image) {
  //   await connectDB;
  //   const exist = await ImageModel.findOne({ path: image }, { path: 1 }).then(
  //     function (data: any) {
  //       if (data) {
  //         return true;
  //       } else {
  //         return false;
  //       }
  //     }
  //   );
  //   return exist;
  // }
  async getMetadata(image) {
    log(image);
    const stats = await stat(image);
    log(stats);
    return stats;
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

  async saveImages() {
    const email = await this.getEmailFromToken(this.token);
    await this.service.saveImageInDB(this.filename, email);
    return await this.returnResponse(this.isExist(this.filename));
  }
}
