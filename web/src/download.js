import vesionsData from "../versions.json";

// 下载页面主要逻辑
class FigmaDownloadManager {
  constructor() {
    this.allVersions = [];
    this.filteredVersions = [];
    this.selectedVersions = new Set();
    this.currentPage = 1;
    this.itemsPerPage = 50;

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
    let data = vesionsData;

    // 将所有平台的版本合并到一个数组中
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
    // 筛选器事件
    document
      .getElementById("platformFilter")
      .addEventListener("change", () => this.applyFilters());
    document
      .getElementById("versionSearch")
      .addEventListener("input", () => this.applyFilters());
    document
      .getElementById("yearFilter")
      .addEventListener("change", () => this.applyFilters());
    document
      .getElementById("sortOrder")
      .addEventListener("change", () => this.applyFilters());

    // 全选事件
    document
      .getElementById("selectAll")
      .addEventListener("change", (e) =>
        this.handleSelectAll(e.target.checked)
      );
    document
      .getElementById("headerSelectAll")
      .addEventListener("change", (e) =>
        this.handleSelectAll(e.target.checked)
      );

    // 批量下载
    document
      .getElementById("downloadSelected")
      .addEventListener("click", () => this.downloadSelected());

    // 模态框关闭
    document
      .getElementById("closeModal")
      .addEventListener("click", () => this.hideModal());

    // 分页事件
    document
      .getElementById("prevPageMobile")
      .addEventListener("click", () => this.previousPage());
    document
      .getElementById("nextPageMobile")
      .addEventListener("click", () => this.nextPage());
  }

  renderInitialData() {
    this.populateYearFilter();
    this.applyFilters();
  }

