const { GoogleGenerativeAI } = require("@google/generative-ai");
const prisma = require("../lib/prisma");
const AppError = require("../utils/AppError");

async function generateQuestions(req, res, next) {
  try {
    const { code, language } = req.body;
    
    if (!process.env.GEMINI_API_KEY) {
      console.warn("GEMINI_API_KEY not found. Using fallback questions.");
      return res.json({
        success: true,
        data: [
          "Explain the core logic of your solution.",
          "What is the time and space complexity of your code?",
          "Why did you choose this specific approach over other alternatives?"
        ]
      });
    }

    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      
      const prompt = `You are an expert technical interviewer. Review the following ${language} code:\n\n${code}\n\nGenerate exactly 3 EXTREMELY short and simple questions to test if the author actually wrote this code. The questions MUST be solvable in under 20 seconds each. Do not ask for complex tracing. Ask about specific variable names used, simple logic choices, or basic time complexity. Return ONLY a valid JSON array of 3 strings. Example: ["Why did you initialize max_length to 0?", "What happens if the input string is empty?", "Is your solution O(n) or O(n^2)?"]`;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      let text = response.text();
      
      // Clean JSON markdown blocks if present
      text = text.replace(/```json/g, "").replace(/```/g, "").trim();
      const questions = JSON.parse(text);

      res.json({ success: true, data: questions });
    } catch (apiErr) {
      console.warn("Gemini API Error (Generate):", apiErr.message);
      return res.json({
        success: true,
        data: [
          "Explain the core logic of your solution.",
          "What is the time and space complexity of your code?",
          "Why did you choose this specific approach over other alternatives?"
        ]
      });
    }
  } catch (err) {
    next(err);
  }
}

async function evaluateAnswers(req, res, next) {
  try {
    const { submissionId, code, language, answers } = req.body;
    
    let baseScore = 0; // 0 is best (human), 1 is worst (AI)

    // Calculate penalty from behaviors (tab switches, pastes)
    let behaviorPenalty = 0;
    answers.forEach(a => {
      if (a.pasteCount > 0) behaviorPenalty += 0.4;
      if (a.tabSwitches > 0) behaviorPenalty += 0.2 * a.tabSwitches;
      if (a.timeTaken > 20) behaviorPenalty += 0.1; // penalized for taking too long
    });

    if (process.env.GEMINI_API_KEY) {
      try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        
        const prompt = `You are an expert technical interviewer. The candidate submitted the following ${language} code:\n\n${code}\n\nI asked them these 3 extremely simple questions, and they provided these short answers under time pressure (20 seconds):\n${answers.map((a, i) => `Q${i+1}: ${a.question}\nA${i+1}: ${a.answer || "[No Answer]"}`).join('\n\n')}\n\nEvaluate the correctness and authenticity of these answers. Keep in mind they had very little time, so brief or slightly informal answers are acceptable if correct. Return ONLY a JSON object with a single field "suspicion_score" between 0.0 (perfectly correct, genuine) and 1.0 (completely wrong, evasive, or fake). Example: {"suspicion_score": 0.2}`;
        
        const result = await model.generateContent(prompt);
        let text = await result.response.text();
        text = text.replace(/```json/g, "").replace(/```/g, "").trim();
        
        const evalResult = JSON.parse(text);
        baseScore = evalResult.suspicion_score ?? 0.5;
      } catch (apiErr) {
        console.warn("Gemini API Error (Evaluate):", apiErr.message);
        const emptyAnswers = answers.filter(a => !a.answer || a.answer.trim().length < 10).length;
        baseScore = (emptyAnswers / 3);
      }
    } else {
      // Fallback evaluation if no Gemini API key
      const emptyAnswers = answers.filter(a => !a.answer || a.answer.trim().length < 10).length;
      baseScore = (emptyAnswers / 3); 
    }

    // Final explainability score (combine answer quality and behavior during answering)
    let finalExplainabilityScore = Math.min(1.0, baseScore + behaviorPenalty);

    // Update the DetectionReport in DB
    const report = await prisma.detectionReport.findUnique({
      where: { submissionId }
    });

    if (report) {
      // Re-calculate final AI score with explainability included
      // Example weights: 30% Behavioral, 20% Pattern, 20% Fingerprint, 30% Explainability
      const w_beh = 0.30;
      const w_pat = 0.20;
      const w_fin = 0.20;
      const w_exp = 0.30;

      let newFinalScore = (report.behavioralScore * w_beh) + 
                          (report.codePatternScore * w_pat) + 
                          (report.fingerprintScore * w_fin) + 
                          (finalExplainabilityScore * w_exp);
                          
      if (report.behavioralScore >= 1.0) newFinalScore = Math.max(newFinalScore, 0.82);

      const aiVerdict = newFinalScore >= 0.75 ? "AI_GENERATED" : newFinalScore >= 0.40 ? "SUSPICIOUS" : "HUMAN";

      // Append new flag if explainability is poor
      const flags = report.flags || [];
      if (finalExplainabilityScore > 0.7) {
        flags.push({
          type: "poor_explainability",
          detail: `Explainability test failed (score: ${Math.round(finalExplainabilityScore * 100)}%). Pastes/Tab switches during test: ${behaviorPenalty > 0 ? 'Yes' : 'No'}`
        });
      }

      await prisma.detectionReport.update({
        where: { submissionId },
        data: {
          explainabilityScore: finalExplainabilityScore,
          finalAiScore: newFinalScore,
          aiVerdict,
          flags
        }
      });
    }

    res.json({ success: true, data: { explainabilityScore: finalExplainabilityScore } });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  generateQuestions,
  evaluateAnswers
};
