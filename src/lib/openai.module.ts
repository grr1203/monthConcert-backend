import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const extractConcertInfo = async (posting: string) => {
  console.log(posting)
  const prompt = `${posting}\n
    위 포스팅에서 다음 key 설명에 맞게 key-value object의 JSON.stringfy 형식으로 정보를 추출해줘. 찾을수 없는 정보는 null로해. 
    { 
    name : 콘서트 이름
    place: 콘서트 장소
    date: 공연 일시 (YYYY-MM-DD HH:mm:ss 형식의 string Array)
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
  console.log("[completion]", completion);
  console.log("[completion message]", completion.choices[0]);

  const content = completion.choices[0].message.content;

  // 여러번 요청시 ```json\n``` 이 두서에 붙는 경우가 있어서, 이를 제거
  return content.startsWith("```json\n") ? JSON.parse(content.slice(7, -3)) : JSON.parse(content);
};