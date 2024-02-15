import { APIGatewayProxyEventV2WithLambdaAuthorizer } from 'aws-lambda';
import mysqlUtil from '../lib/mysqlUtil';
import { FromSchema } from 'json-schema-to-ts';

const parameter = {
  type: 'object',
  properties: {
    year: { type: 'number' }, // 조회할 년도
    month: { type: 'number' }, // 조회할 월
  },
  required: ['year', 'month'],
} as const;

export const handler = async (event: APIGatewayProxyEventV2WithLambdaAuthorizer<{ [key: string]: any }>) => {
  console.log('[event]', event);
  const { year, month } = event.queryStringParameters as FromSchema<typeof parameter>;

  const monthConcertArray = await mysqlUtil.raw(
    `SELECT * FROM tb_concert WHERE YEAR(date) = ${year} AND MONTH(date) = ${month}`
  );
  console.log(`[monthConcertArray of ${year}.${month}]`, monthConcertArray);

  const monthConcert = {};
  // 데이터를 날짜별로 그룹화
  monthConcertArray.forEach((item) => {
    const dateParts = item.date.split(' ')[0].split('-');
    const day = parseInt(dateParts[2]);

    if (!monthConcert[day]) monthConcert[day] = [];
    monthConcert[day].push(item);
  });
  console.log('[monthConcert]', monthConcert);

  return { statusCode: 200, body: JSON.stringify({ monthConcert }) };
};
