import sharp from 'sharp';

async function main() {
    const src = 'public/OTBIT-CURSOR_2.png';
    const dest = 'public/orbit-cursor-new.png';

    const meta = await sharp(src).metadata();
    console.log('Original size:', meta.width, 'x', meta.height);

    // Resize to 32x32 for cursor usage (browsers limit cursor images)
    await sharp(src)
        .resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toFile(dest);

    console.log('Resized to 32x32 -> saved as', dest);
}

main().catch(console.error);
