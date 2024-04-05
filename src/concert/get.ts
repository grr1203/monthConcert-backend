import { APIGatewayProxyEventV2WithLambdaAuthorizer } from "aws-lambda";
import mysqlUtil from "../lib/mysqlUtil";
import { FromSchema } from "json-schema-to-ts";

const parameter = {
  type: "object",
  properties: {
    filter: { type: "array", items: { type: "string" } }, // 필터
  },
} as const;

export const handler = async (event: APIGatewayProxyEventV2WithLambdaAuthorizer<{ [key: string]: any }>) => {
  console.log("[event]", event);
  const { filter } = event.queryStringParameters as FromSchema<typeof parameter>;

  const monthConcertArray = await mysqlUtil.getMany("tb_concert", [], filter?.length ? { filter } : {});
  console.log(`[monthConcertArray]`, monthConcertArray);

  return { statusCode: 200, body: JSON.stringify({ monthConcertArray }) };
};
