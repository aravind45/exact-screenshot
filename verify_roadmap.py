import re
import os

# Forbidden tokens (regex patterns)
FORBIDDEN = [
    r'DE-\d{3}',
    r'Medi-Cal',
    r'DHCS',
    r'PCOR',
    r'IAEA',
    r'Notice of Proposed Action',
    r'Proposed Action',
    r'CA Prob\. Code',
    r'California',
]

# Files to scan
FILES = [
    'src/config/settlementPhases.ts',
    'src/config/settlementStages.ts',
    'server/services/roadmapService.ts',
    'src/lib/authorityGate.ts',
    'src/lib/phaseLock.ts'
]

def scan_file(filepath):
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        return
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Special check for settlementPhases.ts: skip tasks that have states: ["CA"]
    if 'settlementPhases.ts' in filepath:
        # Split by tasks
        tasks = re.split(r'id:\s*"[^"]+"', content)
        for task in tasks:
            # If the task is gated to CA, skip it
            if 'applicability: { states: ["CA"] }' in task or 'states: ["CA"]' in task:
                continue
            
            # Check for forbidden tokens in the task block
            for pattern in FORBIDDEN:
                matches = re.findall(pattern, task, re.IGNORECASE)
                if matches:
                    print(f"FAIL: Found forbidden token '{matches[0]}' in {filepath} (non-gated block)")
                    # Print context
                    lines = task.split('\n')
                    for line in lines:
                        if any(re.search(p, line, re.IGNORECASE) for p in FORBIDDEN):
                            print(f"  > {line.strip()}")
    else:
        # General scan for other files
        for pattern in FORBIDDEN:
            matches = re.finditer(pattern, content, re.IGNORECASE)
            for match in matches:
                # Get line number
                line_no = content.count('\n', 0, match.start()) + 1
                line_content = content.split('\n')[line_no - 1].strip()
                
                # Exceptions: check if it's in a stateOverride for NY or logic that handles other states
                # For roadmapService.ts, we allow them in the normalizeTextForState function as it's scrubbing them
                if 'roadmapService.ts' in filepath and 'replace' in line_content:
                    continue
                if 'stateRules.ts' in filepath and '"CA"' in line_content:
                    continue
                if '"NY"' in line_content or 'stateOverrides: { NY:' in line_content:
                    # If it's a CA token in an NY block, that's definitely a fail
                    print(f"FAIL: Found forbidden token '{match.group()}' in {filepath}:{line_no} (NY/Generic block)")
                    print(f"  > {line_content}")
                elif '"CA"' not in line_content and 'state: "CA"' not in line_content:
                    # If it's a CA token in a block that isn't explicitly CA
                    print(f"FAIL: Found forbidden token '{match.group()}' in {filepath}:{line_no}")
                    print(f"  > {line_content}")

if __name__ == "__main__":
    print("Starting CA Erasure Verification Scanner...")
    for f in FILES:
        scan_file(f)
    print("Scan complete.")
