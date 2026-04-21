# Powerlevel10k Visual Editor

用组件化界面编辑 `~/.p10k.zsh`，本机可保存并打开交互 zsh，静态部署时自动退回模拟渲染。

## 技术栈

- React
- Vite
- Mantine
- Node.js
- xterm.js

## 环境要求

- Node.js 18+
- zsh
- Oh My Zsh
- Powerlevel10k

## 安装 Oh My Zsh

```sh
RUNZSH=no CHSH=no KEEP_ZSHRC=yes sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" --unattended
```

## 安装 Powerlevel10k

```sh
git clone --depth=1 https://github.com/romkatv/powerlevel10k.git \
  "${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/themes/powerlevel10k"
```

在 `~/.zshrc` 中启用主题并加载配置：

```sh
ZSH_THEME="powerlevel10k/powerlevel10k"
[[ ! -f ~/.p10k.zsh ]] || source ~/.p10k.zsh
```

首次生成配置：

```sh
exec zsh
p10k configure
```

## 本地启动

```sh
npm install
npm start
```

默认地址：

```text
http://127.0.0.1:48731
```

macOS 也可以直接双击根目录里的 `start.command`。

## GitHub Pages

静态部署时执行：

```sh
npm run build
```

将 `dist/` 发布到 GitHub Pages 后，会自动使用模拟渲染模式。

## 开发命令

```sh
npm run build
npm run serve
npm run check
```
