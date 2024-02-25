import { load } from "cheerio";
import puppeteer from "puppeteer";
import { filterConcertInfo } from "./openai.module";
// import { OCRhandler } from './naver/OCR.js';

export const getPosting = async (
  artistAccount: string
): Promise<
  { name?: string; place?: string; date?: string[]; ticketDate?: string; ticketPlace?: string; postingUrl?: string }[]
> => {
  console.log("[artistAccount]", artistAccount);
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: "/usr/bin/google-chrome",
    args: [
      "--disable-extensions",
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
  });
  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.125 Safari/537.36"
  );

  const res = await page.goto(`https://www.instagram.com`, { waitUntil: "networkidle2" });
  console.log("res status", res.status());
  let content = await page.content();
  //   console.log('content', content);

  // instagram 로그인
  await page.type('input[name="username"]', '');
  await page.type('input[name="password"]', '');
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle2' });

  await page.goto(`https://www.instagram.com/${artistAccount}`, { waitUntil: "networkidle2" });
  await page.waitForSelector("article");
  console.log("res status", res.status());
  content = await page.content();
  //   console.log('content', content);

  const $ = load(content);
  const article = $("article");
  //   console.log('article html', article.html());
  const postingArray = article.find("div._aagv img");
  console.log("postingArray.length", postingArray.length);

  const filteredPostingArray = [];
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
        filteredPostingArray.length === 0 ||
        filteredPostingArray.every(
          (item) => JSON.stringify(concertInfo.date.sort()) !== JSON.stringify(item.date.sort())
        )
      ) {
        // 게시물들 내 중복체크
        filteredPostingArray.push(concertInfo);
      }
    }
  });
  await Promise.all(tempFilteredPostingArray);
  console.log("filteredPostingArray length", filteredPostingArray.length);
  console.log("filteredPostingArray", filteredPostingArray);

  await page.close();
  await browser.close();
  return filteredPostingArray;
};

const filterByConcertRelated = async (posting: { content: string; img: string }) => {
  console.log("posting", posting);
  if (!posting.content) return false;
  const concertRelatedKeywords = ["콘서트", "공연", "라이브", "티켓", "예매", "concert", "CONCERT", "ticket", "TICKET"];

  // 포스팅 글 필터링
  const count = concertRelatedKeywords.filter((keyword) => posting.content.includes(keyword)).length;
  let isConcertRelated = count >= 1;
  console.log("isConcertRelated 1", isConcertRelated);
  if (!isConcertRelated) return false;

  // 일시 : 1월 1일 / 1.1 / 1. 1 / 1/1
  const datePattern = /\b\d{1,2}월\s*\d{1,2}일|\b\d{1,2}[.\/]\s*\d{1,2}\b/g;
  isConcertRelated = datePattern.test(posting.content);
  console.log("isConcertRelated 2", isConcertRelated);
  if (!isConcertRelated) {
    return false;
  }

  // 포스팅 이미지 필터링
  //   try {
  //     const OCRResult = await OCRhandler(posting.img, 'jpg');
  //     console.log('OCRResult', OCRResult);
  //     isConcertRelated = concertRelatedKeywords.some((keyword) => OCRResult.includes(keyword));
  //     console.log('isConcertRelated 3', isConcertRelated);
  //     if (!isConcertRelated) return false;

  //   } catch (e) {
  //     console.log('OCR error', e);
  //   }

  return isConcertRelated;
};
