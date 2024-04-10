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
    ticket_date: { type: "string" },
    ticket_place: { type: "string" },
    posting_img: { type: "string" },
    posting_url: { type: "string" },
    confirmed: { type: "boolean" },
  },
  required: ["idx"],
} as const;

export const handler = async (event: APIGatewayProxyEventV2WithLambdaAuthorizer<{ [key: string]: any }>) => {
  console.log("[event]", event);
  const { idx, name, date, place, ticket_date, ticket_place, confirmed, posting_img, posting_url } = JSON.parse(
    event.body
  ) as FromSchema<typeof parameter>;

  let concert;
  try {
    concert = await mysqlUtil.getOne("tb_concert", [], { idx });
    console.log(`[concert]`, concert);
  } catch (e) {
    return { statusCode: 404, body: JSON.stringify({ message: "concert not found" }) };
  }

  await mysqlUtil.update(
    "tb_concert",
    { name, date, place, ticket_date, ticket_place, confirmed, posting_img, posting_url },
    { idx: idx }
  );

  return {
    statusCode: 200,
    body: JSON.stringify({
      ...concert,
      name,
      date,
      place,
      ticket_date,
      ticket_place,
      confirmed,
      posting_img,
      posting_url,
    }),
  };
};
