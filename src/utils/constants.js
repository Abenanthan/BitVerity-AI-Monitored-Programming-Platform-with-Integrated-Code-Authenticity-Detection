// ============================================
// CONSTANTS
// ============================================

export const LANGUAGES = [
  { id: 'cpp',        label: 'C++',        icon: '⚡', monacoId: 'cpp' },
  { id: 'java',       label: 'Java',       icon: '☕', monacoId: 'java' },
  { id: 'python',     label: 'Python',     icon: '🐍', monacoId: 'python' },
  { id: 'javascript', label: 'JavaScript', icon: '🟨', monacoId: 'javascript' },
];

export const DIFFICULTY_LEVELS = {
  Easy:   { color: '#10B981', bg: 'rgba(16,185,129,0.12)',   border: 'rgba(16,185,129,0.25)' },
  Medium: { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)',   border: 'rgba(245,158,11,0.25)' },
  Hard:   { color: '#EF4444', bg: 'rgba(239,68,68,0.12)',    border: 'rgba(239,68,68,0.25)'  },
};

export const SAMPLE_PROBLEMS = [
  { id: 1,  title: 'Two Sum',                     difficulty: 'Easy',   acceptance: 67.2, topics: ['Array', 'Hash Table'],              status: 'solved'   },
  { id: 2,  title: 'Longest Palindromic Substring',difficulty: 'Medium', acceptance: 33.8, topics: ['String', 'Dynamic Programming'],   status: 'attempted'},
  { id: 3,  title: 'Median of Two Sorted Arrays',  difficulty: 'Hard',   acceptance: 37.4, topics: ['Array', 'Binary Search'],           status: null       },
  { id: 4,  title: 'Valid Parentheses',            difficulty: 'Easy',   acceptance: 72.9, topics: ['Stack', 'String'],                 status: 'solved'   },
  { id: 5,  title: 'Merge K Sorted Lists',         difficulty: 'Hard',   acceptance: 47.1, topics: ['Linked List', 'Heap'],              status: null       },
  { id: 6,  title: 'Container With Most Water',    difficulty: 'Medium', acceptance: 54.1, topics: ['Array', 'Two Pointers'],           status: 'solved'   },
  { id: 7,  title: 'Trapping Rain Water',          difficulty: 'Hard',   acceptance: 57.9, topics: ['Array', 'Stack', 'DP'],            status: null       },
  { id: 8,  title: 'Binary Tree Level Order',      difficulty: 'Medium', acceptance: 64.3, topics: ['Tree', 'BFS'],                    status: 'attempted'},
  { id: 9,  title: 'Word Search II',               difficulty: 'Hard',   acceptance: 39.2, topics: ['Trie', 'Backtracking'],            status: null       },
  { id: 10, title: 'Best Time to Buy Stock',       difficulty: 'Easy',   acceptance: 54.7, topics: ['Array', 'Greedy'],                 status: 'solved'   },
  { id: 11, title: 'Coin Change',                  difficulty: 'Medium', acceptance: 41.8, topics: ['Dynamic Programming'],            status: null       },
  { id: 12, title: 'N-Queens',                     difficulty: 'Hard',   acceptance: 62.1, topics: ['Backtracking'],                   status: null       },
];

export const SAMPLE_SUBMISSIONS = [
  { id: 1, problem: 'Two Sum',              lang: 'Python',     verdict: 'accepted', aiScore: 12, time: '2m ago'   },
  { id: 2, problem: 'Longest Substring',   lang: 'C++',        verdict: 'wrong',    aiScore: 78, time: '1h ago'   },
  { id: 3, problem: 'Valid Parentheses',   lang: 'Java',       verdict: 'accepted', aiScore: 8,  time: '3h ago'   },
  { id: 4, problem: 'Binary Tree Level',   lang: 'JavaScript', verdict: 'tle',      aiScore: 45, time: '1d ago'   },
  { id: 5, problem: 'Container Water',     lang: 'Python',     verdict: 'accepted', aiScore: 22, time: '2d ago'   },
];

export const ACTIVE_CONTESTS = [
  { id: 'weekly-42',  name: 'Weekly Contest #42', endsAt: Date.now() + 2.5 * 3600 * 1000, problems: 4, participants: 2341 },
  { id: 'biweekly-28',name: 'Biweekly Contest #28',endsAt: Date.now() + 5 * 3600 * 1000,  problems: 5, participants: 1823 },
];

export const STARTER_CODE = {
  cpp: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        // Your code here
        unordered_map<int, int> seen;
        for (int i = 0; i < nums.size(); i++) {
            int complement = target - nums[i];
            if (seen.count(complement)) {
                return {seen[complement], i};
            }
            seen[nums[i]] = i;
        }
        return {};
    }
};`,
  python: `from typing import List

class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        # Your code here
        seen = {}
        for i, num in enumerate(nums):
            complement = target - num
            if complement in seen:
                return [seen[complement], i]
            seen[num] = i
        return []`,
  java: `import java.util.*;

class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Your code here
        Map<Integer, Integer> seen = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (seen.containsKey(complement)) {
                return new int[]{seen.get(complement), i};
            }
            seen.put(nums[i], i);
        }
        return new int[]{};
    }
}`,
  javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
var twoSum = function(nums, target) {
    // Your code here
    const seen = new Map();
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        if (seen.has(complement)) {
            return [seen.get(complement), i];
        }
        seen.set(nums[i], i);
    }
    return [];
};`,
};
