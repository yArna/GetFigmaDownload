import axios from "axios";
import fs from "fs";
import chalk from "chalk";
import {
  fetchOnlineLatestVersion,
  getLastLocalVersion,
  generateVersionList,
} from "./version.js";

/**
 * 检查单个下载 URL 是否有效（发送 HEAD 请求）
 *
 * @param {string} url - 目标文件下载 URL
 * @param {string} ver - 版本号
 * @param {string} fileName - 文件名称
 * @param {string} type - 平台类型（如 macOS, macOS_ARM, Windows）
 * @param {object} resultPool - 结果收集池
 * @param {string} [outputPath] - 实时保存的输出路径
 * @returns {Promise<object|null>} 成功返回结果对象，失败返回 null
 */
export async function checkUrl(url, ver, fileName, type, resultPool, outputPath) {
  try {
    const res = await axios.head(url, { timeout: 10000 });
    if (res?.status === 200) {
      const size = Number.parseInt(res.headers["content-length"] ?? 0);
      const date = new Date(res.headers["last-modified"] ?? Date.now());
      const result = {
        ver,
        url,
        fileName,
        type,
        size,
        date,
      };

      const sizeStr = (size / 1024 / 1024).toFixed(2);
      console.log(
        chalk.green.bold("💚 Found:") +
          " " +
          chalk.cyan(`[${type}]`) +
          " " +
          chalk.yellow.bold(`v${ver}`) +
          " " +
          chalk.dim(`(${sizeStr}MB)`) +
          " " +
          chalk.underline(url)
      );

      if (!resultPool[type]) {
        resultPool[type] = [];
      }
      resultPool[type].push(result);

      if (outputPath) {
        saveResults(resultPool, outputPath);
      }

      return result;
    }
  } catch (error) {
    // 忽略 404 等未找到错误
  }
  return null;
}

/**
 * 探测某个特定版本的各平台下载地址
 *
 * @param {string} ver - 版本号
 * @param {object} resultPool - 结果收集池
 * @param {string} [outputPath] - 输出文件路径
 * @returns {Promise<object[]>} 该版本探测到的有效平台结果数组
 */
export async function fetchVer(ver, resultPool, outputPath) {
  const url_macos = `https://desktop.figma.com/mac/Figma-${ver}.zip`;
  const url_macos_arm = `https://desktop.figma.com/mac-arm/Figma-${ver}.zip`;
  const url_windows = `https://desktop.figma.com/win/Figma-${ver}-full.nupkg`;

  const results = await Promise.all([
    checkUrl(url_macos, ver, `Figma-${ver}.MacOS.zip`, "macOS", resultPool, outputPath),
    checkUrl(url_macos_arm, ver, `Figma-${ver}.MacOS_ARM.zip`, "macOS_ARM", resultPool, outputPath),
    checkUrl(url_windows, ver, `Figma-${ver}.Windows.nupkg.zip`, "Windows", resultPool, outputPath),
  ]);

  const foundAny = results.some((r) => r !== null);
  if (!foundAny) {
    console.log(chalk.gray(`   🖤 Skip: v${ver}`));
  }

  return results.filter(Boolean);
}

/**
 * 将扫描结果保存到本地 JSON 文件
 *
 * @param {object} data - 扫描结果对象
 * @param {string} [filePath="./versions-last.json"] - 目标写入路径
 */
export function saveResults(data, filePath = "./versions-last.json") {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 4));
}

/**
 * 扫描指定版本范围内的 Figma 客户端下载地址
 * 如果未提供 min 或 max，将自动获取本地上次检测版本和线上最新版本
 *
 * @param {string|number} [min] - 起始检测版本（留空则自动从本地 latest.json / versions.json 读取）
 * @param {string|number} [max] - 目标最新版本（留空则自动从线上 version.txt 接口获取）
 * @param {object} [options] - 扫描配置选项
 * @param {number} [options.concurrency=10] - 并发扫描任务数
 * @param {string} [options.outputPath="./versions-last.json"] - 结果输出路径
 * @param {number} [options.maxV2=30] - 次版本号上限扫描范围
 * @param {number} [options.maxV3=30] - 修订版本号上限扫描范围
 * @returns {Promise<{ resultPool: object, totalFound: number, versionCount: number, durationMs: number }>} 扫描结果详情
 */
export async function scan(min, max, options = {}) {
  const startTime = Date.now();
  const {
    concurrency = 10,
    outputPath = "./versions-last.json",
    maxV2 = 30,
    maxV3 = 30,
  } = options;

  console.log(chalk.bold.magenta("\n🔍 [Figma 下载扫描器] 准备开始扫描..."));

  // 1. 自动解析起始版本
  let startVer = min;
  if (!startVer) {
    startVer = getLastLocalVersion();
    console.log(
      chalk.blue("📌 上一次检测的版本 (本地): ") + chalk.bold.cyan(`v${startVer}`)
    );
  } else {
    console.log(
      chalk.blue("📌 指定起始扫描版本: ") + chalk.bold.cyan(`${startVer}`)
    );
  }

  // 2. 自动解析线上最新版本
  let endVer = max;
  if (!endVer) {
    try {
      endVer = await fetchOnlineLatestVersion();
      console.log(
        chalk.green("🌐 线上最新发布版本 (远程): ") + chalk.bold.yellow(`v${endVer}`)
      );
    } catch (err) {
      console.warn(
        chalk.red(`⚠️ 获取线上最新版本失败，回退到默认扫描范围: ${err.message}`)
      );
      endVer = 127;
    }
  } else {
    console.log(
      chalk.green("🌐 指定目标结束版本: ") + chalk.bold.yellow(`${endVer}`)
    );
  }

  // 3. 生成待探测版本列表
  const versionList = generateVersionList(startVer, endVer, maxV2, maxV3);
  console.log(
    chalk.cyan(`🚀 即将扫描版本区间: `) +
      chalk.bold(`[${startVer} -> ${endVer}]`) +
      chalk.dim(` (共 ${versionList.length} 个版本候选, 并发数: ${concurrency})\n`)
  );

  if (versionList.length === 0) {
    console.log(chalk.yellow("⚡ 当前本地版本已是最新或扫描区间为空，无需扫描。"));
    return {
      resultPool: {},
      totalFound: 0,
      versionCount: 0,
      durationMs: Date.now() - startTime,
    };
  }

  const resultPool = {};

  // 4. 并发池队列扫描
  let index = 0;
  async function worker() {
    while (index < versionList.length) {
      const currentIndex = index++;
      const ver = versionList[currentIndex];
      await fetchVer(ver, resultPool, outputPath);
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, versionList.length) },
    () => worker()
  );
  await Promise.all(workers);

  // 5. 保存最终扫描结果
  saveResults(resultPool, outputPath);

  const durationMs = Date.now() - startTime;
  let totalFound = 0;
  for (const type of Object.keys(resultPool)) {
    totalFound += resultPool[type].length;
  }

  // 6. 打印统计报告
  console.log(
    "\n" +
      chalk.bold.green("✨ 扫描完成！") +
      "\n" +
      chalk.cyan(`⏱️  总耗时: ${(durationMs / 1000).toFixed(2)}s`) +
      "\n" +
      chalk.yellow(`📦 探测版本数: ${versionList.length}`) +
      "\n" +
      chalk.green(`🎉 发现可用版本数: ${totalFound}`) +
      "\n" +
      chalk.dim(`💾 结果已保存至: ${outputPath}\n`)
  );

  return {
    resultPool,
    totalFound,
    versionCount: versionList.length,
    durationMs,
  };
}
