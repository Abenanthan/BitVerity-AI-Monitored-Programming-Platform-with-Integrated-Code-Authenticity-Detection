// ============================================
// API UTILITIES (mock for frontend demo)
// ============================================

const delay = (ms) => new Promise(r => setTimeout(r, ms));

export const api = {
  async login(email, password) {
    await delay(800);
    if (email && password) {
      return { token: 'mock-jwt-token', user: { name: 'Alex Chen', email, avatar: null, trustScore: 78 } };
    }
    throw new Error('Invalid credentials');
  },

  async getProblems(filters = {}) {
    await delay(300);
    return { problems: [], total: 0 };
  },

  async submitCode(contestId, problemId, code, language) {
    await delay(2000);
    const verdicts = ['accepted', 'wrong', 'tle'];
    const verdict = verdicts[Math.floor(Math.random() * verdicts.length)];
    return {
      id: `sub-${Date.now()}`,
      verdict,
      runtime: Math.floor(Math.random() * 500) + 'ms',
      memory: Math.floor(Math.random() * 50 + 10) + ' MB',
      aiAnalysis: {
        overallScore: Math.floor(Math.random() * 100),
        behavioral:   Math.floor(Math.random() * 100),
        codePattern:  Math.floor(Math.random() * 100),
        styleFingerprint: Math.floor(Math.random() * 100),
        explainability:   Math.floor(Math.random() * 100),
        flags: [
          { type: 'paste', message: 'Paste event detected', time: '4:32', },
          { type: 'tab',   message: 'Tab switch ×3',        time: '2:15', },
        ],
      },
    };
  },

  async getResults(id) {
    await delay(400);
    return {
      id,
      verdict: 'accepted',
      runtime: '104ms',
      memory: '38.2 MB',
      language: 'Python',
      code: `class Solution:\n    def twoSum(self, nums, target):\n        seen = {}\n        for i, num in enumerate(nums):\n            if target - num in seen:\n                return [seen[target-num], i]\n            seen[num] = i`,
      testCases: [
        { input: '[2,7,11,15], target=9',  expected: '[0,1]', output: '[0,1]', passed: true  },
        { input: '[3,2,4], target=6',       expected: '[1,2]', output: '[1,2]', passed: true  },
        { input: '[3,3], target=6',         expected: '[0,1]', output: '[0,1]', passed: true  },
      ],
      aiAnalysis: {
        overallScore: 14,
        behavioral:   8,
        codePattern:  22,
        styleFingerprint: 12,
        explainability: 18,
        flags: [],
      },
      trustScoreImpact: +2,
    };
  },
};
