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

  const monthConcertArray = await mysqlUtil.raw(
    `SELECT tb_concert.*, tb_artist.artist_name, tb_artist.instagram_account 
    FROM tb_concert LEFT JOIN tb_artist ON tb_concert.artist_idx = tb_artist.idx  ${query || ""}`
  );
  console.log(`[monthConcertArray]`, monthConcertArray);

  return { statusCode: 200, body: JSON.stringify({ monthConcertArray }) };
};
