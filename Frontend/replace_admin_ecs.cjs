const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        const dirPath = path.join(dir, f);
        const isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

walkDir('c:/Users/HES/Desktop/itzo folder/itzo/Frontend/src', function(filePath) {
    if (filePath.match(/\.(js|jsx|ts|tsx)$/)) {
        let content = fs.readFileSync(filePath, 'utf8');
        let newContent = content
            .replace(/'\/admin'/g, "'/ecs'")
            .replace(/\"\/admin\"/g, '"/ecs"')
            .replace(/\`\/admin\`/g, '`/ecs`')
            .replace(/'\/admin\//g, "'/ecs/")
            .replace(/\"\/admin\//g, '"/ecs/')
            .replace(/\`\/admin\//g, '`/ecs/')
            .replace(/'\/admin\/\*'/g, "'/ecs/*'")
            .replace(/\"\/admin\/\*\"/g, '"/ecs/*"')
            .replace(/\`\/admin\/\*\`/g, '`/ecs/*`');
            
        if (content !== newContent) {
            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log('Updated: ' + filePath);
        }
    }
});
