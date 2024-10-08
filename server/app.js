import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const ENDPOINT = process.env.ENDPOINT;

const languageConfig = [
  { language: "en", name: "Tiếng Anh" },
  { language: "vi", name: "Tiếng Việt" },
  { language: "ko", name: "Tiếng Hàn Quốc" },
  { language: "fr", name: "Tiếng Pháp" },
  { language: "es", name: "Tiếng Tây Ban Nha" },
  { language: "de", name: "Tiếng Đức" },
];

app.use(bodyParser.json());

app.post("/summarize", async (req, res) => {
  const { text, target_language, target_length } = req.body;

  if (!text) {
    return res.status(400).json({ error: "No text provided" });
  }

  const summary = await summaryText(text, target_language, target_length);
  if (summary) {
    res.json({ summary });
  } else {
    res.status(500).json({ error: "Failed to get summary" });
  }
});

async function summaryText(
  text,
  targetLanguage = "en",
  targetLength = "medium"
) {
  const endpoint = `${ENDPOINT}`;

  const targetLanguageText = languageConfig.find(
    (item) => item.language === targetLanguage
  )?.name;

  let lengthInstruction = "";
  if (targetLength === "short") {
    lengthInstruction = "ngắn gọn nhất có thể trong 1-2 dòng";
  } else if (targetLength === "medium") {
    lengthInstruction =
      "trong 3 dòng, sát ý nghĩa, ngắn gọn, đơn giản, dễ hiểu";
  } else if (targetLength === "long") {
    lengthInstruction =
      "chi tiết trong 5 dòng, bao gồm cả các chi tiết quan trọng";
  }

  const payload = {
    contents: [
      {
        parts: [
          {
            text:
              `Tóm tắt [${text}] sang ${targetLanguageText} ${lengthInstruction}. Giữ tiêu đề. trả về JSON` +
              `định dạng như sau: {"title": "tiêu đề", "summary": ["đoạn 1", "đoạn 2"]}`,
          },
        ],
      },
    ],
  };

  const options = {
    method: "post",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  };

  const response = await fetch(endpoint, options);
  const result = await response.json();

  if (response.status === 200) {
    try {
      // Remove Markdown formatting
      const jsonString = result.candidates[0].content.parts[0].text.replace(
        /```json\n|```/g,
        ""
      );
      return JSON.parse(jsonString);
    } catch (error) {
      console.error("Error parsing JSON:", error);
      return null;
    }
  }

  return null;
}

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
