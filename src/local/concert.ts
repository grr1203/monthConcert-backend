import puppeteer from "puppeteer";
import { load } from "cheerio";
import mysqlUtil from "../lib/mysqlUtil";
import "./set-env";
import { filterByConcertRelated } from "../lib/crawling";
import { filterConcertInfo } from "../lib/openai.module";

// const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const getConcert = async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.125 Safari/537.36"
  );

  const res = await page.goto(`https://www.instagram.com`, { waitUntil: "networkidle2" });
  console.log("res status", res.status());
  // let content = await page.content();
  //   console.log('content', content);

  // const username = "zzipwooung@gmail.com";
  // const password = "zxc123ZXC!@#";

  // // instagram 로그인
  // await page.type('input[name="username"]', username);
  // await page.type('input[name="password"]', password);
  // await page.click('button[type="submit"]');
  // await page.waitForNavigation({ waitUntil: "networkidle2" });

  const artists = await mysqlUtil.getMany("tb_artist", [], {});
  console.log("artists", artists);

  for (const artist of artists) {
    const artistIdx = artist.idx;
    const artistAccount = artist.instagram_account;
    console.log("[artistAccount]", artistAccount);

    await page.goto(`https://www.instagram.com/${artistAccount}`, { waitUntil: "networkidle2" });
    await page.waitForSelector("div._aagv");
    console.log("res status", res.status());
    //   console.log('content', content);

    // await page.mouse.wheel({ deltaY: -10000 });

    // await wait(10000)

    const content = await page.content();
    //   console.log('content', content);

    const $ = load(content);
    const postingArray = $("div._aagv img");

    const concertInfoArray = [];
    const tempFilteredPostingArray = postingArray.map(async function () {
      const posting = {
        content: $(this).attr("alt"),
        img: $(this).attr("src"),
      };
      // 콘서트 관련 포스팅만 필터링
      if (await filterByConcertRelated(posting)) {
        // 관련있는 경우 구체적인 정보 추출
        const concertInfo = await filterConcertInfo(posting.content);
        console.log("concertInfo", concertInfo);
        concertInfo["postingUrl"] = `https://www.instagram.com${$(this).parent().parent().parent().attr("href")}`;

        // todo: 추출 실패시 수동확인 포스팅으로 저장
        if (!concertInfo.date && !posting["postingUrl"]) console.log("수동확인 포스팅 저장 필요");

        if (
          concertInfoArray.length === 0 ||
          concertInfoArray.every((item) => JSON.stringify(concertInfo.date.sort()) !== JSON.stringify(item.date.sort()))
        ) {
          // 게시물들 내 중복체크
          concertInfoArray.push(concertInfo);
        }
      }
    });

    await Promise.all(tempFilteredPostingArray);
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
            const concert = {
              artist_idx: artistIdx,
              name: concertInfoArray[i].name,
              place: concertInfoArray[i].place,
              date: concertInfoArray[i].date[j],
              ticket_date: concertInfoArray[i].ticketDate,
              ticket_place: concertInfoArray[i].ticketPlace,
              posting_url: concertInfoArray[i].postingUrl,
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

getConcert();
