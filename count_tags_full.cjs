
const fs = require('fs');
const content = fs.readFileSync('c:\\Users\\hp\\Downloads\\AEOHOLIC\\VIRAHOLIC\\components\\Dashboard.tsx', 'utf8');

let openDivs = 0;
let closeDivs = 0;

const openMatches = content.match(/<div(\s|>)/g) || [];
const closeMatches = content.match(/<\/div>/g) || [];

console.log('Total Open divs:', openMatches.length);
console.log('Total Close divs:', closeMatches.length);
console.log('Balance:', openMatches.length - closeMatches.length);

// Also check for other tags
const tags = ['p', 'h3', 'h4', 'h5', 'span', 'a', 'button'];
tags.forEach(t => {
    const o = content.match(new RegExp(`<${t}(\\s|>)`, 'g')) || [];
    const c = content.match(new RegExp(`</${t}>`, 'g')) || [];
    console.log(`${t} balance: ${o.length - c.length}`);
});
