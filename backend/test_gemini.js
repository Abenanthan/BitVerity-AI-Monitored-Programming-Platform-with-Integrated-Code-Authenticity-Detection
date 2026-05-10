const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testGemini() {
  const apiKey = process.env.GEMINI_API_KEY || "AIzaSyCJdGkxoUHIwi54RxQ0cl3SiOk4r--YWQo";
  console.log("API Key prefix:", apiKey.substring(0, 12) + "...");
  
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel(
    { model: "gemini-2.5-flash" },
    { apiVersion: "v1beta" }
  );

  const prompt = `Generate exactly 3 short questions about this Python code. Return ONLY a JSON array of 3 strings.

def twoSum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i`;

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
      }
    });
    const text = result.response.text();
    console.log("RAW RESPONSE:", text);
    const questions = JSON.parse(text);
    console.log("PARSED:", questions);
    console.log("\n✅ Gemini API is WORKING!");
  } catch (err) {
    console.error("❌ Gemini API FAILED!");
    console.error("Error type:", err.constructor.name);
    console.error("Error message:", err.message);
    if (err.message.includes("429")) {
      console.error("\n⚠️  RATE LIMITED — API quota exceeded!");
    } else if (err.message.includes("403")) {
      console.error("\n⚠️  API KEY INVALID or DISABLED!");
    }
  }
}

testGemini();
