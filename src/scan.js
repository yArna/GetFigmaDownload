import axios from "axios"
import fs from "fs"

//--------------------------
// 扫描可用版本，指定最小到最大的版本范围（如 0 -> 120 ）
// 结果保存到 verisons.json 中
scan(116, 130)

//--------------------------

async function scan(min, max) {
    let resultPool = {}

    for (let v1 = min; v1 < max; v1++) {
        for (let v2 = 0; v2 < 20; v2++) {
            for (let v3 = 0; v3 < 20; v3++) {
                let ver = `${v1}.${v2}.${v3}`
                if (v2 == 0) {
                    await fetchVer(ver, resultPool)
                } else {
                    fetchVer(ver, resultPool)
                }
            }
        }
    }
}

async function fetchVer(ver, resultPool) {
    let url_macos = `https://desktop.figma.com/mac/Figma-${ver}.zip`
    let url_windows = `https://desktop.figma.com/win/Figma-${ver}-full.nupkg`
    let url_macos_arm = `https://desktop.figma.com/mac-arm/Figma-${ver}.zip`

    let re = await Promise.all([
        checkUrl(url_macos, ver, `Figma-${ver}.MacOS.zip`, "macOS", resultPool),
        checkUrl(url_macos_arm, ver, `Figma-${ver}.MacOS_ARM.zip`, "macOS_ARM", resultPool),
        checkUrl(url_windows, ver, `Figma-${ver}.Windows.nupkg.zip`, "Windows", resultPool),
    ])

    return re[0] || re[1] || re[2]
}

async function checkUrl(url, ver, fileName, type, resultPool) {
    return await axios
        .head(url)
        .then((re) => {
            if (re?.status == 200) {
                let size = Number.parseInt(re.headers["content-length"])
                let date = new Date(re.headers["last-modified"])
                let result = {
                    ver,
                    url,
                    fileName,
                    type,
                    size,
                    date,
                }

                console.log("💚 Found:", ver, url)
                if (!resultPool[type]) resultPool[type] = []
                resultPool[type].push(result)

                save(resultPool)

                return result
            }
        })
        .catch((error) => console.log("   🖤 Skip:", ver, url))
}

function save(data) {
    fs.writeFileSync("./verisons.json", JSON.stringify(data))
}
