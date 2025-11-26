import axios from "axios";
import fs from "fs";
import { versionCompare } from "fzz";

//--------------------------
// 扫描可用版本，指定最小到最大的版本范围（如 0 -> 120 ）
// 结果保存到 versions.json 中
// scan(125, 127);
scan("125.10.4", 127);

//--------------------------

async function scan(min, max) {
  let resultPool = Object.assign({});

  const parse = (v) => {
    if (typeof v === "number") return { v1: v, v2: 0, v3: 0, isNum: true };
    const [v1, v2 = 0, v3 = 0] = v.split(".").map(Number);
    return { v1, v2, v3, isNum: false };
  };

  const start = parse(min);
  const end = parse(max);

  const maxV1 = end.isNum ? end.v1 : end.v1 + 1;

  for (let v1 = start.v1; v1 < maxV1; v1++) {
    for (let v2 = 0; v2 < 30; v2++) {
      for (let v3 = 0; v3 < 30; v3++) {
        // Check min
        if (v1 === start.v1) {
          if (v2 < start.v2) continue;
          if (v2 === start.v2 && v3 < start.v3) continue;
        }
        // Check max
        if (!end.isNum && v1 === end.v1) {
          if (v2 > end.v2) break;
          if (v2 === end.v2 && v3 >= end.v3) break;
        }

        let ver = `${v1}.${v2}.${v3}`;
        if (v2 == 0) {
          await fetchVer(ver, resultPool);
        } else {
          fetchVer(ver, resultPool);
        }
      }
    }
  }
}

async function fetchVer(ver, resultPool) {
  let url_macos = `https://desktop.figma.com/mac/Figma-${ver}.zip`;
  let url_windows = `https://desktop.figma.com/win/Figma-${ver}-full.nupkg`;
  let url_macos_arm = `https://desktop.figma.com/mac-arm/Figma-${ver}.zip`;

  let re = await Promise.all([
    checkUrl(url_macos, ver, `Figma-${ver}.MacOS.zip`, "macOS", resultPool),
    checkUrl(
      url_macos_arm,
      ver,
      `Figma-${ver}.MacOS_ARM.zip`,
      "macOS_ARM",
      resultPool
    ),
    checkUrl(
      url_windows,
      ver,
      `Figma-${ver}.Windows.nupkg.zip`,
      "Windows",
      resultPool
    ),
  ]);

  return re[0] || re[1] || re[2];
}

async function checkUrl(url, ver, fileName, type, resultPool) {
  return await axios
    .head(url)
    .then((re) => {
      if (re?.status == 200) {
        let size = Number.parseInt(re.headers["content-length"]);
        let date = new Date(re.headers["last-modified"]);
        let result = {
          ver,
          url,
          fileName,
          type,
          size,
          date,
        };

        console.log("💚 Found:", ver, url);
        if (!resultPool[type]) resultPool[type] = [];
        resultPool[type].push(result);

        save(resultPool);

        return result;
      }
    })
    .catch((error) => console.log("   🖤 Skip:", ver, url));
}

function save(data) {
  fs.writeFileSync("./versions-last.json", JSON.stringify(data, null, 4));
}
