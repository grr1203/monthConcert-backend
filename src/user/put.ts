import { APIGatewayProxyEventV2WithLambdaAuthorizer } from 'aws-lambda';
import { USER_JWT_CONTENTS } from '../lib/jwt';
import mysqlUtil from '../lib/mysqlUtil';
import { FromSchema } from 'json-schema-to-ts';

const parameter = {
  type: 'object',
  properties: {
    marketingAgreed: { type: 'boolean' },
  },
  required: [],
} as const;

export const handler = async (event: APIGatewayProxyEventV2WithLambdaAuthorizer<{ [key: string]: any }>) => {
  console.log('[event]', event);
  const { marketingAgreed } = JSON.parse(event.body) as FromSchema<typeof parameter>;
  const userIdx = event.requestContext.authorizer.lambda.idx;

  // 마케팅 동의 여부 업데이트
  if (marketingAgreed) {
    const updateObject: { [key: string]: any } = {};
    typeof marketingAgreed === 'boolean' && (updateObject.marketing_agreed = marketingAgreed);

    await mysqlUtil.update('tb_user', updateObject, { idx: userIdx });
  }

  const userColumns = [...USER_JWT_CONTENTS, 'marketing_agreed'];
  const user = await mysqlUtil.getOne('tb_user', userColumns, { idx: userIdx });

  return { statusCode: 200, body: JSON.stringify({ user }) };
};
