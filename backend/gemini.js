import axios from "axios";

const geminiResponse = async (command, assistantName, userName) => {
  try {
    const API_KEY = process.env.GEMINI_API_KEY;

    if (!API_KEY) {
      throw new Error("❌ GEMINI_API_KEY missing in .env");
    }

    const apiUrl =
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

    const prompt = `
You are a virtual assistant named ${assistantName} created by ${userName}.
You are a voice-enabled assistant.

Reply ONLY in JSON:

{
  "type": "general" | "google-search" | "youtube-search" | "youtube-play" |
          "get-time" | "get-date" | "get-day" | "get-month" |
          "calculator-open" | "instagram-open" | "facebook-open" | "weather-show",
  "userInput": "<cleaned user input>",
  "response": "<short spoken reply>"
}

Rules:
- Only JSON
- Short response
- If asked who created you → say ${userName}

User input:
${command}
`;

    const result = await axios.post(apiUrl, {
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
    });

    return result.data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error("❌ Gemini API Error:", error.response?.data || error.message);
    throw error;
  }
};

export default geminiResponse;
