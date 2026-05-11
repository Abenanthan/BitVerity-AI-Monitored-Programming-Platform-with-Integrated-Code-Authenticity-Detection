def twoSum(nums, target):
    # Loop through each pair of indices
    for i in range(len(nums)):
        for j in range(i + 1, len(nums)):
            if nums[i] + nums[j] == target:
                return [i, j]\n
import sys, json
_lines = sys.stdin.read().strip().split('\n')
_nums = json.loads(_lines[0])
_target = int(_lines[1].strip())
_result = twoSum(_nums, _target)
print(json.dumps(_result, separators=(',', ':')))