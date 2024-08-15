// 下载最新版本的 Figma 客户端到 dist
// Windows, macOS, macOS_ARM 三个平台的客户端

import LatestInfo from "../latest.json" with { type: 'json' };

import axios from "axios";
import fs from "fs";

for (const platform in LatestInfo) {
  const { url } = LatestInfo[platform];
  const filePath = `./dist/${platform}/${platform}.zip`;


  if(!fs.existsSync(`./dist/${platform}`)){
    fs.mkdirSync(`./dist/${platform}`, { recursive: true });
  }

  const writer = fs.createWriteStream(filePath);


  const response = await axios({
    url,
    method: "GET",
    responseType: "stream",
  });

  response.data.pipe(writer);

  await new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });

  console.log(`Downloaded ${platform} to ${filePath}`);
}
