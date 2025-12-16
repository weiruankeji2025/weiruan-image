/**
 * 图床工具 - 主应用逻辑
 * 支持多云存储: GitHub, Google Drive, OneDrive, Dropbox
 */

// 历史记录存储键
const HISTORY_KEY = 'image-hosting-history';

// DOM 元素
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const uploadProgress = document.getElementById('uploadProgress');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const resultSection = document.getElementById('resultSection');
const historyList = document.getElementById('historyList');
const toast = document.getElementById('toast');
const configSection = document.getElementById('configSection');
const configTitle = document.getElementById('configTitle');
const configBody = document.getElementById('configBody');
const cdnLinkItem = document.getElementById('cdnLinkItem');

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    storageManager.init();
    loadHistory();
    initUploadEvents();
    initStorageCardEvents();
});

/**
 * 初始化存储卡片事件
 */
function initStorageCardEvents() {
    document.querySelectorAll('.storage-card').forEach(card => {
        card.addEventListener('click', () => {
            const storageName = card.dataset.storage;
            openConfigPanel(storageName);
        });
    });
}

/**
 * 打开配置面板
 */
function openConfigPanel(storageName) {
    const provider = storageManager.providers[storageName];
    if (!provider) return;

    // 设置当前提供商
    storageManager.setCurrentProvider(storageName);
    storageManager.updateStorageStatus();

    // 更新配置面板内容
    const iconMap = {
        github: '🐙',
        googledrive: '📁',
        onedrive: '☁️',
        dropbox: '📦'
    };

    configTitle.textContent = `${iconMap[storageName] || '⚙️'} 配置 ${provider.displayName}`;
    configBody.innerHTML = provider.getConfigFormHTML();
    configSection.style.display = 'block';

    // 滚动到配置面板
    configSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * 关闭配置面板
 */
function closeConfig() {
    configSection.style.display = 'none';
}

/**
 * 初始化上传事件
 */
function initUploadEvents() {
    // 点击上传
    uploadArea.addEventListener('click', () => fileInput.click());

    // 文件选择
    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
        fileInput.value = ''; // 重置以允许选择相同文件
    });

    // 拖拽上传
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        handleFiles(e.dataTransfer.files);
    });

    // 粘贴上传
    document.addEventListener('paste', (e) => {
        const items = e.clipboardData.items;
        for (let item of items) {
            if (item.type.startsWith('image/')) {
                const file = item.getAsFile();
                handleFiles([file]);
                break;
            }
        }
    });
}

/**
 * 处理文件
 */
async function handleFiles(files) {
    const provider = storageManager.getCurrentProvider();

    if (!provider.isConnected()) {
        showToast(`请先配置 ${provider.displayName}`, 'error');
        openConfigPanel(storageManager.currentProvider);
        return;
    }

    for (let file of files) {
        if (!file.type.startsWith('image/')) {
            showToast('只支持图片文件', 'error');
            continue;
        }

        await uploadFile(file);
    }
}

/**
 * 上传文件
 */
async function uploadFile(file) {
    showProgress(true);
    updateProgress(0, '准备上传...');

    try {
        const result = await storageManager.upload(file, (percent, text) => {
            updateProgress(percent, text);
        });

        updateProgress(100, '上传成功!');

        // 显示结果
        showResult(result);

        // 保存历史
        saveHistory({
            name: result.fileName,
            links: result,
            storage: result.storage,
            time: new Date().toLocaleString()
        });

        showToast('上传成功!', 'success');

    } catch (error) {
        console.error('上传失败:', error);
        showToast(`上传失败: ${error.message}`, 'error');
    } finally {
        setTimeout(() => showProgress(false), 1000);
    }
}

/**
 * 显示/隐藏进度
 */
function showProgress(show) {
    uploadProgress.style.display = show ? 'block' : 'none';
    uploadArea.style.display = show ? 'none' : 'block';
}

/**
 * 更新进度
 */
function updateProgress(percent, text) {
    progressFill.style.width = `${percent}%`;
    progressText.textContent = text;
}

/**
 * 显示结果
 */
function showResult(result) {
    resultSection.style.display = 'block';
    document.getElementById('markdownLink').value = result.markdown;
    document.getElementById('htmlLink').value = result.html;
    document.getElementById('directLink').value = result.direct;

    // CDN 链接只对 GitHub 显示
    if (result.cdn) {
        cdnLinkItem.style.display = 'block';
        document.getElementById('cdnLink').value = result.cdn;
        document.getElementById('previewImage').src = result.cdn;
    } else {
        cdnLinkItem.style.display = 'none';
        document.getElementById('previewImage').src = result.direct;
    }

    // 滚动到结果区域
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * 复制链接
 */
function copyLink(inputId) {
    const input = document.getElementById(inputId);
    input.select();

    navigator.clipboard.writeText(input.value).then(() => {
        showToast('已复制到剪贴板', 'success');
    }).catch(() => {
        // 回退方案
        document.execCommand('copy');
        showToast('已复制到剪贴板', 'success');
    });
}

/**
 * 显示 Toast 提示
 */
function showToast(message, type = '') {
    toast.textContent = message;
    toast.className = 'toast show ' + type;

    setTimeout(() => {
        toast.className = 'toast';
    }, 3000);
}

/**
 * 获取历史记录
 */
function getHistory() {
    const historyStr = localStorage.getItem(HISTORY_KEY);
    return historyStr ? JSON.parse(historyStr) : [];
}

/**
 * 保存历史记录
 */
function saveHistory(item) {
    const history = getHistory();
    history.unshift(item);

    // 只保留最近 100 条
    if (history.length > 100) {
        history.pop();
    }

    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    renderHistory(history);
}

/**
 * 加载历史记录
 */
function loadHistory() {
    const history = getHistory();
    renderHistory(history);
}

/**
 * 渲染历史记录
 */
function renderHistory(history) {
    if (history.length === 0) {
        historyList.innerHTML = '<p class="empty-history">暂无上传记录</p>';
        return;
    }

    historyList.innerHTML = history.map((item, index) => {
        const previewUrl = item.links.cdn || item.links.direct;
        return `
            <div class="history-item">
                <img src="${previewUrl}" alt="${item.name}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🖼️</text></svg>'">
                <div class="history-info">
                    <div class="history-name">${item.name}</div>
                    <div class="history-meta">
                        <span class="history-time">${item.time}</span>
                        <span class="history-storage">${item.storage || 'GitHub'}</span>
                    </div>
                </div>
                <div class="history-actions">
                    <button class="btn btn-copy" onclick="copyHistoryLink(${index}, 'markdown')">MD</button>
                    <button class="btn btn-copy" onclick="copyHistoryLink(${index}, 'direct')">链接</button>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * 复制历史记录链接
 */
function copyHistoryLink(index, type) {
    const history = getHistory();
    const item = history[index];
    if (item) {
        const link = item.links[type];
        navigator.clipboard.writeText(link).then(() => {
            showToast('已复制到剪贴板', 'success');
        });
    }
}

/**
 * 清空历史记录
 */
function clearHistory() {
    if (confirm('确定要清空所有历史记录吗?')) {
        localStorage.removeItem(HISTORY_KEY);
        loadHistory();
        showToast('历史记录已清空', 'success');
    }
}
