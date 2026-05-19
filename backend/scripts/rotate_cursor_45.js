import fs from 'fs';
import sharp from 'sharp';

const imgPath = 'public/orbit-cursor.png';
const bakPath = 'public/orbit-cursor.bak.png';

async function main() {
    if (fs.existsSync(bakPath)) {
        await sharp(bakPath)
            .rotate(45, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .toFile('public/orbit-cursor-45.png');

        fs.renameSync('public/orbit-cursor-45.png', imgPath);
        console.log('Rotated 45 degrees');
    } else {
        console.error('Backup file not found');
    }
}

main().catch(console.error);
