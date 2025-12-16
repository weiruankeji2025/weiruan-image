# 图床工具 (Image Hosting Tool)

一款支持多云存储的免费图床工具，支持 GitHub、Google Drive、OneDrive、Dropbox，提供拖拽上传、粘贴上传，自动生成 Markdown 链接。

## 特性

- **多云存储**: 支持 GitHub、Google Drive、OneDrive、Dropbox
- **多种上传方式**: 拖拽上传、点击上传、Ctrl+V 粘贴上传
- **多种链接格式**: Markdown、HTML、直链、jsDelivr CDN (GitHub)
- **快速授权**: 一键连接各云存储账号
- **全球加速**: GitHub 使用 jsDelivr CDN 全球加速
- **历史记录**: 本地保存上传历史，方便查找
- **响应式设计**: 支持桌面端和移动端
- **暗色模式**: 自动适配系统主题

## 支持的存储服务

| 服务 | 免费空间 | 特点 |
|------|----------|------|
| **GitHub** | 无限制 | jsDelivr CDN 全球加速，最推荐 |
| **Google Drive** | 15GB | 全球访问，速度快 |
| **OneDrive** | 5GB | 微软生态，稳定 |
| **Dropbox** | 2GB | 稳定可靠，老牌服务 |

## 快速开始

### 方式一：在线使用

1. 访问: `https://你的用户名.github.io/weiruan-image`
2. 选择存储服务并配置
3. 开始上传!

### 方式二：部署到自己的 GitHub

#### 1. Fork 仓库

点击右上角 Fork 按钮，将此仓库 Fork 到你的账号下。

#### 2. 开启 GitHub Pages

1. 进入你 Fork 的仓库
2. 点击 `Settings` -> `Pages`
3. Source 选择 `Deploy from a branch`
4. Branch 选择 `main` 分支，目录选择 `/ (root)`
5. 点击 Save

## 配置各存储服务

### GitHub 配置

**推荐方式**: 使用 Personal Access Token

1. 访问 [GitHub Token 设置页面](https://github.com/settings/tokens/new?scopes=repo&description=Image%20Hosting)
2. 勾选 `repo` 权限
3. 点击 `Generate token`
4. 复制 Token 到配置页面

### Google Drive 配置

1. 访问 [Google OAuth Playground](https://developers.google.com/oauthplayground/)
2. 选择 `Drive API v3` -> `https://www.googleapis.com/auth/drive.file`
3. 点击 `Authorize APIs`
4. 登录 Google 账号并授权
5. 点击 `Exchange authorization code for tokens`
6. 复制 `Access Token` 到配置页面

### OneDrive 配置

1. 访问 [Microsoft Graph Explorer](https://developer.microsoft.com/en-us/graph/graph-explorer)
2. 登录 Microsoft 账号
3. 复制页面上的 Access Token

### Dropbox 配置

1. 访问 [Dropbox App Console](https://www.dropbox.com/developers/apps)
2. 创建新 App (选择 Full Dropbox)
3. 在 Settings 中生成 Access Token
4. 复制 Token 到配置页面

## 使用方法

### 拖拽上传
直接将图片拖拽到上传区域即可。

### 粘贴上传
复制图片后，在页面上按 `Ctrl+V`（Mac 为 `Cmd+V`）即可上传。

### 点击上传
点击上传区域，选择要上传的图片文件。

## 链接格式说明

| 类型 | 格式 | 说明 |
|------|------|------|
| Markdown | `![name](url)` | 适用于 Markdown 文档 |
| HTML | `<img src="url">` | 适用于网页 |
| 直链 | `https://...` | 图片直接访问地址 |
| CDN | `cdn.jsdelivr.net/...` | GitHub 专用，全球加速 |

## 项目结构

```
├── index.html              # 主页面
├── css/
│   └── style.css           # 样式文件
├── js/
│   ├── app.js              # 主应用逻辑
│   └── storage-providers.js # 存储提供商模块
├── images/                 # 图片存储目录
└── README.md               # 说明文档
```

## 技术架构

- **前端**: 纯 HTML/CSS/JavaScript，无框架依赖
- **存储**: 多云存储支持 (GitHub API, Google Drive API, Microsoft Graph API, Dropbox API)
- **CDN**: GitHub 图片使用 jsDelivr CDN 加速
- **部署**: GitHub Pages 静态托管

## 安全说明

- 所有 Token 仅保存在浏览器本地 (localStorage)
- 不会上传到任何第三方服务器
- 建议使用最小权限的 Token
- 定期更换 Token 以提高安全性

## 常见问题

### Q: 上传失败怎么办?
A: 请检查:
1. Token 是否正确
2. Token 是否有足够权限
3. 网络是否正常
4. 文件大小是否超过限制

### Q: 图片加载很慢?
A: 推荐使用 GitHub + jsDelivr CDN，全球加速访问。

### Q: Token 会泄露吗?
A: Token 仅保存在您的浏览器本地，不会发送到任何第三方服务器。

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request!
