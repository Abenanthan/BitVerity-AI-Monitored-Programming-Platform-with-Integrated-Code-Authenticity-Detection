function twoSum(nums, target) {
    const seen = {};

    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];

        if (complement in seen) {
            return [seen[complement], i];
        }

        seen[nums[i]] = i;
    }
}

const lines = require('fs').readFileSync(0,'utf-8').trim().split('\n');
const nums = JSON.parse(lines[0]);
const target = parseInt(lines[1]);
console.log(JSON.stringify(twoSum(nums, target)));