  populateYearFilter() {
    const yearFilter = document.getElementById("yearFilter");
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

  applyFilters() {
    const platformFilter = document.getElementById("platformFilter").value;
    const versionSearch = document
      .getElementById("versionSearch")
      .value.toLowerCase();
    const yearFilter = document.getElementById("yearFilter").value;
    const sortOrder = document.getElementById("sortOrder").value;

    this.filteredVersions = this.allVersions.filter((version) => {
      // 平台筛选
      if (platformFilter !== "all" && version.platform !== platformFilter) {
        return false;
      }

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

    // 排序
    this.sortVersions(sortOrder);

    // 重置到第一页
    this.currentPage = 1;
    this.selectedVersions.clear();

    this.updateStats();
    this.renderVersionsTable();
    this.updatePagination();
    this.updateSelectedCount();
  }

  sortVersions(order) {
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

  updateStats() {
    document.getElementById("displayedVersions").textContent =
      this.filteredVersions.length;

    const totalSize = this.filteredVersions.reduce(
      (sum, version) => sum + version.size,
      0
    );
    document.getElementById("totalSize").textContent =
      this.formatFileSize(totalSize);

    if (this.filteredVersions.length > 0) {
      const sortedByVersion = [...this.filteredVersions].sort((a, b) =>
        this.compareVersions(b.ver, a.ver)
      );
      const newestVersion = sortedByVersion[0].ver;
      const oldestVersion = sortedByVersion[sortedByVersion.length - 1].ver;
      document.getElementById(
        "versionRange"
      ).textContent = `${oldestVersion} - ${newestVersion}`;
    } else {
      document.getElementById("versionRange").textContent = "-";
    }
  }

  renderVersionsTable() {
    const tbody = document.getElementById("versionsTable");
    tbody.innerHTML = "";

    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = Math.min(
      startIndex + this.itemsPerPage,
      this.filteredVersions.length
    );
    const pageVersions = this.filteredVersions.slice(startIndex, endIndex);

    pageVersions.forEach((version) => {
      const row = this.createVersionRow(version);
      tbody.appendChild(row);
    });
  }

  createVersionRow(version) {
    const row = document.createElement("tr");
    row.className = "hover:bg-gray-50";

    const versionKey = `${version.platform}-${version.ver}`;
    const isSelected = this.selectedVersions.has(versionKey);

    row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <input type="checkbox" 
                       class="version-checkbox rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50" 
                       data-version="${versionKey}"
                       ${isSelected ? "checked" : ""}>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">${
                  version.ver
                }</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${this.getPlatformBadgeClass(
                  version.platform
                )}">
                    ${this.getPlatformDisplayName(version.platform)}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${this.formatDate(version.date)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${this.formatFileSize(version.size)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button onclick="window.downloadManager.downloadSingle('${versionKey}')" 
                        class="text-blue-600 hover:text-blue-900 inline-flex items-center">
                    <svg class="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z"></path>
                    </svg>
                    下载
                </button>
            </td>
        `;

    // 添加复选框事件监听
    const checkbox = row.querySelector(".version-checkbox");
    checkbox.addEventListener("change", (e) => {
      if (e.target.checked) {
        this.selectedVersions.add(versionKey);
      } else {
        this.selectedVersions.delete(versionKey);
      }
      this.updateSelectedCount();
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

  updatePagination() {
    const totalPages = Math.ceil(
      this.filteredVersions.length / this.itemsPerPage
    );

    // 更新分页信息
    const startItem = (this.currentPage - 1) * this.itemsPerPage + 1;
    const endItem = Math.min(
      this.currentPage * this.itemsPerPage,
      this.filteredVersions.length
    );

    document.getElementById("startItem").textContent =
      this.filteredVersions.length === 0 ? 0 : startItem;
    document.getElementById("endItem").textContent = endItem;
    document.getElementById("totalItems").textContent =
      this.filteredVersions.length;

    // 更新移动端按钮
    document.getElementById("prevPageMobile").disabled = this.currentPage === 1;
    document.getElementById("nextPageMobile").disabled =
      this.currentPage === totalPages || totalPages === 0;

    // 更新桌面端分页控件
    this.renderPaginationControls(totalPages);
  }

  renderPaginationControls(totalPages) {
    const paginationControls = document.getElementById("paginationControls");
    paginationControls.innerHTML = "";

    if (totalPages <= 1) return;

    // 上一页按钮
    const prevButton = this.createPaginationButton(
      "上一页",
      this.currentPage - 1,
      this.currentPage === 1
    );
    prevButton.addEventListener("click", () => this.previousPage());
    paginationControls.appendChild(prevButton);

    // 页码按钮
    const startPage = Math.max(1, this.currentPage - 2);
    const endPage = Math.min(totalPages, this.currentPage + 2);

    if (startPage > 1) {
      const firstButton = this.createPaginationButton("1", 1, false);
      firstButton.addEventListener("click", () => this.goToPage(1));
      paginationControls.appendChild(firstButton);

      if (startPage > 2) {
        paginationControls.appendChild(this.createPaginationEllipsis());
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      const pageButton = this.createPaginationButton(
        i.toString(),
        i,
        false,
        i === this.currentPage
      );
      pageButton.addEventListener("click", () => this.goToPage(i));
      paginationControls.appendChild(pageButton);
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        paginationControls.appendChild(this.createPaginationEllipsis());
      }

      const lastButton = this.createPaginationButton(
        totalPages.toString(),
        totalPages,
        false
      );
      lastButton.addEventListener("click", () => this.goToPage(totalPages));
      paginationControls.appendChild(lastButton);
    }

    // 下一页按钮
    const nextButton = this.createPaginationButton(
      "下一页",
      this.currentPage + 1,
      this.currentPage === totalPages
    );
    nextButton.addEventListener("click", () => this.nextPage());
    paginationControls.appendChild(nextButton);
  }

  createPaginationButton(text, page, disabled = false, current = false) {
    const button = document.createElement("button");
    button.textContent = text;
    button.disabled = disabled;

    if (current) {
      button.className =
        "relative inline-flex items-center px-4 py-2 border border-blue-500 bg-blue-50 text-sm font-medium text-blue-600";
    } else if (disabled) {
      button.className =
        "relative inline-flex items-center px-4 py-2 border border-gray-300 bg-gray-100 text-sm font-medium text-gray-400 cursor-not-allowed";
    } else {
      button.className =
        "relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50";
    }

    return button;
  }

  createPaginationEllipsis() {
    const span = document.createElement("span");
    span.textContent = "...";
    span.className =
      "relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700";
    return span;
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.renderVersionsTable();
      this.updatePagination();
    }
  }

  nextPage() {
    const totalPages = Math.ceil(
      this.filteredVersions.length / this.itemsPerPage
    );
    if (this.currentPage < totalPages) {
      this.currentPage++;
      this.renderVersionsTable();
      this.updatePagination();
    }
  }

  goToPage(page) {
    this.currentPage = page;
    this.renderVersionsTable();
    this.updatePagination();
  }

  handleSelectAll(checked) {
    const currentPageVersions = this.getCurrentPageVersions();

    currentPageVersions.forEach((version) => {
      const versionKey = `${version.platform}-${version.ver}`;
      if (checked) {
        this.selectedVersions.add(versionKey);
      } else {
        this.selectedVersions.delete(versionKey);
      }
    });

    // 更新页面上的复选框
    const checkboxes = document.querySelectorAll(".version-checkbox");
    checkboxes.forEach((checkbox) => {
      checkbox.checked = checked;
    });

    this.updateSelectedCount();
  }

  getCurrentPageVersions() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = Math.min(
      startIndex + this.itemsPerPage,
      this.filteredVersions.length
    );
    return this.filteredVersions.slice(startIndex, endIndex);
  }

  updateSelectedCount() {
    const count = this.selectedVersions.size;
    document.getElementById(
      "selectedCount"
    ).textContent = `已选择 ${count} 个版本`;

    const downloadButton = document.getElementById("downloadSelected");
    downloadButton.disabled = count === 0;

    // 更新全选复选框状态
    const currentPageVersions = this.getCurrentPageVersions();
    const currentPageSelected = currentPageVersions.filter((version) =>
      this.selectedVersions.has(`${version.platform}-${version.ver}`)
    ).length;

    const selectAllCheckbox = document.getElementById("selectAll");
    const headerSelectAllCheckbox = document.getElementById("headerSelectAll");

    if (currentPageSelected === 0) {
      selectAllCheckbox.checked = false;
      headerSelectAllCheckbox.checked = false;
      selectAllCheckbox.indeterminate = false;
      headerSelectAllCheckbox.indeterminate = false;
    } else if (currentPageSelected === currentPageVersions.length) {
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
      const version = this.findVersionByKey(versionKey);
      if (version) {
        selectedVersionsData.push(version);
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
    document.getElementById("content").classList.remove("hidden");
  }

  showError(message) {
    document.getElementById("loading").classList.add("hidden");
    document.getElementById("error").classList.remove("hidden");
    document.getElementById("errorMessage").textContent = message;
  }
}

// 初始化下载管理器
window.downloadManager = new FigmaDownloadManager();
