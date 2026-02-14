
import fs from 'fs';

const filePath = 'server/services/pdfService.ts';
const content = fs.readFileSync(filePath, 'utf8');

const stack: { line: number; col: number }[] = [];
let line = 1;
let col = 1;

for (let i = 0; i < content.length; i++) {
    const char = content[i];
    if (char === '\n') {
        line++;
        col = 1;
    } else {
        col++;
    }

    if (char === '{') {
        stack.push({ line, col });
    } else if (char === '}') {
        if (stack.length === 0) {
            console.log(`❌ Unmatched closing brace at line ${line}, col ${col}`);
        } else {
            stack.pop();
        }
    }
}

if (stack.length > 0) {
    console.log(`❌ Unmatched opening brace(s) remaining: ${stack.length}`);
    stack.forEach((s) => console.log(`  - Opened at line ${s.line}, col ${s.col}`));
} else {
    console.log("✅ All braces matched!");
}
