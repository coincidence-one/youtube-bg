/**
 * SVG → PNG 아이콘 생성 스크립트
 * 실행: node scripts/generate-icons.mjs
 * 필요: npm install sharp (devDependency)
 */

import sharp from "sharp";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "..", "public");

const svgBuffer = readFileSync(join(publicDir, "icon.svg"));

const sizes = [192, 512];

for (const size of sizes) {
  await sharp(svgBuffer)
    .resize(size, size)
    .png()
    .toFile(join(publicDir, `icon-${size}.png`));
  console.log(`Generated icon-${size}.png`);
}

console.log("Done!");
