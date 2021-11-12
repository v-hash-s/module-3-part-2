import { GalleryManager } from "./gallery.manager";
import { createResponse } from "@helper/http-api/response";
import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { log } from "@helper/logger";
import * as multipartParser from "lambda-multipart-parser";

import { GalleryService } from "./gallery.service";

export const getGallery: APIGatewayProxyHandlerV2 = async (event) => {
  const query = event.queryStringParameters;
  const manager = new GalleryManager();
  const service = new GalleryService();
  //@ts-ignore
  const token = await event.multiValueHeaders.Authorization.toString().replace(
    "Bearer ",
    ""
  );
  const email = await manager.getEmailFromToken(token);
  const images = await service.getGalleryObjects(query, email);
  const readyImages = await service.formatGalleryObject(images);

  if (query!.page && query!.limit) {
    const toSendImages = await manager.sendGalleryObject(
      await service.getPagedImages(readyImages, query!.page, query!.limit)
    );
    return createResponse(toSendImages.statusCode, toSendImages.content);
  } else {
    const toSendImages = await manager.sendGalleryObject(readyImages);
    return createResponse(toSendImages.statusCode, toSendImages.content);
  }
};

export const upload: APIGatewayProxyHandlerV2 = async (event) => {
  // @ts-ignore
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
};
