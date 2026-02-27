/**
 * Add scope: "CORE" to inline tasks in roadmapGenerator.ts
 * These use the pattern: tasks.push({ id: "xxx", ... })
 */
const fs = require('fs');
const f = 'src/config/roadmapGenerator.ts';
let c = fs.readFileSync(f, 'utf8');

// Pattern: tasks.push({\n            id: "xxx",
// Add scope: "CORE" before id
const pattern = /tasks\.push\(\{\s*\n(\s+)id:\s*"/g;
const matches = c.match(pattern);
console.log(`Found ${matches ? matches.length : 0} inline tasks to add scope`);

c = c.replace(pattern, 'tasks.push({\n$1scope: "CORE",\n$1id: "');

// Also handle: [normalizeTaskForState({ id: ... }, state)]
const pattern2 = /normalizeTaskForState\(\{\s*\n(\s+)id:\s*"/g;
const matches2 = c.match(pattern2);
if (matches2) {
    console.log(`Found ${matches2.length} normalizeTaskForState inline tasks`);
    c = c.replace(pattern2, 'normalizeTaskForState({\n$1scope: "CORE",\n$1id: "');
}

// Also handle: tasks = [{ id: ... }] one-off
const pattern3 = /tasks\s*=\s*\[\{\s*\n(\s+)id:\s*"/g;
const matches3 = c.match(pattern3);
if (matches3) {
    console.log(`Found ${matches3.length} tasks=[...] inline tasks`);
    c = c.replace(pattern3, 'tasks = [{\n$1scope: "CORE",\n$1id: "');
}

fs.writeFileSync(f, c);
console.log('Done.');
