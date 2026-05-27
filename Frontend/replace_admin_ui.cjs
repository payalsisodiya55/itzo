const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        const dirPath = path.join(dir, f);
        if (fs.statSync(dirPath).isDirectory()) {
            walkDir(dirPath, callback);
        } else {
            callback(dirPath);
        }
    });
}

const replacements = [
    // Standalone strings and basic JSX
    { from: />Admin</g, to: '>ECS<' },
    { from: />\s*Admin\s*</g, to: '> ECS <' },
    { from: />Admin\s*:/g, to: '>ECS:' },
    { from: /"Admin"/g, to: '"ECS"' },
    { from: /'Admin'/g, to: "'ECS'" },
    { from: /"Admin "/g, to: '"ECS "' },
    { from: /" Admin"/g, to: '" ECS"' },
    { from: /'Admin '/g, to: "'ECS '" },
    { from: /' Admin'/g, to: "' ECS'" },
    { from: /"Admin:"/g, to: '"ECS:"' },
    
    // Common phrases in strings
    { from: /"Admin Login"/gi, to: '"ECS Login"' },
    { from: /"Admin Dashboard"/gi, to: '"ECS Dashboard"' },
    { from: /"Admin Panel"/gi, to: '"ECS Panel"' },
    { from: /"Super Admin"/gi, to: '"Super ECS"' },
    { from: /"Admin Overview"/gi, to: '"ECS Overview"' },
    { from: /"Admin Settings"/gi, to: '"ECS Settings"' },
    { from: /"Admin User"/g, to: '"ECS User"' },
    { from: /"Admin alert"/g, to: '"ECS alert"' },
    
    // Common phrases in JSX/Text
    { from: />Admin Login</gi, to: '>ECS Login<' },
    { from: />Admin Dashboard</gi, to: '>ECS Dashboard<' },
    { from: />Admin Panel</gi, to: '>ECS Panel<' },
    { from: />Super Admin</gi, to: '>Super ECS<' },
    { from: />Admin Overview</gi, to: '>ECS Overview<' },
    { from: />Admin Settings</gi, to: '>ECS Settings<' },
    { from: />Admin User</gi, to: '>ECS User<' },
    { from: />Admin Response</gi, to: '>ECS Response<' },
    { from: />Admin Console</gi, to: '>ECS Console<' },
    
    // Specific fragments
    { from: /Admin Application/g, to: 'ECS Application' },
    { from: /Admin Logo/g, to: 'ECS Logo' },
    { from: /Admin Favicon/g, to: 'ECS Favicon' },
    { from: /Pending Admin Approval/g, to: 'Pending ECS Approval' },
    { from: /Total Admin Commission/g, to: 'Total ECS Commission' },
    { from: /Admin Tax Report/g, to: 'ECS Tax Report' },
    { from: /Admin Earning/g, to: 'ECS Earning' },
    { from: /Admin controls this category now/g, to: 'ECS controls this category now' },
    { from: /Admin notification/g, to: 'ECS notification' },
    { from: /Admin response/g, to: 'ECS response' },
    { from: /Admin Response/g, to: 'ECS Response' },
    { from: /Admin Landing Page/g, to: 'ECS Landing Page' },
    { from: /Admin note/g, to: 'ECS note' },
    { from: /Admin notes/g, to: 'ECS notes' },
    { from: /Admin Fee/g, to: 'ECS Fee' },
    { from: /Admin Platform/g, to: 'ECS Platform' },
    { from: /Admin Commission/g, to: 'ECS Commission' },
    { from: /Admin Theme Color/g, to: 'ECS Theme Color' },
    { from: /Admin Sign Up/g, to: 'ECS Sign Up' },
    
    // Label and placeholder
    { from: /label="Admin"/g, to: 'label="ECS"' },
    { from: /placeholder="Admin"/g, to: 'placeholder="ECS"' },
    { from: /label="Admin Theme Color"/g, to: 'label="ECS Theme Color"' },
];

walkDir('c:/Users/HES/Desktop/itzo folder/itzo/Frontend/src', function(filePath) {
    if (filePath.match(/\.(js|jsx|ts|tsx)$/)) {
        let content = fs.readFileSync(filePath, 'utf8');
        let newContent = content;
        
        replacements.forEach(r => {
            newContent = newContent.replace(r, r.to); // wait, r is an object, I need r.from
        });
        
        // Let's re-run cleanly
        replacements.forEach(r => {
            newContent = newContent.replace(r.from, r.to);
        });

        // Some specific un-handled string replacements like sentences:
        newContent = newContent.replace(/\n(\s*)Admin(\s*)\n/g, '\n$1ECS$2\n');
        newContent = newContent.replace(/Choose How Admin Will/g, 'Choose How ECS Will');
        
        if (content !== newContent) {
            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log('Updated: ' + filePath);
        }
    }
});
