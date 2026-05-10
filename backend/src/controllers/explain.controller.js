const { GoogleGenerativeAI } = require("@google/generative-ai");
const prisma = require("../lib/prisma");
const AppError = require("../utils/AppError");

/**
 * Generates code-specific questions by analyzing variable/function names.
 * Used as fallback when Gemini API is unavailable or rate-limited.
 */
function generateCodeSpecificQuestions(code, language) {
  const lines = code.split('\n').filter(l => l.trim());

  // Extract variable names (words before = or :)
  const varMatches = code.match(/\b([a-z_][a-z0-9_]{2,})\s*=/gi) || [];
  const vars = [...new Set(varMatches.map(m => m.replace(/\s*=.*/, '').trim()).filter(v => !['def', 'class', 'return', 'import', 'from', 'if', 'for', 'while', 'else', 'elif', 'const', 'let', 'var', 'function'].includes(v)))].slice(0, 5);

  const questions = [];

  // Q1 - about a specific variable name
  if (vars.length > 1) {
    questions.push(`Why did you name the variable \`${vars[1]}\` and what role does it play in your solution?`);
  } else if (vars.length === 1) {
    questions.push(`What does the variable \`${vars[0]}\` store, and why is it initialized the way it is?`);
  } else {
    questions.push(`Walk me through the key variables you used and their purpose.`);
  }

  // Q2 - about the approach / data structure
  const hasDict = /\{\}|dict\(|char_map|seen|visited|memo|cache|HashMap|Map\(\)|new Map/.test(code);
  const hasTwoPointers = /left.*right|right.*left|lo.*hi|start.*end/.test(code);
  const hasSliding = /window|left|right/.test(code) && /for|while/.test(code);

  if (hasDict) {
    questions.push(`Why did you use a hash map (dictionary) as the main data structure? What would happen if you used a list instead?`);
  } else if (hasTwoPointers) {
    questions.push(`Explain the two-pointer technique in your solution — when does the left pointer move?`);
  } else if (hasSliding) {
    questions.push(`How does your sliding window maintain validity as it expands and contracts?`);
  } else {
    questions.push(`What is the main data structure you used and why did you choose it?`);
  }

  // Q3 - complexity
  const loopCount = (code.match(/\bfor\b|\bwhile\b/g) || []).length;
  if (loopCount >= 2) {
    questions.push(`Your code has ${loopCount} loops — is the overall time complexity O(n) or O(n²)? Explain briefly.`);
  } else if (loopCount === 1) {
    questions.push(`Your solution has a single loop — what is the time complexity and is there any extra space used?`);
  } else {
    questions.push(`What is the overall time and space complexity of your solution?`);
  }

  return questions;
}

async function generateQuestions(req, res, next) {
  try {
    const { code, language } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      console.warn("[Explain] GEMINI_API_KEY not found. Using code-analysis fallback.");
      return res.json({ success: true, data: generateCodeSpecificQuestions(code, language) });
    }
    console.log(`[Explain] Using Gemini API. Key prefix: ${process.env.GEMINI_API_KEY.substring(0, 8)}...`);

    try {
      console.log('[Explain] Calling Gemini 2.5 Flash...');
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }, { apiVersion: "v1beta" });

      const prompt = `You are an expert technical interviewer. Review the following ${language} code:\n\n${code}\n\nGenerate exactly 3 EXTREMELY short and simple questions to test if the author actually wrote this code. The questions MUST be solvable in under 20 seconds each. Do not ask for complex tracing. Ask about specific variable names used, simple logic choices, or basic time complexity. Return ONLY a valid JSON array of 3 strings. Example: ["Why did you initialize max_length to 0?", "What happens if the input string is empty?", "Is your solution O(n) or O(n^2)?"]`;

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
        }
      });
      const response = await result.response;
      let text = response.text();

      // Because of responseMimeType, we should get raw JSON directly
      const questions = JSON.parse(text);
      console.log('[Explain] Gemini generated questions successfully:', questions);

      res.json({ success: true, data: questions });
    } catch (apiErr) {
      const is429 = apiErr.message?.includes('429');
      console.error(`[Explain] Gemini API FAILED (${is429 ? 'RATE_LIMITED — quota exceeded' : 'ERROR'}):`, apiErr.message?.substring(0, 120));
      // Smart code-analysis fallback — NOT generic questions
      const fallback = generateCodeSpecificQuestions(code, language);
      console.log('[Explain] Using code-analysis fallback:', fallback);
      return res.json({ success: true, data: fallback });
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
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }, { apiVersion: "v1beta" });

        const prompt = `You are an expert technical interviewer. The candidate submitted the following ${language} code:\n\n${code}\n\nI asked them these 3 extremely simple questions, and they provided these short answers under time pressure (20 seconds):\n${answers.map((a, i) => `Q${i + 1}: ${a.question}\nA${i + 1}: ${a.answer || "[No Answer]"}`).join('\n\n')}\n\nEvaluate the correctness and authenticity of these answers. Keep in mind they had very little time, so brief or slightly informal answers are acceptable if correct. Return ONLY a JSON object with a single field "suspicion_score" between 0.0 (perfectly correct, genuine) and 1.0 (completely wrong, evasive, or fake). Example: {"suspicion_score": 0.2}`;

        const result = await model.generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
          }
        });
        let text = await result.response.text();

        const evalResult = JSON.parse(text);
        baseScore = evalResult.suspicion_score ?? 0.5;
      } catch (apiErr) {
        console.warn("Gemini API Error (Evaluate):", apiErr.message?.substring(0, 100));
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
