/**
 * Prisma DB Seed — CodeVerify Blind 75
 * 27 problems | Run: npm run db:seed
 */
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

const ALL_SLUGS = [
  "two-sum","longest-substring-without-repeating-characters",
  "best-time-to-buy-and-sell-stock","contains-duplicate",
  "product-of-array-except-self","maximum-subarray",
  "maximum-product-subarray","find-minimum-in-rotated-sorted-array",
  "search-in-rotated-sorted-array","container-with-most-water",
  "valid-parentheses","merge-intervals","jump-game","climbing-stairs",
  "coin-change","longest-common-subsequence","word-break",
  "house-robber","house-robber-ii","number-of-1-bits",
  "counting-bits","missing-number","binary-search",
  "palindromic-substrings","decode-ways","unique-paths","reverse-bits",
  "minimum-window-substring","median-of-two-sorted-arrays",
  "trapping-rain-water","first-missing-positive","word-search-ii",
];

// ── Runner Templates ──────────────────────────────────────────────────────────
const R = {
  arrInt:  f=>({python:`\nimport sys,json\n_a=json.loads(sys.stdin.read().strip())\nprint(${f}(_a))`,javascript:`\nconst _a=JSON.parse(require('fs').readFileSync(0,'utf-8').trim());console.log(${f}(_a));`}),
  arrBool: f=>({python:`\nimport sys,json\n_a=json.loads(sys.stdin.read().strip())\nprint(str(${f}(_a)).lower())`,javascript:`\nconst _a=JSON.parse(require('fs').readFileSync(0,'utf-8').trim());console.log(${f}(_a));`}),
  arrArr:  f=>({python:`\nimport sys,json\n_a=json.loads(sys.stdin.read().strip())\nprint(json.dumps(${f}(_a),separators=(',',':')))`,javascript:`\nconst _a=JSON.parse(require('fs').readFileSync(0,'utf-8').trim());console.log(JSON.stringify(${f}(_a)));`}),
  strInt:  f=>({python:`\nimport sys\n_s=sys.stdin.read().rstrip('\\r\\n')\nprint(${f}(_s))`,javascript:`\nconst _s=require('fs').readFileSync(0,'utf-8').replace(/\\r?\\n$/,'');console.log(${f}(_s));`}),
  strBool: f=>({python:`\nimport sys\n_s=sys.stdin.read().rstrip('\\r\\n')\nprint(str(${f}(_s)).lower())`,javascript:`\nconst _s=require('fs').readFileSync(0,'utf-8').replace(/\\r?\\n$/,'');console.log(${f}(_s));`}),
  intInt:  f=>({python:`\nimport sys\n_n=int(sys.stdin.read().strip())\nprint(${f}(_n))`,javascript:`\nconst _n=parseInt(require('fs').readFileSync(0,'utf-8').trim());console.log(${f}(_n));`}),
  intArr:  f=>({python:`\nimport sys,json\n_n=int(sys.stdin.read().strip())\nprint(json.dumps(${f}(_n),separators=(',',':')))`,javascript:`\nconst _n=parseInt(require('fs').readFileSync(0,'utf-8').trim());console.log(JSON.stringify(${f}(_n)));`}),
  aiInt:   f=>({python:`\nimport sys,json\n_l=sys.stdin.read().strip().split('\\n')\nprint(${f}(json.loads(_l[0]),int(_l[1])))`,javascript:`\nconst _l=require('fs').readFileSync(0,'utf-8').trim().split('\\n');\nconsole.log(${f}(JSON.parse(_l[0]),parseInt(_l[1])));`}),
  ssInt:   f=>({python:`\nimport sys\n_l=sys.stdin.read().rstrip('\\r\\n').split('\\n')\nprint(${f}(_l[0],_l[1]))`,javascript:`\nconst _l=require('fs').readFileSync(0,'utf-8').replace(/\\r?\\n$/,'').split('\\n');console.log(${f}(_l[0],_l[1]));`}),
  saBool:  f=>({python:`\nimport sys,json\n_l=sys.stdin.read().rstrip('\\r\\n').split('\\n')\nprint(str(${f}(_l[0],json.loads(_l[1]))).lower())`,javascript:`\nconst _l=require('fs').readFileSync(0,'utf-8').replace(/\\r?\\n$/,'').split('\\n');\nconsole.log(${f}(_l[0],JSON.parse(_l[1])));`}),
  iiInt:   f=>({python:`\nimport sys\n_l=sys.stdin.read().strip().split('\\n')\nprint(${f}(int(_l[0]),int(_l[1])))`,javascript:`\nconst _l=require('fs').readFileSync(0,'utf-8').trim().split('\\n');\nconsole.log(${f}(parseInt(_l[0]),parseInt(_l[1])));`}),
  arr2arr2:f=>({python:`\nimport sys,json\n_a=json.loads(sys.stdin.read().strip())\nprint(json.dumps(${f}(_a),separators=(',',':')))`,javascript:`\nconst _a=JSON.parse(require('fs').readFileSync(0,'utf-8').trim());console.log(JSON.stringify(${f}(_a)));`}),
  ssStr:   f=>({python:`\nimport sys\n_l=sys.stdin.read().rstrip('\\r\\n').split('\\n')\nprint(${f}(_l[0],_l[1]))`,javascript:`\nconst _l=require('fs').readFileSync(0,'utf-8').replace(/\\r?\\n$/,'').split('\\n');console.log(${f}(_l[0],_l[1]));`}),
  aaFloat: f=>({python:`\nimport sys,json\n_l=sys.stdin.read().rstrip('\\r\\n').split('\\n')\nprint(float(${f}(json.loads(_l[0]),json.loads(_l[1]))))`,javascript:`\nconst _l=require('fs').readFileSync(0,'utf-8').replace(/\\r?\\n$/,'').split('\\n');console.log(Number(${f}(JSON.parse(_l[0]),JSON.parse(_l[1]))).toFixed(5));`}),
  aaArr:   f=>({python:`\nimport sys,json\n_l=sys.stdin.read().rstrip('\\r\\n').split('\\n')\nres=${f}(json.loads(_l[0]),json.loads(_l[1]))\nif res is None: res=[]\nres.sort()\nprint(json.dumps(res,separators=(',',':')))`,javascript:`\nconst _l=require('fs').readFileSync(0,'utf-8').replace(/\\r?\\n$/,'').split('\\n');\nlet res=${f}(JSON.parse(_l[0]),JSON.parse(_l[1]))||[];res.sort();console.log(JSON.stringify(res));`}),
};

async function up(p) {
  const r = await prisma.problem.upsert({
    where:  { slug: p.slug },
    update: { starterCode:p.sc, codeRunner:p.cr, testCases:{ create:p.tc } },
    create: { title:p.title, slug:p.slug, description:p.desc, difficulty:p.diff,
      topics:p.topics, constraints:p.con, sampleInput:p.si, sampleOutput:p.so,
      timeLimit:p.tl||2000, memoryLimit:256, starterCode:p.sc, codeRunner:p.cr,
      testCases:{ create:p.tc } },
  });
  console.log(`✅  ${r.title}`);
  return r;
}

