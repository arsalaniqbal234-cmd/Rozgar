import { getVideoMetadata } from "@remotion/renderer";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CATEGORY_IMAGE_SETS } from "../lib/job-preview-config";

const directory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../public/job-previews/video");
let count = 0;
let total = 0;
let minimum = Infinity;
let maximum = 0;
for (const category of Object.keys(CATEGORY_IMAGE_SETS)) {
  for (const variant of [1, 2]) {
    const stem = path.join(directory, `${category}-${variant}`);
    const poster = await readFile(`${stem}.jpg`);
    if (poster[0] !== 0xff || poster[1] !== 0xd8) throw new Error(`Invalid JPEG: ${stem}`);
    for (const [extension, codec] of [["mp4", "h264"], ["webm", "vp9"]] as const) {
      const filename = `${stem}.${extension}`;
      const metadata = await getVideoMetadata(filename);
      if (metadata.codec !== codec || metadata.width !== 960 || metadata.height !== 720 || metadata.fps !== 30 ||
        metadata.durationInSeconds === null || Math.abs(metadata.durationInSeconds - 6) > .05 || metadata.audioCodec !== null || metadata.pixelFormat !== "yuv420p") {
        throw new Error(`Invalid rendered video ${filename}: ${JSON.stringify(metadata)}`);
      }
      const { size } = await stat(filename);
      if (size > 500_000) console.warn(`Above 500 KB target: ${filename} (${size} bytes)`);
      minimum = Math.min(minimum, size);
      maximum = Math.max(maximum, size);
      total += size;
      count++;
    }
  }
}
console.log(`Verified ${count} videos and ${count / 2} JPEG posters. H.264/VP9, 960x720, 30fps, 6 seconds, no audio.`);
console.log(`Videos: ${(minimum / 1024).toFixed(1)}-${(maximum / 1024).toFixed(1)} KiB each; ${(total / 1024 / 1024).toFixed(2)} MiB total.`);
