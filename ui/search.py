import sys
with open('ui/src/ui/views/usage.ts', 'r') as f:
    lines = f.readlines()
for i, line in enumerate(lines):
    if 'Refresh' in line or 'Tokens' in line or 'Cost' in line:
        print(f"{i+1}: {line.strip()}")
