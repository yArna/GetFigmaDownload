import fs from "node:fs";
let versionsAll = JSON.parse(fs.readFileSync("./verisons.json", "utf-8"));

let urls = new Set();

let obs = [
  ...versionsAll.Windows,
  ...versionsAll.macOS,
  ...versionsAll.macOS_ARM,
];

obs.forEach((ob) => {
  urls.add(ob.url);
});

fs.writeFileSync("./downloadUrls.txt", Array.from(urls).join("\n"));
console.log(`Done! ${urls.size}urls, see downloadUrls.txt` )