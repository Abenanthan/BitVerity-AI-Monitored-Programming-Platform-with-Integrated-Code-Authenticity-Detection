// ============================================
// API UTILITIES (Piston API Integration)
// ============================================

const delay = (ms) => new Promise(r => setTimeout(r, ms));

const PROBLEMS = {
  'two-sum': {
    id: 'two-sum',
    title: 'Two Sum',
    difficulty: 'EASY',
    description: 'Given an array of integers `nums` and an integer `target`, return *indices of the two numbers such that they add up to `target`*.\n\nYou may assume that each input would have ***exactly* one solution**, and you may not use the *same* element twice.\n\nYou can return the answer in any order.',
    examples: [
      { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].' },
      { input: 'nums = [3,2,4], target = 6', output: '[1,2]', explanation: '' }
    ],
    constraints: [
      '2 <= nums.length <= 10^4',
      '-10^9 <= nums[i] <= 10^9',
      '-10^9 <= target <= 10^9',
      'Only one valid answer exists.'
    ],
    initialCode: `class Solution:\n    def twoSum(self, nums, target):\n        pass`,
    testRunnerTemplate: `
import sys, json
try:
    sol = Solution()
    print("TC|1|", json.dumps(sol.twoSum([2,7,11,15], 9)))
    print("TC|2|", json.dumps(sol.twoSum([3,2,4], 6)))
    print("TC|3|", json.dumps(sol.twoSum([3,3], 6)))
except Exception as e:
    print("ERROR|", str(e))
`,
    testCases: [
      { id: 1, input: '[2,7,11,15], target=9', expected: '[0, 1]', stdin: '2 7 11 15\n9' },
      { id: 2, input: '[3,2,4], target=6',      expected: '[1, 2]', stdin: '3 2 4\n6' },
      { id: 3, input: '[3,3], target=6',         expected: '[0, 1]', stdin: '3 3\n6' }
    ]
  },
  'palindrome-number': {
    id: 'palindrome-number',
    title: 'Palindrome Number',
    difficulty: 'EASY',
    description: 'Given an integer `x`, return `true` if `x` is a palindrome, and `false` otherwise.',
    examples: [
      { input: 'x = 121', output: 'true', explanation: '121 reads as 121 from left to right and from right to left.' },
      { input: 'x = -121', output: 'false', explanation: 'From left to right, it reads -121. From right to left, it becomes 121-. Therefore it is not a palindrome.' }
    ],
    constraints: [
      '-2^31 <= x <= 2^31 - 1'
    ],
    initialCode: `class Solution:\n    def isPalindrome(self, x: int) -> bool:\n        pass`,
    testRunnerTemplate: `
import sys, json
try:
    sol = Solution()
    print("TC|1|", json.dumps(sol.isPalindrome(121)))
    print("TC|2|", json.dumps(sol.isPalindrome(-121)))
except Exception as e:
    print("ERROR|", str(e))
`,
    testCases: [
      { id: 1, input: 'x = 121', expected: 'true' },
      { id: 2, input: 'x = -121', expected: 'false' }
    ]
  }
};

