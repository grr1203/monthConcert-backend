import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const extractConcertInfo = async (posting: string): Promise<ConcertInfo> => {
  const prompt = `${posting}\n
    위 포스팅은 어떤 가수가 SNS에 포스팅한 내용이야. 먼저 해당 가수가 콘서트를 오픈하는 것에 대한 내용을 포스팅했는지 확인해주고,
    만약 맞다면 다음 key 설명에 맞게 key-value object의 JSON.stringfy 형식으로 정보를 추출해줘. 찾을수 없는 정보는 null로 해줘.
    그리고 만약 콘서트 오픈 관련이 아니라면 전부 null로 처리해주고 다른말은 하지말고 바로 JSON object를 줘.
    { 
    name : 콘서트 이름
    place: 콘서트 장소
    date: 공연 일시 (YYYY-MM-DD HH:mm:ss 형식의 string Array, 만약 연도가 없다면 2024년도로 채워줘.)
    ticketDate: 티켓 예매일시
    ticketPlace: 티켓 예매장소(사이트)
    }`;

  const completion = await openai.chat.completions.create({
    messages: [
      { role: "system", content: "You are the assistant who makes cool and critical judgments." },
      { role: "user", content: prompt },
    ],
    model: "gpt-3.5-turbo", // gpt-3.5-turbo-1106
  });
  // console.log("[completion]", completion);
  console.log("[completion message]", completion.choices[0]);

  const content = completion.choices[0].message.content;

  // 여러번 요청시 ```json\n``` 이 두서에 붙는 경우가 있어서, 이를 제거
  if (content.startsWith("```json\n")) {
    const lastBrace = content.indexOf("}");
    return JSON.parse(content.slice(7, lastBrace + 1));
  }

  return JSON.parse(content);
};

export const extractPopupStoreInfo = async (posting: string): Promise<PopupStoreInfo> => {
  const prompt = `${posting}\n
    위 포스팅은 팝업 스토어 오픈에 대한 내용이야. 먼저 팝업스토어 오픈에 대한 내용을 포스팅했는지 확인해주고,
    만약 맞다면 다음 key 설명에 맞게 key-value object의 JSON.stringfy 형식으로 정보를 추출해줘. 찾을수 없는 정보는 null로 해줘.
    그리고 팝업스토어 오픈 관련이 아니라면 전부 null로 처리해주고 다른말은 하지말고 바로 JSON object를 raw data로 줘.
    { 
    "name" : 팝업스토어 제목
    "place": 팝업스토어 위치
    "date": 팝업스토어 오픈 일시 (YYYY-MM-DD 형식의 string Array로 [시작날짜,종료날짜] 이렇게 표현해줘, 만약 연도가 없다면 2024년도로 채워줘.)
    "time": 오픈 시간 (적혀있는 그대로 담아줘)
    }`;

  const completion = await openai.chat.completions.create({
    messages: [
      { role: "system", content: "You are the assistant who makes cool and critical judgments." },
      { role: "user", content: prompt },
    ],
    model: "gpt-3.5-turbo", // gpt-3.5-turbo-1106
  });
  // console.log("[completion]", completion);
  console.log("[completion message]", completion.choices[0]);

  const content = completion.choices[0].message.content;

  // 여러번 요청시 ```json\n``` 이 두서에 붙는 경우가 있어서, 이를 제거
  if (content.startsWith("```json\n")) {
    const lastBrace = content.indexOf("}");
    return JSON.parse(content.slice(7, lastBrace + 1));
  }

  return JSON.parse(content);
};

type ConcertInfo = {
  name: string | null;
  place: string | null;
  date: string[] | null;
  ticketDate: string | null;
  ticketPlace: string | null;
};

type PopupStoreInfo = {
  name: string | null;
  place: string | null;
  date: string[] | null;
  time: string | null;
};
