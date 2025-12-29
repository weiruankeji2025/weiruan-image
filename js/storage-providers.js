/**
 * 存储提供商模块
 * 支持 GitHub, Google Drive, OneDrive, Dropbox
 */

// 存储配置键
const STORAGE_CONFIG_KEY = 'image-hosting-storage-config';

/**
 * 存储提供商基类
 */
class StorageProvider {
    constructor(name, displayName) {
        this.name = name;
        this.displayName = displayName;
    }

    // 获取配置
    getConfig() {
        const allConfig = JSON.parse(localStorage.getItem(STORAGE_CONFIG_KEY) || '{}');
        return allConfig[this.name] || {};
    }

    // 保存配置
    saveConfig(config) {
        const allConfig = JSON.parse(localStorage.getItem(STORAGE_CONFIG_KEY) || '{}');
        allConfig[this.name] = config;
        localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify(allConfig));
    }

    // 清除配置
    clearConfig() {
        const allConfig = JSON.parse(localStorage.getItem(STORAGE_CONFIG_KEY) || '{}');
        delete allConfig[this.name];
        localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify(allConfig));
    }

    // 检查是否已连接
    isConnected() {
        return false;
    }

    // 获取配置表单 HTML
    getConfigFormHTML() {
        return '';
    }

    // 上传文件
    async upload(file) {
        throw new Error('Not implemented');
    }

    // 生成链接
    generateLinks(url, fileName) {
        return {
            markdown: `![${fileName}](${url})`,
            html: `<img src="${url}" alt="${fileName}">`,
            direct: url
        };
    }
}

/**
 * GitHub 存储提供商
 */
class GitHubProvider extends StorageProvider {
    constructor() {
        super('github', 'GitHub');
        // GitHub OAuth App 配置 (用户需要创建自己的 OAuth App)
        this.clientId = ''; // 用户需要填写自己的 Client ID
    }

    isConnected() {
        const config = this.getConfig();
        return !!(config.token && config.owner && config.repo);
    }

    getConfigFormHTML() {
        const config = this.getConfig();
        const isConnected = this.isConnected();

        if (isConnected) {
            return `
                <div class="user-info">
                    <img class="user-avatar" src="https://github.com/${config.owner}.png?size=80" alt="avatar">
                    <div class="user-details">
                        <div class="user-name">${config.owner}</div>
                        <div class="user-email">${config.repo} / ${config.branch || 'main'}</div>
                    </div>
                    <button class="btn-disconnect" onclick="storageManager.disconnect('github')">断开连接</button>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>存储路径</label>
                        <input type="text" id="github-path" value="${config.path || 'images'}" placeholder="images">
                    </div>
                    <div class="form-group">
                        <label>分支</label>
                        <input type="text" id="github-branch" value="${config.branch || 'main'}" placeholder="main">
                    </div>
                </div>
                <button class="btn btn-primary" onclick="storageManager.saveGitHubSettings()">保存设置</button>
            `;
        }

        return `
            <div class="oauth-section">
                <p>快速连接 GitHub 账号</p>
                <button class="btn-oauth github" onclick="storageManager.startGitHubOAuth()">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                    使用 GitHub 登录
                </button>
            </div>
            <div class="divider"><span>或手动配置</span></div>
            <div class="form-group">
                <label>Personal Access Token</label>
                <input type="password" id="github-token" value="${config.token || ''}" placeholder="ghp_xxxxxxxxxxxx">
                <small>需要 repo 权限，<a href="https://github.com/settings/tokens/new?scopes=repo&description=Image%20Hosting" target="_blank">点击获取 Token</a></small>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>用户名</label>
                    <input type="text" id="github-owner" value="${config.owner || ''}" placeholder="你的 GitHub 用户名">
                </div>
                <div class="form-group">
                    <label>仓库名</label>
                    <input type="text" id="github-repo" value="${config.repo || ''}" placeholder="image-hosting">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>存储路径</label>
                    <input type="text" id="github-path" value="${config.path || 'images'}" placeholder="images">
                </div>
                <div class="form-group">
                    <label>分支</label>
                    <input type="text" id="github-branch" value="${config.branch || 'main'}" placeholder="main">
                </div>
            </div>
            <div class="btn-group">
                <button class="btn btn-primary" onclick="storageManager.saveGitHubConfig()">保存配置</button>
                <button class="btn btn-secondary" onclick="storageManager.testGitHubConnection()">测试连接</button>
            </div>
        `;
    }

