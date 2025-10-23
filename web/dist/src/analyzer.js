class FigmaAnalyzer {
    constructor() {
        this.data = null;
        this.charts = {};
        this.processedData = {
            all: [],
            byPlatform: {},
            byYear: {},
            byMonth: {}
        };
        this.init();
    }

    async init() {
        try {
            await this.loadData();
            this.processData();
            this.updateStats();
            this.setupControls();
            this.createCharts();
            this.generateInsights();
            this.hideLoading();
        } catch (error) {
            this.showError('数据加载失败: ' + error.message);
        }
    }

    async loadData() {
        // 尝试从相对路径加载数据
        try {
            const response = await fetch('./versions.json');
            if (!response.ok) throw new Error('文件不存在');
            this.data = await response.json();
            console.log('成功加载真实数据');
        } catch (error) {
            // 如果文件不存在，使用模拟数据
            // console.warn('无法加载 versions.json，使用模拟数据');
            // this.data = this.generateMockData();
        }
    }

    generateMockData() {
        // 生成模拟数据用于演示
        const platforms = ['Windows', 'macOS', 'macOS_ARM'];
        const data = {};
        
        platforms.forEach(platform => {
            data[platform] = [];
            let currentDate = new Date('2017-01-01');
            let version = [1, 0, 0];
            
            for (let i = 0; i < 200; i++) {
                // 随机间隔 1-30 天
                const interval = Math.floor(Math.random() * 30) + 1;
                currentDate = new Date(currentDate.getTime() + interval * 24 * 60 * 60 * 1000);
                
                // 版本号递增
                if (Math.random() > 0.7) {
                    version[0]++;
                    version[1] = 0;
                    version[2] = 0;
                } else if (Math.random() > 0.3) {
                    version[1]++;
                    version[2] = 0;
                } else {
                    version[2]++;
                }
                
                data[platform].push({
                    ver: version.join('.'),
                    date: currentDate.toISOString(),
                    type: platform,
                    size: Math.floor(Math.random() * 50000000) + 50000000
                });
                
                if (currentDate > new Date('2024-12-31')) break;
            }
        });
        
        return data;
    }

    processData() {
        // 处理所有平台数据
        Object.keys(this.data).forEach(platform => {
            this.processedData.byPlatform[platform] = this.data[platform].map(item => ({
                ...item,
                date: new Date(item.date),
                platform: platform
            })).sort((a, b) => a.date - b.date);
            
            this.processedData.all.push(...this.processedData.byPlatform[platform]);
        });

        // 按日期排序
        this.processedData.all.sort((a, b) => a.date - b.date);

        // 按年份分组
        this.processedData.all.forEach(item => {
            const year = item.date.getFullYear();
            if (!this.processedData.byYear[year]) {
                this.processedData.byYear[year] = [];
            }
            this.processedData.byYear[year].push(item);
        });

        // 按月份分组
        this.processedData.all.forEach(item => {
            const month = item.date.getMonth();
            if (!this.processedData.byMonth[month]) {
                this.processedData.byMonth[month] = 0;
            }
            this.processedData.byMonth[month]++;
        });
    }

    updateStats() {
        const totalVersions = this.processedData.all.length;
        
        // 计算平均更新间隔
        let totalInterval = 0;
        let intervalCount = 0;
        
        Object.values(this.processedData.byPlatform).forEach(platformData => {
            for (let i = 1; i < platformData.length; i++) {
                const interval = (platformData[i].date - platformData[i-1].date) / (1000 * 60 * 60 * 24);
                totalInterval += interval;
                intervalCount++;
            }
        });
        
        const avgDaysBetween = intervalCount > 0 ? Math.round(totalInterval / intervalCount) : 0;
        
        // 时间跨度
        const dates = this.processedData.all.map(item => item.date);
        const minDate = new Date(Math.min(...dates));
        const maxDate = new Date(Math.max(...dates));
        const yearRange = `${minDate.getFullYear()}-${maxDate.getFullYear()}`;
        
        // 最活跃年份
        let mostActiveYear = '';
        let maxCount = 0;
        Object.keys(this.processedData.byYear).forEach(year => {
            if (this.processedData.byYear[year].length > maxCount) {
                maxCount = this.processedData.byYear[year].length;
                mostActiveYear = year;
            }
        });

        document.getElementById('totalVersions').textContent = totalVersions;
        document.getElementById('avgDaysBetween').textContent = avgDaysBetween;
        document.getElementById('yearRange').textContent = yearRange;
        document.getElementById('mostActiveYear').textContent = mostActiveYear;
    }

    setupControls() {
        // 设置年份选择器
        const yearSelect = document.getElementById('yearSelect');
        const years = Object.keys(this.processedData.byYear).sort();
        years.forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            yearSelect.appendChild(option);
        });

        // 绑定事件
        document.getElementById('platformSelect').addEventListener('change', () => this.updateCharts());
        document.getElementById('yearSelect').addEventListener('change', () => this.updateCharts());
    }

    createCharts() {
        this.createTimelineChart();
        this.createMonthlyChart();
        this.createIntervalChart();
        this.createYearlyChart();
    }

    createTimelineChart() {
        const ctx = document.getElementById('timelineChart').getContext('2d');
        const selectedPlatform = document.getElementById('platformSelect').value;
        const selectedYear = document.getElementById('yearSelect').value;
        
        // 获取所有月份的标签
        const allMonths = new Set();
        this.processedData.all.forEach(item => {
            if (selectedYear === 'all' || item.date.getFullYear().toString() === selectedYear) {
                const monthKey = `${item.date.getFullYear()}-${(item.date.getMonth() + 1).toString().padStart(2, '0')}`;
                allMonths.add(monthKey);
            }
        });
        const sortedMonths = Array.from(allMonths).sort();
        
        // 按平台分组数据
        const datasets = [];
        const platforms = selectedPlatform === 'all' ? 
            Object.keys(this.processedData.byPlatform) : [selectedPlatform];
        const colors = [
            { border: '#667eea', bg: 'rgba(102, 126, 234, 0.1)' },
            { border: '#764ba2', bg: 'rgba(118, 75, 162, 0.1)' },
            { border: '#f093fb', bg: 'rgba(240, 147, 251, 0.1)' }
        ];
        
        platforms.forEach((platform, index) => {
            const platformData = this.processedData.byPlatform[platform] || [];
            
            // 按月份聚合该平台的数据
            const monthlyData = {};
            platformData.forEach(item => {
                if (selectedYear === 'all' || item.date.getFullYear().toString() === selectedYear) {
                    const monthKey = `${item.date.getFullYear()}-${(item.date.getMonth() + 1).toString().padStart(2, '0')}`;
                    monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
                }
            });
            
            // 为所有月份创建数据点（没有发布的月份为0）
            const values = sortedMonths.map(month => monthlyData[month] || 0);
            
            datasets.push({
                label: platform,
                data: values,
                borderColor: colors[index % colors.length].border,
                backgroundColor: colors[index % colors.length].bg,
                borderWidth: 3,
                fill: false,
                tension: 0.4,
                pointBackgroundColor: colors[index % colors.length].border,
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 8
            });
        });

        this.charts.timeline = new Chart(ctx, {
            type: 'line',
            data: {
                labels: sortedMonths,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: '时间 (年-月)'
                        },
                        ticks: {
                            maxTicksLimit: 15,
                            callback: function(value, index, values) {
                                const label = this.getLabelForValue(value);
                                // 只显示每3个月的标签，避免拥挤
                                return index % 3 === 0 ? label : '';
                            }
                        }
                    },
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: '每月发布数量'
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            title: function(context) {
                                return `${context[0].label}`;
                            },
                            label: function(context) {
                                return `${context.dataset.label}: ${context.parsed.y} 个版本`;
                            }
                        }
                    },
                    legend: {
                        display: true,
                        position: 'top'
                    }
                }
            }
        });
    }

    createMonthlyChart() {
        const ctx = document.getElementById('monthlyChart').getContext('2d');
        const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', 
                           '7月', '8月', '9月', '10月', '11月', '12月'];
        
        const selectedPlatform = document.getElementById('platformSelect').value;
        const selectedYear = document.getElementById('yearSelect').value;
        
        const datasets = [];
        const platforms = selectedPlatform === 'all' ? 
            Object.keys(this.processedData.byPlatform) : [selectedPlatform];
        const colors = [
            'rgba(102, 126, 234, 0.8)',
            'rgba(118, 75, 162, 0.8)',
            'rgba(240, 147, 251, 0.8)'
        ];
        
        platforms.forEach((platform, index) => {
            const monthData = Array(12).fill(0);
            const platformData = this.processedData.byPlatform[platform] || [];
            
            platformData.forEach(item => {
                if (selectedYear === 'all' || item.date.getFullYear().toString() === selectedYear) {
                    monthData[item.date.getMonth()]++;
                }
            });
            
            datasets.push({
                label: platform,
                data: monthData,
                backgroundColor: colors[index % colors.length],
                borderColor: colors[index % colors.length].replace('0.8', '1'),
                borderWidth: 1
            });
        });

        this.charts.monthly = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: monthNames,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: '发布次数'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: '月份'
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${context.parsed.y} 次`;
                            }
                        }
                    },
                    legend: {
                        display: true,
                        position: 'top'
                    }
                }
            }
        });
    }

    createIntervalChart() {
        const ctx = document.getElementById('intervalChart').getContext('2d');
        const intervals = [];
        
        Object.values(this.processedData.byPlatform).forEach(platformData => {
            for (let i = 1; i < platformData.length; i++) {
                const interval = Math.round((platformData[i].date - platformData[i-1].date) / (1000 * 60 * 60 * 24));
                intervals.push(interval);
            }
        });

        // 创建间隔分布
        const buckets = {};
        intervals.forEach(interval => {
            let bucket;
            if (interval <= 1) bucket = '1天';
            else if (interval <= 7) bucket = '2-7天';
            else if (interval <= 14) bucket = '8-14天';
            else if (interval <= 30) bucket = '15-30天';
            else if (interval <= 60) bucket = '31-60天';
            else bucket = '60天以上';
            
            buckets[bucket] = (buckets[bucket] || 0) + 1;
        });

        const labels = ['1天', '2-7天', '8-14天', '15-30天', '31-60天', '60天以上'];
        const data = labels.map(label => buckets[label] || 0);

        this.charts.interval = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: [
                        '#667eea',
                        '#764ba2',
                        '#f093fb',
                        '#f5576c',
                        '#4facfe',
                        '#00f2fe'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return `${context.label}: ${context.parsed} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    createYearlyChart() {
        const ctx = document.getElementById('yearlyChart').getContext('2d');
        const selectedPlatform = document.getElementById('platformSelect').value;
        
        // 获取所有年份
        const allYears = new Set();
        this.processedData.all.forEach(item => {
            allYears.add(item.date.getFullYear());
        });
        const sortedYears = Array.from(allYears).sort();
        
        const datasets = [];
        const platforms = selectedPlatform === 'all' ? 
            Object.keys(this.processedData.byPlatform) : [selectedPlatform];
        const colors = [
            { border: '#667eea', bg: 'rgba(102, 126, 234, 0.1)' },
            { border: '#764ba2', bg: 'rgba(118, 75, 162, 0.1)' },
            { border: '#f093fb', bg: 'rgba(240, 147, 251, 0.1)' }
        ];
        
        platforms.forEach((platform, index) => {
            const platformData = this.processedData.byPlatform[platform] || [];
            
            // 按年份聚合数据
            const yearlyData = {};
            platformData.forEach(item => {
                const year = item.date.getFullYear();
                yearlyData[year] = (yearlyData[year] || 0) + 1;
            });
            
            // 为所有年份创建数据点
            const values = sortedYears.map(year => yearlyData[year] || 0);
            
            datasets.push({
                label: platform,
                data: values,
                borderColor: colors[index % colors.length].border,
                backgroundColor: colors[index % colors.length].bg,
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: colors[index % colors.length].border,
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 10
            });
        });

        this.charts.yearly = new Chart(ctx, {
            type: 'line',
            data: {
                labels: sortedYears,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: '发布次数'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: '年份'
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            title: function(context) {
                                return `${context[0].label}年`;
                            },
                            label: function(context) {
                                return `${context.dataset.label}: ${context.parsed.y} 个版本`;
                            }
                        }
                    },
                    legend: {
                        display: true,
                        position: 'top'
                    }
                }
            }
        });
    }

    getFilteredData() {
        const platform = document.getElementById('platformSelect').value;
        const year = document.getElementById('yearSelect').value;
        
        let data = this.processedData.all;
        
        if (platform !== 'all') {
            data = data.filter(item => item.platform === platform);
        }
        
        if (year !== 'all') {
            data = data.filter(item => item.date.getFullYear().toString() === year);
        }
        
        return data;
    }

    updateCharts() {
        // 销毁现有图表
        Object.values(this.charts).forEach(chart => {
            if (chart) chart.destroy();
        });
        
        // 重新创建图表
        this.createCharts();
    }

    generateInsights() {
        const insights = [];
        const data = this.processedData.all;
        
        // 计算一些统计数据
        const totalVersions = data.length;
        const platformCounts = {};
        Object.keys(this.processedData.byPlatform).forEach(platform => {
            platformCounts[platform] = this.processedData.byPlatform[platform].length;
        });
        
        const mostPopularPlatform = Object.keys(platformCounts).reduce((a, b) => 
            platformCounts[a] > platformCounts[b] ? a : b
        );
        
        // 计算平均间隔
        let totalInterval = 0;
        let intervalCount = 0;
        Object.values(this.processedData.byPlatform).forEach(platformData => {
            for (let i = 1; i < platformData.length; i++) {
                const interval = (platformData[i].date - platformData[i-1].date) / (1000 * 60 * 60 * 24);
                totalInterval += interval;
                intervalCount++;
            }
        });
        const avgInterval = Math.round(totalInterval / intervalCount);
        
        // 年度趋势
        const years = Object.keys(this.processedData.byYear).sort();
        const recentYears = years.slice(-3);
        const recentAvg = recentYears.reduce((sum, year) => 
            sum + this.processedData.byYear[year].length, 0) / recentYears.length;
        
        insights.push(`Figma 总共发布了 ${totalVersions} 个桌面版本`);
        insights.push(`${mostPopularPlatform} 平台版本最多，共 ${platformCounts[mostPopularPlatform]} 个版本`);
        insights.push(`平均更新间隔约为 ${avgInterval} 天`);
        insights.push(`近三年平均每年发布 ${Math.round(recentAvg)} 个版本`);
        
        // 月份分析
        const monthCounts = Array(12).fill(0);
        data.forEach(item => monthCounts[item.date.getMonth()]++);
        const mostActiveMonth = monthCounts.indexOf(Math.max(...monthCounts)) + 1;
        insights.push(`${mostActiveMonth} 月是最活跃的发布月份`);
        
        const insightsList = document.getElementById('insights');
        insightsList.innerHTML = ''; // 清空现有内容
        insights.forEach(insight => {
            const li = document.createElement('li');
            li.className = 'flex items-start space-x-2';
            li.innerHTML = `
                <svg class="h-5 w-5 mt-0.5 flex-shrink-0 text-blue-200" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                <span>${insight}</span>
            `;
            insightsList.appendChild(li);
        });
    }

    hideLoading() {
        document.getElementById('loading').classList.add('hidden');
        document.getElementById('content').classList.remove('hidden');
    }

    showError(message) {
        document.getElementById('loading').classList.add('hidden');
        document.getElementById('error').classList.remove('hidden');
        document.getElementById('errorMessage').textContent = message;
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new FigmaAnalyzer();
});