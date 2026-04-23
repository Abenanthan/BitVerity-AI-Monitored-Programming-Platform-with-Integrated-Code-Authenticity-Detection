async function test() {
  const res = await fetch('https://wandbox.org/api/compile.json', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      compiler: 'cpython-3.10.15',
      code: `
class Solution:
    def twoSum(self, nums, target):
        pass

import sys, json
try:
    sol = Solution()
    print("TC|1|", json.dumps(sol.twoSum([2,7,11,15], 9)))
except Exception as e:
    print("ERROR|", str(e))
`,
      save: false
    })
  });
  const data = await res.json();
  console.log(data);
  const output = (data.program_message || data.program_output || '').trim();
  const tc = { id: 1, expected: '[0, 1]' };
  const match = output.match(new RegExp('TC\\\\|' + tc.id + '\\\\| (.*)'));
  console.log("Match:", match);
}
test();
