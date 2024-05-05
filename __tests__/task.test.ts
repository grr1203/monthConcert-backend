import { createPublicLambdaEvent, privateFunctionTest } from './testUtil';
// import { handler as postMusician } from '../src/artist/post';
import { handler as getUser } from '../src/user/get';
import { handler as putUser } from '../src/user/put';
import { handler as getArtist } from '../src/artist/get';
import { handler as postArtistFollow } from '../src/artist/follow/post';
import { handler as getArtistFollow } from '../src/artist/follow/get';
import { handler as postConcertSave } from '../src/concert/save/post';
import { handler as getConcertSave } from '../src/concert/save/get';
import { handler as searchArtist } from '../src/artist/search/get';
import { handler as getCalendar } from '../src/calendar/get';
import { handler as getConcert } from '../src/concert/get';
import { handler as putConcert } from '../src/concert/put';
import { handler as postConcert } from '../src/concert/post';
import { handler as deleteConcert } from '../src/concert/delete';
import { handler as getPopupCalendar } from '../src/popup/calendar/get';
import { handler as postPopupLikes } from '../src/popup/likes/post';
import { handler as getPopupLikes } from '../src/popup/likes/get';
import { handler as getAccessToken } from '../src/token/access/get';
import { generateUserAccessToken } from '../src/lib/jwt';
import mysqlUtil from '../src/lib/mysqlUtil';

describe('MonthConcert test', () => {
  // test('POST artist', async () => {
  //   const parameters = { artistName: '볼빨간사춘기', instagramAccount: 'official_bol4' };
  //   const res = await postMusician(createPublicLambdaEvent(parameters));
  //   console.log('res', res);
  //   expect(res).toHaveProperty('statusCode', 200);
  // }, 1000000);

  test('GET user', async () => {
    const response = await privateFunctionTest(getUser, {});
    expect(response).toHaveProperty('statusCode', 200);
  });
  test('PUT user', async () => {
    const response = await privateFunctionTest(putUser, { profileImage: true });
    expect(response).toHaveProperty('statusCode', 200);
  });

  test('GET artist', async () => {
    const res = await privateFunctionTest(getArtist, { name: '볼' });
    expect(res).toHaveProperty('statusCode', 200);
  });

  test('GET artist follow', async () => {
    const res = await privateFunctionTest(getArtistFollow, {});
    expect(res).toHaveProperty('statusCode', 200);
  });

  test('POST artist follow', async () => {
    const res = await privateFunctionTest(postArtistFollow, { artistIdx: 296, follow: true });
    expect(res).toHaveProperty('statusCode', 200);
  });
  test('POST artist unfollow', async () => {
    const res2 = await privateFunctionTest(postArtistFollow, { artistIdx: 90, follow: false });
    expect(res2).toHaveProperty('statusCode', 200);
  });

  test('GET concert save', async () => {
    const res = await privateFunctionTest(getConcertSave, {});
    expect(res).toHaveProperty('statusCode', 200);
  });

  test('POST concert save', async () => {
    const res = await privateFunctionTest(postConcertSave, { concertIdx: 180, save: true });
    expect(res).toHaveProperty('statusCode', 200);
  });
  test('POST concert unsave', async () => {
    const res2 = await privateFunctionTest(postConcertSave, { concertIdx: 180, save: false });
    expect(res2).toHaveProperty('statusCode', 200);
  });

  test('GET artist search', async () => {
    const res = await privateFunctionTest(searchArtist, { name: '비' });
    expect(res).toHaveProperty('statusCode', 200);

    const res2 = await privateFunctionTest(searchArtist, { name: '윤아' });
    expect(res2).toHaveProperty('statusCode', 200);
  });

  test('GET concert', async () => {
    const res2 = await privateFunctionTest(getConcert, { query: '' });
    expect(res2).toHaveProperty('statusCode', 200);
  });

  test('POST concert', async () => {
    const newConcert = {
      name: 'test',
      date: '2024-03-01',
      place: 'testPlace',
      ticket_date: '2024-03-01',
      ticket_place: 'testTicketPlace',
      confirmed: true,
      artist_idx: 90,
      posting_img: 'testImage',
      posting_url: 'testUrl',
    };
    const res2 = await privateFunctionTest(postConcert, newConcert);
    expect(res2).toHaveProperty('statusCode', 200);
  });

  test('DELETE concert', async () => {
    const res2 = await privateFunctionTest(deleteConcert, { idx: 109 });
    expect(res2).toHaveProperty('statusCode', 200);
  });

  test('PUT concert', async () => {
    const concert = {
      idx: 109,
      name: 'test',
      date: '2024-03-01',
      place: 'testPlace',
      ticket_date: '2024-03-01',
      ticket_place: 'testTicketPlace',
      confirmed: true,
      artist_idx: 90,
      posting_img: 'testImage',
      posting_url: 'testUrl',
    };
    const res2 = await privateFunctionTest(putConcert, concert);
    expect(res2).toHaveProperty('statusCode', 200);
  });

  test('GET calendar', async () => {
    const res = await privateFunctionTest(getCalendar, { year: 2024, month: 4, userIdx: 1 });
    expect(res).toHaveProperty('statusCode', 200);
  });

  test('GET popup calendar', async () => {
    const res = await privateFunctionTest(getPopupCalendar, { year: 2024, month: 3, userIdx: 1 });
    expect(res).toHaveProperty('statusCode', 200);
  });

  test('GET popup likes', async () => {
    const res = await privateFunctionTest(getPopupLikes, {});
    expect(res).toHaveProperty('statusCode', 200);
  });

  test('POST popup likes', async () => {
    const res = await privateFunctionTest(postPopupLikes, { popupIdx: 108, likes: true });
    expect(res).toHaveProperty('statusCode', 200);
  });
  test('GET access token', async () => {
    const refreshtoken = await generateUserAccessToken(3);
    await mysqlUtil.update('tb_user', { refresh_token: refreshtoken }, { idx: 3 });
    const parameters = { refreshToken: refreshtoken };
    const res = await getAccessToken(createPublicLambdaEvent(parameters));
    console.log('res', res);
    expect(res).toHaveProperty('statusCode', 200);
  });
});
