require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' }, { apiVersion: 'v1beta' });

const code = "def twoSum(nums, target):\n    return [0,1]";
const language = "python";

const prompt = `You are an expert technical interviewer. Review the following ${language} code:\n\n${code}\n\nGenerate exactly 3 EXTREMELY short and simple questions to test if the author actually wrote this code. The questions MUST be solvable in under 20 seconds each. Do not ask for complex tracing. Ask about specific variable names used, simple logic choices, or basic time complexity. Return ONLY a valid JSON array of 3 strings. Example: ["Why did you initialize max_length to 0?", "What happens if the input string is empty?", "Is your solution O(n) or O(n^2)?"]`;

model.generateContent(prompt).then(async result => {
  const response = await result.response;
  let text = response.text();
  console.log('RAW:', text);
  try {
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    console.log('PARSED:', JSON.parse(text));
  } catch(e) {
    console.error('PARSE ERROR', e);
  }
}).catch(err => console.error(err));
