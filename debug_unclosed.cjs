
const fs = require('fs');
const content = fs.readFileSync('c:\\Users\\hp\\Downloads\\AEOHOLIC\\VIRAHOLIC\\components\\Dashboard.tsx', 'utf8');

const stack = [];
let inString = false;
let stringChar = '';
let inComment = false;
let lineComment = false;

const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (inComment) {
            if (char === '*' && line[j+1] === '/') { j++; inComment = false; }
            continue;
        }
        if (lineComment) break;
        if (inString) {
            if (char === '\\') { j++; continue; }
            if (char === stringChar) { inString = false; }
            continue;
        }
        
        if (char === '/' && line[j+1] === '*') { j++; inComment = true; continue; }
        if (char === '/' && line[j+1] === '/') { j++; lineComment = true; continue; }
        if (char === "'" || char === '"' || char === '`') { inString = true; stringChar = char; continue; }
        
        if (char === '{' || char === '(' || char === '[') {
            stack.push({ char, line: i + 1, col: j + 1, text: line.trim() });
        } else if (char === '}' || char === ')' || char === ']') {
            const last = stack.pop();
            // Match logic...
        }
    }
    lineComment = false;
}

stack.forEach(s => {
    console.log(`Unclosed ${s.char} at line ${s.line}:${s.col} -> ${s.text}`);
});
