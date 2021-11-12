import { AWSPartitial } from "../types";

export const galleryConfig: AWSPartitial = {
  provider: {
    httpApi: {
      authorizers: {
        jwtauth: {
          type: "request",
          enableSimpleResponses: true,
          functionName: "jwtauth",
          identitySource: "$request.header.Authorization",
        },
      },
    },
  },

  functions: {
    jwtauth: {
      handler: "api/auth/jwt-auth.authenticationJWT",
      memorySize: 128,
    },

    getGallery: {
      handler: "api/gallery/handler.getGallery",
      memorySize: 128,
      events: [
        {
          http: {
            path: "/gallery",
            method: "get",
            cors: true,
          },
        },
      ],
    },

    upload: {
      handler: "api/gallery/handler.upload",
      memorySize: 128,
      events: [
        {
          http: {
            path: "/upload",
            method: "post",
          },
        },
      ],
    },
  },
};
