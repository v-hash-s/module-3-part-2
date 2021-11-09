import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { getEnv } from "@helper/environment";

const DynamoClient = new DynamoDBClient({ region: getEnv("REGION") });

export { DynamoClient };
