const fs = require('fs');
const filepath = require('path').join(__dirname, '..', 'src', 'controllers', 'submissions.controller.js');
let content = fs.readFileSync(filepath, 'utf-8');

const startMarker = "// \u2500\u2500 Build a runner that calls the user's function with parsed stdin args";
const startIdx = content.indexOf(startMarker);
if (startIdx === -1) {
  console.error('Could not find start marker');
  process.exit(1);
}

// Line 160 has "  return code;" and line 161 has "}"
// Find "return code;" after line 140 area
let searchFrom = startIdx + 500; // skip past the first occurrences
let endIdx = content.indexOf('return code;', searchFrom);
if (endIdx === -1) {
  console.error('Could not find return code;');
  process.exit(1);
}
// Move past "return code;\r\n}\r\n" 
endIdx = content.indexOf('}', endIdx) + 1;

console.log('Replacing from offset', startIdx, 'to', endIdx);
console.log('Removed text starts with:', JSON.stringify(content.substring(startIdx, startIdx+80)));
console.log('Removed text ends with:', JSON.stringify(content.substring(endIdx-30, endIdx)));

const NL = '\n'; // join char

const newFunction = [
"// \u2500\u2500 Build a runner that calls the user's function with parsed stdin args \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500",
"function buildWrappedCode(code, langId) {",
"  if (langId === 71) { // Python",
"    const fnMatch = code.match(/^\\s*def\\s+(\\w+)\\s*\\(/m);",
"    if (!fnMatch) return code;",
"    const fnName = fnMatch[1];",
"    const runner = [",
"      '',",
"      '',",
"      'import sys as _sys, json as _json',",
"      'def _runner():',",
"      '    _raw = _sys.stdin.read().strip()',",
"      '    if not _raw: return',",
"      '    _lines = [l for l in _raw.splitlines() if l.strip()]',",
"      '    _args = []',",
"      '    for _l in _lines:',",
"      '        try: _args.append(_json.loads(_l))',",
"      '        except: _args.append(_l)',",
"      '    try:',",
"      '        _result = ' + fnName + '(*_args)',",
"      '        if _result is not None:',",
"      '            if isinstance(_result, (list, dict)): print(_json.dumps(_result))',",
"      '            else: print(_result)',",
"      '    except Exception as e:',",
"      '        print(str(e), file=_sys.stderr)',",
"      '        _sys.exit(1)',",
"      '_runner()',",
"    ].join('\\n');",
"    return code + runner;",
"  }",
"  if (langId === 63) { // JS",
"    const fnMatch = code.match(/(?:function\\s+(\\w+)|(?:const|let|var)\\s+(\\w+)\\s*=\\s*(?:function|\\()|^\\s*(\\w+)\\s*=\\s*(?:function|\\())/m);",
"    if (!fnMatch) return code;",
"    const fnName = fnMatch[1] || fnMatch[2] || fnMatch[3];",
"    const runner = [",
"      '',",
"      '',",
"      'try {',",
"      '  const _input = require(\"fs\").readFileSync(0,\"utf-8\").trim();',",
"      '  const _lines = _input.split(String.fromCharCode(10)).filter(Boolean);',",
"      '  const _args = _lines.map(function(l) { try { return JSON.parse(l); } catch(e) { return l; } });',",
"      '  const _result = ' + fnName + '(..._args);',",
"      '  if (_result !== undefined) {',",
"      '    console.log(typeof _result === \"object\" ? JSON.stringify(_result) : _result);',",
"      '  }',",
"      '} catch (e) {',",
"      '  process.stderr.write(e.message);',",
"      '  process.exit(1);',",
"      '}',",
"    ].join('\\n');",
"    return code + runner;",
"  }",
"  return code;",
"}",
].join('\r\n');

content = content.substring(0, startIdx) + newFunction + content.substring(endIdx);
fs.writeFileSync(filepath, content, 'utf-8');
console.log('✅ buildWrappedCode replaced successfully!');

// Verify
const verify = fs.readFileSync(filepath, 'utf-8');
console.log('Contains splitlines:', verify.includes('splitlines'));
console.log('Contains String.fromCharCode:', verify.includes('String.fromCharCode'));
console.log('Still contains executeLocally:', verify.includes('executeLocally'));
console.log('Still contains module.exports:', verify.includes('module.exports'));
