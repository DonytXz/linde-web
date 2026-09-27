import { chromium } from "@playwright/test";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Buffer } from "node:buffer";

// Deterministic vector exports using the same installed Chrome as the UI tests.
const root = resolve("public/brand");
const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage({ deviceScaleFactor: 1 });
async function raster(source, width, height, output) {
  const svg = await readFile(resolve(root, source), "utf8");
  await page.setViewportSize({ width, height });
  await page.setContent(
    `<style>html,body{margin:0;background:transparent}svg{display:block;width:100vw;height:100vh}</style>${svg}`,
  );
  const png = await page.screenshot({ omitBackground: true });
  if (output) await writeFile(resolve(root, output), png);
  return png;
}
try {
  for (const size of [180, 192, 256, 512])
    await raster("favicon.svg", size, size, `icon-${size}.png`);
  for (const variant of ["dark", "inverse"]) {
    for (const width of [320, 640])
      await raster(
        `wordmark-${variant}.svg`,
        width,
        width / 4,
        `wordmark-${variant}-${width}.png`,
      );
  }
  for (const lang of ["es", "en"])
    await raster(`social-${lang}.svg`, 1200, 630, `social-${lang}.png`);
  const sizes = [16, 32, 48];
  const images = [];
  for (const size of sizes)
    images.push(await raster("favicon.svg", size, size));
  const header = Buffer.alloc(6 + 16 * images.length);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach((png, index) => {
    const start = 6 + index * 16;
    header[start] = header[start + 1] = sizes[index];
    header.writeUInt16LE(1, start + 4);
    header.writeUInt16LE(32, start + 6);
    header.writeUInt32LE(png.length, start + 8);
    header.writeUInt32LE(offset, start + 12);
    offset += png.length;
  });
  await writeFile(
    resolve(root, "favicon.ico"),
    Buffer.concat([header, ...images]),
  );
} finally {
  await browser.close();
}
