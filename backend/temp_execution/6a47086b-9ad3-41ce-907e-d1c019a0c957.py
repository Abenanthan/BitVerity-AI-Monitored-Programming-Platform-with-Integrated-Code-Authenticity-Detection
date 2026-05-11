def twoSum(nums, target):
    seen = {}

    for i, num in enumerate(nums):
        complement = target - num

        if complement in seen:
            return [seen[complement], i]

        seen[num] = i

import sys, json
_lines = sys.stdin.read().strip().split('\n')
_nums = json.loads(_lines[0])
_target = int(_lines[1].strip())
_result = twoSum(_nums, _target)
print(json.dumps(_result, separators=(',', ':')))