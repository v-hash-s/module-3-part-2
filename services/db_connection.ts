import { log } from "@helper/logger";
import * as mongoose from "mongoose";
import { getEnv } from "../helper/environment";

mongoose.connect(getEnv("MONGODB_URI"));

export const connectDB = new Promise((res, rej) => {
  mongoose.connection.on("error", (error) => {
    log(error);
    rej(error);
  });

  mongoose.connection.on("open", () => {
    log("DB connection established");
  });

  res(mongoose.connection);
});
