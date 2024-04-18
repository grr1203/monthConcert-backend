import { APIGatewayProxyEventV2WithLambdaAuthorizer } from "aws-lambda";
import mysqlUtil from "../lib/mysqlUtil";
import { FromSchema } from "json-schema-to-ts";

const parameter = {
  type: "object",
  properties: {
    year: { type: "number" }, // 조회할 년도
    month: { type: "number" }, // 조회할 월
  },
  required: ["year", "month"],
} as const;

export const handler = async (event: APIGatewayProxyEventV2WithLambdaAuthorizer<{ [key: string]: any }>) => {
  console.log("[event]", event);
  const { year, month } = event.queryStringParameters as FromSchema<typeof parameter>;

  const user_idx = event.requestContext.authorizer.lambda.idx;

  const monthConcertArray = await mysqlUtil.raw(
    `SELECT * FROM tb_concert WHERE YEAR(date) = ${year} AND MONTH(date) = ${month}`
  );
  console.log(`[monthConcertArray of ${year}.${month}]`, monthConcertArray);

  const followedArtistIdxArray = (
    await mysqlUtil.getMany("tb_artist_follow", ["artist_idx"], { user_idx: user_idx })
  ).map((item) => item.artist_idx);
  const savedConcertIdxArray = (
    await mysqlUtil.getMany("tb_concert_save", ["concert_idx"], { user_idx: user_idx })
  ).map((item) => item.concert_idx);
  console.log("[followedArtistIdxArray]", followedArtistIdxArray);
  console.log("[savedConcertIdxArray]", savedConcertIdxArray);

  const monthConcert = {};
  const followedArtistsMonthConcert = {};
  // 데이터를 날짜별로 그룹화
  const monthConcertArrayPromise = monthConcertArray.map(async (item) => {
    const dateParts = item.date.split(" ")[0].split("-");
    const day = parseInt(dateParts[2]);

    const artist = await mysqlUtil.getOne("tb_artist", [], { idx: item.artist_idx });
    item.artistName = artist.artist_name;
    item.artistAccount = artist.instagram_account;

    if (!monthConcert[day]) monthConcert[day] = [];
    monthConcert[day].push(item);

    if (savedConcertIdxArray.includes(item.idx)) {
      item.saved = true;
    }

    if (followedArtistIdxArray.includes(item.artist_idx)) {
      if (!followedArtistsMonthConcert[day]) followedArtistsMonthConcert[day] = [];
      followedArtistsMonthConcert[day].push(item);
    }
  });
  await Promise.all(monthConcertArrayPromise);
  console.log("[monthConcert]", monthConcert);

  return {
    statusCode: 200,
    body: JSON.stringify({ monthConcert, followedArtistsConcert: followedArtistsMonthConcert }),
  };
};
