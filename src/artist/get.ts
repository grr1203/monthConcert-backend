import { APIGatewayProxyEventV2WithLambdaAuthorizer } from 'aws-lambda';
import mysqlUtil from '../lib/mysqlUtil';
import { FromSchema } from 'json-schema-to-ts';

const parameter = {
  type: 'object',
  properties: {
    name: { type: 'string' }, // 아티스트 이름
  },
  required: ['name'],
} as const;

export const handler = async (event: APIGatewayProxyEventV2WithLambdaAuthorizer<{ [key: string]: any }>) => {
  console.log('[event]', event);
  const { name } = event.queryStringParameters as FromSchema<typeof parameter>;

  const artistArray = await mysqlUtil.search('tb_artist', 'artist_name', name.replaceAll(' ', ''));
  console.log('[artistArray]', artistArray);

  return { statusCode: 200, body: JSON.stringify({ artistArray }) };
};
