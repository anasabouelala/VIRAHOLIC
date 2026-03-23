
const fs = require('fs');
const content = fs.readFileSync('c:\\Users\\hp\\Downloads\\AEOHOLIC\\VIRAHOLIC\\components\\Dashboard.tsx', 'utf8');

const oP = (content.match(/\(/g) || []).length;
const cP = (content.match(/\)/g) || []).length;
const oB = (content.match(/\{/g) || []).length;
const cB = (content.match(/\}/g) || []).length;

console.log('Parens ( ):', oP, cP, oP - cP);
console.log('Braces { }:', oB, cB, oB - cB);
