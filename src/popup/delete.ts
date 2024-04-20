import { APIGatewayProxyEventV2WithLambdaAuthorizer } from "aws-lambda";
import mysqlUtil from "../lib/mysqlUtil";
import { FromSchema } from "json-schema-to-ts";

const parameter = {
  type: "object",
  properties: {
    idx: { type: "number" },
  },
  required: ["idx"],
} as const;

export const handler = async (event: APIGatewayProxyEventV2WithLambdaAuthorizer<{ [key: string]: any }>) => {
  console.log("[event]", event);
  const { idx } = event.queryStringParameters as FromSchema<typeof parameter>;

  await mysqlUtil.deleteMany("tb_popup_store", { idx });

  return { statusCode: 200, body: JSON.stringify({}) };
};
