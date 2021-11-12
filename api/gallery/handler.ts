import { GalleryManager } from "./gallery.manager";
import { createResponse } from "@helper/http-api/response";
import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { log } from "@helper/logger";
import * as multipartParser from "lambda-multipart-parser";

import { GalleryService } from "./gallery.service";

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
