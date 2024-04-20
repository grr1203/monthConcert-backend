import { APIGatewayProxyEventV2WithLambdaAuthorizer } from "aws-lambda";
import mysqlUtil from "../lib/mysqlUtil";
import { FromSchema } from "json-schema-to-ts";

const parameter = {
  type: "object",
  properties: {
    query: { type: "string" }, // 필터
  },
} as const;

export const handler = async (event: APIGatewayProxyEventV2WithLambdaAuthorizer<{ [key: string]: any }>) => {
  console.log("[event]", event);
  const { query } = (event.queryStringParameters as FromSchema<typeof parameter>) || {};

  const popupStoreArray = await mysqlUtil.raw(`SELECT * FROM tb_popup_store ${query || ""}`);
  console.log(`[popupStoreArray]`, popupStoreArray);

  return { statusCode: 200, body: JSON.stringify({ popupStoreArray }) };
};
