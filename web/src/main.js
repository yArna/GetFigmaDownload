// 导入样式
import './styles/globals.css'

// 导入 Chart.js 及其组件
import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  BarController,
  LineController,
  DoughnutController,
  PieController,
  Title,
  Tooltip,
  Legend,
  TimeScale
} from 'chart.js'
import 'chartjs-adapter-date-fns'

// 注册 Chart.js 组件
Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  BarController,
  LineController,
  DoughnutController,
  PieController,
  Title,
  Tooltip,
  Legend,
  TimeScale
)

// 将 Chart 暴露到全局，以便现有代码可以使用
window.Chart = Chart

// 导入应用逻辑
import './combined.js'