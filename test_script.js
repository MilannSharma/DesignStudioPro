import { readFileSync } from 'fs';
const file = readFileSync('src/hooks/useIndicInput.ts', 'utf-8');
console.log(file.includes('obj.hiddenTextarea.value = newText'));
