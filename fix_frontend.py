import os
import re

def fix_html_file(filepath):
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    
    # 1. Fix theme toggle button
    # Replace empty theme toggle or one with no icon
    content = re.sub(r'<button id="theme-toggle" aria-label="Toggle theme"></button>', 
                     '<button id="theme-toggle" aria-label="Toggle theme"><i class="fas fa-moon"></i></button>', content)
    content = re.sub(r'<button id="theme-toggle"></button>', 
                     '<button id="theme-toggle" aria-label="Toggle theme"><i class="fas fa-moon"></i></button>', content)
    
    # 2. Fix api.js missing or weird
    # First remove any corrupted ones with `n` or other weirdness
    content = re.sub(r'<script src="js/api\.js"></script>`n', '', content)
    content = re.sub(r'<script src="js/api\.js"></script>`r`n', '', content)
    
    # Ensure api.js is there before main.js
    if 'js/api.js' not in content and 'js/main.js' in content:
        content = content.replace('<script src="js/main.js"></script>', 
                                  '<script src="js/api.js"></script>\n<script src="js/main.js"></script>')
    
    # Remove duplicates
    matches = list(re.finditer(r'<script src="js/api\.js"></script>', content))
    if len(matches) > 1:
        # Keep only the first one
        first_match_end = matches[0].end()
        content = content[:first_match_end] + content[first_match_end:].replace('<script src="js/api.js"></script>', '')
        
    with open(filepath, 'w', encoding='utf-8', newline='\n') as f:
        f.write(content)

frontend_dir = r'c:\Users\anshd\OneDrive\Desktop\My Code\Harkirat 100XDev\Projects\Verva\frontend'
for filename in os.listdir(frontend_dir):
    if filename.endswith('.html'):
        fix_html_file(os.path.join(frontend_dir, filename))
        print(f"Fixed {filename}")
