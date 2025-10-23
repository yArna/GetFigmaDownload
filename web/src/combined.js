import vesionsData from "../versions.json";
// 结合版本分析和下载功能的应用
class FigmaAnalyzerApp {
  constructor() {
    this.allVersions = [];
    this.filteredVersions = [];
    this.selectedVersions = new Set();
    this.currentTab = "analysis";

    this.init();
  }

  async init() {
    try {
      await this.loadVersionData();
      this.setupEventListeners();
      this.renderInitialData();
      this.hideLoading();
    } catch (error) {
      console.error("初始化失败:", error);
      this.showError("加载版本数据失败: " + error.message);
    }
  }

  async loadVersionData() {
    const data = vesionsData;

    // 将所有平台的版本合并到一个数组中，并添加平台信息
    this.allVersions = [];
    Object.keys(data).forEach((platform) => {
      data[platform].forEach((version) => {
        this.allVersions.push({
          ...version,
          platform: platform,
        });
      });
    });

    // 按日期排序（最新的在前）
    this.allVersions.sort((a, b) => new Date(b.date) - new Date(a.date));

    this.filteredVersions = [...this.allVersions];
  }

  setupEventListeners() {
    // Tab 切换事件
    document
      .getElementById("analysisTab")
      .addEventListener("click", () => this.switchTab("analysis"));
    document
      .getElementById("downloadTab")
      .addEventListener("click", () => this.switchTab("download"));

    // 分析页面筛选器事件
    document
      .getElementById("platformSelect")
      ?.addEventListener("change", () => this.updateCharts());
    document
      .getElementById("yearSelect")
      ?.addEventListener("change", () => this.updateCharts());

    // 下载页面筛选器事件
    document
      .getElementById("downloadPlatformFilter")
      ?.addEventListener("change", () => this.applyDownloadFilters());
    document
      .getElementById("downloadVersionSearch")
      ?.addEventListener("input", () => this.applyDownloadFilters());
    document
      .getElementById("downloadYearFilter")
      ?.addEventListener("change", () => this.applyDownloadFilters());
    document
      .getElementById("downloadSortOrder")
      ?.addEventListener("change", () => this.applyDownloadFilters());

    // 下载页面全选事件
    document
      .getElementById("downloadSelectAll")
      ?.addEventListener("change", (e) =>
        this.handleSelectAll(e.target.checked)
      );
    document
      .getElementById("downloadHeaderSelectAll")
      ?.addEventListener("change", (e) =>
        this.handleSelectAll(e.target.checked)
      );

    // 批量下载
    document
      .getElementById("downloadSelectedBtn")
      ?.addEventListener("click", () => this.downloadSelected());

    // 模态框关闭
    document
      .getElementById("closeModal")
      ?.addEventListener("click", () => this.hideModal());
  }

  switchTab(tab) {
    this.currentTab = tab;

    // 更新 tab 按钮样式
    const analysisTab = document.getElementById("analysisTab");
    const downloadTab = document.getElementById("downloadTab");

    if (tab === "analysis") {
      analysisTab.className =
        "tab-button border-blue-500 text-blue-600 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm";
      downloadTab.className =
        "tab-button border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm";

      document.getElementById("analysisContent").classList.remove("hidden");
      document.getElementById("downloadContent").classList.add("hidden");
    } else {
      downloadTab.className =
        "tab-button border-blue-500 text-blue-600 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm";
      analysisTab.className =
        "tab-button border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm";

      document.getElementById("analysisContent").classList.add("hidden");
      document.getElementById("downloadContent").classList.remove("hidden");

      // 初始化下载页面数据
      this.initDownloadTab();
    }
  }

  renderInitialData() {
    this.populateAnalysisData();
    this.setupCharts();
    this.updateCharts();
  }

  populateAnalysisData() {
    // 总版本数
    document.getElementById("totalVersions").textContent =
      this.allVersions.length;

    // 计算平均更新间隔
    const sortedVersions = [...this.allVersions].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );
    let totalDays = 0;
    let intervalCount = 0;

