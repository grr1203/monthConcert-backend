import mysqlUtil from '../../lib/mysqlUtil';
import { APIGatewayProxyEventV2WithLambdaAuthorizer } from 'aws-lambda';
// import { FromSchema } from "json-schema-to-ts";

// const parameter = {
//   type: "object",
//   properties: {},
// } as const;

export const handler = async (event: APIGatewayProxyEventV2WithLambdaAuthorizer<{ [key: string]: any }>) => {
  console.log('[event]', event);

  const userIdx = event.requestContext.authorizer.lambda.idx;

  try {
    const res = await mysqlUtil.raw(`SELECT tb_concert.*
    FROM tb_concert_save 
    JOIN tb_concert ON tb_concert_save.concert_idx = tb_concert.idx 
    WHERE user_idx = ${userIdx}`);
    console.log('[res]', res);

    return { statusCode: 200, body: JSON.stringify({ monthConcertArray: res }) };
  } catch (error) {
    console.log(error);
    return { statusCode: 500, body: JSON.stringify({}) };
  }
};
