
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
        if (lineComment) {
            // line comment ends at newline, which is effectively end of line loop
            break; 
        }
        if (inString) {
            if (char === '\\') { j++; continue; }
            if (char === stringChar) { inString = false; }
            continue;
        }
        
        if (char === '/' && line[j+1] === '*') { j++; inComment = true; continue; }
        if (char === '/' && line[j+1] === '/') { j++; lineComment = true; continue; }
        if (char === "'" || char === '"' || char === '`') { inString = true; stringChar = char; continue; }
        
        if (char === '{' || char === '(' || char === '[') {
            stack.push({ char, line: i + 1, col: j + 1 });
        } else if (char === '}' || char === ')' || char === ']') {
            const last = stack.pop();
            if (!last) {
                console.log(`Extra closing ${char} at line ${i + 1}, col ${j + 1}`);
                continue;
            }
            const match = (char === '}' && last.char === '{') ||
                          (char === ')' && last.char === '(') ||
                          (char === ']' && last.char === '[');
            if (!match) {
                console.log(`Mismatched ${char} at line ${i + 1}, col ${j + 1} (last was ${last.char} from line ${last.line})`);
                // Put it back to keep tracking? No, just keep going or fix stack
                stack.push(last); 
            }
        }
    }
    lineComment = false;
}

console.log('Final Stack size:', stack.length);
stack.forEach(s => console.log(`Unclosed ${s.char} from line ${s.line}, col ${s.col}`));
