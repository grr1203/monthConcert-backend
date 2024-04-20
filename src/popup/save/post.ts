import mysqlUtil from "../../lib/mysqlUtil";
import { APIGatewayProxyEventV2WithLambdaAuthorizer } from "aws-lambda";
import { FromSchema } from "json-schema-to-ts";

const parameter = {
  type: "object",
  properties: {
    concertIdx: { type: "string" }, // 아티스트 이름
    save: { type: "boolean" }, // 팔로우 여부
  },
  required: ["concertIdx", "save"],
} as const;

export const handler = async (event: APIGatewayProxyEventV2WithLambdaAuthorizer<{ [key: string]: any }>) => {
  console.log("[event]", event);
  const { concertIdx, save } = JSON.parse(event.body) as FromSchema<typeof parameter>; // body

  const userIdx = event.requestContext.authorizer.lambda.idx;

  try {
    const res = save
      ? await mysqlUtil.create("tb_concert_save", { concert_idx: concertIdx, user_idx: userIdx })
      : await mysqlUtil.deleteMany("tb_concert_save", { concert_idx: concertIdx, user_idx: userIdx });

    console.log("[res]", res);
    return { statusCode: 200, body: JSON.stringify({}) };
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      console.log("[already saved]", error);
      return { statusCode: 200, body: JSON.stringify({}) };
    }
    console.log(error);
    return { statusCode: 500, body: JSON.stringify({}) };
  }
};
