import { APIGatewayProxyEventV2WithLambdaAuthorizer } from "aws-lambda";
// import mysqlUtil from "../../lib/mysqlUtil";
import { FromSchema } from "json-schema-to-ts";
import { getArtistsProfiles } from "../../lib/crawling";

const parameter = {
  type: "object",
  properties: {
    name: { type: "string" }, // 아티스트 이름
  },
  required: ["name"],
} as const;

export const handler = async (event: APIGatewayProxyEventV2WithLambdaAuthorizer<{ [key: string]: any }>) => {
  console.log("[event]", event);
  const { name } = event.queryStringParameters as FromSchema<typeof parameter>;

  const artists = await getArtistsProfiles(name);
  console.log("[artists]", artists);

  return { statusCode: 200, body: JSON.stringify(artists) };
};
