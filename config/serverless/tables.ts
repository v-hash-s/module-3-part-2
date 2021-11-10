import { AWSPartitial } from "./types";

export const TableConfig: AWSPartitial = {
  provider: {
    environment: {},
    iam: {
      role: {
        statements: [
          {
            Effect: "Allow",
            Action: [
              "dynamodb:DescribeTable",
              "dynamodb:Query",
              "dynamodb:Scan",
              "dynamodb:GetItem",
              "dynamodb:PutItem",
              "dynamodb:DeleteItem",
              "dynamodb:UpdateItem",
            ],
            Resource: [
              "arn:aws:dynamodb:*:*:table/${file(env.yml):${self:provider.stage}.USERS_TABLE_NAME}",
              "arn:aws:dynamodb:*:*:table/${file(env.yml):${self:provider.stage}.USERS_TABLE_NAME}/index/*",
            ],
          },
        ],
      },
    },
  },

  resources: {
    Resources: {
      galleryTable: {
        DeletionPolicy: "Retain",
        Type: "AWS::DynamoDB::Table",
        Properties: {
          TableName: "gallery",
          KeySchema: [
            {
              AttributeName: "email",
              KeyType: "HASH",
            },
            {
              AttributeName: "data",
              KeyType: "RANGE",
            },
          ],
          AttributeDefinitions: [
            {
              AttributeName: "email",
              AttributeType: "S",
            },
            {
              AttributeName: "data",
              AttributeType: "S",
            },
          ],
          BillingMode: "PAY_PER_REQUEST",
        },
      },
    },
  },
};