    // 测试 GitHub 连接
    async testConnection() {
        const config = this.getConfig();
        if (!config.token || !config.owner || !config.repo) {
            return { success: false, message: '请先填写完整配置' };
        }

        try {
            const response = await fetch(
                `https://api.github.com/repos/${config.owner}/${config.repo}`,
                {
                    headers: {
                        'Authorization': `token ${config.token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                }
            );

            if (response.ok) {
                const repo = await response.json();
                return {
                    success: true,
                    message: `连接成功! 仓库: ${repo.full_name}，默认分支: ${repo.default_branch}`
                };
            } else if (response.status === 404) {
                return { success: false, message: '仓库不存在，请检查用户名和仓库名' };
            } else if (response.status === 401) {
                return { success: false, message: 'Token 无效或已过期' };
            } else if (response.status === 403) {
                return { success: false, message: 'Token 权限不足，请确保有 repo 权限' };
            } else {
                return { success: false, message: `连接失败 (${response.status})` };
            }
        } catch (e) {
            return { success: false, message: `网络错误: ${e.message}` };
        }
    }

    async upload(file, onProgress) {
        const config = this.getConfig();
        if (!config.token || !config.owner || !config.repo) {
            throw new Error('请先配置 GitHub');
        }

        onProgress?.(10, '验证仓库...');

        // 先验证仓库是否存在
        try {
            const repoCheck = await fetch(
                `https://api.github.com/repos/${config.owner}/${config.repo}`,
                {
                    headers: {
                        'Authorization': `token ${config.token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                }
            );
            if (!repoCheck.ok) {
                if (repoCheck.status === 404) {
                    throw new Error(`仓库 ${config.owner}/${config.repo} 不存在，请检查配置`);
                } else if (repoCheck.status === 401) {
                    throw new Error('Token 无效或已过期');
                }
            }
        } catch (e) {
            if (e.message.includes('仓库') || e.message.includes('Token')) {
                throw e;
            }
            // 网络错误时继续尝试上传
            console.warn('仓库验证失败，继续尝试上传:', e);
        }

        onProgress?.(20, '读取文件...');

        // 读取文件为 Base64
        const base64 = await this.fileToBase64(file);

        // 生成文件名
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 8);
        const ext = file.name.split('.').pop() || 'png';
        const fileName = `${timestamp}_${randomStr}.${ext}`;
        const filePath = `${config.path || 'images'}/${fileName}`;

        onProgress?.(40, '上传到 GitHub...');

        // 调用 GitHub API
        const response = await fetch(
            `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${filePath}`,
            {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${config.token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/vnd.github.v3+json'
                },
                body: JSON.stringify({
                    message: `Upload image: ${fileName}`,
                    content: base64,
                    branch: config.branch || 'main'
                })
            }
        );

        if (!response.ok) {
            let errorMessage = '上传失败';
            try {
                const errorText = await response.text();
                console.error('GitHub API Error:', response.status, errorText);
                // 尝试解析为 JSON
                const error = JSON.parse(errorText);
                errorMessage = error.message || `错误代码: ${response.status}`;
            } catch (e) {
                // 如果不是 JSON，使用 HTTP 状态信息
                if (response.status === 400) {
                    errorMessage = '请求无效，请检查仓库名称和分支是否正确';
                } else if (response.status === 401) {
                    errorMessage = 'Token 无效或已过期，请重新配置';
                } else if (response.status === 403) {
                    errorMessage = '没有权限，请确保 Token 有 repo 权限';
                } else if (response.status === 404) {
                    errorMessage = '仓库不存在，请检查用户名和仓库名';
                } else if (response.status === 422) {
                    errorMessage = '文件已存在或路径无效';
                } else {
                    errorMessage = `上传失败 (错误代码: ${response.status})`;
                }
            }
            throw new Error(errorMessage);
        }

        onProgress?.(80, '生成链接...');

        // 生成链接
        const cdnUrl = `https://cdn.jsdelivr.net/gh/${config.owner}/${config.repo}@${config.branch || 'main'}/${filePath}`;
        const rawUrl = `https://raw.githubusercontent.com/${config.owner}/${config.repo}/${config.branch || 'main'}/${filePath}`;

        return {
            ...this.generateLinks(cdnUrl, fileName),
            cdn: cdnUrl,
            direct: rawUrl,
            fileName,
            storage: 'GitHub'
        };
    }

    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
}

/**
 * Google Drive 存储提供商
 */
class GoogleDriveProvider extends StorageProvider {
    constructor() {
        super('googledrive', 'Google Drive');
        // Google OAuth 配置
        this.clientId = ''; // 用户需要填写自己的 Client ID
        this.scope = 'https://www.googleapis.com/auth/drive.file';
    }

    isConnected() {
        const config = this.getConfig();
        return !!(config.accessToken);
    }

    getConfigFormHTML() {
        const config = this.getConfig();
        const isConnected = this.isConnected();

        if (isConnected) {
            return `
                <div class="user-info">
                    <img class="user-avatar" src="${config.userPhoto || 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>👤</text></svg>'}" alt="avatar">
                    <div class="user-details">
                        <div class="user-name">${config.userName || 'Google 用户'}</div>
                        <div class="user-email">${config.userEmail || ''}</div>
                    </div>
                    <button class="btn-disconnect" onclick="storageManager.disconnect('googledrive')">断开连接</button>
                </div>
                <div class="form-group">
                    <label>存储文件夹 ID (可选)</label>
                    <input type="text" id="googledrive-folder" value="${config.folderId || ''}" placeholder="留空则上传到根目录">
                    <small>可在 Google Drive 文件夹 URL 中找到</small>
                </div>
                <button class="btn btn-primary" onclick="storageManager.saveGoogleDriveSettings()">保存设置</button>
            `;
        }

        return `
            <div class="oauth-section">
                <p>连接 Google Drive 账号</p>
                <button class="btn-oauth google" onclick="storageManager.startGoogleOAuth()">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M4.433 22l-1.566-2.7 7.134-12.3h3.132l-7.134 12.3zm10.567-17h-6l7.5 13 1.5-2.6zm-3.5 6l-3.5 6h14l-3.5-6z"/></svg>
                    使用 Google 登录
                </button>
            </div>
            <div class="divider"><span>或手动配置</span></div>
            <div class="form-group">
                <label>Access Token</label>
                <input type="password" id="googledrive-token" value="" placeholder="Google OAuth Access Token">
                <small><a href="https://developers.google.com/oauthplayground/" target="_blank">获取 Token</a> (选择 Drive API v3)</small>
            </div>
            <div class="form-group">
                <label>存储文件夹 ID (可选)</label>
                <input type="text" id="googledrive-folder" value="${config.folderId || ''}" placeholder="留空则上传到根目录">
            </div>
            <button class="btn btn-primary" onclick="storageManager.saveGoogleDriveConfig()">保存配置</button>
        `;
    }

    async upload(file, onProgress) {
        const config = this.getConfig();
        if (!config.accessToken) {
            throw new Error('请先连接 Google Drive');
        }

        onProgress?.(20, '准备上传...');

        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 8);
        const ext = file.name.split('.').pop() || 'png';
        const fileName = `${timestamp}_${randomStr}.${ext}`;

        // 创建 metadata
        const metadata = {
            name: fileName,
            mimeType: file.type
        };

        if (config.folderId) {
            metadata.parents = [config.folderId];
        }

        onProgress?.(40, '上传到 Google Drive...');

        // 使用 multipart upload
        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', file);

        const response = await fetch(
            'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink,webContentLink',
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${config.accessToken}`
                },
                body: form
            }
        );

        if (!response.ok) {
            let errorMessage = '上传失败';
            try {
                const error = await response.json();
                errorMessage = error.error?.message || errorMessage;
            } catch (e) {
                errorMessage = `上传失败 (${response.status}: ${response.statusText})`;
            }
            throw new Error(errorMessage);
        }

        const result = await response.json();

        onProgress?.(60, '设置共享权限...');

        // 设置文件为公开
        await fetch(
            `https://www.googleapis.com/drive/v3/files/${result.id}/permissions`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${config.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    role: 'reader',
                    type: 'anyone'
                })
            }
        );

        onProgress?.(80, '生成链接...');

        // 生成直接访问链接
        const directUrl = `https://drive.google.com/uc?export=view&id=${result.id}`;

        return {
            ...this.generateLinks(directUrl, fileName),
            direct: directUrl,
            fileName,
            storage: 'Google Drive'
        };
    }
}

/**
 * OneDrive 存储提供商
 */
class OneDriveProvider extends StorageProvider {
    constructor() {
        super('onedrive', 'OneDrive');
        this.clientId = ''; // 用户需要填写 Azure App Client ID
    }

    isConnected() {
        const config = this.getConfig();
        return !!(config.accessToken);
    }

    getConfigFormHTML() {
        const config = this.getConfig();
        const isConnected = this.isConnected();

        if (isConnected) {
            return `
                <div class="user-info">
                    <img class="user-avatar" src="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>👤</text></svg>" alt="avatar">
                    <div class="user-details">
                        <div class="user-name">${config.userName || 'OneDrive 用户'}</div>
                        <div class="user-email">${config.userEmail || ''}</div>
                    </div>
                    <button class="btn-disconnect" onclick="storageManager.disconnect('onedrive')">断开连接</button>
                </div>
                <div class="form-group">
                    <label>存储路径</label>
                    <input type="text" id="onedrive-path" value="${config.path || 'ImageHosting'}" placeholder="ImageHosting">
                </div>
                <button class="btn btn-primary" onclick="storageManager.saveOneDriveSettings()">保存设置</button>
            `;
        }

        return `
            <div class="oauth-section">
                <p>连接 OneDrive 账号</p>
                <button class="btn-oauth onedrive" onclick="storageManager.startOneDriveOAuth()">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M10.5 18.5h8.25c2.9 0 5.25-2.35 5.25-5.25s-2.35-5.25-5.25-5.25c-.17 0-.33.01-.5.02C17.55 5.69 15.22 4 12.5 4c-3.04 0-5.5 2.46-5.5 5.5 0 .28.02.55.06.82C4.22 10.85 2 13.37 2 16.5c0 3.31 2.69 6 6 6h2.5v-4z"/></svg>
                    使用 Microsoft 登录
                </button>
            </div>
            <div class="divider"><span>或手动配置</span></div>
            <div class="form-group">
                <label>Access Token</label>
                <input type="password" id="onedrive-token" value="" placeholder="Microsoft Graph Access Token">
                <small><a href="https://developer.microsoft.com/en-us/graph/graph-explorer" target="_blank">获取 Token</a></small>
            </div>
            <div class="form-group">
                <label>存储路径</label>
                <input type="text" id="onedrive-path" value="${config.path || 'ImageHosting'}" placeholder="ImageHosting">
            </div>
            <button class="btn btn-primary" onclick="storageManager.saveOneDriveConfig()">保存配置</button>
        `;
    }

    async upload(file, onProgress) {
        const config = this.getConfig();
        if (!config.accessToken) {
            throw new Error('请先连接 OneDrive');
        }

        onProgress?.(20, '准备上传...');

        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 8);
        const ext = file.name.split('.').pop() || 'png';
        const fileName = `${timestamp}_${randomStr}.${ext}`;
        const filePath = `${config.path || 'ImageHosting'}/${fileName}`;

        onProgress?.(40, '上传到 OneDrive...');

        // 上传文件
        const response = await fetch(
            `https://graph.microsoft.com/v1.0/me/drive/root:/${filePath}:/content`,
            {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${config.accessToken}`,
                    'Content-Type': file.type
                },
                body: file
            }
        );

        if (!response.ok) {
            let errorMessage = '上传失败';
            try {
                const error = await response.json();
                errorMessage = error.error?.message || errorMessage;
            } catch (e) {
                errorMessage = `上传失败 (${response.status}: ${response.statusText})`;
            }
            throw new Error(errorMessage);
        }

        const result = await response.json();

        onProgress?.(60, '创建共享链接...');

        // 创建共享链接
        const shareResponse = await fetch(
            `https://graph.microsoft.com/v1.0/me/drive/items/${result.id}/createLink`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${config.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    type: 'view',
                    scope: 'anonymous'
                })
            }
        );