    for (let i = 1; i < sortedVersions.length; i++) {
      const prevDate = new Date(sortedVersions[i - 1].date);
      const currDate = new Date(sortedVersions[i].date);
      const daysDiff = Math.abs((currDate - prevDate) / (1000 * 60 * 60 * 24));
      totalDays += daysDiff;
      intervalCount++;
    }

    const avgDays =
      intervalCount > 0 ? Math.round(totalDays / intervalCount) : 0;
    document.getElementById("avgDaysBetween").textContent = avgDays;

    // 时间跨度
    if (sortedVersions.length > 0) {
      const startYear = new Date(sortedVersions[0].date).getFullYear();
      const endYear = new Date(
        sortedVersions[sortedVersions.length - 1].date
      ).getFullYear();
      document.getElementById(
        "yearRange"
      ).textContent = `${startYear} - ${endYear}`;
    }

    // 最活跃年份
    const yearCounts = {};
    this.allVersions.forEach((version) => {
      const year = new Date(version.date).getFullYear();
      yearCounts[year] = (yearCounts[year] || 0) + 1;
    });

    const mostActiveYear = Object.keys(yearCounts).reduce(
      (a, b) => (yearCounts[a] > yearCounts[b] ? a : b),
      Object.keys(yearCounts)[0]
    );

    document.getElementById("mostActiveYear").textContent =
      mostActiveYear || "-";

    // 填充年份选择器
    this.populateYearSelect();

