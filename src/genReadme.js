import fs from "fs"
import dayjs from "dayjs"
import { compareVersions } from "compare-versions"

let readmeBase = fs.readFileSync("./readme.base.md").toString()
let verisons = JSON.parse(fs.readFileSync("./verisons.json").toString())
let verisons_old = JSON.parse(fs.readFileSync("./verisons.old.json").toString())

let versionsResultMap = {}

resolveVesions(verisons_old)
resolveVesions(verisons)

let tableMd = `版本|日期|Windows|macOS|macOS_ARM(苹果芯片)\n---|---|---|---|---\n` + resultToMdTable(versionsResultMap)
let finReadme = readmeBase.replace(`[---全部数据---]`, tableMd)
fs.writeFileSync("./readme.md", finReadme)

function resultToMdTable(versionsResultMap) {
    return Object.entries(versionsResultMap)
        .sort((a, b) => compareVersions(a[0], b[0]))
        .reverse()
        .map(([ver, x]) => {
            let file_windows = x["Windows"]
            let file_macOS = x["macOS"]
            let file_macOS_ARM = x["macOS_ARM"]

            let date = file_windows?.date ?? file_macOS?.date ?? file_macOS_ARM?.date

            return [
                `\`v${ver}\``,
                dayjs(date).format("YYYY/MM/DD"),
                file_windows ? `[Windows(${readableSize(file_windows.size)})](${file_windows.url})` : "",
                file_macOS ? `[macOS(${readableSize(file_macOS.size)})](${file_macOS.url})` : "",
                file_macOS_ARM ? `[macOS_RAM(${readableSize(file_macOS_ARM.size)})](${file_macOS_ARM.url})` : "",
            ].join("|")
        })
        .join("\n")
}

function resolveVesions(verisons) {
    for (const key in verisons) {
        let list = verisons[key]
        for (const item of list) {
            if (!versionsResultMap[item.ver]) versionsResultMap[item.ver] = {}
            versionsResultMap[item.ver][item.type] = item
        }
    }
}

function readableSize(size) {
    return (size / 1024 / 1024).toFixed(2) + "MB"
}
