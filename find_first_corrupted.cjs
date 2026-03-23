
const fs = require('fs');
const content = fs.readFileSync('c:\\Users\\hp\\Downloads\\AEOHOLIC\\VIRAHOLIC\\components\\Dashboard.tsx', 'utf8');

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
        if (char === "'" || char === '"' || char === '`') { 
            inString = true; 
            stringChar = char; 
        }
    }
    lineComment = false;
    if (inString && stringChar === "'") {
        console.log(`First corrupted line: ${i+1}: ${line}`);
        process.exit(0);
    }
}
