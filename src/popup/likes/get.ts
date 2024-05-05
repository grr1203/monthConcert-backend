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
    const res = await mysqlUtil.raw(`SELECT tb_popup_store.*
    FROM tb_popup_likes 
    JOIN tb_popup_store ON tb_popup_likes.popup_idx = tb_popup_store.idx 
    WHERE user_idx = ${userIdx}`);
    console.log('[res]', res);

    return { statusCode: 200, body: JSON.stringify({ popupStoreArray: res }) };
  } catch (error) {
    console.log(error);
    return { statusCode: 500, body: JSON.stringify({}) };
  }
};
