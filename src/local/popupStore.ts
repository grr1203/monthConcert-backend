import "./set-env";
import puppeteer from "puppeteer";
import { load } from "cheerio";
import mysqlUtil from "../lib/mysqlUtil";
import { extractPopupStoreInfo } from "../lib/openai.module";
import fs from "fs";
import { wait } from "../lib/util";

const popupstore_account_list = [`popupstorego`, "popupmate", "paulseee", "inas.pick", "pops.official_"];

const getPopupStore = async (popup_account_list) => {
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

  for (const popup_account of popup_account_list) {
    console.log("[popup_account]", popup_account);

    // 일정시간 기다림없이 계속요청시 401 에러 발생
    await wait(4000);

    try {
      await page.goto(`https://www.instagram.com/${popup_account}`, { waitUntil: "networkidle2" });
      await page.waitForSelector("div._aagv", { timeout: 10000 });
    } catch (e) {
      fs.writeFileSync("./error.log", `[${popup_account}]\n ${e}`);
      continue;
    }

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

    const popupStoreInfoArray = [];

    postingLoop: for (const posting of postingArray) {
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
      // 관련있는 경우 구체적인 정보 추출
      const popupStoreInfo = await extractPopupStoreInfo(posting.content);

      if (popupStoreInfo["date"] == null) continue;

      console.log("popupStoreInfo", popupStoreInfo);
      popupStoreInfo["postingUrl"] = posting["postingUrl"];
      // concertInfo["postingImg"] = posting["img"];

      if (popupStoreInfo["date"] !== null) {
        popupStoreInfoArray.push(popupStoreInfo);
      }
    }

    console.log("filteredPostingArray length", popupStoreInfoArray.length);

    for (let i = 0; i < popupStoreInfoArray.length; i++) {
      const popupStoreInfo = popupStoreInfoArray[i];
      if (popupStoreInfo.name !== null) {
        const popupStore = {
          name: popupStoreInfo.name,
          place: popupStoreInfo.place,
          date: `${popupStoreInfo.date}`,
          time: popupStoreInfo.time,
          posting_url: popupStoreInfo.postingUrl,
        };
        await mysqlUtil.create("tb_popup_store", popupStore);
      }
    }
  }

  await page.close();
  await browser.close();
};

(async function () {
  await getPopupStore(popupstore_account_list);
})();
