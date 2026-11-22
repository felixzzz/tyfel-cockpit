import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const publicDir = path.join(rootDir, 'public');
const appDir = path.join(rootDir, 'src/app');

const defaultSource = path.join(publicDir, 'tyfel-logo-square.png');
const inputArg = process.argv[2] || defaultSource;

async function generate() {
  if (!fs.existsSync(inputArg)) {
    console.error(`Source image not found: ${inputArg}`);
    process.exit(1);
  }

  console.log(`Processing source image: ${inputArg}`);
  const masterBuf = await sharp(inputArg)
    .resize(1024, 1024, { fit: 'contain', background: '#6a926f' })
    .png({ quality: 100, compressionLevel: 9 })
    .toBuffer();

  fs.writeFileSync(path.join(publicDir, 'tyfel-logo-square.png'), masterBuf);

  const save = async (dest, size) => {
    await sharp(masterBuf)
      .resize(size, size)
      .png({ compressionLevel: 9 })
      .toFile(dest);
    console.log(`Saved: ${path.relative(rootDir, dest)} (${size}x${size})`);
  };

  // Favicons
  await save(path.join(publicDir, 'favicon-16x16.png'), 16);
  await save(path.join(publicDir, 'favicon-32x32.png'), 32);
  await save(path.join(publicDir, 'favicon-48x48.png'), 48);
  await save(path.join(publicDir, 'favicon-96x96.png'), 96);

  // Apple Touch Icons
  await save(path.join(publicDir, 'apple-touch-icon.png'), 180);
  await save(path.join(publicDir, 'apple-touch-icon-precomposed.png'), 180);

  // Web App / PWA Install Icons
  await save(path.join(publicDir, 'web-app-manifest-192x192.png'), 192);
  await save(path.join(publicDir, 'web-app-manifest-512x512.png'), 512);
  await save(path.join(publicDir, 'icon-192x192.png'), 192);
  await save(path.join(publicDir, 'icon-512x512.png'), 512);
  await save(path.join(publicDir, 'icon-maskable-192x192.png'), 192);
  await save(path.join(publicDir, 'icon-maskable-512x512.png'), 512);

  // Next.js App Router conventions
  await save(path.join(appDir, 'icon.png'), 512);
  await save(path.join(appDir, 'apple-icon.png'), 180);

  // Multi-resolution ICO (16x16, 32x32, 48x48)
  const icoSizes = [16, 32, 48];
  const pngBuffers = [];
  for (const s of icoSizes) {
    const buf = await sharp(masterBuf).resize(s, s).png().toBuffer();
    pngBuffers.push({ size: s, buffer: buf });
  }

  const count = pngBuffers.length;
  let offset = 6 + count * 16;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(count, 4);

  const dirEntries = [];
  for (const item of pngBuffers) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(item.size, 0);
    entry.writeUInt8(item.size, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(item.buffer.length, 8);
    entry.writeUInt32LE(offset, 12);
    dirEntries.push(entry);
    offset += item.buffer.length;
  }

  const icoBuf = Buffer.concat([header, ...dirEntries, ...pngBuffers.map((p) => p.buffer)]);
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuf);
  fs.writeFileSync(path.join(appDir, 'favicon.ico'), icoBuf);
  console.log('Saved multi-resolution favicon.ico in public/ and src/app/');
}

generate().catch(console.error);