        let directUrl = result.webUrl;
        if (shareResponse.ok) {
            const shareResult = await shareResponse.json();
            // 转换为直接下载链接
            const shareId = shareResult.link.webUrl.split('/').pop();
            directUrl = `https://api.onedrive.com/v1.0/shares/${shareId}/root/content`;
        }

        onProgress?.(80, '生成链接...');

        return {
            ...this.generateLinks(directUrl, fileName),
            direct: directUrl,
            fileName,
            storage: 'OneDrive'
        };
    }
}

/**
 * Dropbox 存储提供商
 */
class DropboxProvider extends StorageProvider {
    constructor() {
        super('dropbox', 'Dropbox');
        this.clientId = ''; // 用户需要填写 Dropbox App Key
    }

    isConnected() {
        const config = this.getConfig();
        return !!(config.accessToken);
    }

    getConfigFormHTML() {
        const config = this.getConfig();
        const isConnected = this.isConnected();

        if (isConnected) {
            return `
                <div class="user-info">
                    <img class="user-avatar" src="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>👤</text></svg>" alt="avatar">
                    <div class="user-details">
                        <div class="user-name">${config.userName || 'Dropbox 用户'}</div>
                        <div class="user-email">${config.userEmail || ''}</div>
                    </div>
                    <button class="btn-disconnect" onclick="storageManager.disconnect('dropbox')">断开连接</button>
                </div>
                <div class="form-group">
                    <label>存储路径</label>
                    <input type="text" id="dropbox-path" value="${config.path || '/ImageHosting'}" placeholder="/ImageHosting">
                </div>
                <button class="btn btn-primary" onclick="storageManager.saveDropboxSettings()">保存设置</button>
            `;
        }

        return `
            <div class="oauth-section">
                <p>连接 Dropbox 账号</p>
                <button class="btn-oauth dropbox" onclick="storageManager.startDropboxOAuth()">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 2l6 3.75L6 9.5 0 5.75zm12 0l6 3.75-6 3.75-6-3.75zM0 13.25L6 9.5l6 3.75-6 3.75zm12 0l6-3.75 6 3.75-6 3.75zm-6 7.5l6-3.75 6 3.75-6 3.75z"/></svg>
                    使用 Dropbox 登录
                </button>
            </div>
            <div class="divider"><span>或手动配置</span></div>
            <div class="form-group">
                <label>Access Token</label>
                <input type="password" id="dropbox-token" value="" placeholder="Dropbox Access Token">
                <small><a href="https://www.dropbox.com/developers/apps" target="_blank">创建 App 获取 Token</a></small>
            </div>
            <div class="form-group">
                <label>存储路径</label>
                <input type="text" id="dropbox-path" value="${config.path || '/ImageHosting'}" placeholder="/ImageHosting">
            </div>
            <button class="btn btn-primary" onclick="storageManager.saveDropboxConfig()">保存配置</button>
        `;
    }

