import { APIGatewayProxyEventV2WithLambdaAuthorizer } from "aws-lambda";
import mysqlUtil from "../lib/mysqlUtil";
import { FromSchema } from "json-schema-to-ts";

const parameter = {
  type: "object",
  properties: {
    name: { type: "string" },
    date: { type: "string" },
    place: { type: "string" },
    artist_idx: { type: "number" },
    ticket_date: { type: "string" },
    ticket_place: { type: "string" },
    posting_img: { type: "string" },
    posting_url: { type: "string" },
    confirmed: { type: "boolean" },
  },
  required: ["name", "date", "place", "artist_idx", "ticket_date", "ticket_place", "posting_img", "confirmed"],
} as const;

export const handler = async (event: APIGatewayProxyEventV2WithLambdaAuthorizer<{ [key: string]: any }>) => {
  console.log("[event]", event);
  const { name, date, place, ticket_date, ticket_place, confirmed, artist_idx, posting_img, posting_url } = JSON.parse(
    event.body
  ) as FromSchema<typeof parameter>;

  const concert = await mysqlUtil.create("tb_concert", {
    name,
    date,
    place,
    ticket_date,
    ticket_place,
    confirmed,
    artist_idx,
    posting_img,
    posting_url,
  });
  console.log(`[monthConcert]`, concert);

  return { statusCode: 200, body: JSON.stringify({ concert }) };
};
