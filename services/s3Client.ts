import { S3Client } from "@aws-sdk/client-s3";
import { getEnv } from "@helper/environment";
// Set the AWS Region.
const REGION = getEnv("REGION"); //e.g. "us-east-1"
// Create an Amazon S3 service client object.
const s3Client = new S3Client({ region: REGION });
export { s3Client };
