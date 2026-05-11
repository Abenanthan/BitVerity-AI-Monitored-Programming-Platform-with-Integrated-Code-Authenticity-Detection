const fs = require('fs');
const filepath = 'src/controllers/submissions.controller.js';
let c = fs.readFileSync(filepath, 'utf-8');

// Find the new clean function ending
const marker = "  return code;\n}";
// We need to find the FIRST occurrence of this after our new buildWrappedCode
const buildStart = c.indexOf("function buildWrappedCode");
const firstEnd = c.indexOf(marker, buildStart);
// firstEnd + marker.length is where the new function ends

// Now find if there's ANOTHER "  return code;\n}" after that (the old leftover)
const secondEnd = c.indexOf(marker, firstEnd + marker.length);

if (secondEnd !== -1) {
  // There's a second occurrence - this is the garbage
  // Remove everything between end of first function and end of second garbage block
  const garbageStart = firstEnd + marker.length;
  const garbageEnd = secondEnd + marker.length;
  console.log('Garbage found from offset', garbageStart, 'to', garbageEnd);
  console.log('Garbage content:', JSON.stringify(c.substring(garbageStart, garbageEnd)));
  c = c.substring(0, garbageStart) + c.substring(garbageEnd);
  fs.writeFileSync(filepath, c);
  console.log('Cleaned!');
} else {
  console.log('No duplicate found, checking another way...');
  // Look for the specific garbage pattern
  const garbagePattern = "} catch(e) { return l; } });";
  const garbageIdx = c.indexOf(garbagePattern);
  if (garbageIdx !== -1) {
    // Find the end of the garbage block (ends with "}\n")
    const endPattern = "  return code;\n}\n";
    const gEnd = c.indexOf(endPattern, garbageIdx);
    if (gEnd !== -1) {
      const removeEnd = gEnd + endPattern.length;
      console.log('Found garbage at offset', garbageIdx, 'to', removeEnd);
      c = c.substring(0, garbageIdx) + c.substring(removeEnd);
      fs.writeFileSync(filepath, c);
      console.log('Cleaned!');
    }
  } else {
    console.log('No garbage found');
  }
}

// Verify
const verify = fs.readFileSync(filepath, 'utf-8');
const lines = verify.split(/\r?\n/);
console.log('Total lines now:', lines.length);
for (let i = 164; i < 175 && i < lines.length; i++) {
  console.log((i+1) + ':', lines[i]);
}
