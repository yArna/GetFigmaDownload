// 下载最新版本的 Figma 客户端到 dist
// Windows, macOS, macOS_ARM 三个平台的客户端

import LatestInfo from "../latest.json" with { type: 'json' };

import axios from "axios";
import fs from "fs";
import path from "path";
import os from "os";
import { execFile } from "child_process";
import { promisify } from "util";
import AdmZip from "adm-zip";

const execFileAsync = promisify(execFile);

for (const platform in LatestInfo) {
  const { url } = LatestInfo[platform];
  const filePath = `./dist/${platform}/${platform}.zip`;
  const platformDir = `./dist/${platform}`;


  if(!fs.existsSync(platformDir)){
    fs.mkdirSync(platformDir, { recursive: true });
  }
  

  const writer = fs.createWriteStream(filePath);

  const response = await axios({
    url,
    method: "GET",
    responseType: "stream",
  });

  await streamWithProgress(platform, response, writer);

  await handlePostDownload(platform, filePath, platformDir);
}

async function streamWithProgress(platform, response, writer) {
  const totalBytes = Number(response.headers["content-length"] ?? 0);
  let downloaded = 0;
  let lastPercent = -10;
  let loggedBytes = 0;
  const label = `[${platform}]`;

  if (totalBytes === 0) {
    console.log(`${label} 下载中（未知大小）...`);
  } else {
    console.log(`${label} 开始下载，总大小 ${(totalBytes / (1024 * 1024)).toFixed(2)} MB`);
  }

  response.data.on("data", (chunk) => {
    downloaded += chunk.length;

    if (totalBytes > 0) {
      const percent = Math.floor((downloaded / totalBytes) * 100);
      if (percent - lastPercent >= 5 || percent === 100) {
        lastPercent = percent;
        console.log(`${label} 下载进度 ${percent}%`);
      }
    } else if (downloaded - loggedBytes >= 5 * 1024 * 1024) {
      loggedBytes = downloaded;
      console.log(`${label} 已下载 ${(downloaded / (1024 * 1024)).toFixed(2)} MB`);
    }
  });

  response.data.pipe(writer);

  await new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });

  console.log(`${label} 下载完成 -> ${writer.path}`);
}

async function handlePostDownload(platform, zipPath, outputDir) {
  const lower = platform.toLowerCase();
  const isWindows = platform === "Windows";
  const isMac = lower.startsWith("macos");
  const needsExtraction = isWindows || isMac;

  if (!needsExtraction) {
    return;
  }

  if (isWindows) {
    await prepareWindowsPackage(zipPath, outputDir);
    return;
  }

  if (isMac) {
    await extractWithMacOS(platform, zipPath, outputDir);
  }
}

async function prepareWindowsPackage(zipPath, outputDir) {
  console.log(`[Windows] 解压到临时目录...`);
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "figma-win-"));
  const zip = new AdmZip(zipPath);
  zip.extractAllTo(tempDir, true);
  fs.unlinkSync(zipPath);

  const net45Dir = path.join(tempDir, "lib", "net45");
  if (!fs.existsSync(net45Dir)) {
    console.warn(`[Windows] 未找到 lib/net45 目录：${net45Dir}`);
    fs.rmSync(tempDir, { recursive: true, force: true });
    return;
  }

  const destination = path.join(outputDir, "Figma");
  if (fs.existsSync(destination)) {
    fs.rmSync(destination, { recursive: true, force: true });
  }
  fs.mkdirSync(destination, { recursive: true });

  console.log(`[Windows] 复制 lib/net45 -> ${destination}`);
  copyDirectory(net45Dir, destination);

  fs.rmSync(tempDir, { recursive: true, force: true });
  console.log(`[Windows] 处理完成 -> ${destination}`);
}

function copyDirectory(source, target) {
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const srcPath = path.join(source, entry.name);
    const destPath = path.join(target, entry.name);

    if (entry.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

async function extractWithMacOS(platform, zipPath, outputDir) {
  console.log(`[${platform}] 使用 macOS 系统解压工具解压...`);

  const useSystemDitto = process.platform === "darwin";

  if (useSystemDitto) {
    try {
      await execFileAsync("/usr/bin/ditto", ["-x", "-k", zipPath, outputDir]);
      fs.unlinkSync(zipPath);
      console.log(`[${platform}] 处理完成 -> ${outputDir}`);
      return;
    } catch (error) {
      console.warn(`[${platform}] ditto 解压失败，回退到内置解压: ${error.message}`);
    }
  } else {
    console.warn(`[${platform}] 当前运行环境非 macOS，回退到内置解压。`);
  }

  const zip = new AdmZip(zipPath);
  zip.extractAllTo(outputDir, true);
  fs.unlinkSync(zipPath);
  console.log(`[${platform}] 处理完成 -> ${outputDir}`);
}
