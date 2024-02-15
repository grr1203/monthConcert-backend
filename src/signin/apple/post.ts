import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { FromSchema } from 'json-schema-to-ts';
import mysqlUtil from '../../lib/mysqlUtil';
import { generateTokens } from '../../lib/jwt';
import { verifyAppleToken } from '../../lib/loginUtil';
import { USER_REGISTER_TYPE } from '../../lib/constants/user';

const parameter = {
  type: 'object',
  properties: {
    identityToken: { type: 'string' }, // apple에서 발급한 identityToken (email 포함)
    fullName: { type: 'string' }, // apple에서 처음 1회만 제공
  },
  required: ['identityToken'],
} as const;

export const handler = async (event: APIGatewayProxyEventV2) => {
  console.log('[event]', event);
  const { identityToken, fullName } = JSON.parse(event.body) as FromSchema<typeof parameter>;

  try {
    // apple server에서 발급한 identityToken 검증 및 payload 조회
    let userEmail: string;
    try {
      const jwtClaims = await verifyAppleToken(identityToken);
      if (Object.keys(jwtClaims).length === 0) throw Error('jwtClaims is empty');
      console.log('[jwtClaims]', jwtClaims);
      userEmail = jwtClaims.email;
    } catch (err) {
      console.log('[verifyAppleToken failed]', err);
      return { statusCode: 401, body: JSON.stringify({ code: 'Verification_Failed' }) };
    }

    let user = await mysqlUtil.getOne('tb_user', [], { user_email: userEmail });
    const processType = user ? 'signin' : 'signup';
    // 회원가입
    if (processType === 'signup') {
      await mysqlUtil.create('tb_user', {
        user_email: userEmail,
        user_name: fullName,
        register_type: USER_REGISTER_TYPE.APPLE,
        marketing_agreed: 1, // 가입시 마케팅 동의
      });
      user = await mysqlUtil.getOne('tb_user', [], { user_email: userEmail });
    }

    // 로그인
    await mysqlUtil.update('tb_user', { last_login_type: USER_REGISTER_TYPE.APPLE }, { idx: user!.idx });
    await mysqlUtil.updateTimestamp('tb_user', 'last_login_date', { idx: user!.idx });
    const { accessToken, refreshToken } = await generateTokens(event, user!.idx);

    return { statusCode: 200, body: JSON.stringify({ processType, accessToken, refreshToken }) };
  } catch (err) {
    console.log('err', err);
    return { statusCode: 500, body: JSON.stringify({ code: 'Internal_Server_Error' }) };
  }
};
