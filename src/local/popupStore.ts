import './set-env';
import puppeteer from 'puppeteer';
import { load } from 'cheerio';
import mysqlUtil from '../lib/mysqlUtil';
import { extractPopupStoreInfo } from '../lib/openai.module';
import fs from 'fs';
import { checktYYYYMMDDFormat, wait } from '../lib/util';
import axios from 'axios';
import { getPresignedPostUrl, s3Url } from '../lib/aws/s3Util';

const popupstore_account_list = [
  `popupstorego`,
  'popupmate',
  'paulseee',
  'inas.pick',
  'pops.official_',
  'daeding.official',
  'seoulhotple',
  '_seoulhotplace',
  'seoul_trends',
  'lanline.unnie',

  'seoul_life___',
  'enjou.seoul',
  'nowistravel'
];

const getPopupStore = async (popup_account_list) => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.125 Safari/537.36'
  );

  const res = await page.goto(`https://www.instagram.com`, { waitUntil: 'networkidle2' });
  console.log('res status', res.status());
  // let content = await page.content();
  //   console.log('content', content);

  const username = 'monthconcert@gmail.com' //'zzipwooung@gmail.com';
  const password = 'monthconcert123!!' //'zxc123ZXC!@#';

  // instagram 로그인
  await page.type('input[name="username"]', username);
  await page.type('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle2' });

  for (const popup_account of popup_account_list) {
    console.log('[popup_account]', popup_account);

    // 일정시간 기다림없이 계속요청시 401 에러 발생
    await wait(9000);

    try {
      await page.goto(`https://www.instagram.com/${popup_account}`, { waitUntil: 'networkidle2' });
      await page.waitForSelector('div._aagv', { timeout: 10000 });
    } catch (e) {
      fs.writeFileSync('./error.log', `[${popup_account}]\n ${e}`);
      continue;
    }

    const content = await page.content();
    const $ = load(content);
    console.log('get content');

    const postingArray = [];

    $('div._aagv img').map((i, el) => {
      postingArray.push({
        content: $(el).attr('alt'),
        img: $(el).attr('src'),
        postingUrl: `https://www.instagram.com${$(el).parent().parent().parent().attr('href')}`,
      });
    });

    const popupStoreInfoArray = [];

    postingLoop: for (const posting of postingArray) {
      if (posting.content && posting.content.startsWith('Photo shared by')) {
        await wait(1000);
        await page.goto(posting.postingUrl, { waitUntil: 'networkidle2' });
        await page.waitForSelector('div.x4h1yfo', { timeout: 10000 });
        const content = await page.content();
        const $2 = load(content);

        let text = '';
        $2('div.x4h1yfo').map((i, el) => {
          text += $(el).text();
        });
        posting.content = text;
      }

      // 콘서트 관련 Text있는 포스팅만 필터링 (콘서트 관련 단어 , 일자)
      // 관련있는 경우 구체적인 정보 추출
      let popupStoreInfo;
      try {
        popupStoreInfo = await extractPopupStoreInfo(posting.content);
      } catch {
        console.log('extractPopupStoreInfo error');
        continue;
      }

      if (popupStoreInfo?.date == null) continue;

      console.log('popupStoreInfo', popupStoreInfo);
      popupStoreInfo['postingUrl'] = posting['postingUrl'];
      popupStoreInfo['postingImg'] = posting['img'];

      if (popupStoreInfo['date'] !== null && Array.isArray(popupStoreInfo['date'])) {
        popupStoreInfoArray.push(popupStoreInfo);
      }
    }

    console.log('filteredPostingArray length', popupStoreInfoArray.length);

    for (let i = 0; i < popupStoreInfoArray.length; i++) {
      const popupStoreInfo = popupStoreInfoArray[i];
      if (popupStoreInfo.name !== null) {
        const popupStore = {
          name: popupStoreInfo.name,
          place: popupStoreInfo.place,
          time: popupStoreInfo.time,
          posting_url: popupStoreInfo.postingUrl,
        };
        const from = popupStoreInfo.date[0];
        const to = popupStoreInfo.date[1];
        if (from && checktYYYYMMDDFormat(from)) {
          popupStore['from'] = from;
        }
        if (to && checktYYYYMMDDFormat(to)) {
          popupStore['to'] = to;
        }
        // 중복 체크
        const existPopupStore = await mysqlUtil.getOne('tb_popup_store', [], { posting_url: popupStore.posting_url });
        if (existPopupStore) continue;
        else {
          // 이미지 s3 업로드
          const response = await axios.get(popupStoreInfo.postingImg, { responseType: 'arraybuffer' });
          const imageBuffer = Buffer.from(response.data, 'binary');
          const postingImageKey = `popup/${popupStoreInfo.name}/${popupStoreInfo.postingUrl.split('/')[4]}/posting.png`;
          const postingImageUrl = await getPresignedPostUrl(postingImageKey);
          await axios.put(postingImageUrl, imageBuffer, { headers: { 'Content-Type': 'image/png' } });
          popupStore['posting_img'] = s3Url + postingImageKey;

          await mysqlUtil.create('tb_popup_store', popupStore);
        }
      }
    }
  }

  await page.close();
  await browser.close();
};

(async function () {
  await getPopupStore(popupstore_account_list);
})();
