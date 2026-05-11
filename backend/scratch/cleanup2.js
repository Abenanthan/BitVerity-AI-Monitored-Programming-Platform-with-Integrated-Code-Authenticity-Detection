const fs = require('fs');
const filepath = 'src/controllers/submissions.controller.js';
let c = fs.readFileSync(filepath, 'utf-8');

// Find the garbage: starts with "} catch(e) { return l; }"
const garbageStart = c.indexOf('} catch(e) { return l; }');
if (garbageStart === -1) {
  console.log('No garbage found');
  process.exit(0);
}

// Find where the garbage ends - it's a full old function copy ending with "}\r\n"
// After the garbage there should be "\r\nfunction executeLocally"
const execLocallyIdx = c.indexOf('function executeLocally', garbageStart);
if (execLocallyIdx === -1) {
  console.log('Could not find executeLocally after garbage');
  process.exit(1);
}

// The garbage is everything from garbageStart to just before executeLocally
// But we need to keep the newline before executeLocally
let cutEnd = execLocallyIdx;
// Walk backwards to find the start of the line
while (cutEnd > 0 && c[cutEnd-1] !== '\n') cutEnd--;

console.log('Cutting from offset', garbageStart, 'to', cutEnd);
console.log('Removed:', JSON.stringify(c.substring(garbageStart, cutEnd).substring(0, 100)) + '...');

c = c.substring(0, garbageStart) + c.substring(cutEnd);
fs.writeFileSync(filepath, c);

// Verify
const v = fs.readFileSync(filepath, 'utf-8');
const lines = v.split(/\r?\n/);
console.log('Total lines now:', lines.length);
for (let i = 164; i < 175 && i < lines.length; i++) {
  console.log((i+1)+':', lines[i]);
}
// Check for syntax validity
try {
  new Function(v);
  console.log('JS syntax: VALID');
} catch(e) {
  console.log('JS syntax check:', e.message);
}
