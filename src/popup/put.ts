import { APIGatewayProxyEventV2WithLambdaAuthorizer } from "aws-lambda";
import mysqlUtil from "../lib/mysqlUtil";
import { FromSchema } from "json-schema-to-ts";

const parameter = {
  type: "object",
  properties: {
    idx: { type: "number" },
    name: { type: "string" },
    place: { type: "string" },
    date: { type: "string" },
    time: { type: "string" },
    posting_url: { type: "string" },
    confirmed: { type: "boolean" },
  },
  required: ["idx"],
} as const;

export const handler = async (event: APIGatewayProxyEventV2WithLambdaAuthorizer<{ [key: string]: any }>) => {
  console.log("[event]", event);
  const { idx, name, date, place, time, posting_url, confirmed } = JSON.parse(event.body) as FromSchema<
    typeof parameter
  >;

  let popupstore;
  try {
    popupstore = await mysqlUtil.getOne("tb_popup_store", [], { idx });
    console.log(`[popupstore]`, popupstore);
  } catch (e) {
    return { statusCode: 404, body: JSON.stringify({ message: "concert not found" }) };
  }

  await mysqlUtil.update("tb_popup_store", { name, date, place, time, posting_url, confirmed }, { idx: idx });

  return {
    statusCode: 200,
    body: JSON.stringify({
      ...popupstore,
      name,
      date,
      place,
      time,
      posting_url,
      confirmed,
    }),
  };
};
