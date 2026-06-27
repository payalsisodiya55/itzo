import fs from 'fs';

const content = fs.readFileSync('e:/itzo folder/itzo/Frontend/src/modules/Food/pages/user/cart/Cart.jsx', 'utf-8');
const lines = content.split('\n');

lines.forEach((line, index) => {
    if (line.includes('cart.map')) {
        console.log(`Line ${index + 1}: ${line}`);
    }
});
