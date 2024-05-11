import { APIGatewayProxyEventV2 } from 'aws-lambda';
import mysqlUtil from '../../lib/mysqlUtil';
import { FromSchema } from 'json-schema-to-ts';
import { getLastDayOfMonth } from '../../lib/util';

const parameter = {
  type: 'object',
  properties: {
    year: { type: 'number' }, // 조회할 년도
    month: { type: 'number' }, // 조회할 월
    userIdx: { type: 'number' },
  },
  required: ['year', 'month'],
} as const;

export const handler = async (event: APIGatewayProxyEventV2) => {
  console.log('[event]', event);
  const { year, month, userIdx } = event.queryStringParameters as FromSchema<typeof parameter>;

  const popupStoreArray = await mysqlUtil.raw(
    `SELECT * FROM tb_popup_store WHERE 
    (YEAR(tb_popup_store.from) = ${year} AND MONTH(tb_popup_store.from) = ${month}) OR
    (YEAR(tb_popup_store.to) = ${year} AND MONTH(tb_popup_store.to) = ${month})`
  );
  console.log(`[popupStoreArray of ${year}.${month}]`, popupStoreArray);

  let likesPopupIdxArray;
  if (userIdx) {
    likesPopupIdxArray = (await mysqlUtil.getMany('tb_popup_likes', ['popup_idx'], { user_idx: userIdx })).map(
      (item) => item.popup_idx
    );
    console.log('[likesPopupIdxArray]', likesPopupIdxArray);
  }

  const popupStore = { arr: popupStoreArray, byDay: {} };
  const likesPopupStore = { arr: [], byDay: {} };

  const popupStoreByDay = {};
  const likesPopupStoreByDay = {};

  // 데이터를 날짜별로 그룹화
  popupStoreArray.map((item) => {
    if (!item.from || !item.to) return;

    // from 이 해당 월이 아니지만 to는 해당월인경우, 또는 반대의 경우에 대한 처리
    const fromDateParts = item.from.split(' ')[0].split('-');
    const toDateParts = item.to.split(' ')[0].split('-');
    let fromDay;
    fromDay = fromDateParts[1] == month ? parseInt(fromDateParts[2]) : 1;
    let toDay;
    toDay = toDateParts[1] == month ? parseInt(toDateParts[2]) : getLastDayOfMonth(year, month);

    item.likes = false;
    if (likesPopupIdxArray?.includes(item.idx)) {
      item.likes = true;
      likesPopupStore.arr.push(item);
    }

    for (let i = fromDay; i <= toDay; i++) {
      if (!popupStoreByDay[i]) popupStoreByDay[i] = [];
      popupStoreByDay[i].push(item);

      if (item.likes) {
        if (!likesPopupStoreByDay[i]) likesPopupStoreByDay[i] = [];
        likesPopupStoreByDay[i].push(item);
      }
    }
  });

  popupStore.byDay = popupStoreByDay;
  likesPopupStore.byDay = likesPopupStoreByDay;

  console.log('popupStore', popupStore);
  console.log('likesPopupStore', likesPopupStore);

  return {
    statusCode: 200,
    body: JSON.stringify({ popupStore, likesPopupStore }),
  };
};
