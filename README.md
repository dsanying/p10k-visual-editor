# Powerlevel10k Visual Editor

本工具是一个本地 Web 编辑器，用来可视化编辑 `~/.p10k.zsh` 的常用配置，并通过本机 zsh + Powerlevel10k 在伪终端中真实渲染和交互执行命令。

## 运行模式

本项目使用同一套前端自动切换两种模式：

- 真实模式：本机运行 `npm start` 后，页面会连接 Node 后端，读取 `~/.p10k.zsh`，并调用本机 zsh + Powerlevel10k 真实渲染；也可以启动交互 zsh，像普通终端一样输入命令并回车执行。
- 静态预览模式：部署到 GitHub Pages 时没有后端，页面会自动降级为预览版。预览版可以勾选、排序和查看近似效果，但不能读取、保存或真实调用 zsh。

## GitHub Pages

可以部署到 GitHub Pages。Pages 会运行静态预览模式。

部署方式：

- GitHub 仓库托管完整源码。
- GitHub Pages 指向仓库根目录 `/`。
- 用户需要真实编辑时，clone 仓库后在本机运行 `npm start`。

## 文件结构

- `index.html`、`app.js`、`style.css`：本机服务和 GitHub Pages 共用的前端页面。
- `server.js`：本机 Node 后端，提供配置读取、保存和 zsh 真实渲染 API。
- `start.command`：macOS 双击启动文件，会启动本机服务并打开浏览器。
- `package.json`：本地启动和检查脚本。

## 环境要求

- macOS 或类 Unix 环境
- Node.js 18+
- zsh
- Oh My Zsh
- Powerlevel10k
- macOS 上用于单次真实渲染的 `script` 命令

## 快速安装

### 1. 安装 Oh My Zsh

```sh
RUNZSH=no CHSH=no KEEP_ZSHRC=yes sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" --unattended
```

### 2. 安装 Powerlevel10k

```sh
git clone --depth=1 https://github.com/romkatv/powerlevel10k.git \
  "${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/themes/powerlevel10k"
```

### 3. 启用 Powerlevel10k

编辑 `~/.zshrc`：

```sh
ZSH_THEME="powerlevel10k/powerlevel10k"
```

确保 `~/.zshrc` 中有下面这一行，用于加载 Powerlevel10k 配置：

```sh
[[ ! -f ~/.p10k.zsh ]] || source ~/.p10k.zsh
```

### 4. 生成基础配置

```sh
exec zsh
p10k configure
```

## 启动编辑器

macOS 可以直接双击项目根目录里的 `start.command`。

克隆本仓库后：

```sh
cd p10k-visual-editor
npm install
npm start
```

默认地址：

```text
http://127.0.0.1:48731
```

页面会自动检测运行模式：

- 本机 `npm start` 打开：真实模式，可读取、预览并保存 `~/.p10k.zsh`。
- GitHub Pages 打开：预览模式，可手动选择 `.p10k.zsh` 文件并下载修改后的配置。

## 行为

- 读取当前用户的 `~/.p10k.zsh`
- 保存前自动备份原文件，备份名类似 `.p10k.zsh.p10k-editor.YYYYMMDDTHHMMSS.bak`
- 可视化编辑左右 prompt 段、显示顺序和常用参数
- 预览时会把当前界面上的未保存配置写入临时文件，并调用本机 zsh + Powerlevel10k 在伪终端中真实渲染
- 交互 zsh 会使用同一份临时配置启动，输入命令并回车后会真实执行
- 保存后在终端执行 `source ~/.p10k.zsh` 或 `exec zsh` 生效

## 开发检查

```sh
npm run check
```
