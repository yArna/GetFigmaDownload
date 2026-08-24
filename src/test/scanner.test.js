import fs from "fs";
import path from "path";
import os from "os";
import { saveResults } from "../lib/scanner.js";

describe("扫描器结果保存与文件操作", () => {
  test("能正确格式化并保存扫描结果到指定的 JSON 文件", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "figma-scanner-test-"));
    const outputPath = path.join(tempDir, "versions-last.test.json");
    const mockResult = {
      macOS: [
        {
          ver: "126.7.10",
          url: "https://desktop.figma.com/mac/Figma-126.7.10.zip",
          fileName: "Figma-126.7.10.MacOS.zip",
          type: "macOS",
          size: 128000000,
          date: "2026-08-20T00:00:00.000Z",
        },
      ],
    };

    saveResults(mockResult, outputPath);

    expect(fs.existsSync(outputPath)).toBe(true);
    const content = JSON.parse(fs.readFileSync(outputPath, "utf-8"));
    expect(content.macOS).toHaveLength(1);
    expect(content.macOS[0].ver).toBe("126.7.10");

    fs.rmSync(tempDir, { recursive: true, force: true });
  });
});
