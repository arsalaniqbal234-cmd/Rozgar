import { bundle } from "@remotion/bundler";
import { getCompositions, openBrowser, renderFrames, renderStill, stitchFramesToVideo } from "@remotion/renderer";
import { mkdir, mkdtemp, rename, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "public/job-previews/video");
const requested = process.argv.slice(2).filter(arg => !arg.startsWith("--"));
const resume = process.argv.includes("--resume");
const concurrency = Number(process.env.REMOTION_CONCURRENCY || 2);
if (!Number.isInteger(concurrency) || concurrency < 1) throw new Error("REMOTION_CONCURRENCY must be a positive integer");
await mkdir(output, { recursive: true });
const serveUrl = await bundle({ entryPoint: path.join(root, "remotion/index.tsx"), publicDir: null });
const browser = await openBrowser("chrome");
const report: { id: string; format: string; bytes: number }[] = [];
try {
  const compositions = await getCompositions(serveUrl, { puppeteerInstance: browser });
  for (const id of requested) if (!compositions.some(c => c.id === id || c.id.replace(/-[12]$/, "") === id)) throw new Error(`Unknown category/composition: ${id}`);
  for (const composition of compositions) {
    if (requested.length && !requested.some(id => composition.id === id || composition.id.replace(/-[12]$/, "") === id)) continue;
    const common = { serveUrl, composition, puppeteerInstance: browser };
    let frames: Awaited<ReturnType<typeof renderFrames>> | undefined;
    const frameDirectory = await mkdtemp(path.join(tmpdir(), "rozgar-preview-"));
    try {
      for (const format of ["jpg", "mp4", "webm"] as const) {
        const destination = path.join(output, `${composition.id}.${format}`);
        const exists = await stat(destination).then(s => s.size > 0).catch(() => false);
        if (!resume || !exists) {
          const temporary = path.join(output, `${composition.id}.partial.${format}`);
          if (format === "jpg") await renderStill({ ...common, frame: 0, imageFormat: "jpeg", jpegQuality: 92, output: temporary });
          else {
            // Rasterize once, then encode both formats from the same lossless frames.
            frames ??= await renderFrames({ ...common, inputProps: composition.props, outputDir: frameDirectory,
              concurrency, imageFormat: "png", onStart: () => console.log(`Rendering ${composition.id}…`),
              onFrameUpdate: count => { if (count % 60 === 0) console.log(`  ${count}/${composition.durationInFrames} frames`); } });
            await stitchFramesToVideo({ assetsInfo: frames.assetsInfo, fps: composition.fps,
              width: composition.width, height: composition.height, outputLocation: temporary,
              codec: format === "mp4" ? "h264" : "vp9", crf: format === "mp4" ? 23 : 32,
              pixelFormat: "yuv420p", muted: true, ...(format === "mp4" ? { x264Preset: "slow" as const } : {}) });
          }
          await rename(temporary, destination);
        }
        const { size } = await stat(destination);
        report.push({ id: composition.id, format, bytes: size });
        console.log(`${composition.id}.${format}: ${(size / 1024).toFixed(1)} KiB${size > 500_000 && format !== "jpg" ? " (above 500 KB target)" : ""}`);
      }
    } finally {
      // This is the unique directory returned by mkdtemp, never a user supplied path.
      if (path.dirname(frameDirectory) !== path.resolve(tmpdir()) || !path.basename(frameDirectory).startsWith("rozgar-preview-")) throw new Error("Unsafe frame cleanup path");
      await rm(frameDirectory, { recursive: true, force: true });
    }
  }
  await writeFile(path.join(output, "render-report.json"), JSON.stringify({ width: 960, height: 720, fps: 30, seconds: 6, files: report }, null, 2));
} finally {
  await browser.close({ silent: true });
}