// ── Build a stdin-based test runner script ────────────────────────
// Works for any solution that uses input() to read from stdin.
// Each test case's stdin is fed via a patched input() per execution.
function buildStdinScript(userCode, testCases) {
  // Base64-encode the user code to avoid any string escaping issues
  const b64 = btoa(unescape(encodeURIComponent(userCode)));
  let s = '';
  s += 'import sys, base64, builtins\n';
  s += 'from io import StringIO\n\n';
  s += '__code__ = base64.b64decode("' + b64 + '").decode("utf-8")\n\n';
  s += 'def run_tc(stdin_str, tc_id):\n';
  s += '    lines = stdin_str.split("\\n")\n';
  s += '    idx = [0]\n';
  s += '    buf = StringIO()\n';
  s += '    orig_input = builtins.input\n';
  s += '    orig_stdout = sys.stdout\n';
  s += '    def fake(prompt=""):\n';
  s += '        v = lines[idx[0]].strip() if idx[0] < len(lines) else ""\n';
  s += '        idx[0] += 1\n';
  s += '        return v\n';
  s += '    builtins.input = fake\n';
  s += '    sys.stdout = buf\n';
  s += '    try:\n';
  s += '        exec(__code__, {})\n';
  s += '        result = buf.getvalue().strip()\n';
  s += '    except Exception as e:\n';
  s += '        result = "ERROR: " + str(e)\n';
  s += '    finally:\n';
  s += '        sys.stdout = orig_stdout\n';
  s += '        builtins.input = orig_input\n';
  s += '    print("TC|" + str(tc_id) + "|", result)\n\n';
  for (const tc of testCases) {
    const escapedStdin = (tc.stdin || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
    s += 'run_tc("' + escapedStdin + '", ' + tc.id + ')\n';
  }
  return s;
}

let lastSubmission = null;

export const api = {
  async login(email, password) {
    await delay(800);
    if (email && password) {
      return { token: 'mock-jwt-token', user: { name: 'Ashwin', email, avatar: null, trustScore: 78 } };
    }
    throw new Error('Invalid credentials');
  },

  async getProblems(filters = {}) {
    await delay(300);
    return { problems: Object.values(PROBLEMS).map(p => ({ id: p.id, title: p.title, difficulty: p.difficulty })), total: 2 };
  },

  async getProblem(id) {
    await delay(300);
    return PROBLEMS[id] || PROBLEMS['two-sum'];
  },

  async runCode(code, language) {
    const langMap = { 'python': 'cpython-3.10.15', 'javascript': 'nodejs-20.10.0' };
    
    try {
      const res = await fetch('https://wandbox.org/api/compile.json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          compiler: langMap[language] || 'cpython-3.10.15',
          code: code,
          save: false
        })
      });
      const data = await res.json();
      
      if (!res.ok) {
        return { stdout: '', stderr: `API Error: ${res.status} ${res.statusText}`, code: 1 };
      }
      
      // IMPORTANT: use program_output (pure stdout) NOT program_message (stdout+stderr)
      return {
        stdout: data.program_output || '',
        stderr: (data.compiler_error || '') + (data.program_error || ''),
        code: data.status === '0' ? 0 : 1
      };
    } catch(e) {
      return { stderr: `Network Error: ${e.message}`, stdout: '', code: 1 };
    }
  },

  async submitCode(contestId, problemId, code, language, behaviorLog) {
    const problem = PROBLEMS[problemId] || PROBLEMS['two-sum'];

    // Auto-detect solution style:
    // - Class-based (LeetCode style): has "class Solution"
    // - Stdin-based: uses input() directly
    const isClassBased = /class\s+Solution\s*[:(]/i.test(code);
    console.log('[Submit] Solution style:', isClassBased ? 'class-based' : 'stdin-based');

    let fullScript;
    if (isClassBased) {
      // Append the class-based test runner (calls sol.method())
      fullScript = code + '\n\n' + problem.testRunnerTemplate;
    } else {
      // Build a stdin-patching runner that re-execs the user code per test case
      fullScript = buildStdinScript(code, problem.testCases);
    }
    
    const runResult = await this.runCode(fullScript, language);
    
    // Use only stdout for TC parsing — stderr is separate
    const stdout = runResult.stdout || '';
    const stderr = runResult.stderr || '';
    
    // Debug: always log what we got back
    console.log('[Submit] exit code:', runResult.code);
    console.log('[Submit] stdout:', JSON.stringify(stdout));
    console.log('[Submit] stderr:', JSON.stringify(stderr));
    
    // Scan stdout line by line for TC|N| results
    const tcResults = {};
    let foundError = false;
    
    stdout.split('\n').forEach(line => {
      const trimmed = line.trim();
      // Match lines like: TC|1| [0, 1]
      const tcMatch = trimmed.match(/^TC\|(\d+)\|\s*(.+)$/);
      if (tcMatch) {
        tcResults[tcMatch[1]] = tcMatch[2].trim();
      }
      // Match error lines
      if (trimmed.startsWith('ERROR|')) {
        foundError = true;
      }
    });
    
    const hasError = foundError || (runResult.code !== 0 && Object.keys(tcResults).length === 0);
    
    let allPassed = true;
    const evaluatedTestCases = problem.testCases.map(tc => {
      const got = tcResults[String(tc.id)];
      let passed = false;
      
      if (got !== undefined) {
        // Compare ignoring minor spacing differences
        passed = got === tc.expected || got.replace(/\s/g, '') === tc.expected.replace(/\s/g, '');
      } else if (hasError) {
        // No result for this TC and there was an error
      }
      
      if (!passed) allPassed = false;
      
      return {
        input: tc.input,
        expected: tc.expected,
        output: got !== undefined ? got : (hasError ? (stderr || 'Runtime Error').split('\n')[0] : 'No output'),
        passed
      };
    });

    const verdict = allPassed && !hasError ? 'accepted' : 'wrong';
    
    lastSubmission = {
      id: 'sub-' + Date.now(),
      verdict,
      code,
      runtime: allPassed ? Math.floor(Math.random() * 50 + 20) + 'ms' : 'N/A',
      memory: allPassed ? '38.2 MB' : 'N/A',
      language,
      testCases: evaluatedTestCases,
      aiAnalysis: {
        overallScore: verdict === 'accepted' ? 14 : 75,
        behavioral: Math.floor(Math.random() * 100),
        codePattern: Math.floor(Math.random() * 100),
        styleFingerprint: Math.floor(Math.random() * 100),
        explainability: Math.floor(Math.random() * 100),
        flags: behaviorLog && behaviorLog.length > 10 ? [{ type: 'paste', message: 'Paste detected', time: '0:05' }] : [],
      },
      trustScoreImpact: verdict === 'accepted' ? +2 : -5,
    };

    return lastSubmission;
  },

  async getResults(id) {
    await delay(400);
    if (lastSubmission && lastSubmission.id === id) {
      return lastSubmission;
    }
    // Fallback if not found
    return {
      id, verdict: 'error', runtime: 'N/A', memory: 'N/A', language: 'Python', code: '',
      testCases: [], aiAnalysis: { overallScore: 0 }, trustScoreImpact: 0
    };
  },
};
