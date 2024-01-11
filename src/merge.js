import fs from "fs"
import { versionCompare } from "fzz"
merge()
export function merge() {
    let versionsLast = JSON.parse(fs.readFileSync("./verisons-last.json", "utf-8"))
    let versionsAll = JSON.parse(fs.readFileSync("./verisons.json", "utf-8"))

    ;["Windows", "macOS", "macOS_ARM"].forEach((type) => {
        console.log("Merge:", type)
        if (!versionsLast[type]) return
        versionsLast[type].forEach((item) => {
            let index = versionsAll[type].findIndex((i) => i.ver == item.ver)
            if (index == -1) {
                versionsAll[type].push(item)
                console.log("Add:", type, item)
            }
        })

        versionsAll[type] = versionsAll[type].sort((a, b) => {
            return versionCompare(a.ver, b.ver)
        })
    })

    fs.writeFileSync("./verisons.json", JSON.stringify(versionsAll, null, 4))
}
