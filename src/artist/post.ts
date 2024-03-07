import mysqlUtil from "../lib/mysqlUtil";
import { APIGatewayProxyEventV2 } from "aws-lambda";
import { FromSchema } from "json-schema-to-ts";

const parameter = {
  type: "object",
  properties: {
    artistName: { type: "string" }, // 아티스트 이름
    instagramAccount: { type: "string" }, // 아티스트 인스타 계정
  },
  required: ["artistName", "instagramAccount"],
} as const;

export const handler = async (event: APIGatewayProxyEventV2) => {
  console.log("[event]", event);
  const { artistName, instagramAccount } = JSON.parse(event.body) as FromSchema<typeof parameter>; // body

  try {
    // todo: 뮤지션 계정 검증 (팔로우 수, 크롤링 되는지) 체크 (자동등록)

    // 뮤지션 정보 저장
    const createObject = {
      artist_name: artistName.replaceAll(" ", ""),
      instagram_account: instagramAccount,
    };

    // const artistIdx = (await mysqlUtil.create("tb_artist", createObject))[0];
    await mysqlUtil.create("tb_artist", createObject);

    return { statusCode: 200, body: JSON.stringify(createObject) };
  } catch (error) {
    console.log(error);
    return { statusCode: 500, body: JSON.stringify({}) };
  }
};
