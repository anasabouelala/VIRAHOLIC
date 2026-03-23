
const fs = require('fs');
const content = fs.readFileSync('c:\\Users\\hp\\Downloads\\AEOHOLIC\\VIRAHOLIC\\components\\Dashboard.tsx', 'utf8');

const stack = [];
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '{' || char === '(' || char === '[') {
            stack.push({ char, line: i + 1, col: j + 1 });
        } else if (char === '}' || char === ')' || char === ']') {
            const last = stack.pop();
            if (!last) {
                console.log(`Extra closing ${char} at line ${i + 1}, col ${j + 1}`);
                continue;
            }
            if ((char === '}' && last.char !== '{') ||
                (char === ')' && last.char !== '(') ||
                (char === ']' && last.char !== '[')) {
                console.log(`Mismatched ${char} at line ${i + 1}, col ${j + 1} (expected ${last.char} from line ${last.line})`);
            }
        }
    }
}

if (stack.length > 0) {
    stack.forEach(s => console.log(`Unclosed ${s.char} from line ${s.line}, col ${s.col}`));
} else {
    console.log('Braces/Parens balanced!');
}
