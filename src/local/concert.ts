import "./set-env";

import puppeteer from "puppeteer";
import { load } from "cheerio";
import mysqlUtil from "../lib/mysqlUtil";
import { filterByConcertRelated } from "../lib/crawling";
import { extractConcertInfo } from "../lib/openai.module";
import fs from "fs";
import axios from "axios";
import { getPresignedPostUrl, s3Url } from "../lib/aws/s3Util";
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const countObjectValue = (object: Object, value: any) => {
  const array = Object.values(object);
  let count = 0;
  for (let i = 0; i < array.length; ++i) {
    if (array[i] === value) {
      count++;
    }
  }
  return count;
};

const getConcert = async (artists) => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.125 Safari/537.36"
  );

  const res = await page.goto(`https://www.instagram.com`, { waitUntil: "networkidle2" });
  console.log("res status", res.status());
  // let content = await page.content();
  //   console.log('content', content);

  const username = "zzipwooung@gmail.com";
  const password = "zxc123ZXC!@#";

  // instagram 로그인
  await page.type('input[name="username"]', username);
  await page.type('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: "networkidle2" });

  for (const artist of artists) {
    const artistIdx = artist.idx;
    const artistAccount = artist.instagram_account;
    console.log("[artistAccount]", artistAccount);

    // 일정시간 기다림없이 계속요청시 401 에러 발생
    await wait(4000);

    try {
      await page.goto(`https://www.instagram.com/${artistAccount}`, { waitUntil: "networkidle2" });
      await page.waitForSelector("div._aagv", { timeout: 10000 });
    } catch (e) {
      fs.writeFileSync("./error.log", `[${artistAccount}]\n ${e}`);
      continue;
    }

    // await wait(10000)

    const content = await page.content();
    const $ = load(content);

    const postingArray = [];

    $("div._aagv img").map((i, el) => {
      postingArray.push({
        content: $(el).attr("alt"),
        img: $(el).attr("src"),
        postingUrl: `https://www.instagram.com${$(el).parent().parent().parent().attr("href")}`,
      });
    });

    let concertInfoArray = [];

    for (const posting of postingArray) {
      if (posting.content && posting.content.startsWith("Photo shared by")) {
        await wait(1000);
        await page.goto(posting.postingUrl, { waitUntil: "networkidle2" });
        await page.waitForSelector("div.x4h1yfo", { timeout: 10000 });
        const content = await page.content();
        const $2 = load(content);

        let text = "";
        $2("div.x4h1yfo").map((i, el) => {
          text += $(el).text();
        });
        posting.content = text;
      }

      // 콘서트 관련 Text있는 포스팅만 필터링 (콘서트 관련 단어 , 일자)
      if (await filterByConcertRelated(posting)) {
        // 관련있는 경우 구체적인 정보 추출
        const concertInfo = await extractConcertInfo(posting.content);
        console.log("concertInfo", concertInfo);
        concertInfo["postingUrl"] = posting["postingUrl"];
        concertInfo["postingImg"] = posting["img"];

        // 동일한 계시물이 있는지 확인하고 만약 이미 있는 경우, 더 정확한 정보가 있는 posting으로 업데이트
        if (concertInfoArray.length !== 0 && concertInfo["date"] !== null) {
          for (const item of concertInfoArray) {
            if (JSON.stringify(concertInfo.date.sort()) == JSON.stringify(item.date.sort())) {
              // 더 정보가 많다면 업데이트
              console.log("same date", concertInfo, item);
              console.log(
                "확인",
                countObjectValue(concertInfo, null),
                countObjectValue(item, null),
                concertInfoArray.indexOf(item)
              );
              if (countObjectValue(concertInfo, null) < countObjectValue(item, null)) {
                concertInfoArray[concertInfoArray.indexOf(item)] = concertInfo;
              } else {
                continue;
              }
            }
          }
        }
        if (concertInfo["date"] !== null) {
          concertInfoArray.push(concertInfo);
        }
      }
    }

    console.log("filteredPostingArray length", concertInfoArray.length);
    console.log("filteredPostingArray", concertInfoArray);

    if (concertInfoArray.length > 0) {
      // 콘서트 별
      for (let i = 0; i < concertInfoArray.length; i++) {
        // 콘서트의 일정 별(하루 단위)

        for (let j = 0; j < concertInfoArray[i]["date"].length; j++) {
          // 이미 저장된 콘서트인지 체크 후 저장
          const concert = await mysqlUtil.getOne("tb_concert", ["idx"], {
            artist_idx: artistIdx,
            date: concertInfoArray[i].date[j],
          });
          if (concert === null) {
            // 이미지 s3 업로드
            const response = await axios.get(concertInfoArray[i].postingImg, { responseType: "arraybuffer" });
            const imageBuffer = Buffer.from(response.data, "binary");
            const postingImageKey = `${artist.atrist_name}/${concertInfoArray[i].date[j].split(" ")[0]}/posting.png`;
            const postingImageUrl = await getPresignedPostUrl(postingImageKey);
            await axios.put(postingImageUrl, imageBuffer, { headers: { "Content-Type": "image/png" } });

            const concert = {
              artist_idx: artistIdx,
              name: concertInfoArray[i].name,
              place: concertInfoArray[i].place,
              date: concertInfoArray[i].date[j],
              ticket_date: concertInfoArray[i].ticketDate,
              ticket_place: concertInfoArray[i].ticketPlace,
              posting_url: concertInfoArray[i].postingUrl,
              posting_img: s3Url + postingImageKey,
            };
            await mysqlUtil.create("tb_concert", concert);
          }
        }
      }
    }
  }

  await page.close();
  await browser.close();
};

// (async function () {
//   let artists = await mysqlUtil.getMany("tb_artist", [], {});
//   console.log("artists", artists);

//   await getConcert(artists);
// })();

(async function () {
  // 전체 Artist post 원할시

  // let artists = await mysqlUtil.getMany("tb_artist", [], {});
  // await getConcert(artists);

  // 특정 Artist post 원할시
  const idx = 207;
  const instagram_account = "interstellajang";
  await getConcert([{ idx, instagram_account }]);
})();
