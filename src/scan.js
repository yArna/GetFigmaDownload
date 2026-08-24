import { scan } from "./lib/scanner.js";
import { getLastLocalVersion, fetchOnlineLatestVersion } from "./lib/version.js";

//--------------------------------------------------------------
// 扫描可用版本：自动从本地读取上一次检测版本，从线上获取最新版本
// scan(上一次检测的版本, 线上最新版本);
// 结果保存到 ./versions-last.json 中
//--------------------------------------------------------------

/**
 * 启动扫描流程的主函数
 */
async function main() {
  const args = process.argv.slice(2);
  let min = args[0];
  let max = args[1];

  // 若未指定参数，则自动获取本地上一次检测版本与线上最新版本
  if (!min) {
    min = getLastLocalVersion();
  }
  if (!max) {
    // 自动获取线上数据
    max = await fetchOnlineLatestVersion();
    // max = "127.1.1"
  }

  await scan(min, max);
}

// 导出扫描函数供外部模块调用
export { scan, getLastLocalVersion, fetchOnlineLatestVersion };

// 如果直接运行此脚本则执行主流程
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