    // 生成洞察
    this.generateInsights();
  }

  populateYearSelect() {
    const yearSelect = document.getElementById("yearSelect");
    const years = new Set();

    this.allVersions.forEach((version) => {
      const year = new Date(version.date).getFullYear();
      years.add(year);
    });

    const sortedYears = Array.from(years).sort((a, b) => b - a);

    sortedYears.forEach((year) => {
      const option = document.createElement("option");
      option.value = year;
      option.textContent = year;
      yearSelect.appendChild(option);
    });
  }

  generateInsights() {
    const insights = [];

    // 分析更新频率
    const yearCounts = {};
    this.allVersions.forEach((version) => {
      const year = new Date(version.date).getFullYear();
      yearCounts[year] = (yearCounts[year] || 0) + 1;
    });

    const years = Object.keys(yearCounts).map(Number).sort();
    const maxYear = Math.max(...Object.values(yearCounts));
    const mostActiveYear = Object.keys(yearCounts).find(
      (year) => yearCounts[year] === maxYear
    );

    insights.push(
      `最活跃的年份是 ${mostActiveYear}，共发布了 ${maxYear} 个版本`
    );

    // 分析平台分布
    const platformCounts = {};
    this.allVersions.forEach((version) => {
      platformCounts[version.platform] =
        (platformCounts[version.platform] || 0) + 1;
    });

    const platformNames = {
      Windows: "Windows",
      macOS: "macOS",
      macOS_ARM: "macOS ARM",
    };

    const topPlatform = Object.keys(platformCounts).reduce((a, b) =>
      platformCounts[a] > platformCounts[b] ? a : b
    );

    insights.push(
      `${platformNames[topPlatform]} 平台版本最多，共 ${platformCounts[topPlatform]} 个版本`
    );

    // 分析更新趋势
    const recentYears = years.slice(-3);
    const recentAvg =
      recentYears.reduce((sum, year) => sum + yearCounts[year], 0) /
      recentYears.length;
    const overallAvg =
      Object.values(yearCounts).reduce((a, b) => a + b, 0) / years.length;

    if (recentAvg > overallAvg) {
      insights.push("近年来版本发布频率呈上升趋势");
    } else {
      insights.push("近年来版本发布频率较为稳定");
    }

    const insightsList = document.getElementById("insights");
    insightsList.innerHTML = insights
      .map((insight) => `<li>• ${insight}</li>`)
      .join("");
  }

  setupCharts() {
    // 这里使用之前 analyzer.js 中的图表设置代码
    // 为了简化，我只实现基本的月度发布趋势图
    this.setupTimelineChart();
    this.setupMonthlyChart();
    this.setupIntervalChart();
    this.setupYearlyChart();
  }

  setupTimelineChart() {
    const ctx = document.getElementById("timelineChart").getContext("2d");
    this.timelineChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: [],
        datasets: [],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            title: {
              display: true,
              text: "时间轴",
              font: {
                size: 14,
                weight: "bold",
              },
              color: "#374151",
            },
            grid: {
              color: "#f3f4f6",
              lineWidth: 1,
            },
            ticks: {
              color: "#6b7280",
              font: {
                size: 12,
              },
              maxTicksLimit: 12,
              callback: function (value, index, ticks) {
                const label = this.getLabelForValue(value);
                // 只显示年份变化的月份或每隔几个月显示一次
                if (index % Math.ceil(ticks.length / 8) === 0) {
                  return label;
                }
                return "";
              },
            },
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "版本发布数量",
              font: {
                size: 14,
                weight: "bold",
              },
              color: "#374151",
            },
            grid: {
              color: "#f3f4f6",
              lineWidth: 1,
            },
            ticks: {
              color: "#6b7280",
              font: {
                size: 12,
              },
              stepSize: 1,
              callback: function (value) {
                return Number.isInteger(value) ? value : "";
              },
            },
          },
        },
        plugins: {
          legend: {
            display: true,
            position: "top",
            labels: {
              font: {
                size: 13,
              },
              color: "#374151",
              usePointStyle: true,
              padding: 20,
            },
          },
          tooltip: {
            mode: "index",
            intersect: false,
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            titleFont: {
              size: 14,
              weight: "bold",
            },
            bodyFont: {
              size: 13,
            },
            cornerRadius: 8,
            displayColors: true,
          },
        },
        interaction: {
          mode: "nearest",
          axis: "x",
          intersect: false,
        },
      },
    });
  }

  setupMonthlyChart() {
    const ctx = document.getElementById("monthlyChart").getContext("2d");
    this.monthlyChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: [
          "1月",
          "2月",
          "3月",
          "4月",
          "5月",
          "6月",
          "7月",
          "8月",
          "9月",
          "10月",
          "11月",
          "12月",
        ],
        datasets: [
          {
            label: "版本发布数量",
            data: [],
            backgroundColor: "rgba(59, 130, 246, 0.6)",
            borderColor: "rgb(59, 130, 246)",
            borderWidth: 2,
            borderRadius: 4,
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            title: {
              display: true,
              text: "月份",
              font: {
                size: 14,
                weight: "bold",
              },
              color: "#374151",
            },
            grid: {
              display: false,
            },
            ticks: {
              color: "#6b7280",
              font: {
                size: 12,
              },
            },
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "发布数量",
              font: {
                size: 14,
                weight: "bold",
              },
              color: "#374151",
            },
            grid: {
              color: "#f3f4f6",
              lineWidth: 1,
            },
            ticks: {
              color: "#6b7280",
              font: {
                size: 12,
              },
              stepSize: 1,
              callback: function (value) {
                return Number.isInteger(value) ? value : "";
              },
            },
          },
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            titleFont: {
              size: 14,
              weight: "bold",
            },
            bodyFont: {
              size: 13,
            },
            cornerRadius: 8,
            callbacks: {
              title: function (context) {
                return context[0].label;
              },
              label: function (context) {
                return `发布数量: ${context.parsed.y}`;
              },
            },
          },
        },
      },
    });
  }

  setupIntervalChart() {
    const ctx = document.getElementById("intervalChart").getContext("2d");
    this.intervalChart = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["≤1天", "2-7天", "8-14天", "15-30天", "31-60天", ">60天"],
        datasets: [
          {
            data: [],
            backgroundColor: [
              "rgb(239, 68, 68)",
              "rgb(245, 158, 11)",
              "rgb(34, 197, 94)",
              "rgb(59, 130, 246)",
              "rgb(147, 51, 234)",
              "rgb(107, 114, 128)",
            ],
            borderWidth: 2,
            borderColor: "#ffffff",
            hoverBorderWidth: 3,
            hoverBorderColor: "#ffffff",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "50%",
        plugins: {
          legend: {
            position: "right",
            labels: {
              font: {
                size: 13,
              },
              color: "#374151",
              usePointStyle: true,
              padding: 15,
              generateLabels: function (chart) {
                const data = chart.data;
                if (data.labels.length && data.datasets.length) {
                  const dataset = data.datasets[0];
                  const total = dataset.data.reduce((a, b) => a + b, 0);

                  return data.labels.map((label, i) => {
                    const value = dataset.data[i];
                    const percentage =
                      total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";

                    return {
                      text: `${label}: ${value} (${percentage}%)`,
                      fillStyle: dataset.backgroundColor[i],
                      strokeStyle: dataset.borderColor,
                      lineWidth: dataset.borderWidth,
                      hidden: false,
                      index: i,
                    };
                  });
                }
                return [];
              },
            },
          },
          tooltip: {
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            titleFont: {
              size: 14,
              weight: "bold",
            },
            bodyFont: {
              size: 13,
            },
            cornerRadius: 8,
            callbacks: {
              label: function (context) {
                const label = context.label;
                const value = context.parsed;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage =
                  total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";
                return `${label}: ${value} 次 (${percentage}%)`;
              },
            },
          },
        },
      },
    });
  }

  setupYearlyChart() {
    const ctx = document.getElementById("yearlyChart").getContext("2d");
    this.yearlyChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: [],
        datasets: [
          {
            label: "年度发布数量",
            data: [],
            borderColor: "rgb(139, 92, 246)",
            backgroundColor: "rgba(139, 92, 246, 0.1)",
            fill: true,
            tension: 0.4,
            borderWidth: 3,
            pointBackgroundColor: "rgb(139, 92, 246)",
            pointBorderColor: "#ffffff",
            pointBorderWidth: 2,
            pointRadius: 6,
            pointHoverRadius: 8,
            pointHoverBackgroundColor: "rgb(139, 92, 246)",
            pointHoverBorderColor: "#ffffff",
            pointHoverBorderWidth: 3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            title: {
              display: true,
              text: "年份",
              font: {
                size: 14,
                weight: "bold",
              },
              color: "#374151",
            },
            grid: {
              color: "#f3f4f6",
              lineWidth: 1,
            },
            ticks: {
              color: "#6b7280",
              font: {
                size: 12,
              },
              callback: function (value, index, ticks) {
                // 确保年份显示为整数
                const year = this.getLabelForValue(value);
                return Number.isInteger(Number(year)) ? year : "";
              },
            },
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "发布数量",
              font: {
                size: 14,
                weight: "bold",
              },
              color: "#374151",
            },
            grid: {
              color: "#f3f4f6",
              lineWidth: 1,
            },
            ticks: {
              color: "#6b7280",
              font: {
                size: 12,
              },
              stepSize: 1,
              callback: function (value) {
                return Number.isInteger(value) ? value : "";
              },
            },
          },
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            titleFont: {
              size: 14,
              weight: "bold",
            },
            bodyFont: {
              size: 13,
            },
            cornerRadius: 8,
            callbacks: {
              title: function (context) {
                return `${context[0].label}年`;
              },
              label: function (context) {
                return `发布数量: ${context.parsed.y}`;
              },
            },
          },
        },
      },
    });
  }

  updateCharts() {
    const platformFilter = document.getElementById("platformSelect").value;
    const yearFilter = document.getElementById("yearSelect").value;

    let filteredData = this.allVersions;

    if (platformFilter !== "all") {
      filteredData = filteredData.filter((v) => v.platform === platformFilter);
    }

    if (yearFilter !== "all") {
      filteredData = filteredData.filter(
        (v) => new Date(v.date).getFullYear().toString() === yearFilter
      );
    }

    this.updateTimelineChart(filteredData);
    this.updateMonthlyChart(filteredData);
    this.updateIntervalChart(filteredData);
    this.updateYearlyChart(filteredData);
  }

  updateTimelineChart(data) {
    // 按年月分组统计
    const monthlyData = {};
    const platforms = ["Windows", "macOS", "macOS_ARM"];
    const platformColors = {
      Windows: {
        border: "rgba(12, 0, 237, 0.8)", // 鲜绿色
        background: "rgba(175, 173, 193, 0.1)",
      },
      macOS: {
        border: "rgba(249, 85, 48, 0.8)", // 紫色
        background: "rgba(162, 48, 249, 0.1)",
      },
      macOS_ARM: {
        border: "rgba(251, 190, 60, 0.8)", // 橙色
        background: "rgba(251, 210, 60, 0.1)",
      },
    };

    // 初始化数据结构
    platforms.forEach((platform) => {
      monthlyData[platform] = {};
    });

    // 统计每个平台每月的发布数量
    data.forEach((version) => {
      const date = new Date(version.date);
      const yearMonth = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;

      if (!monthlyData[version.platform][yearMonth]) {
        monthlyData[version.platform][yearMonth] = 0;
      }
      monthlyData[version.platform][yearMonth]++;
    });

    // 获取所有月份并排序
    const allMonths = new Set();
    platforms.forEach((platform) => {
      Object.keys(monthlyData[platform]).forEach((month) => {
        allMonths.add(month);
      });
    });
    const sortedMonths = Array.from(allMonths).sort();

    // 创建数据集
    const datasets = platforms.map((platform) => {
      const platformData = sortedMonths.map(
        (month) => monthlyData[platform][month] || 0
      );

      return {
        label: platform === "macOS_ARM" ? "macOS ARM" : platform,
        data: platformData,
        borderColor: platformColors[platform].border,
        backgroundColor: platformColors[platform].background,
        fill: true,
        tension: 0.3,
        borderWidth: 3,
        pointBackgroundColor: platformColors[platform].border,
        pointBorderColor: "#ffffff",
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
      };
    });

    // 格式化月份标签
    const formattedLabels = sortedMonths.map((month) => {
      const [year, monthNum] = month.split("-");
      return `${year}年${monthNum}月`;
    });

    this.timelineChart.data.labels = formattedLabels;
    this.timelineChart.data.datasets = datasets;
    this.timelineChart.update();
  }

  updateMonthlyChart(data) {
    const monthCounts = new Array(12).fill(0);

    data.forEach((version) => {
      const month = new Date(version.date).getMonth();
      monthCounts[month]++;
    });

    this.monthlyChart.data.datasets[0].data = monthCounts;
    this.monthlyChart.update();
  }

  updateIntervalChart(data) {
    const sortedData = [...data].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );
    const intervals = [0, 0, 0, 0, 0, 0]; // 1天, 2-7天, 8-14天, 15-30天, 31-60天, 60天以上

    for (let i = 1; i < sortedData.length; i++) {
      const prevDate = new Date(sortedData[i - 1].date);
      const currDate = new Date(sortedData[i].date);
      const daysDiff = Math.abs((currDate - prevDate) / (1000 * 60 * 60 * 24));

      if (daysDiff <= 1) intervals[0]++;
      else if (daysDiff <= 7) intervals[1]++;
      else if (daysDiff <= 14) intervals[2]++;
      else if (daysDiff <= 30) intervals[3]++;
      else if (daysDiff <= 60) intervals[4]++;
      else intervals[5]++;
    }

    this.intervalChart.data.datasets[0].data = intervals;
    this.intervalChart.update();
  }

  updateYearlyChart(data) {
    const yearCounts = {};

    data.forEach((version) => {
      const year = new Date(version.date).getFullYear();
      yearCounts[year] = (yearCounts[year] || 0) + 1;
    });

    const years = Object.keys(yearCounts).map(Number).sort();
    const counts = years.map((year) => yearCounts[year]);

    this.yearlyChart.data.labels = years;
    this.yearlyChart.data.datasets[0].data = counts;
    this.yearlyChart.update();
  }

  // 下载功能相关方法
  initDownloadTab() {
    this.populateDownloadYearFilter();
    this.applyDownloadFilters();
  }

  populateDownloadYearFilter() {
    const yearFilter = document.getElementById("downloadYearFilter");
    // 清空现有选项（保留"所有年份"）
    yearFilter.innerHTML = '<option value="all">所有年份</option>';

    const years = new Set();
    this.allVersions.forEach((version) => {
      const year = new Date(version.date).getFullYear();
      years.add(year);
    });

    const sortedYears = Array.from(years).sort((a, b) => b - a);

    sortedYears.forEach((year) => {
      const option = document.createElement("option");
      option.value = year;
      option.textContent = year;
      yearFilter.appendChild(option);
    });
  }

  applyDownloadFilters() {
    const platformFilter = document.getElementById(
      "downloadPlatformFilter"
    ).value;
    const versionSearch = document
      .getElementById("downloadVersionSearch")
      .value.toLowerCase();
    const yearFilter = document.getElementById("downloadYearFilter").value;
    const sortOrder = document.getElementById("downloadSortOrder").value;

    let filteredData = this.allVersions.filter((version) => {
      // 版本号搜索
      if (versionSearch && !version.ver.toLowerCase().includes(versionSearch)) {
        return false;
      }

      // 年份筛选
      if (yearFilter !== "all") {
        const versionYear = new Date(version.date).getFullYear();
        if (versionYear.toString() !== yearFilter) {
          return false;
        }
      }

      return true;
    });

    // 按版本号分组
    const versionGroups = {};
    filteredData.forEach((version) => {
      if (!versionGroups[version.ver]) {
        versionGroups[version.ver] = {};
      }
      versionGroups[version.ver][version.platform] = version;
    });

    // 转换为合并的版本数据
    this.filteredVersions = Object.keys(versionGroups).map((ver) => {
      const platforms = versionGroups[ver];
      const firstVersion = Object.values(platforms)[0];

      return {
        ver: ver,
        date: firstVersion.date,
        platforms: platforms,
      };
    });

    // 排序
    this.sortDownloadVersions(sortOrder);

    // 如果有平台筛选，进一步过滤
    if (platformFilter !== "all") {
      this.filteredVersions = this.filteredVersions.filter(
        (version) => version.platforms[platformFilter]
      );
    }

    // 清空选择
    this.selectedVersions.clear();

    this.updateDownloadStats();
    this.renderDownloadVersionsTable();
    this.updateDownloadSelectedCount();
  }

  sortDownloadVersions(order) {
    switch (order) {
      case "newest":
        this.filteredVersions.sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        );
        break;
      case "oldest":
        this.filteredVersions.sort(
          (a, b) => new Date(a.date) - new Date(b.date)
        );
        break;
      case "version":
        this.filteredVersions.sort((a, b) => {
          return this.compareVersions(a.ver, b.ver);
        });
        break;
    }
  }

  compareVersions(a, b) {
    const aParts = a.split(".").map(Number);
    const bParts = b.split(".").map(Number);

    for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
      const aPart = aParts[i] || 0;
      const bPart = bParts[i] || 0;

      if (aPart !== bPart) {
        return bPart - aPart; // 降序
      }
    }
    return 0;
  }

  updateDownloadStats() {
    document.getElementById("downloadDisplayedVersions").textContent =
      this.filteredVersions.length;

    // 计算总大小（所有平台的文件总和）
    const totalSize = this.filteredVersions.reduce((sum, version) => {
      return (
        sum +
        Object.values(version.platforms).reduce(
          (platformSum, platform) => platformSum + platform.size,
          0
        )
      );
    }, 0);
    document.getElementById("downloadTotalSize").textContent =
      this.formatFileSize(totalSize);

    if (this.filteredVersions.length > 0) {
      const sortedByVersion = [...this.filteredVersions].sort((a, b) =>
        this.compareVersions(b.ver, a.ver)
      );
      const newestVersion = sortedByVersion[0].ver;
      const oldestVersion = sortedByVersion[sortedByVersion.length - 1].ver;
      document.getElementById(
        "downloadVersionRange"
      ).textContent = `${newestVersion} → ${oldestVersion}`;
    } else {
      document.getElementById("downloadVersionRange").textContent = "-";
    }
  }

  renderDownloadVersionsTable() {
    const tbody = document.getElementById("downloadVersionsTable");
    tbody.innerHTML = "";

    this.filteredVersions.forEach((version) => {
      const row = this.createDownloadVersionRow(version);
      tbody.appendChild(row);
    });
  }

  createDownloadVersionRow(version) {
    const row = document.createElement("tr");
    row.className = "hover:bg-gray-50";

    const versionKey = version.ver;
    const isSelected = this.selectedVersions.has(versionKey);

    // 创建平台下载按钮
    const createPlatformButton = (platform, platformData) => {
      if (!platformData) {
        return '<span class="text-gray-400 text-sm">-</span>';
      }

      return `
                <div class="flex flex-col items-start space-y-1">
                    <button onclick="window.figmaApp.downloadSingle('${
                      platformData.platform
                    }-${platformData.ver}')" 
                            class="inline-flex items-center px-2 py-1 text-xs font-medium rounded border border-blue-300 text-blue-600 hover:bg-blue-50 transition-colors">
                        <svg class="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z"></path>
                        </svg>
                        下载
                    </button>
                    <span class="text-xs text-gray-500">${this.formatFileSize(
                      platformData.size
                    )}</span>
                </div>
            `;
    };

    row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <input type="checkbox" 
                       class="download-version-checkbox rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50" 
                       data-version="${versionKey}"
                       ${isSelected ? "checked" : ""}>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">${
                  version.ver
                }</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${this.formatDate(version.date)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                ${createPlatformButton("Windows", version.platforms.Windows)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                ${createPlatformButton("macOS", version.platforms.macOS)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                ${createPlatformButton(
                  "macOS ARM",
                  version.platforms.macOS_ARM
                )}
            </td>
        `;

    // 添加复选框事件监听
    const checkbox = row.querySelector(".download-version-checkbox");
    checkbox.addEventListener("change", (e) => {
      if (e.target.checked) {
        this.selectedVersions.add(versionKey);
      } else {
        this.selectedVersions.delete(versionKey);
      }
      this.updateDownloadSelectedCount();
    });

    return row;
  }

  getPlatformBadgeClass(platform) {
    switch (platform) {
      case "Windows":
        return "bg-blue-100 text-blue-800";
      case "macOS":
        return "bg-gray-100 text-gray-800";
      case "macOS_ARM":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }

  getPlatformDisplayName(platform) {
    switch (platform) {
      case "macOS_ARM":
        return "macOS ARM";
      default:
        return platform;
    }
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  }

  formatFileSize(bytes) {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  }

  handleSelectAll(checked) {
    this.filteredVersions.forEach((version) => {
      const versionKey = version.ver;
      if (checked) {
        this.selectedVersions.add(versionKey);
      } else {
        this.selectedVersions.delete(versionKey);
      }
    });

    // 更新页面上的复选框
    const checkboxes = document.querySelectorAll(".download-version-checkbox");
    checkboxes.forEach((checkbox) => {
      checkbox.checked = checked;
    });

    this.updateDownloadSelectedCount();
  }

  updateDownloadSelectedCount() {
    const count = this.selectedVersions.size;
    document.getElementById(
      "downloadSelectedCount"
    ).textContent = `已选择 ${count} 个版本`;

    const downloadButton = document.getElementById("downloadSelectedBtn");
    downloadButton.disabled = count === 0;

    // 更新全选复选框状态
    const selectedInFiltered = this.filteredVersions.filter((version) =>
      this.selectedVersions.has(version.ver)
    ).length;

    const selectAllCheckbox = document.getElementById("downloadSelectAll");
    const headerSelectAllCheckbox = document.getElementById(
      "downloadHeaderSelectAll"
    );

    if (selectedInFiltered === 0) {
      selectAllCheckbox.checked = false;
      headerSelectAllCheckbox.checked = false;
      selectAllCheckbox.indeterminate = false;
      headerSelectAllCheckbox.indeterminate = false;
    } else if (selectedInFiltered === this.filteredVersions.length) {
      selectAllCheckbox.checked = true;
      headerSelectAllCheckbox.checked = true;
      selectAllCheckbox.indeterminate = false;
      headerSelectAllCheckbox.indeterminate = false;
    } else {
      selectAllCheckbox.checked = false;
      headerSelectAllCheckbox.checked = false;
      selectAllCheckbox.indeterminate = true;
      headerSelectAllCheckbox.indeterminate = true;
    }
  }

  async downloadSelected() {
    if (this.selectedVersions.size === 0) return;

    const selectedVersionsData = [];
    this.selectedVersions.forEach((versionKey) => {
      const versionGroup = this.filteredVersions.find(
        (v) => v.ver === versionKey
      );
      if (versionGroup) {
        // 添加该版本的所有平台
        Object.values(versionGroup.platforms).forEach((platformData) => {
          selectedVersionsData.push(platformData);
        });
      }
    });

    await this.startDownload(selectedVersionsData);
  }

  async downloadSingle(versionKey) {
    const version = this.findVersionByKey(versionKey);
    if (!version) return;

    await this.startDownload([version]);
  }

  findVersionByKey(versionKey) {
    const [platform, ver] = versionKey.split("-");
    return this.allVersions.find(
      (v) => v.platform === platform && v.ver === ver
    );
  }

  async startDownload(versions) {
    this.showModal();

    try {
      let completed = 0;
      const total = versions.length;

      for (const version of versions) {
        this.updateDownloadProgress(
          completed,
          total,
          `正在下载 ${version.ver} (${this.getPlatformDisplayName(
            version.platform
          )})`
        );

        // 创建下载链接并触发下载
        const link = document.createElement("a");
        link.href = version.url;
        link.download =
          version.fileName || `${version.ver}-${version.platform}`;
        link.style.display = "none";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // 等待一小段时间避免浏览器阻止多个下载
        await new Promise((resolve) => setTimeout(resolve, 1000));

        completed++;
      }

      this.updateDownloadProgress(total, total, "下载完成！");

      // 3秒后自动关闭模态框
      setTimeout(() => {
        this.hideModal();
      }, 3000);
    } catch (error) {
      console.error("下载过程中出错:", error);
      document.getElementById("modalMessage").textContent =
        "下载过程中出现错误: " + error.message;
    }
  }

  updateDownloadProgress(completed, total, message) {
    const progress = total > 0 ? (completed / total) * 100 : 0;
    document.getElementById("downloadProgress").style.width = `${progress}%`;
    document.getElementById("progressText").textContent = `${Math.round(
      progress
    )}% (${completed}/${total})`;
    document.getElementById("modalMessage").textContent = message;
  }

  showModal() {
    document.getElementById("downloadModal").classList.remove("hidden");
    document.getElementById("modalTitle").textContent = "正在下载";
    document.getElementById("modalMessage").textContent = "正在准备下载...";
    document.getElementById("downloadProgress").style.width = "0%";
    document.getElementById("progressText").textContent = "0%";
  }

  hideModal() {
    document.getElementById("downloadModal").classList.add("hidden");
  }

  hideLoading() {
    document.getElementById("loading").classList.add("hidden");
    document.getElementById("analysisContent").classList.remove("hidden");
  }

  showError(message) {
    document.getElementById("loading").classList.add("hidden");
    document.getElementById("error").classList.remove("hidden");
    document.getElementById("errorMessage").textContent = message;
  }
}

// 初始化应用
window.figmaApp = new FigmaAnalyzerApp();
