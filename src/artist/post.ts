import mysqlUtil from '../lib/mysqlUtil';
import { getPosting } from '../lib/crawling';
import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { FromSchema } from 'json-schema-to-ts';

const parameter = {
  type: 'object',
  properties: {
    artistName: { type: 'string' }, // 아티스트 이름
    instagramAccount: { type: 'string' }, // 아티스트 인스타 계정
  },
  required: ['artistName', 'instagramAccount'],
} as const;

export const handler = async (event: APIGatewayProxyEventV2) => {
  console.log('[event]', event);
  const { artistName, instagramAccount } = JSON.parse(event.body) as FromSchema<typeof parameter>; // body

  try {
    // todo: 뮤지션 계정 검증 (팔로우 수, 크롤링 되는지) 체크 (자동등록)

    // 뮤지션 정보 저장
    const artistIdx = (
      await mysqlUtil.create('tb_artist', {
        artist_name: artistName.replaceAll(' ', ''),
        instagram_account: instagramAccount,
      })
    )[0];

    // 인스타 크롤링 (12개 포스팅)
    const concertInfoArray = await getPosting(instagramAccount);
    const concertArray = [];
    // 콘서트 정보 저장
    if (concertInfoArray.length > 0) {
      // 콘서트 별
      for (let i = 0; i < concertInfoArray.length; i++) {
        // 콘서트의 일정 별(하루 단위)
        for (let j = 0; j < concertInfoArray[i]['date'].length; j++) {
          // 이미 저장된 콘서트인지 체크 후 저장
          const concert = await mysqlUtil.getOne('tb_concert', ['idx'], {
            artist_idx: artistIdx,
            date: concertInfoArray[i].date[j],
          });
          if (concert === null) {
            const concert = {
              artist_idx: artistIdx,
              name: concertInfoArray[i].name,
              place: concertInfoArray[i].place,
              date: concertInfoArray[i].date[j],
              ticket_date: concertInfoArray[i].ticketDate,
              ticket_place: concertInfoArray[i].ticketPlace,
              posting_url: concertInfoArray[i].postingUrl,
            };
            concertArray.push(concert);
            await mysqlUtil.create('tb_concert', concert);
          }
        }
      }
    }

    return { statusCode: 200, body: JSON.stringify({ concertArray }) };
  } catch (error) {
    console.log(error);
    return { statusCode: 500, body: JSON.stringify({}) };
  }
};
