const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({path: '.env'});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
model.generateContent('hello').then(res => {
  console.log("SUCCESS");
}).catch(err => {
  console.log("ERROR:", err.message);
});
