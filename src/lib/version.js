import axios from "axios";
import fs from "fs";
import { compareVersions } from "compare-versions";

/**
 * 线上最新版本查询的默认接口地址（macOS 平台）
 */
export const DEFAULT_ONLINE_VERSION_URL = "https://desktop.figma.com/mac/version.txt";

/**
 * 从线上获取 Figma 客户端最新版本号
 *
 * @param {string} [url=DEFAULT_ONLINE_VERSION_URL] - 获取版本号的 URL
 * @returns {Promise<string>} 线上最新版本号，例如 "126.7.10"
 */
export async function fetchOnlineLatestVersion(url = DEFAULT_ONLINE_VERSION_URL) {
  try {
    const response = await axios.get(url, { timeout: 10000 });
    const version = String(response.data).trim();
    if (!version) {
      throw new Error("获取到的版本号为空");
    }
    return version;
  } catch (error) {
    throw new Error(`获取线上最新版本失败 [${url}]: ${error.message}`);
  }
}

/**
 * 从本地配置文件中获取上一次检测/记录的最大版本号
 * 优先读取 latest.json，若无则从 versions.json 读取
 *
 * @param {object} [options] - 配置参数
 * @param {string} [options.latestPath="./latest.json"] - latest.json 文件路径
 * @param {string} [options.versionsPath="./versions.json"] - versions.json 文件路径
 * @returns {string} 本地检测到的最大版本号，若无则返回 "0.0.0"
 */
export function getLastLocalVersion(options = {}) {
  const { latestPath = "./latest.json", versionsPath = "./versions.json" } = options;

  let maxVersion = null;

  // 1. 优先尝试从 latest.json 获取
  if (fs.existsSync(latestPath)) {
    try {
      const latestData = JSON.parse(fs.readFileSync(latestPath, "utf-8"));
      for (const platform of Object.keys(latestData)) {
        const item = latestData[platform];
        if (item && item.ver) {
          if (!maxVersion || compareVersions(item.ver, maxVersion) > 0) {
            maxVersion = item.ver;
          }
        }
      }
    } catch {
      // 忽略解析错误，继续尝试 versions.json
    }
  }

  if (maxVersion) {
    return maxVersion;
  }

  // 2. 尝试从 versions.json 获取
  if (fs.existsSync(versionsPath)) {
    try {
      const versionsData = JSON.parse(fs.readFileSync(versionsPath, "utf-8"));
      for (const platform of Object.keys(versionsData)) {
        const list = versionsData[platform];
        if (Array.isArray(list)) {
          for (const item of list) {
            if (item && item.ver) {
              if (!maxVersion || compareVersions(item.ver, maxVersion) > 0) {
                maxVersion = item.ver;
              }
            }
          }
        }
      }
    } catch {
      // 忽略解析错误
    }
  }

  return maxVersion || "0.0.0";
}

/**
 * 解析版本号（支持数字或语义化版本号字符串）
 *
 * @param {number|string} v - 版本号输入，如 127 或 "126.6.12"
 * @returns {{ v1: number, v2: number, v3: number, isNum: boolean, raw: number|string }} 解析后的版本对象
 */
export function parseVersion(v) {
  if (typeof v === "number") {
    return { v1: v, v2: 0, v3: 0, isNum: true, raw: v };
  }
  const parts = String(v).split(".").map(Number);
  const v1 = Number.isNaN(parts[0]) ? 0 : parts[0];
  const v2 = parts[1] !== undefined && !Number.isNaN(parts[1]) ? parts[1] : 0;
  const v3 = parts[2] !== undefined && !Number.isNaN(parts[2]) ? parts[2] : 0;
  return { v1, v2, v3, isNum: false, raw: v };
}

/**
 * 生成在 [min, max] 版本区间内的所有待探测版本号列表
 *
 * @param {number|string} min - 起始版本，如 "126.6.12"
 * @param {number|string} max - 结束版本，如 "126.7.10" 或 127
 * @param {number} [maxV2=30] - 次版本号上限扫描范围（0 到 maxV2-1）
 * @param {number} [maxV3=30] - 修订版本号上限扫描范围（0 到 maxV3-1）
 * @returns {string[]} 待扫描的版本号列表
 */
export function generateVersionList(min, max, maxV2 = 30, maxV3 = 30) {
  const start = parseVersion(min);
  const end = parseVersion(max);

  // 如果 min 与 max 完全相同（且不是纯数字），直接返回单个版本
  if (!start.isNum && !end.isNum && min === max) {
    return [String(min)];
  }

  // 如果起始版本大于结束版本，返回空列表
  if (!start.isNum && !end.isNum && compareVersions(String(min), String(max)) > 0) {
    return [];
  }

  const list = [];
  const maxV1 = end.isNum ? end.v1 : end.v1 + 1;

  for (let v1 = start.v1; v1 < maxV1; v1++) {
    for (let v2 = 0; v2 < maxV2; v2++) {
      for (let v3 = 0; v3 < maxV3; v3++) {
        // 检查起始边界
        if (v1 === start.v1) {
          if (v2 < start.v2) continue;
          if (v2 === start.v2 && v3 < start.v3) continue;
        }

        // 检查结束边界
        if (!end.isNum && v1 === end.v1) {
          if (v2 > end.v2) break;
          if (v2 === end.v2 && v3 > end.v3) break;
        }

        list.push(`${v1}.${v2}.${v3}`);
      }
    }
  }

  return list;
}
