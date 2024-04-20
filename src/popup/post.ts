import { APIGatewayProxyEventV2WithLambdaAuthorizer } from "aws-lambda";
import mysqlUtil from "../lib/mysqlUtil";
import { FromSchema } from "json-schema-to-ts";

const parameter = {
  type: "object",
  properties: {
    name: { type: "string" },
    place: { type: "string" },
    date: { type: "string" },
    time: { type: "string" },
    posting_url: { type: "string" },
    confirmed: { type: "boolean" },
  },
  required: ["name", "date", "place", "time"],
} as const;

export const handler = async (event: APIGatewayProxyEventV2WithLambdaAuthorizer<{ [key: string]: any }>) => {
  console.log("[event]", event);
  const { name, date, place, time, posting_url } = JSON.parse(event.body) as FromSchema<typeof parameter>;

  const popupstore = await mysqlUtil.create("tb_popup_store", {
    name,
    date,
    place,
    time,
    posting_url,
  });
  console.log(`[popupstore]`, popupstore);

  return { statusCode: 200, body: JSON.stringify({ popupstore }) };
};
