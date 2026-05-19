import fs from 'fs';
import sharp from 'sharp';

const imgPath = 'public/orbit-cursor.png';
const bakPath = 'public/orbit-cursor.bak.png';

async function main() {
    if (!fs.existsSync(bakPath)) {
        fs.copyFileSync(imgPath, bakPath);
    }

    await sharp(imgPath)
        .rotate(120, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .toFile('public/orbit-cursor-120.png');

    fs.renameSync('public/orbit-cursor-120.png', imgPath);
    console.log('Rotated 120 degrees');
}

main().catch(console.error);
