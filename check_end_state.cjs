
const fs = require('fs');
const content = fs.readFileSync('c:\\Users\\hp\\Downloads\\AEOHOLIC\\VIRAHOLIC\\components\\Dashboard.tsx', 'utf8');

let inString = false;
let stringChar = '';
let inComment = false;
let lineComment = false;

for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const next = content[i+1];
    
    if (inComment) {
        if (char === '*' && next === '/') { i++; inComment = false; }
        continue;
    }
    if (lineComment) {
        if (char === '\n') { lineComment = false; }
        continue;
    }
    if (inString) {
        if (char === '\\') { i++; continue; }
        if (char === stringChar) { inString = false; }
        continue;
    }
    
    if (char === '/' && next === '*') { i++; inComment = true; continue; }
    if (char === '/' && next === '/') { i++; lineComment = true; continue; }
    if (char === "'" || char === '"' || char === '`') { inString = true; stringChar = char; }
}

console.log('Final inString:', inString, stringChar);
console.log('Final inComment:', inComment);
console.log('Final lineComment:', lineComment);
