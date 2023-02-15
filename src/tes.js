import axios from "axios"
import dayjs from "dayjs"

axios.head("https://desktop.figma.com/mac/Figma-97.7.0.zip").then((re) => {
    let size = Number.parseInt(re.headers["content-length"])
    let date = new Date(re.headers["last-modified"])

    console.log("size", (size / 1024 / 1024).toFixed(2) + "MB")
    console.log("date", dayjs(date).format("YYYY/MM/DD"))
})
