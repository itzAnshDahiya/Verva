const fs = require('fs');
const path = require('path');

const frontendDir = 'c:\\Users\\anshd\\OneDrive\\Desktop\\My Code\\Harkirat 100XDev\\Projects\\Verva\\frontend';

function fixHtmlFile(filepath) {
    let content = fs.readFileSync(filepath, 'utf-8');
    
    // 1. Fix theme toggle button
    content = content.replace(/<button id="theme-toggle" aria-label="Toggle theme"><\/button>/g, 
        '<button id="theme-toggle" aria-label="Toggle theme"><i class="fas fa-moon"></i></button>');
    content = content.replace(/<button id="theme-toggle"><\/button>/g, 
        '<button id="theme-toggle" aria-label="Toggle theme"><i class="fas fa-moon"></i></button>');
    
    // 2. Fix api.js missing or weird
    content = content.replace(/<script src="js\/api\.js"><\/script>`n/g, '');
    content = content.replace(/<script src="js\/api\.js"><\/script>`r`n/g, '');
    
    // Ensure api.js is there before main.js
    if (!content.includes('js/api.js') && content.includes('js/main.js')) {
        content = content.replace('<script src="js/main.js"></script>', 
            '<script src="js/api.js"></script>\n<script src="js/main.js"></script>');
    }
    
    // Remove duplicates
    const apiScript = '<script src="js/api.js"></script>';
    const parts = content.split(apiScript);
    if (parts.length > 2) {
        content = parts[0] + apiScript + parts.slice(1).join('');
    }

    fs.writeFileSync(filepath, content, 'utf-8');
    console.log(`Fixed ${path.basename(filepath)}`);
}

fs.readdirSync(frontendDir).forEach(file => {
    if (file.endsWith('.html')) {
        fixHtmlFile(path.join(frontendDir, file));
    }
});
