import fs from "fs"
import dayjs from "dayjs"
import { compareVersions } from "compare-versions"

let readmeBase = fs.readFileSync("./readme.base.md").toString()
let versions = JSON.parse(fs.readFileSync("./versions.json").toString())
let versions_old = JSON.parse(fs.readFileSync("./versions.old.json").toString())

let versionsResultMap = {}
let lastVersions = {}

resolveVesions(versions_old)
resolveVesions(versions)

let tableMd =
    `版本|日期|Windows|macOS|macOS_ARM(苹果芯片)\n---|---|---|---|---\n` +
    resultToMdTable(versionsResultMap, lastVersions)
let latestMd =
    `平台|版本|日期|地址\n---|---|---|---\n` +
    Object.entries(lastVersions)
        .map(([type, ob]) => `${ob.title}|${ob.ver}|${ob.date}|${ob.url}`)
        .join("\n")

let finReadme = readmeBase.replace(`[---全部数据---]`, tableMd)
finReadme = finReadme.replace(`[---最新数据---]`, latestMd)

fs.writeFileSync("./readme.md", finReadme)
fs.writeFileSync("./latest.json", JSON.stringify(lastVersions, null, 4))

function resultToMdTable(versionsResultMap, lastVesions) {
    return Object.entries(versionsResultMap)
        .sort((a, b) => compareVersions(a[0], b[0]))
        .reverse()
        .map(([ver, x]) => {
            let file_windows = x["Windows"]
            let file_macOS = x["macOS"]
            let file_macOS_ARM = x["macOS_ARM"]

            let date = file_windows?.date ?? file_macOS?.date ?? file_macOS_ARM?.date

            ;[
                [file_windows, "Windows"],
                [file_macOS, "macOS"],
                [file_macOS_ARM, "macOS_ARM"],
            ].forEach(([file_ob, type]) => {
                if (file_ob && compareVersions(ver, lastVesions[type]?.ver ?? "0") == 1) {
                    lastVesions[type] = {
                        ver,
                        date: dayjs(file_ob.date).format("YYYY/MM/DD"),
                        url: file_ob.url,
                        title: `[${type}(${readableSize(file_ob.size)})](${file_ob.url})`,
                    }
                }
            })

            return [
                `\`v${ver}\``,
                dayjs(date).format("YYYY/MM/DD"),
                file_windows ? `[Windows(${readableSize(file_windows.size)})](${file_windows.url})` : "",
                file_macOS ? `[macOS(${readableSize(file_macOS.size)})](${file_macOS.url})` : "",
                file_macOS_ARM ? `[macOS_ARM(${readableSize(file_macOS_ARM.size)})](${file_macOS_ARM.url})` : "",
            ].join("|")
        })
        .join("\n")
}

function resolveVesions(versions) {
    for (const key in versions) {
        let list = versions[key]
        for (const item of list) {
            if (!versionsResultMap[item.ver]) versionsResultMap[item.ver] = {}
            versionsResultMap[item.ver][item.type] = item
        }
    }
}

function readableSize(size) {
    return (size / 1024 / 1024).toFixed(2) + "MB"
}
