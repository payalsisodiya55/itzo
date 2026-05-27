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
    // JSX text nodes and raw text
    { from: />Email</g, to: '>User Id<' },
    { from: />Email Address</g, to: '>User Id<' },
    { from: />Email address</g, to: '>User Id<' },
    { from: />Email\s*:</g, to: '>User Id:' },
    { from: />Email\s+Address\s*:</g, to: '>User Id:' },
    { from: />Owner Email</g, to: '>Owner User Id<' },
    { from: />Restaurant Email</g, to: '>Restaurant User Id<' },
    { from: />Support Email</g, to: '>Support User Id<' },
    { from: />Primary Email</g, to: '>Primary User Id<' },
    { from: />Contact Email</g, to: '>Contact User Id<' },
    { from: />Email\s*\*/g, to: '>User Id *' },
    { from: />Email address\*/g, to: '>User Id*' },
    { from: />Email Address\*/g, to: '>User Id*' },
    { from: />Email\s*\(Optional\)</g, to: '>User Id (Optional)<' },
    
    // Label and Placeholder attributes
    { from: /label="Email"/g, to: 'label="User Id"' },
    { from: /label="Email Address"/g, to: 'label="User Id"' },
    { from: /label="Support Email"/g, to: 'label="Support User Id"' },
    { from: /placeholder="Email"/g, to: 'placeholder="User Id"' },
    { from: /placeholder="Enter Email"/g, to: 'placeholder="Enter User Id"' },
    { from: /placeholder="Enter your email"/g, to: 'placeholder="Enter your User Id"' },
    { from: /placeholder="Enter your email address"/g, to: 'placeholder="Enter your User Id"' },
    { from: /placeholder="Email \(e\.g\. name@domain\.com\)"/g, to: 'placeholder="User Id (e.g. name@domain.com)"' },
    
    // Exact string literals
    { from: /"Email"/g, to: '"User Id"' },
    { from: /'Email'/g, to: "'User Id'" },
    { from: /"Email Address"/g, to: '"User Id"' },
    { from: /'Email Address'/g, to: "'User Id'" },
    { from: /"Email:"/g, to: '"User Id:"' },
    { from: /'Email:'/g, to: "'User Id:'" },
    { from: /"Owner Email"/g, to: '"Owner User Id"' },
    { from: /"Restaurant Email"/g, to: '"Restaurant User Id"' },
    { from: /"Support Email"/g, to: '"Support User Id"' },
    { from: /"Primary Email"/g, to: '"Primary User Id"' },
    { from: /"Contact Email"/g, to: '"Contact User Id"' },
    { from: /"Email is required"/g, to: '"User Id is required"' },
    { from: /'Email is required'/g, to: "'User Id is required'" },
    { from: /"Verify Email"/g, to: '"Verify User Id"' },
    { from: /"Email \(A-Z\)"/g, to: '"User Id (A-Z)"' },
    { from: /"Email \(Z-A\)"/g, to: '"User Id (Z-A)"' },
    
    // Specific text content within tags (where Email is first word)
    { from: />Email can be changed</g, to: '>User Id can be changed<' },
    { from: /Email Support/g, to: 'User Id Support' },
    { from: /Email Report/g, to: 'User Id Report' },
    { from: /Owner Email \(at registration\)/g, to: 'Owner User Id (at registration)' },
    { from: /Email Service/g, to: 'User Id Service' }
];

walkDir('c:/Users/HES/Desktop/itzo folder/itzo/Frontend/src', function(filePath) {
    if (filePath.match(/\.(js|jsx|ts|tsx)$/)) {
        let content = fs.readFileSync(filePath, 'utf8');
        let newContent = content;
        
        replacements.forEach(r => {
            newContent = newContent.replace(r.from, r.to);
        });
        
        // Also handle cases like `Email <span` or `Email<span`
        newContent = newContent.replace(/>Email\s*<span/g, '>User Id <span');
        
        // Handle standalone "Email" in JSX text where there might be spaces
        // We'll replace \n\s*Email\s*\n to \nUser Id\n
        newContent = newContent.replace(/\n(\s*)Email(\s*)\n/g, '\n$1User Id$2\n');
        
        // Handle "Email Address" in standalone lines
        newContent = newContent.replace(/\n(\s*)Email Address(\s*)\n/g, '\n$1User Id$2\n');

        if (content !== newContent) {
            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log('Updated: ' + filePath);
        }
    }
});
