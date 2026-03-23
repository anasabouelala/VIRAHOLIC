
const fs = require('fs');
const content = fs.readFileSync('c:\\Users\\hp\\Downloads\\AEOHOLIC\\VIRAHOLIC\\components\\Dashboard.tsx', 'utf8');
const lines = content.split('\n');
const start = 818;
const end = 1208;
const slice = lines.slice(start - 1, end).join('\n');

let openDivs = 0;
let closeDivs = 0;

// Simple regex for tags (not perfect but good enough for well-formatted JSX)
const openMatches = slice.match(/<div(\s|>)/g) || [];
const closeMatches = slice.match(/<\/div>/g) || [];
const selfClosing = slice.match(/<div\s+[^>]*\/>/g) || [];

console.log('Open divs:', openMatches.length);
console.log('Close divs:', closeMatches.length);
console.log('Self-closing:', selfClosing.length);
console.log('Balance:', openMatches.length - closeMatches.length - selfClosing.length);
