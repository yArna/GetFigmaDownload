import fs from "fs";
import path from "path";
import os from "os";
import {
  parseVersion,
  generateVersionList,
  getLastLocalVersion,
  fetchOnlineLatestVersion,
} from "../lib/version.js";

describe("版本号解析与版本列表生成", () => {
  test("正确解析数字形式的主版本号", () => {
    const result = parseVersion(127);
    expect(result).toEqual({
      v1: 127,
      v2: 0,
      v3: 0,
      isNum: true,
      raw: 127,
    });
  });

  test("正确解析标准三段式版本号字符串", () => {
    const result = parseVersion("126.6.12");
    expect(result).toEqual({
      v1: 126,
      v2: 6,
      v3: 12,
      isNum: false,
      raw: "126.6.12",
    });
  });

  test("解析缺少小版本号的字符串时自动补零", () => {
    const result = parseVersion("126");
    expect(result).toEqual({
      v1: 126,
      v2: 0,
      v3: 0,
      isNum: false,
      raw: "126",
    });
  });

  test("当起始版本与结束版本相同时，生成包含自身的单元素列表", () => {
    const list = generateVersionList("126.7.10", "126.7.10");
    expect(list).toEqual(["126.7.10"]);
  });

  test("生成版本列表包含起始边界和结束边界，并覆盖中间所有可能的小版本", () => {
    const list = generateVersionList("126.6.12", "126.7.2", 10, 15);
    // 起始版本应该包含 126.6.12
    expect(list).toContain("126.6.12");
    // 包含 126.6.13, 126.6.14
    expect(list).toContain("126.6.13");
    expect(list).toContain("126.6.14");
    // 包含 126.7.0, 126.7.1, 126.7.2
    expect(list).toContain("126.7.0");
    expect(list).toContain("126.7.1");
    expect(list).toContain("126.7.2");
    // 不应包含小于起始版本或大于结束版本的项目
    expect(list).not.toContain("126.6.11");
    expect(list).not.toContain("126.7.3");
  });

  test("当起始版本大于结束版本时，返回空数组", () => {
    const list = generateVersionList("126.7.10", "126.6.12");
    expect(list).toEqual([]);
  });
});

describe("获取本地与线上版本号", () => {
  test("能正确从 mock 的 latest.json 中获取最大版本", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "figma-test-"));
    const mockLatestFile = path.join(tempDir, "latest.json");
    const mockData = {
      Windows: { ver: "126.6.10" },
      macOS: { ver: "126.6.12" },
      macOS_ARM: { ver: "126.6.12" },
    };
    fs.writeFileSync(mockLatestFile, JSON.stringify(mockData));

    const ver = getLastLocalVersion({ latestPath: mockLatestFile });
    expect(ver).toBe("126.6.12");

    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test("当 latest.json 不存在时，能从 versions.json 中读取最大版本", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "figma-test-"));
    const mockVersionsFile = path.join(tempDir, "versions.json");
    const mockData = {
      macOS: [{ ver: "1.5.0" }, { ver: "126.5.0" }],
      Windows: [{ ver: "126.6.12" }],
    };
    fs.writeFileSync(mockVersionsFile, JSON.stringify(mockData));

    const ver = getLastLocalVersion({
      latestPath: path.join(tempDir, "not-exist.json"),
      versionsPath: mockVersionsFile,
    });
    expect(ver).toBe("126.6.12");

    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test("文件均不存在时返回默认版本 0.0.0", () => {
    const ver = getLastLocalVersion({
      latestPath: "./non-existent-latest.json",
      versionsPath: "./non-existent-versions.json",
    });
    expect(ver).toBe("0.0.0");
  });

  test("能成功从线上 version.txt 接口获取有效的三段式版本号", async () => {
    const version = await fetchOnlineLatestVersion();
    expect(version).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