    async upload(file, onProgress) {
        const config = this.getConfig();
        if (!config.accessToken) {
            throw new Error('请先连接 Dropbox');
        }

        onProgress?.(20, '准备上传...');

        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 8);
        const ext = file.name.split('.').pop() || 'png';
        const fileName = `${timestamp}_${randomStr}.${ext}`;
        let path = config.path || '/ImageHosting';
        if (!path.startsWith('/')) path = '/' + path;
        const filePath = `${path}/${fileName}`;

        onProgress?.(40, '上传到 Dropbox...');

        // 上传文件
        const response = await fetch(
            'https://content.dropboxapi.com/2/files/upload',
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${config.accessToken}`,
                    'Content-Type': 'application/octet-stream',
                    'Dropbox-API-Arg': JSON.stringify({
                        path: filePath,
                        mode: 'add',
                        autorename: true
                    })
                },
                body: file
            }
        );

        if (!response.ok) {
            let errorMessage = '上传失败';
            try {
                const error = await response.json();
                errorMessage = error.error_summary || errorMessage;
            } catch (e) {
                errorMessage = `上传失败 (${response.status}: ${response.statusText})`;
            }
            throw new Error(errorMessage);
        }

        const result = await response.json();

        onProgress?.(60, '创建共享链接...');

        // 创建共享链接
        const shareResponse = await fetch(
            'https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings',
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${config.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    path: result.path_display,
                    settings: {
                        requested_visibility: 'public'
                    }
                })
            }
        );

        let directUrl = '';
        if (shareResponse.ok) {
            const shareResult = await shareResponse.json();
            // 转换为直接下载链接
            directUrl = shareResult.url.replace('www.dropbox.com', 'dl.dropboxusercontent.com').replace('?dl=0', '');
        } else {
            // 如果链接已存在，获取现有链接
            const listResponse = await fetch(
                'https://api.dropboxapi.com/2/sharing/list_shared_links',
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${config.accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        path: result.path_display
                    })
                }
            );
            if (listResponse.ok) {
                const listResult = await listResponse.json();
                if (listResult.links && listResult.links.length > 0) {
                    directUrl = listResult.links[0].url.replace('www.dropbox.com', 'dl.dropboxusercontent.com').replace('?dl=0', '');
                }
            }
        }

        onProgress?.(80, '生成链接...');

        return {
            ...this.generateLinks(directUrl, fileName),
            direct: directUrl,
            fileName,
            storage: 'Dropbox'
        };
    }
}

/**
 * 存储管理器
 */
class StorageManager {
    constructor() {
        this.providers = {
            github: new GitHubProvider(),
            googledrive: new GoogleDriveProvider(),
            onedrive: new OneDriveProvider(),
            dropbox: new DropboxProvider()
        };
        this.currentProvider = 'github';
    }

    // 获取当前提供商
    getCurrentProvider() {
        return this.providers[this.currentProvider];
    }

    // 设置当前提供商
    setCurrentProvider(name) {
        if (this.providers[name]) {
            this.currentProvider = name;
            localStorage.setItem('current-storage-provider', name);
        }
    }

    // 初始化
    init() {
        // 恢复上次使用的提供商
        const saved = localStorage.getItem('current-storage-provider');
        if (saved && this.providers[saved]) {
            this.currentProvider = saved;
        }

        // 更新 UI 状态
        this.updateStorageStatus();
    }

    // 更新存储状态
    updateStorageStatus() {
        for (const [name, provider] of Object.entries(this.providers)) {
            const card = document.querySelector(`[data-storage="${name}"]`);
            const statusEl = document.getElementById(`${name}-status`);
            if (card && statusEl) {
                const isConnected = provider.isConnected();
                card.classList.toggle('connected', isConnected);
                card.classList.toggle('active', name === this.currentProvider);
                statusEl.querySelector('.status-text').textContent = isConnected ? '已连接' : '未连接';
            }
        }
    }

    // 断开连接
    disconnect(providerName) {
        const provider = this.providers[providerName];
        if (provider) {
            provider.clearConfig();
            this.updateStorageStatus();
            showToast(`已断开 ${provider.displayName} 连接`, 'success');
            closeConfig();
        }
    }

    // GitHub OAuth
    startGitHubOAuth() {
        // GitHub OAuth 需要后端支持，这里提供一个简化的方案
        // 使用 GitHub Device Flow 或引导用户手动获取 Token
        const tokenUrl = 'https://github.com/settings/tokens/new?scopes=repo&description=Image%20Hosting%20Tool';
        window.open(tokenUrl, '_blank');
        showToast('请在新窗口中创建 Token，然后粘贴到下方输入框', 'success');
    }

    // 保存 GitHub 配置
    saveGitHubConfig() {
        const token = document.getElementById('github-token')?.value.trim();
        const owner = document.getElementById('github-owner')?.value.trim();
        const repo = document.getElementById('github-repo')?.value.trim();
        const path = document.getElementById('github-path')?.value.trim() || 'images';
        const branch = document.getElementById('github-branch')?.value.trim() || 'main';

        if (!token || !owner || !repo) {
            showToast('请填写完整的配置信息', 'error');
            return;
        }

        this.providers.github.saveConfig({ token, owner, repo, path, branch });
        this.updateStorageStatus();
        showToast('GitHub 配置已保存', 'success');
        closeConfig();
    }

    // 保存 GitHub 设置
    saveGitHubSettings() {
        const config = this.providers.github.getConfig();
        const path = document.getElementById('github-path')?.value.trim() || 'images';
        const branch = document.getElementById('github-branch')?.value.trim() || 'main';

        this.providers.github.saveConfig({ ...config, path, branch });
        showToast('设置已保存', 'success');
    }

    // 测试 GitHub 连接
    async testGitHubConnection() {
        // 先临时保存当前输入的配置
        const token = document.getElementById('github-token')?.value.trim();
        const owner = document.getElementById('github-owner')?.value.trim();
        const repo = document.getElementById('github-repo')?.value.trim();

        if (!token || !owner || !repo) {
            showToast('请先填写 Token、用户名和仓库名', 'error');
            return;
        }

        showToast('正在测试连接...', '');

        try {
            const response = await fetch(
                `https://api.github.com/repos/${owner}/${repo}`,
                {
                    headers: {
                        'Authorization': `token ${token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                }
            );

            if (response.ok) {
                const repoData = await response.json();
                showToast(`连接成功! 仓库: ${repoData.full_name}`, 'success');
            } else if (response.status === 404) {
                showToast('仓库不存在，请检查用户名和仓库名', 'error');
            } else if (response.status === 401) {
                showToast('Token 无效或已过期', 'error');
            } else if (response.status === 403) {
                showToast('Token 权限不足，请确保有 repo 权限', 'error');
            } else {
                showToast(`连接失败 (${response.status})`, 'error');
            }
        } catch (e) {
            showToast(`网络错误: ${e.message}`, 'error');
        }
    }

    // Google OAuth
    startGoogleOAuth() {
        const tokenUrl = 'https://developers.google.com/oauthplayground/';
        window.open(tokenUrl, '_blank');
        showToast('请在 OAuth Playground 中获取 Access Token (选择 Drive API v3)', 'success');
    }

    // 保存 Google Drive 配置
    saveGoogleDriveConfig() {
        const accessToken = document.getElementById('googledrive-token')?.value.trim();
        const folderId = document.getElementById('googledrive-folder')?.value.trim();

        if (!accessToken) {
            showToast('请填写 Access Token', 'error');
            return;
        }

        this.providers.googledrive.saveConfig({ accessToken, folderId });
        this.updateStorageStatus();
        showToast('Google Drive 配置已保存', 'success');
        closeConfig();
    }

    saveGoogleDriveSettings() {
        const config = this.providers.googledrive.getConfig();
        const folderId = document.getElementById('googledrive-folder')?.value.trim();
        this.providers.googledrive.saveConfig({ ...config, folderId });
        showToast('设置已保存', 'success');
    }

    // OneDrive OAuth
    startOneDriveOAuth() {
        const tokenUrl = 'https://developer.microsoft.com/en-us/graph/graph-explorer';
        window.open(tokenUrl, '_blank');
        showToast('请在 Graph Explorer 中获取 Access Token', 'success');
    }

    // 保存 OneDrive 配置
    saveOneDriveConfig() {
        const accessToken = document.getElementById('onedrive-token')?.value.trim();
        const path = document.getElementById('onedrive-path')?.value.trim() || 'ImageHosting';

        if (!accessToken) {
            showToast('请填写 Access Token', 'error');
            return;
        }

        this.providers.onedrive.saveConfig({ accessToken, path });
        this.updateStorageStatus();
        showToast('OneDrive 配置已保存', 'success');
        closeConfig();
    }

    saveOneDriveSettings() {
        const config = this.providers.onedrive.getConfig();
        const path = document.getElementById('onedrive-path')?.value.trim() || 'ImageHosting';
        this.providers.onedrive.saveConfig({ ...config, path });
        showToast('设置已保存', 'success');
    }

    // Dropbox OAuth
    startDropboxOAuth() {
        const tokenUrl = 'https://www.dropbox.com/developers/apps';
        window.open(tokenUrl, '_blank');
        showToast('请创建 Dropbox App 并获取 Access Token', 'success');
    }

    // 保存 Dropbox 配置
    saveDropboxConfig() {
        const accessToken = document.getElementById('dropbox-token')?.value.trim();
        const path = document.getElementById('dropbox-path')?.value.trim() || '/ImageHosting';

        if (!accessToken) {
            showToast('请填写 Access Token', 'error');
            return;
        }

        this.providers.dropbox.saveConfig({ accessToken, path });
        this.updateStorageStatus();
        showToast('Dropbox 配置已保存', 'success');
        closeConfig();
    }

    saveDropboxSettings() {
        const config = this.providers.dropbox.getConfig();
        const path = document.getElementById('dropbox-path')?.value.trim() || '/ImageHosting';
        this.providers.dropbox.saveConfig({ ...config, path });
        showToast('设置已保存', 'success');
    }

    // 上传文件
    async upload(file, onProgress) {
        const provider = this.getCurrentProvider();
        if (!provider.isConnected()) {
            throw new Error(`请先配置 ${provider.displayName}`);
        }
        return provider.upload(file, onProgress);
    }
}

// 创建全局实例
const storageManager = new StorageManager();
