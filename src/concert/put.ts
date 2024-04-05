import { APIGatewayProxyEventV2WithLambdaAuthorizer } from "aws-lambda";
import mysqlUtil from "../lib/mysqlUtil";
import { FromSchema } from "json-schema-to-ts";

const parameter = {
  type: "object",
  properties: {
    idx: { type: "number" },
    name: { type: "string" },
    date: { type: "string" },
    place: { type: "string" },
    ticketDate: { type: "string" },
    ticketPlace: { type: "string" },
    confirmed: { type: "boolean" },
  },
  required: ["idx"],
} as const;

export const handler = async (event: APIGatewayProxyEventV2WithLambdaAuthorizer<{ [key: string]: any }>) => {
  console.log("[event]", event);
  const { idx, name, date, place, ticketDate, ticketPlace, confirmed } = event.queryStringParameters as FromSchema<
    typeof parameter
  >;

  const concert = await mysqlUtil.update(
    "tb_concert",
    { idx: idx },
    { name, date, place, ticketDate, ticketPlace, confirmed }
  );
  console.log(`[monthConcert]`, concert);

  return { statusCode: 200, body: JSON.stringify({ concert }) };
};
