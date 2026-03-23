
const fs = require('fs');
const content = fs.readFileSync('c:\\Users\\hp\\Downloads\\AEOHOLIC\\VIRAHOLIC\\components\\Dashboard.tsx', 'utf8');

let inString = false;
let stringChar = '';
let startLine = 0;

const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (inString) {
            if (char === '\\') { j++; continue; }
            if (char === stringChar) { inString = false; }
            continue;
        }
        if (char === "'" || char === '"' || char === '`') {
            inString = true;
            stringChar = char;
            startLine = i + 1;
        }
    }
}

if (inString) {
    console.log(`Unclosed ${stringChar} starting on line ${startLine}`);
} else {
    console.log('All strings closed!');
}
