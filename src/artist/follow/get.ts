import mysqlUtil from "../../lib/mysqlUtil";
import { APIGatewayProxyEventV2WithLambdaAuthorizer } from "aws-lambda";
// import { FromSchema } from "json-schema-to-ts";

// const parameter = {
//   type: "object",
//   properties: {},
// } as const;

export const handler = async (event: APIGatewayProxyEventV2WithLambdaAuthorizer<{ [key: string]: any }>) => {
  console.log("[event]", event);

  const userIdx = event.requestContext.authorizer.lambda.idx;

  try {
    const followArtistArray = await mysqlUtil.raw(`SELECT tb_artist.idx, tb_artist.artist_name, tb_artist.instagram_account 
    FROM tb_artist_follow 
    JOIN tb_artist ON tb_artist_follow.artist_idx = tb_artist.idx 
    WHERE user_idx = ${userIdx}`);
    console.log("[followArtistArray]", followArtistArray);

    return { statusCode: 200, body: JSON.stringify({ followArtistArray }) };
  } catch (error) {
    console.log(error);
    return { statusCode: 500, body: JSON.stringify({}) };
  }
};
