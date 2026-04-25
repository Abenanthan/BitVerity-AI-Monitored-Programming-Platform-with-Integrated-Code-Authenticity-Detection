const axios = require('axios');

async function test() {
  try {
    const code = "import sys\ndef solve(): pass\n# Just some extra text to make it longer than 20 chars\n# A bit more to trigger the paste properly\n# And more just in case.";
    const res = await axios.post('http://localhost:8000/detect/analyze', {
      submissionId: "f9999999-9999-4999-9999-999999999999",
      userId: "1e6e32ed-5e39-4455-8ec5-5bdae5077462",
      code: code,
      language: "python",
      behaviorLog: [
        { time: 100, type: "window_focus", data: {} },
        { time: 500, type: "paste", data: { chars: code.length, isLarge: true, pasteType: "full_code_block" } },
        { time: 1000, type: "submit", data: {} }
      ]
    });
    console.log(JSON.stringify(res.data, null, 2));
  } catch (err) {
    if (err.response) {
      console.error(err.response.status, err.response.data);
    } else {
      console.error(err);
    }
  }
}

test();
