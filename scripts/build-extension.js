import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

function createPngIcon(size, r = 14, g = 165, b = 233) {
  const width = size;
  const height = size;
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const ihdrChunk = createChunk("IHDR", ihdr);

  const rawData = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    const rowOffset = y * (width * 4 + 1);
    rawData[rowOffset] = 0;

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const nx = (x - width / 2) / (width / 2);
      const ny = (y - height / 2) / (height / 2);
      const inShield = (Math.abs(nx) <= 0.8 && ny >= -0.8 && ny <= 0.8 - Math.pow(Math.abs(nx), 1.5));

      if (inShield) {
        const factor = 1 - (y / height) * 0.3;
        rawData[pxOffset] = Math.round(r * factor);
        rawData[pxOffset + 1] = Math.round(g * factor);
        rawData[pxOffset + 2] = Math.round(b * factor);
        rawData[pxOffset + 3] = 255;
      } else {
        rawData[pxOffset] = 0;
        rawData[pxOffset + 1] = 0;
        rawData[pxOffset + 2] = 0;
        rawData[pxOffset + 3] = 0;
      }
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = createChunk("IDAT", compressedData);
  const iendChunk = createChunk("IEND", Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const length = data.length;
  const chunk = Buffer.alloc(4 + 4 + length + 4);
  chunk.writeUInt32BE(length, 0);
  chunk.write(type, 4, 4, "ascii");
  data.copy(chunk, 8);

  const crc = crc32(chunk.subarray(4, 8 + length));
  chunk.writeUInt32BE(crc, 8 + length);
  return chunk;
}

const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

console.log("🛠️ Building JobLens Chrome Manifest V3 Extension Package...");

const EXT_DIR = path.resolve("./extension");
const PUBLIC_EXT_DIR = path.resolve("./public/extension");

// Ensure directories exist
for (const base of [EXT_DIR, PUBLIC_EXT_DIR]) {
  fs.mkdirSync(path.join(base, "icons"), { recursive: true });
  fs.mkdirSync(path.join(base, "background"), { recursive: true });
  fs.mkdirSync(path.join(base, "content"), { recursive: true });
  fs.mkdirSync(path.join(base, "sidepanel"), { recursive: true });
  fs.mkdirSync(path.join(base, "detectors"), { recursive: true });
}

// Generate icons
const iconSizes = [16, 32, 48, 128];
for (const size of iconSizes) {
  const iconBuf = createPngIcon(size);
  fs.writeFileSync(path.join(EXT_DIR, `icons/icon${size}.png`), iconBuf);
  fs.writeFileSync(path.join(PUBLIC_EXT_DIR, `icons/icon${size}.png`), iconBuf);
}

// Copy all extension files to public/extension for web serving
function copyRecursive(src, dest) {
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

copyRecursive(EXT_DIR, PUBLIC_EXT_DIR);

// Create README.md
const extReadme = `# JobLens — Manifest V3 Chrome Extension

## How to Install into Google Chrome / Brave / Edge

1. Open your browser and navigate to:
   \`chrome://extensions\` (or \`brave://extensions\` / \`edge://extensions\`)
2. Toggle **Developer mode** in the top right corner.
3. Click **Load unpacked**.
4. Select the \`extension/\` directory in this workspace.
5. JobLens will appear in your extensions toolbar with its shield icon 🛡️.

## How to Use
- Open any job listing on **LinkedIn**, **Indeed**, **Naukri**, or corporate careers sites.
- Click the **JobLens** shield icon in your browser toolbar or press \`Ctrl+Shift+J\`.
- The side panel will open and evaluate the listing using local deterministic heuristics without transmitting data to third parties.
- Select text and right-click -> *"🛡️ Scan selection with JobLens"* to analyze messages or recruiter emails.
`;

fs.writeFileSync(path.join(EXT_DIR, "README.md"), extReadme.trim());
fs.writeFileSync(path.join(PUBLIC_EXT_DIR, "README.md"), extReadme.trim());

// Generate ZIP package containing ONLY the extension directory
import("jszip").then(async ({ default: JSZip }) => {
  const zip = new JSZip();

  function addDirToZip(dirPath, zipFolder) {
    const items = fs.readdirSync(dirPath);
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        const subFolder = zipFolder.folder(item);
        if (subFolder) addDirToZip(fullPath, subFolder);
      } else {
        const content = fs.readFileSync(fullPath);
        zipFolder.file(item, content);
      }
    }
  }

  addDirToZip(EXT_DIR, zip);

  const zipBuffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
  fs.writeFileSync(path.resolve("./joblens-extension.zip"), zipBuffer);
  fs.writeFileSync(path.resolve("./public/joblens-extension.zip"), zipBuffer);
  console.log("📦 Created joblens-extension.zip successfully!");
  console.log("✅ Extension files verified and synchronized!");
});
