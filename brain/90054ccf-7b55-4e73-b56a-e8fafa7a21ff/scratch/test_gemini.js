require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function test() {
  const key = process.env.GEMINI_API_KEY;
  console.log('API Key present:', !!key);
  if (key) console.log('Key prefix:', key.substring(0, 10) + '...');

  if (!key) {
    console.error('NO API KEY FOUND - check backend/.env');
    process.exit(1);
  }

  try {
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `You are an expert technical interviewer. Review the following python code:

def lengthOfLongestSubstring(s):
    char_map = {}
    left = 0
    max_length = 0
    for right in range(len(s)):
        if s[right] in char_map and char_map[s[right]] >= left:
            left = char_map[s[right]] + 1
        char_map[s[right]] = right
        max_length = max(max_length, right - left + 1)
    return max_length

Generate exactly 3 EXTREMELY short and simple questions to test if the author actually wrote this code. Return ONLY a valid JSON array of 3 strings.`;

    const result = await model.generateContent(prompt);
    const text = await result.response.text();
    console.log('SUCCESS! Gemini response:');
    console.log(text);
  } catch (err) {
    console.error('GEMINI ERROR:', err.message);
    if (err.status) console.error('HTTP Status:', err.status);
    if (err.errorDetails) console.error('Details:', JSON.stringify(err.errorDetails));
  }
}

test();