async function main() {
  console.log("🌱  Seeding CodeVerify …");
  const hash = await bcrypt.hash("Admin@1234", 12);
  const admin = await prisma.user.upsert({
    where:  { email:"admin@codeverify.dev" },
    update: {},
    create: { email:"admin@codeverify.dev", username:"admin", passwordHash:hash, trustScore:100, totalSolved:0 },
  });
  console.log(`✅  User: ${admin.username}`);

  await prisma.testCase.deleteMany({ where:{ problem:{ slug:{ in:ALL_SLUGS } } } });

  const probs = [];

  // ── 1. Two Sum ─────────────────────────────────────────────────────────────
  probs.push(await up({
    title:"Two Sum", slug:"two-sum", diff:"EASY", topics:["Array","Hash Table"],
    desc:"Given array `nums` and integer `target`, return indices of the two numbers that add up to target. Exactly one solution exists, and you may not use the same element twice.",
    con:"2 ≤ nums.length ≤ 10^4\n-10^9 ≤ nums[i] ≤ 10^9\n-10^9 ≤ target ≤ 10^9",
    si:"nums = [2,7,11,15], target = 9", so:"[0,1]",
    sc:{
      python:`def twoSum(nums, target):\n    # Write your solution here\n    pass`,
      javascript:`function twoSum(nums, target) {\n    // Write your solution here\n}`,
      java:`class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        return new int[]{};\n    }\n}`,
      cpp:`class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        return {};\n    }\n};`,
    },
    cr:{
      python:`\nimport sys,json\n_l=sys.stdin.read().strip().split('\\n')\nprint(json.dumps(twoSum(json.loads(_l[0]),int(_l[1])),separators=(',',':')))`,
      javascript:`\nconst _l=require('fs').readFileSync(0,'utf-8').trim().split('\\n');\nconsole.log(JSON.stringify(twoSum(JSON.parse(_l[0]),parseInt(_l[1]))));`,
    },
    tc:[
      {input:"[2,7,11,15]\n9",  output:"[0,1]", isHidden:false},
      {input:"[3,2,4]\n6",      output:"[1,2]", isHidden:true},
      {input:"[3,3]\n6",        output:"[0,1]", isHidden:true},
      {input:"[0,4,3,0]\n0",    output:"[0,3]", isHidden:true},
      {input:"[-1,-2,-3,-4,-5]\n-8", output:"[2,4]", isHidden:true},
      {input:"[1000000000,1000000000]\n2000000000", output:"[0,1]", isHidden:true},
    ],
  }));

  // ── 2. Longest Substring Without Repeating Characters ─────────────────────
  probs.push(await up({
    title:"Longest Substring Without Repeating Characters",
    slug:"longest-substring-without-repeating-characters", diff:"MEDIUM",
    topics:["String","Sliding Window","Hash Table"],
    desc:"Given string `s`, find the length of the longest substring without repeating characters.",
    con:"0 ≤ s.length ≤ 5*10^4\ns consists of English letters, digits, symbols and spaces.",
    si:'s = "abcabcbb"', so:"3",
    sc:{
      python:`def lengthOfLongestSubstring(s):\n    # Write your solution here\n    pass`,
      javascript:`function lengthOfLongestSubstring(s) {\n    // Write your solution here\n}`,
      java:`class Solution {\n    public int lengthOfLongestSubstring(String s) {\n        return 0;\n    }\n}`,
      cpp:`class Solution {\npublic:\n    int lengthOfLongestSubstring(string s) {\n        return 0;\n    }\n};`,
    },
    cr:R.strInt("lengthOfLongestSubstring"),
    tc:[
      {input:"abcabcbb", output:"3", isHidden:false},
      {input:"bbbbb",    output:"1", isHidden:true},
      {input:"pwwkew",   output:"3", isHidden:true},
      {input:" ",        output:"1", isHidden:true},
      {input:"dvdf",     output:"3", isHidden:true},
      {input:"abcdefghijklmnopqrstuvwxyz", output:"26", isHidden:true},
    ],
  }));

  // ── 3. Best Time to Buy and Sell Stock ────────────────────────────────────
  probs.push(await up({
    title:"Best Time to Buy and Sell Stock",
    slug:"best-time-to-buy-and-sell-stock", diff:"EASY",
    topics:["Array","Dynamic Programming","Greedy"],
    desc:"Given an array `prices` where `prices[i]` is the stock price on day i, return the maximum profit from a single buy-sell transaction. Return 0 if no profit is possible.",
    con:"1 ≤ prices.length ≤ 10^5\n0 ≤ prices[i] ≤ 10^4",
    si:"prices = [7,1,5,3,6,4]", so:"5",
    sc:{
      python:`def maxProfit(prices):\n    # Write your solution here\n    pass`,
      javascript:`function maxProfit(prices) {\n    // Write your solution here\n}`,
      java:`class Solution {\n    public int maxProfit(int[] prices) {\n        return 0;\n    }\n}`,
      cpp:`class Solution {\npublic:\n    int maxProfit(vector<int>& prices) {\n        return 0;\n    }\n};`,
    },
    cr:R.arrInt("maxProfit"),
    tc:[
      {input:"[7,1,5,3,6,4]", output:"5", isHidden:false},
      {input:"[7,6,4,3,1]",   output:"0", isHidden:true},
      {input:"[1,2]",          output:"1", isHidden:true},
      {input:"[3,3]",          output:"0", isHidden:true},
      {input:"[1,2,3,4,5]",   output:"4", isHidden:true},
      {input:"[2,4,1]",        output:"2", isHidden:true},
    ],
  }));

  // ── 4. Contains Duplicate ─────────────────────────────────────────────────
  probs.push(await up({
    title:"Contains Duplicate", slug:"contains-duplicate", diff:"EASY",
    topics:["Array","Hash Table","Sorting"],
    desc:"Given integer array `nums`, return `true` if any value appears at least twice in the array, and `false` if every element is distinct.",
    con:"1 ≤ nums.length ≤ 10^5\n-10^9 ≤ nums[i] ≤ 10^9",
    si:"nums = [1,2,3,1]", so:"true",
    sc:{
      python:`def containsDuplicate(nums):\n    # Write your solution here\n    pass`,
      javascript:`function containsDuplicate(nums) {\n    // Write your solution here\n}`,
      java:`class Solution {\n    public boolean containsDuplicate(int[] nums) {\n        return false;\n    }\n}`,
      cpp:`class Solution {\npublic:\n    bool containsDuplicate(vector<int>& nums) {\n        return false;\n    }\n};`,
    },
    cr:R.arrBool("containsDuplicate"),
    tc:[
      {input:"[1,2,3,1]",               output:"true",  isHidden:false},
      {input:"[1,2,3,4]",               output:"false", isHidden:true},
      {input:"[1,1,1,3,3,4,3,2,4,2]",  output:"true",  isHidden:true},
      {input:"[0]",                      output:"false", isHidden:true},
      {input:"[-1,-2,-3,-1]",           output:"true",  isHidden:true},
    ],
  }));

  // ── 5. Product of Array Except Self ───────────────────────────────────────
  probs.push(await up({
    title:"Product of Array Except Self", slug:"product-of-array-except-self", diff:"MEDIUM",
    topics:["Array","Prefix Sum"],
    desc:"Return array `answer` where `answer[i]` is the product of all elements of `nums` except `nums[i]`. Must run in O(n) time without using the division operation.",
    con:"2 ≤ nums.length ≤ 10^5\n-30 ≤ nums[i] ≤ 30\nThe product of any prefix or suffix fits in a 32-bit integer.",
    si:"nums = [1,2,3,4]", so:"[24,12,8,6]",
    sc:{
      python:`def productExceptSelf(nums):\n    # Write your solution here\n    pass`,
      javascript:`function productExceptSelf(nums) {\n    // Write your solution here\n}`,
      java:`class Solution {\n    public int[] productExceptSelf(int[] nums) {\n        return new int[]{};\n    }\n}`,
      cpp:`class Solution {\npublic:\n    vector<int> productExceptSelf(vector<int>& nums) {\n        return {};\n    }\n};`,
    },
    cr:R.arrArr("productExceptSelf"),
    tc:[
      {input:"[1,2,3,4]",    output:"[24,12,8,6]",  isHidden:false},
      {input:"[-1,1,0,-3,3]",output:"[0,0,9,0,0]",  isHidden:true},
      {input:"[1,1]",         output:"[1,1]",         isHidden:true},
      {input:"[2,3,4]",       output:"[12,8,6]",      isHidden:true},
      {input:"[-1,-2,-3,-4]", output:"[-24,12,-8,6]", isHidden:true},
    ],
  }));

  // ── 6. Maximum Subarray ───────────────────────────────────────────────────
  probs.push(await up({
    title:"Maximum Subarray", slug:"maximum-subarray", diff:"MEDIUM",
    topics:["Array","Dynamic Programming","Divide and Conquer"],
    desc:"Given integer array `nums`, find the subarray with the largest sum and return its sum.",
    con:"1 ≤ nums.length ≤ 10^5\n-10^4 ≤ nums[i] ≤ 10^4",
    si:"nums = [-2,1,-3,4,-1,2,1,-5,4]", so:"6",
    sc:{
      python:`def maxSubArray(nums):\n    # Write your solution here\n    pass`,
      javascript:`function maxSubArray(nums) {\n    // Write your solution here\n}`,
      java:`class Solution {\n    public int maxSubArray(int[] nums) {\n        return 0;\n    }\n}`,
      cpp:`class Solution {\npublic:\n    int maxSubArray(vector<int>& nums) {\n        return 0;\n    }\n};`,
    },
    cr:R.arrInt("maxSubArray"),
    tc:[
      {input:"[-2,1,-3,4,-1,2,1,-5,4]", output:"6",  isHidden:false},
      {input:"[1]",                       output:"1",  isHidden:true},
      {input:"[5,4,-1,7,8]",             output:"23", isHidden:true},
      {input:"[-1]",                      output:"-1", isHidden:true},
      {input:"[-2,-1]",                   output:"-1", isHidden:true},
    ],
  }));

  // ── 7. Maximum Product Subarray ───────────────────────────────────────────
  probs.push(await up({
    title:"Maximum Product Subarray", slug:"maximum-product-subarray", diff:"MEDIUM",
    topics:["Array","Dynamic Programming"],
    desc:"Given integer array `nums`, find a contiguous subarray that has the largest product and return that product.",
    con:"1 ≤ nums.length ≤ 2*10^4\n-10 ≤ nums[i] ≤ 10",
    si:"nums = [2,3,-2,4]", so:"6",
    sc:{
      python:`def maxProduct(nums):\n    # Write your solution here\n    pass`,
      javascript:`function maxProduct(nums) {\n    // Write your solution here\n}`,
      java:`class Solution {\n    public int maxProduct(int[] nums) {\n        return 0;\n    }\n}`,
      cpp:`class Solution {\npublic:\n    int maxProduct(vector<int>& nums) {\n        return 0;\n    }\n};`,
    },
    cr:R.arrInt("maxProduct"),
    tc:[
      {input:"[2,3,-2,4]",    output:"6",  isHidden:false},
      {input:"[-2,0,-1]",      output:"0",  isHidden:true},
      {input:"[-2]",            output:"-2", isHidden:true},
      {input:"[2,-5,-2,-4,3]", output:"24", isHidden:true},
      {input:"[3,-1,4]",       output:"4",  isHidden:true},
    ],
  }));

  // ── 8. Find Minimum in Rotated Sorted Array ───────────────────────────────
  probs.push(await up({
    title:"Find Minimum in Rotated Sorted Array",
    slug:"find-minimum-in-rotated-sorted-array", diff:"MEDIUM",
    topics:["Array","Binary Search"],
    desc:"Given sorted array `nums` rotated between 1 and n times, return the minimum element. Must run in O(log n) time.",
    con:"n == nums.length\n1 ≤ n ≤ 5000\n-5000 ≤ nums[i] ≤ 5000\nAll integers are unique.",
    si:"nums = [3,4,5,1,2]", so:"1",
    sc:{
      python:`def findMin(nums):\n    # Write your solution here\n    pass`,
      javascript:`function findMin(nums) {\n    // Write your solution here\n}`,
      java:`class Solution {\n    public int findMin(int[] nums) {\n        return 0;\n    }\n}`,
      cpp:`class Solution {\npublic:\n    int findMin(vector<int>& nums) {\n        return 0;\n    }\n};`,
    },
    cr:R.arrInt("findMin"),
    tc:[
      {input:"[3,4,5,1,2]",       output:"1",  isHidden:false},
      {input:"[4,5,6,7,0,1,2]",   output:"0",  isHidden:true},
      {input:"[11,13,15,17]",      output:"11", isHidden:true},
      {input:"[2,1]",               output:"1",  isHidden:true},
      {input:"[5,1,2,3,4]",        output:"1",  isHidden:true},
    ],
  }));

  // ── 9. Search in Rotated Sorted Array ────────────────────────────────────
  probs.push(await up({
    title:"Search in Rotated Sorted Array",
    slug:"search-in-rotated-sorted-array", diff:"MEDIUM",
    topics:["Array","Binary Search"],
    desc:"Given rotated sorted array `nums` with unique values and integer `target`, return the index of target or -1 if not found. Must run in O(log n) time.",
    con:"1 ≤ nums.length ≤ 5000\n-10^4 ≤ nums[i] ≤ 10^4\nAll values are unique.",
    si:"nums = [4,5,6,7,0,1,2], target = 0", so:"4",
    sc:{
      python:`def search(nums, target):\n    # Write your solution here\n    pass`,
      javascript:`function search(nums, target) {\n    // Write your solution here\n}`,
      java:`class Solution {\n    public int search(int[] nums, int target) {\n        return -1;\n    }\n}`,
      cpp:`class Solution {\npublic:\n    int search(vector<int>& nums, int target) {\n        return -1;\n    }\n};`,
    },
    cr:R.aiInt("search"),
    tc:[
      {input:"[4,5,6,7,0,1,2]\n0", output:"4",  isHidden:false},
      {input:"[4,5,6,7,0,1,2]\n3", output:"-1", isHidden:true},
      {input:"[1]\n0",              output:"-1", isHidden:true},
      {input:"[1,3]\n3",            output:"1",  isHidden:true},
      {input:"[5,1,2,3,4]\n1",     output:"1",  isHidden:true},
      {input:"[1,3,5]\n5",          output:"2",  isHidden:true},
    ],
  }));

  // ── 10. Container With Most Water ─────────────────────────────────────────
  probs.push(await up({
    title:"Container With Most Water", slug:"container-with-most-water", diff:"MEDIUM",
    topics:["Array","Two Pointers","Greedy"],
    desc:"Given integer array `height` of length n, find two lines that form a container that holds the most water. Return the maximum amount of water the container can store.",
    con:"n == height.length\n2 ≤ n ≤ 10^5\n0 ≤ height[i] ≤ 10^4",
    si:"height = [1,8,6,2,5,4,8,3,7]", so:"49",
    sc:{
      python:`def maxArea(height):\n    # Write your solution here\n    pass`,
      javascript:`function maxArea(height) {\n    // Write your solution here\n}`,
      java:`class Solution {\n    public int maxArea(int[] height) {\n        return 0;\n    }\n}`,
      cpp:`class Solution {\npublic:\n    int maxArea(vector<int>& height) {\n        return 0;\n    }\n};`,
    },
    cr:R.arrInt("maxArea"),
    tc:[
      {input:"[1,8,6,2,5,4,8,3,7]", output:"49", isHidden:false},
      {input:"[1,1]",                output:"1",  isHidden:true},
      {input:"[4,3,2,1,4]",          output:"16", isHidden:true},
      {input:"[1,2,1]",              output:"2",  isHidden:true},
      {input:"[2,3,4,5,18,17,6]",   output:"17", isHidden:true},
    ],
  }));

  // ── 11. Valid Parentheses ─────────────────────────────────────────────────
  probs.push(await up({
    title:"Valid Parentheses", slug:"valid-parentheses", diff:"EASY",
    topics:["String","Stack"],
    desc:"Given string `s` containing only '(', ')', '{', '}', '[' and ']', determine if the input string is valid. Brackets must close in the correct order.",
    con:"1 ≤ s.length ≤ 10^4\ns consists of parentheses only '()[]{}'.",
    si:'s = "()"', so:"true",
    sc:{
      python:`def isValid(s):\n    # Write your solution here\n    pass`,
      javascript:`function isValid(s) {\n    // Write your solution here\n}`,
      java:`class Solution {\n    public boolean isValid(String s) {\n        return false;\n    }\n}`,
      cpp:`class Solution {\npublic:\n    bool isValid(string s) {\n        return false;\n    }\n};`,
    },
    cr:R.strBool("isValid"),
    tc:[
      {input:"()",      output:"true",  isHidden:false},
      {input:"()[]{}", output:"true",  isHidden:true},
      {input:"(]",      output:"false", isHidden:true},
      {input:"([)]",    output:"false", isHidden:true},
      {input:"{[]}",    output:"true",  isHidden:true},
      {input:"(",        output:"false", isHidden:true},
    ],
  }));

  // ── 12. Merge Intervals ───────────────────────────────────────────────────
  probs.push(await up({
    title:"Merge Intervals", slug:"merge-intervals", diff:"MEDIUM",
    topics:["Array","Sorting"],
    desc:"Given array of `intervals` where `intervals[i] = [starti, endi]`, merge all overlapping intervals and return an array of non-overlapping intervals.",
    con:"1 ≤ intervals.length ≤ 10^4\nintervals[i].length == 2\n0 ≤ starti ≤ endi ≤ 10^4",
    si:"intervals = [[1,3],[2,6],[8,10],[15,18]]", so:"[[1,6],[8,10],[15,18]]",
    sc:{
      python:`def merge(intervals):\n    # Write your solution here\n    pass`,
      javascript:`function merge(intervals) {\n    // Write your solution here\n}`,
      java:`class Solution {\n    public int[][] merge(int[][] intervals) {\n        return new int[][]{};\n    }\n}`,
      cpp:`class Solution {\npublic:\n    vector<vector<int>> merge(vector<vector<int>>& intervals) {\n        return {};\n    }\n};`,
    },
    cr:R.arr2arr2("merge"),
    tc:[
      {input:"[[1,3],[2,6],[8,10],[15,18]]", output:"[[1,6],[8,10],[15,18]]", isHidden:false},
      {input:"[[1,4],[4,5]]",                 output:"[[1,5]]",               isHidden:true},
      {input:"[[1,4],[2,3]]",                 output:"[[1,4]]",               isHidden:true},
      {input:"[[1,4]]",                        output:"[[1,4]]",               isHidden:true},
      {input:"[[2,3],[4,5],[6,7],[8,9]]",     output:"[[2,3],[4,5],[6,7],[8,9]]", isHidden:true},
    ],
  }));

  // ── 13. Jump Game ─────────────────────────────────────────────────────────
  probs.push(await up({
    title:"Jump Game", slug:"jump-game", diff:"MEDIUM",
    topics:["Array","Dynamic Programming","Greedy"],
    desc:"Given integer array `nums` where `nums[i]` is the maximum jump length from index i, return `true` if you can reach the last index starting from index 0.",
    con:"1 ≤ nums.length ≤ 10^4\n0 ≤ nums[i] ≤ 10^5",
    si:"nums = [2,3,1,1,4]", so:"true",
    sc:{
      python:`def canJump(nums):\n    # Write your solution here\n    pass`,
      javascript:`function canJump(nums) {\n    // Write your solution here\n}`,
      java:`class Solution {\n    public boolean canJump(int[] nums) {\n        return false;\n    }\n}`,
      cpp:`class Solution {\npublic:\n    bool canJump(vector<int>& nums) {\n        return false;\n    }\n};`,
    },
    cr:R.arrBool("canJump"),
    tc:[
      {input:"[2,3,1,1,4]",   output:"true",  isHidden:false},
      {input:"[3,2,1,0,4]",   output:"false", isHidden:true},
      {input:"[1]",             output:"true",  isHidden:true},
      {input:"[0]",             output:"true",  isHidden:true},
      {input:"[0,2,3]",        output:"false", isHidden:true},
      {input:"[2,0,0]",        output:"true",  isHidden:true},
    ],
  }));

  // ── 14. Climbing Stairs ───────────────────────────────────────────────────
  probs.push(await up({
    title:"Climbing Stairs", slug:"climbing-stairs", diff:"EASY",
    topics:["Math","Dynamic Programming","Memoization"],
    desc:"You are climbing a staircase with `n` steps. Each time you can climb 1 or 2 steps. In how many distinct ways can you climb to the top?",
    con:"1 ≤ n ≤ 45",
    si:"n = 2", so:"2",
    sc:{
      python:`def climbStairs(n):\n    # Write your solution here\n    pass`,
      javascript:`function climbStairs(n) {\n    // Write your solution here\n}`,
      java:`class Solution {\n    public int climbStairs(int n) {\n        return 0;\n    }\n}`,
      cpp:`class Solution {\npublic:\n    int climbStairs(int n) {\n        return 0;\n    }\n};`,
    },
    cr:R.intInt("climbStairs"),
    tc:[
      {input:"2",  output:"2",          isHidden:false},
      {input:"3",  output:"3",          isHidden:true},
      {input:"1",  output:"1",          isHidden:true},
      {input:"5",  output:"8",          isHidden:true},
      {input:"10", output:"89",         isHidden:true},
      {input:"45", output:"1836311903", isHidden:true},
    ],
  }));

  // ── 15. Coin Change ───────────────────────────────────────────────────────
  probs.push(await up({
    title:"Coin Change", slug:"coin-change", diff:"MEDIUM",
    topics:["Array","Dynamic Programming","Breadth-First Search"],
    desc:"Given coins of different denominations and a total `amount`, return the fewest number of coins needed to make up that amount. Return -1 if it cannot be made up.",
    con:"1 ≤ coins.length ≤ 12\n1 ≤ coins[i] ≤ 2^31-1\n0 ≤ amount ≤ 10^4",
    si:"coins = [1,2,5], amount = 11", so:"3",
    sc:{
      python:`def coinChange(coins, amount):\n    # Write your solution here\n    pass`,
      javascript:`function coinChange(coins, amount) {\n    // Write your solution here\n}`,
      java:`class Solution {\n    public int coinChange(int[] coins, int amount) {\n        return -1;\n    }\n}`,
      cpp:`class Solution {\npublic:\n    int coinChange(vector<int>& coins, int amount) {\n        return -1;\n    }\n};`,
    },
    cr:R.aiInt("coinChange"),
    tc:[
      {input:"[1,2,5]\n11",      output:"3",  isHidden:false},
      {input:"[2]\n3",            output:"-1", isHidden:true},
      {input:"[1]\n0",            output:"0",  isHidden:true},
      {input:"[1]\n2",            output:"2",  isHidden:true},
      {input:"[1,5,10,25]\n30",  output:"2",  isHidden:true},
      {input:"[1,5,10,25]\n41",  output:"4",  isHidden:true},
    ],
  }));

  // ── 16. Longest Common Subsequence ───────────────────────────────────────
  probs.push(await up({
    title:"Longest Common Subsequence", slug:"longest-common-subsequence", diff:"MEDIUM",
    topics:["String","Dynamic Programming"],
    desc:"Given two strings `text1` and `text2`, return the length of their longest common subsequence. A subsequence is a sequence derived by deleting some elements without changing the order.",
    con:"1 ≤ text1.length, text2.length ≤ 1000\ntext1 and text2 consist of only lowercase English characters.",
    si:'text1 = "abcde", text2 = "ace"', so:"3",
    sc:{
      python:`def longestCommonSubsequence(text1, text2):\n    # Write your solution here\n    pass`,
      javascript:`function longestCommonSubsequence(text1, text2) {\n    // Write your solution here\n}`,
      java:`class Solution {\n    public int longestCommonSubsequence(String text1, String text2) {\n        return 0;\n    }\n}`,
      cpp:`class Solution {\npublic:\n    int longestCommonSubsequence(string text1, string text2) {\n        return 0;\n    }\n};`,
    },
    cr:R.ssInt("longestCommonSubsequence"),
    tc:[
      {input:"abcde\nace",   output:"3", isHidden:false},
      {input:"abc\nabc",     output:"3", isHidden:true},
      {input:"abc\ndef",     output:"0", isHidden:true},
      {input:"bl\nyby",      output:"1", isHidden:true},
      {input:"oxcpqrsvwf\nwlockf", output:"3", isHidden:true},
    ],
  }));

  // ── 17. Word Break ────────────────────────────────────────────────────────
  probs.push(await up({
    title:"Word Break", slug:"word-break", diff:"MEDIUM",
    topics:["Hash Table","String","Dynamic Programming","Trie","Memoization"],
    desc:"Given string `s` and dictionary `wordDict`, return `true` if `s` can be segmented into space-separated sequence of words from the dictionary.",
    con:"1 ≤ s.length ≤ 300\n1 ≤ wordDict.length ≤ 1000\n1 ≤ wordDict[i].length ≤ 20",
    si:'s = "leetcode", wordDict = ["leet","code"]', so:"true",
    sc:{
      python:`def wordBreak(s, wordDict):\n    # Write your solution here\n    pass`,
      javascript:`function wordBreak(s, wordDict) {\n    // Write your solution here\n}`,
      java:`class Solution {\n    public boolean wordBreak(String s, List<String> wordDict) {\n        return false;\n    }\n}`,
      cpp:`class Solution {\npublic:\n    bool wordBreak(string s, vector<string>& wordDict) {\n        return false;\n    }\n};`,
    },
    cr:R.saBool("wordBreak"),
    tc:[
      {input:'leetcode\n["leet","code"]',             output:"true",  isHidden:false},
      {input:'applepenapple\n["apple","pen"]',         output:"true",  isHidden:true},
      {input:'catsandog\n["cats","dog","sand","and","cat"]', output:"false", isHidden:true},
      {input:'cars\n["car","ca","rs"]',                output:"true",  isHidden:true},
      {input:'a\n["a"]',                               output:"true",  isHidden:true},
    ],
  }));

  // ── 18. House Robber ──────────────────────────────────────────────────────
  probs.push(await up({
    title:"House Robber", slug:"house-robber", diff:"MEDIUM",
    topics:["Array","Dynamic Programming"],
    desc:"You are a robber planning to rob houses along a street. Adjacent houses have alarms — you cannot rob two adjacent houses. Given `nums` array of non-negative integers, return the maximum amount of money you can rob tonight.",
    con:"1 ≤ nums.length ≤ 100\n0 ≤ nums[i] ≤ 400",
    si:"nums = [1,2,3,1]", so:"4",
    sc:{
      python:`def rob(nums):\n    # Write your solution here\n    pass`,
      javascript:`function rob(nums) {\n    // Write your solution here\n}`,
      java:`class Solution {\n    public int rob(int[] nums) {\n        return 0;\n    }\n}`,
      cpp:`class Solution {\npublic:\n    int rob(vector<int>& nums) {\n        return 0;\n    }\n};`,
    },
    cr:R.arrInt("rob"),
    tc:[
      {input:"[1,2,3,1]",          output:"4",  isHidden:false},
      {input:"[2,7,9,3,1]",        output:"12", isHidden:true},
      {input:"[2,1]",               output:"2",  isHidden:true},
      {input:"[1,2,3]",            output:"4",  isHidden:true},
      {input:"[1,2,3,4,5,6,7,8,9,10]", output:"30", isHidden:true},
    ],
  }));

  // ── 19. House Robber II ───────────────────────────────────────────────────
  probs.push(await up({
    title:"House Robber II", slug:"house-robber-ii", diff:"MEDIUM",
    topics:["Array","Dynamic Programming"],
    desc:"Houses are arranged in a circle. You cannot rob adjacent houses, and the first and last house are adjacent. Return the maximum amount you can rob.",
    con:"1 ≤ nums.length ≤ 100\n0 ≤ nums[i] ≤ 1000",
    si:"nums = [2,3,2]", so:"3",
    sc:{
      python:`def rob(nums):\n    # Write your solution here\n    pass`,
      javascript:`function rob(nums) {\n    // Write your solution here\n}`,
      java:`class Solution {\n    public int rob(int[] nums) {\n        return 0;\n    }\n}`,
      cpp:`class Solution {\npublic:\n    int rob(vector<int>& nums) {\n        return 0;\n    }\n};`,
    },
    cr:R.arrInt("rob"),
    tc:[
      {input:"[2,3,2]",   output:"3", isHidden:false},
      {input:"[1,2,3,1]", output:"4", isHidden:true},
      {input:"[1]",        output:"1", isHidden:true},
      {input:"[1,2]",      output:"2", isHidden:true},
      {input:"[1,2,3]",   output:"3", isHidden:true},
    ],
  }));

  // ── 20. Number of 1 Bits ─────────────────────────────────────────────────
  probs.push(await up({
    title:"Number of 1 Bits", slug:"number-of-1-bits", diff:"EASY",
    topics:["Divide and Conquer","Bit Manipulation"],
    desc:"Given a positive integer `n`, return the number of set bits (1s) in its binary representation (also known as the Hamming weight).",
    con:"1 ≤ n ≤ 2^31 - 1",
    si:"n = 11", so:"3",
    sc:{
      python:`def hammingWeight(n):\n    # Write your solution here\n    pass`,
      javascript:`function hammingWeight(n) {\n    // Write your solution here\n}`,
      java:`class Solution {\n    public int hammingWeight(int n) {\n        return 0;\n    }\n}`,
      cpp:`class Solution {\npublic:\n    int hammingWeight(uint32_t n) {\n        return 0;\n    }\n};`,
    },
    cr:R.intInt("hammingWeight"),
    tc:[
      {input:"11",          output:"3",  isHidden:false},
      {input:"128",         output:"1",  isHidden:true},
      {input:"0",           output:"0",  isHidden:true},
      {input:"1",           output:"1",  isHidden:true},
      {input:"2147483647",  output:"31", isHidden:true},
    ],
  }));

  // ── 21. Counting Bits ─────────────────────────────────────────────────────
  probs.push(await up({
    title:"Counting Bits", slug:"counting-bits", diff:"EASY",
    topics:["Dynamic Programming","Bit Manipulation"],
    desc:"Given integer `n`, return array `ans` of length n+1 where `ans[i]` is the number of 1's in the binary representation of i.",
    con:"0 ≤ n ≤ 10^5",
    si:"n = 2", so:"[0,1,1]",
    sc:{
      python:`def countBits(n):\n    # Write your solution here\n    pass`,
      javascript:`function countBits(n) {\n    // Write your solution here\n}`,
      java:`class Solution {\n    public int[] countBits(int n) {\n        return new int[]{};\n    }\n}`,
      cpp:`class Solution {\npublic:\n    vector<int> countBits(int n) {\n        return {};\n    }\n};`,
    },
    cr:R.intArr("countBits"),
    tc:[
      {input:"2",  output:"[0,1,1]",       isHidden:false},
      {input:"5",  output:"[0,1,1,2,1,2]", isHidden:true},
      {input:"0",  output:"[0]",            isHidden:true},
      {input:"1",  output:"[0,1]",          isHidden:true},
      {input:"7",  output:"[0,1,1,2,1,2,2,3]", isHidden:true},
    ],
  }));

  // ── 22. Missing Number ────────────────────────────────────────────────────
  probs.push(await up({
    title:"Missing Number", slug:"missing-number", diff:"EASY",
    topics:["Array","Hash Table","Math","Binary Search","Bit Manipulation","Sorting"],
    desc:"Given array `nums` containing n distinct numbers in range [0, n], return the only number in the range that is missing from the array.",
    con:"n == nums.length\n1 ≤ n ≤ 10^4\n0 ≤ nums[i] ≤ n\nAll numbers are unique.",
    si:"nums = [3,0,1]", so:"2",
    sc:{
      python:`def missingNumber(nums):\n    # Write your solution here\n    pass`,
      javascript:`function missingNumber(nums) {\n    // Write your solution here\n}`,
      java:`class Solution {\n    public int missingNumber(int[] nums) {\n        return -1;\n    }\n}`,
      cpp:`class Solution {\npublic:\n    int missingNumber(vector<int>& nums) {\n        return -1;\n    }\n};`,
    },
    cr:R.arrInt("missingNumber"),
    tc:[
      {input:"[3,0,1]",           output:"2", isHidden:false},
      {input:"[0,1]",              output:"2", isHidden:true},
      {input:"[9,6,4,2,3,5,7,0,1]", output:"8", isHidden:true},
      {input:"[0]",                output:"1", isHidden:true},
      {input:"[1]",                output:"0", isHidden:true},
    ],
  }));

  // ── 23. Binary Search ────────────────────────────────────────────────────
  probs.push(await up({
    title:"Binary Search", slug:"binary-search", diff:"EASY",
    topics:["Array","Binary Search"],
    desc:"Given sorted array of integers `nums` in ascending order and integer `target`, return the index of target. If target doesn't exist, return -1. Must run in O(log n) time.",
    con:"1 ≤ nums.length ≤ 10^4\n-10^4 < nums[i], target < 10^4\nAll values in nums are unique.",
    si:"nums = [-1,0,3,5,9,12], target = 9", so:"4",
    sc:{
      python:`def search(nums, target):\n    # Write your solution here\n    pass`,
      javascript:`function search(nums, target) {\n    // Write your solution here\n}`,
      java:`class Solution {\n    public int search(int[] nums, int target) {\n        return -1;\n    }\n}`,
      cpp:`class Solution {\npublic:\n    int search(vector<int>& nums, int target) {\n        return -1;\n    }\n};`,
    },
    cr:R.aiInt("search"),
    tc:[
      {input:"[-1,0,3,5,9,12]\n9",  output:"4",  isHidden:false},
      {input:"[-1,0,3,5,9,12]\n2",  output:"-1", isHidden:true},
      {input:"[5]\n5",               output:"0",  isHidden:true},
      {input:"[1,3,5,7,9]\n1",      output:"0",  isHidden:true},
      {input:"[1,3,5,7,9]\n9",      output:"4",  isHidden:true},
      {input:"[1,3,5,7,9]\n5",      output:"2",  isHidden:true},
    ],
  }));

  // ── 24. Palindromic Substrings ────────────────────────────────────────────
  probs.push(await up({
    title:"Palindromic Substrings", slug:"palindromic-substrings", diff:"MEDIUM",
    topics:["String","Dynamic Programming"],
    desc:"Given string `s`, return the number of palindromic substrings in it. A substring is a contiguous sequence of characters within the string.",
    con:"1 ≤ s.length ≤ 1000\ns consists of lowercase English letters.",
    si:'s = "abc"', so:"3",
    sc:{
      python:`def countSubstrings(s):\n    # Write your solution here\n    pass`,
      javascript:`function countSubstrings(s) {\n    // Write your solution here\n}`,
      java:`class Solution {\n    public int countSubstrings(String s) {\n        return 0;\n    }\n}`,
      cpp:`class Solution {\npublic:\n    int countSubstrings(string s) {\n        return 0;\n    }\n};`,
    },
    cr:R.strInt("countSubstrings"),
    tc:[
      {input:"abc",     output:"3",  isHidden:false},
      {input:"aaa",     output:"6",  isHidden:true},
      {input:"racecar", output:"10", isHidden:true},
      {input:"a",       output:"1",  isHidden:true},
      {input:"abba",    output:"6",  isHidden:true},
    ],
  }));

  // ── 25. Decode Ways ───────────────────────────────────────────────────────
  probs.push(await up({
    title:"Decode Ways", slug:"decode-ways", diff:"MEDIUM",
    topics:["String","Dynamic Programming"],
    desc:"A message is encoded where 'A'=1, 'B'=2, ..., 'Z'=26. Given string `s` of digits, return the number of ways to decode it.",
    con:"1 ≤ s.length ≤ 100\ns contains only digits and may contain leading zeros.",
    si:'s = "12"', so:"2",
    sc:{
      python:`def numDecodings(s):\n    # Write your solution here\n    pass`,
      javascript:`function numDecodings(s) {\n    // Write your solution here\n}`,
      java:`class Solution {\n    public int numDecodings(String s) {\n        return 0;\n    }\n}`,
      cpp:`class Solution {\npublic:\n    int numDecodings(string s) {\n        return 0;\n    }\n};`,
    },
    cr:R.strInt("numDecodings"),
    tc:[
      {input:"12",   output:"2", isHidden:false},
      {input:"226",  output:"3", isHidden:true},
      {input:"06",   output:"0", isHidden:true},
      {input:"0",    output:"0", isHidden:true},
      {input:"11106",output:"2", isHidden:true},
    ],
  }));

  // ── 26. Unique Paths ─────────────────────────────────────────────────────
  probs.push(await up({
    title:"Unique Paths", slug:"unique-paths", diff:"MEDIUM",
    topics:["Math","Dynamic Programming","Combinatorics"],
    desc:"A robot starts at top-left of an m x n grid and wants to reach bottom-right. It can only move right or down. How many unique paths are there?",
    con:"1 ≤ m, n ≤ 100",
    si:"m = 3, n = 7", so:"28",
    sc:{
      python:`def uniquePaths(m, n):\n    # Write your solution here\n    pass`,
      javascript:`function uniquePaths(m, n) {\n    // Write your solution here\n}`,
      java:`class Solution {\n    public int uniquePaths(int m, int n) {\n        return 0;\n    }\n}`,
      cpp:`class Solution {\npublic:\n    int uniquePaths(int m, int n) {\n        return 0;\n    }\n};`,
    },
    cr:R.iiInt("uniquePaths"),
    tc:[
      {input:"3\n7",  output:"28", isHidden:false},
      {input:"3\n2",  output:"3",  isHidden:true},
      {input:"7\n3",  output:"28", isHidden:true},
      {input:"1\n1",  output:"1",  isHidden:true},
      {input:"10\n10",output:"48620", isHidden:true},
    ],
  }));

  // ── 27. Reverse Bits ─────────────────────────────────────────────────────
  probs.push(await up({
    title:"Reverse Bits", slug:"reverse-bits", diff:"EASY",
    topics:["Divide and Conquer","Bit Manipulation"],
    desc:"Reverse the bits of a given 32-bit unsigned integer and return the result as an unsigned integer.",
    con:"The input must be a binary string of length 32 (but here given as a decimal integer).",
    si:"n = 43261596", so:"964176192",
    sc:{
      python:`def reverseBits(n):\n    # Write your solution here\n    pass`,
      javascript:`function reverseBits(n) {\n    // Write your solution here\n}`,
      java:`class Solution {\n    public int reverseBits(int n) {\n        return 0;\n    }\n}`,
      cpp:`class Solution {\npublic:\n    uint32_t reverseBits(uint32_t n) {\n        return 0;\n    }\n};`,
    },
    cr:R.intInt("reverseBits"),
    tc:[
      {input:"43261596",   output:"964176192",  isHidden:false},
      {input:"4294967293", output:"3221225471", isHidden:true},
      {input:"0",           output:"0",          isHidden:true},
      {input:"1",           output:"2147483648", isHidden:true},
      {input:"2147483648",  output:"1",          isHidden:true},
    ],
  }));


  // ── 28. Minimum Window Substring ───────────────────────────────────────────
  probs.push(await up({
    title:"Minimum Window Substring", slug:"minimum-window-substring", diff:"HARD",
    topics:["Hash Table","String","Sliding Window"],
    desc:"Given two strings `s` and `t`, return the minimum window substring of `s` such that every character in `t` (including duplicates) is included in the window. If there is no such substring, return the empty string `\"\"`.",
    con:"m == s.length\nn == t.length\n1 <= m, n <= 10^5\ns and t consist of uppercase and lowercase English letters.",
    si:"s = \"ADOBECODEBANC\", t = \"ABC\"", so:"\"BANC\"",
    sc:{
      python:`def minWindow(s, t):\n    # Write your solution here\n    pass`,
      javascript:`function minWindow(s, t) {\n    // Write your solution here\n}`,
      java:`class Solution {\n    public String minWindow(String s, String t) {\n        return \"\";\n    }\n}`,
      cpp:`class Solution {\npublic:\n    string minWindow(string s, string t) {\n        return \"\";\n    }\n};`,
    },
    cr:R.ssStr("minWindow"),
    tc:[
      {input:"ADOBECODEBANC\nABC", output:"BANC", isHidden:false},
      {input:"a\na",             output:"a",    isHidden:true},
      {input:"a\naa",            output:"",     isHidden:true},
      {input:"a\nb",             output:"",     isHidden:true},
      {input:"ab\nb",            output:"b",    isHidden:true},
    ],
  }));

  // ── 29. Median of Two Sorted Arrays ────────────────────────────────────────
  probs.push(await up({
    title:"Median of Two Sorted Arrays", slug:"median-of-two-sorted-arrays", diff:"HARD",
    topics:["Array","Binary Search","Divide and Conquer"],
    desc:"Given two sorted arrays `nums1` and `nums2` of size m and n respectively, return the median of the two sorted arrays. The overall run time complexity should be O(log (m+n)).",
    con:"nums1.length == m\nnums2.length == n\n0 <= m, n <= 1000\n1 <= m + n <= 2000\n-10^6 <= nums1[i], nums2[i] <= 10^6",
    si:"nums1 = [1,3], nums2 = [2]", so:"2.00000",
    sc:{
      python:`def findMedianSortedArrays(nums1, nums2):\n    # Write your solution here\n    pass`,
      javascript:`function findMedianSortedArrays(nums1, nums2) {\n    // Write your solution here\n}`,
      java:`class Solution {\n    public double findMedianSortedArrays(int[] nums1, int[] nums2) {\n        return 0.0;\n    }\n}`,
      cpp:`class Solution {\npublic:\n    double findMedianSortedArrays(vector<int>& nums1, vector<int>& nums2) {\n        return 0.0;\n    }\n};`,
    },
    cr:R.aaFloat("findMedianSortedArrays"),
    tc:[
      {input:"[1,3]\n[2]",         output:"2.00000", isHidden:false},
      {input:"[1,2]\n[3,4]",       output:"2.50000", isHidden:true},
      {input:"[0,0]\n[0,0]",       output:"0.00000", isHidden:true},
      {input:"[]\n[1]",            output:"1.00000", isHidden:true},
      {input:"[2]\n[]",            output:"2.00000", isHidden:true},
    ],
  }));

  // ── 30. Trapping Rain Water ────────────────────────────────────────────────
  probs.push(await up({
    title:"Trapping Rain Water", slug:"trapping-rain-water", diff:"HARD",
    topics:["Array","Two Pointers","Dynamic Programming","Stack"],
    desc:"Given `n` non-negative integers representing an elevation map where the width of each bar is `1`, compute how much water it can trap after raining.",
    con:"n == height.length\n1 <= n <= 2 * 10^4\n0 <= height[i] <= 10^5",
    si:"height = [0,1,0,2,1,0,1,3,2,1,2,1]", so:"6",
    sc:{
      python:`def trap(height):\n    # Write your solution here\n    pass`,
      javascript:`function trap(height) {\n    // Write your solution here\n}`,
      java:`class Solution {\n    public int trap(int[] height) {\n        return 0;\n    }\n}`,
      cpp:`class Solution {\npublic:\n    int trap(vector<int>& height) {\n        return 0;\n    }\n};`,
    },
    cr:R.arrInt("trap"),
    tc:[
      {input:"[0,1,0,2,1,0,1,3,2,1,2,1]", output:"6", isHidden:false},
      {input:"[4,2,0,3,2,5]",             output:"9", isHidden:true},
      {input:"[1,2,3,4,5]",               output:"0", isHidden:true},
      {input:"[5,4,3,2,1]",               output:"0", isHidden:true},
      {input:"[2,0,2]",                   output:"2", isHidden:true},
    ],
  }));

  // ── 31. First Missing Positive ─────────────────────────────────────────────
  probs.push(await up({
    title:"First Missing Positive", slug:"first-missing-positive", diff:"HARD",
    topics:["Array","Hash Table"],
    desc:"Given an unsorted integer array `nums`. Return the smallest positive integer that is not present in `nums`. You must implement an algorithm that runs in O(n) time and uses O(1) auxiliary space.",
    con:"1 <= nums.length <= 10^5\n-2^31 <= nums[i] <= 2^31 - 1",
    si:"nums = [1,2,0]", so:"3",
    sc:{
      python:`def firstMissingPositive(nums):\n    # Write your solution here\n    pass`,
      javascript:`function firstMissingPositive(nums) {\n    // Write your solution here\n}`,
      java:`class Solution {\n    public int firstMissingPositive(int[] nums) {\n        return 1;\n    }\n}`,
      cpp:`class Solution {\npublic:\n    int firstMissingPositive(vector<int>& nums) {\n        return 1;\n    }\n};`,
    },
    cr:R.arrInt("firstMissingPositive"),
    tc:[
      {input:"[1,2,0]",           output:"3", isHidden:false},
      {input:"[3,4,-1,1]",        output:"2", isHidden:true},
      {input:"[7,8,9,11,12]",     output:"1", isHidden:true},
      {input:"[1]",               output:"2", isHidden:true},
      {input:"[2,1]",             output:"3", isHidden:true},
    ],
  }));

  // ── 32. Word Search II ─────────────────────────────────────────────────────
  probs.push(await up({
    title:"Word Search II", slug:"word-search-ii", diff:"HARD",
    topics:["Array","String","Backtracking","Trie","Matrix"],
    desc:"Given an `m x n` board of characters and a list of strings `words`, return all words on the board. Each word must be constructed from letters of sequentially adjacent cells, where adjacent cells are horizontally or vertically neighboring. The same letter cell may not be used more than once in a word.",
    con:"m == board.length\nn == board[i].length\n1 <= m, n <= 12\nboard[i][j] is a lowercase English letter.\n1 <= words.length <= 3 * 10^4\n1 <= words[i].length <= 10\nwords[i] consists of lowercase English letters.\nAll the strings of words are unique.",
    si:"board = [[\"o\",\"a\",\"a\",\"n\"],[\"e\",\"t\",\"a\",\"e\"],[\"i\",\"h\",\"k\",\"r\"],[\"i\",\"f\",\"l\",\"v\"]], words = [\"oath\",\"pea\",\"eat\",\"rain\"]", so:"[\"eat\",\"oath\"]",
    sc:{
      python:`def findWords(board, words):\n    # Write your solution here\n    pass`,
      javascript:`function findWords(board, words) {\n    // Write your solution here\n}`,
      java:`class Solution {\n    public List<String> findWords(char[][] board, String[] words) {\n        return new ArrayList<>();\n    }\n}`,
      cpp:`class Solution {\npublic:\n    vector<string> findWords(vector<vector<char>>& board, vector<string>& words) {\n        return {};\n    }\n};`,
    },
    cr:R.aaArr("findWords"),
    tc:[
      {input:"[[\"o\",\"a\",\"a\",\"n\"],[\"e\",\"t\",\"a\",\"e\"],[\"i\",\"h\",\"k\",\"r\"],[\"i\",\"f\",\"l\",\"v\"]]\n[\"oath\",\"pea\",\"eat\",\"rain\"]", output:"[\"eat\",\"oath\"]", isHidden:false},
      {input:"[[\"a\",\"b\"],[\"c\",\"d\"]]\n[\"abcb\"]", output:"[]", isHidden:true},
      {input:"[[\"a\",\"b\"],[\"c\",\"d\"]]\n[\"ab\",\"cd\"]", output:"[\"ab\",\"cd\"]", isHidden:true},
      {input:"[[\"x\"]]\n[\"x\"]", output:"[\"x\"]", isHidden:true},
      {input:"[[\"x\"]]\n[\"y\"]", output:"[]", isHidden:true},
    ],
  }));

  // ── Contest ────────────────────────────────────────────────────────────────
  const now = new Date();
  const contest = await prisma.contest.create({
    data:{
      title:"CodeVerify Weekly #1",
      description:"Weekly contest featuring Blind 75 problems.",
      startTime: new Date(now.getTime()+60*60*1000),
      endTime:   new Date(now.getTime()+4*60*60*1000),
      isPublic:true, createdBy:admin.id,
      problems:{ create: probs.slice(0,2).map((p,i)=>({ problemId:p.id, points:(i+1)*100, orderIndex:i })) },
    },
  });
  console.log(`✅  Contest: ${contest.title}`);
  console.log("\n🎉  Seed complete.");
}

main().catch(e=>{ console.error("❌  Seed failed:", e); process.exit(1); }).finally(async()=>{ await prisma.$disconnect(); });
