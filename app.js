'use strict';

let state = null;
let backendMode = 'detecting';
const ANSI_COLORS = [
  '#000000', '#800000', '#008000', '#808000', '#000080', '#800080', '#008080', '#c0c0c0',
  '#808080', '#ff0000', '#00ff00', '#ffff00', '#0000ff', '#ff00ff', '#00ffff', '#ffffff',
];

const leftList = document.querySelector('#left-list');
const rightList = document.querySelector('#right-list');
const settingsEl = document.querySelector('#settings');
const messageEl = document.querySelector('#message');
const rawEl = document.querySelector('#raw-config');
const previewDirInput = document.querySelector('#preview-dir');
const previewNote = document.querySelector('#preview-note');
const realPromptEl = document.querySelector('#real-prompt');
const saveButton = document.querySelector('#save');
const settingsNote = document.querySelector('#settings-note');
const configPathInput = document.querySelector('#config-path-input');
const configFileInput = document.querySelector('#config-file-input');
const configHelp = document.querySelector('#config-help');
const selectDirButton = document.querySelector('#select-dir');
const terminalOpenButton = document.querySelector('#terminal-open');
const terminalStartButton = document.querySelector('#terminal-start');
const terminalStopButton = document.querySelector('#terminal-stop');
const terminalCloseButton = document.querySelector('#terminal-close');
const terminalDialog = document.querySelector('#terminal-dialog');
const terminalEl = document.querySelector('#terminal');
let snapshot = { values: {} };
let realRender = { ansi: '', error: '' };
let renderTimer = null;
let uploadedConfigText = '';
let uploadedFileName = '.p10k.zsh';
let terminal = null;
let terminalSocket = null;

const segmentExamples = {
  newline: ['第一行显示路径，第二行输入命令', '所有内容尽量挤在同一行'],
  os_icon: [' ~/project', '~/project'],
  dir: ['~/Desktop/project', '不显示当前位置'],
  vcs: ['on main *1', '不显示 Git 分支和改动状态'],
  prompt_char: ['❯ npm start', '直接从边框后开始输入'],
  status: ['128 ✘', '不显示上一条命令是否失败'],
  command_execution_time: ['took 8s', '不显示上一条命令耗时'],
  background_jobs: ['≡', '不提示后台任务'],
  direnv: ['direnv', '不显示 direnv 状态'],
  asdf: ['nodejs 22.1.0', '不显示 asdf 版本'],
  virtualenv: ['venv', '不显示 Python 虚拟环境'],
  anaconda: ['base', '不显示 Conda 环境'],
  pyenv: ['3.12.2', '不显示 pyenv 版本'],
  goenv: ['1.22.3', '不显示 goenv 版本'],
  nodenv: ['20.11.1', '不显示 nodenv 版本'],
  nvm: ['20.11.1', '不显示 nvm Node 版本'],
  nodeenv: ['nodeenv', '不显示 nodeenv 环境'],
  node_version: ['node 20.11.1', '不显示 Node 版本'],
  go_version: ['go 1.22.3', '不显示 Go 版本'],
  rust_version: ['rust 1.76.0', '不显示 Rust 版本'],
  dotnet_version: ['.NET 8.0.1', '不显示 .NET 版本'],
  php_version: ['php 8.3.0', '不显示 PHP 版本'],
  java_version: ['java 21', '不显示 Java 版本'],
  package: ['project@1.0.0', '不显示 package.json 版本'],
  rbenv: ['ruby 3.3.0', '不显示 rbenv 版本'],
  rvm: ['ruby-3.3.0', '不显示 RVM 环境'],
  fvm: ['flutter 3.19.0', '不显示 Flutter FVM'],
  luaenv: ['lua 5.4.6', '不显示 Lua 版本'],
  jenv: ['java 21', '不显示 jenv 环境'],
  plenv: ['perl 5.38', '不显示 Perl 环境'],
  perlbrew: ['perl-5.38', '不显示 perlbrew'],
  phpenv: ['php 8.3.0', '不显示 phpenv'],
  scalaenv: ['scala 3.4.0', '不显示 Scala 环境'],
  haskell_stack: ['stack 9.6.3', '不显示 Haskell Stack'],
  kubecontext: ['at dev-cluster', '不显示 Kubernetes context'],
  terraform: ['default', '不显示 Terraform workspace'],
  terraform_version: ['terraform 1.7.0', '不显示 Terraform 版本'],
  aws: ['prod us-east-1', '不显示 AWS profile/region'],
  aws_eb_env: ['eb prod', '不显示 Elastic Beanstalk 环境'],
  azure: ['work-account', '不显示 Azure account'],
  gcloud: ['my-gcp-project', '不显示 Google Cloud 项目'],
  google_app_cred: ['service-project', '不显示 Google 凭据项目'],
  toolbox: ['toolbox', '不显示 Toolbox 容器名'],
  context: ['user@machine', '本机普通用户通常不显示'],
  nordvpn: ['VPN', '不显示 NordVPN 状态'],
  ranger: ['ranger 1', '不显示 ranger 子 shell 层级'],
  yazi: ['yazi 1', '不显示 Yazi 子 shell 层级'],
  nnn: ['nnn 1', '不显示 nnn 子 shell 层级'],
  lf: ['lf 1', '不显示 lf 子 shell 层级'],
  xplr: ['xplr', '不显示 xplr 子 shell 状态'],
  vim_shell: ['vim shell', '不显示 Vim 子 shell 提示'],
  midnight_commander: ['mc', '不显示 Midnight Commander 子 shell 提示'],
  nix_shell: ['nix shell', '不显示 Nix shell'],
  chezmoi_shell: ['chezmoi', '不显示 chezmoi shell'],
  vi_mode: ['NORMAL', '不显示 Vi 模式'],
  todo: ['todo 3', '不显示 todo 数量'],
  timewarrior: ['coding 12m', '不显示 Timewarrior 状态'],
  taskwarrior: ['task 5', '不显示任务数量'],
  per_directory_history: ['local history', '不显示目录历史状态'],
  cpu_arch: ['arm64', '不显示 CPU 架构'],
  time: ['at 19:30:08', '不显示当前时间'],
  ip: ['192.168.1.8', '不显示内网 IP'],
  public_ip: ['203.0.113.8', '不显示公网 IP'],
  proxy: ['proxy', '不显示代理状态'],
  battery: ['82%', '不显示电池'],
  wifi: ['Wi-Fi 866Mbps', '不显示 Wi-Fi 状态'],
};

const fallbackCatalog = [
  ['newline', '换到下一行', '让后面的内容显示到下一行'],
  ['os_icon', '系统图标', '显示操作系统图标'],
  ['dir', '当前目录', '显示当前所在目录'],
  ['vcs', 'Git 状态', '显示分支、变更、ahead/behind'],
  ['prompt_char', '输入符号', '显示 ❯ 等输入提示符'],
  ['status', '命令状态', '显示上一条命令成功或失败'],
  ['command_execution_time', '命令耗时', '超过阈值后显示上一条命令耗时'],
  ['background_jobs', '后台任务', '显示是否有后台任务'],
  ['direnv', 'direnv', '显示 direnv 状态'],
  ['asdf', 'asdf', '显示 asdf 当前版本'],
  ['virtualenv', 'Python venv', '显示 Python 虚拟环境'],
  ['anaconda', 'Conda', '显示 Conda 环境'],
  ['pyenv', 'pyenv', '显示 pyenv 版本'],
  ['goenv', 'goenv', '显示 goenv 版本'],
  ['nodenv', 'nodenv', '显示 nodenv 版本'],
  ['nvm', 'nvm', '显示 nvm Node 版本'],
  ['nodeenv', 'nodeenv', '显示 nodeenv 环境'],
  ['node_version', 'Node 版本', '显示 node 版本'],
  ['go_version', 'Go 版本', '显示 Go 版本'],
  ['rust_version', 'Rust 版本', '显示 rustc 版本'],
  ['dotnet_version', '.NET 版本', '显示 .NET 版本'],
  ['php_version', 'PHP 版本', '显示 PHP 版本'],
  ['java_version', 'Java 版本', '显示 Java 版本'],
  ['package', 'package.json', '显示 package.json 的 name@version'],
  ['rbenv', 'rbenv', '显示 rbenv Ruby 版本'],
  ['rvm', 'RVM', '显示 RVM Ruby 版本'],
  ['fvm', 'Flutter FVM', '显示 FVM 版本'],
  ['luaenv', 'luaenv', '显示 Lua 版本'],
  ['jenv', 'jenv', '显示 Java 环境'],
  ['plenv', 'plenv', '显示 Perl 环境'],
  ['perlbrew', 'perlbrew', '显示 perlbrew 环境'],
  ['phpenv', 'phpenv', '显示 phpenv 版本'],
  ['scalaenv', 'scalaenv', '显示 Scala 环境'],
  ['haskell_stack', 'Haskell Stack', '显示 Stack 环境'],
  ['kubecontext', 'Kubernetes', '显示 Kubernetes context'],
  ['terraform', 'Terraform', '显示 Terraform workspace'],
  ['terraform_version', 'Terraform 版本', '显示 Terraform 版本'],
  ['aws', 'AWS', '显示 AWS profile/region'],
  ['aws_eb_env', 'Elastic Beanstalk', '显示 EB 环境'],
  ['azure', 'Azure', '显示 Azure account'],
  ['gcloud', 'GCloud', '显示 Google Cloud 项目'],
  ['google_app_cred', 'Google 凭据', '显示应用凭据项目'],
  ['toolbox', 'Toolbox 容器', '进入 Fedora Toolbox/容器开发环境时显示容器名'],
  ['context', '用户/主机', '显示 user@host'],
  ['nordvpn', 'NordVPN', '显示 NordVPN 连接状态'],
  ['ranger', 'ranger 文件管理器', '在 ranger 文件管理器子 shell 中显示层级'],
  ['yazi', 'Yazi 文件管理器', '在 Yazi 文件管理器子 shell 中显示层级'],
  ['nnn', 'nnn 文件管理器', '在 nnn 文件管理器子 shell 中显示层级'],
  ['lf', 'lf 文件管理器', '在 lf 文件管理器子 shell 中显示层级'],
  ['xplr', 'xplr 文件管理器', '在 xplr 文件管理器子 shell 中显示状态'],
  ['vim_shell', 'Vim 子 shell', '在 Vim 内打开 shell 时显示提示'],
  ['midnight_commander', 'Midnight Commander', '在 mc 文件管理器子 shell 中显示提示'],
  ['nix_shell', 'Nix Shell', '显示 Nix shell'],
  ['chezmoi_shell', 'chezmoi', '显示 chezmoi shell'],
  ['vi_mode', 'Vi 模式', '显示 NORMAL/VISUAL 等模式'],
  ['todo', 'todo.txt', '显示 todo 数量'],
  ['timewarrior', 'Timewarrior', '显示计时状态'],
  ['taskwarrior', 'Taskwarrior', '显示任务数量'],
  ['per_directory_history', '目录历史', '显示 per-directory-history 状态'],
  ['cpu_arch', 'CPU 架构', '显示 CPU 架构'],
  ['time', '当前时间', '显示当前时间'],
  ['ip', '内网 IP', '显示 IP 和带宽'],
  ['public_ip', '公网 IP', '显示公网 IP'],
  ['proxy', '代理', '显示系统代理'],
  ['battery', '电池', '显示电池状态'],
  ['wifi', 'Wi-Fi', '显示 Wi-Fi 状态'],
];

const fallbackSettingsCatalog = [
  ['POWERLEVEL9K_PROMPT_ADD_NEWLINE', 'boolean', 'Prompt 前空一行'],
  ['POWERLEVEL9K_MULTILINE_FIRST_PROMPT_GAP_CHAR', 'string', '第一行填充字符'],
  ['POWERLEVEL9K_DIR_MAX_LENGTH', 'number', '目录最大长度'],
  ['POWERLEVEL9K_DIR_MIN_COMMAND_COLUMNS', 'number', '命令区最小列数'],
  ['POWERLEVEL9K_COMMAND_EXECUTION_TIME_THRESHOLD', 'number', '耗时显示阈值（秒）'],
  ['POWERLEVEL9K_COMMAND_EXECUTION_TIME_PREFIX', 'string', '耗时前缀'],
  ['POWERLEVEL9K_TIME_FORMAT', 'string', '时间格式'],
  ['POWERLEVEL9K_TIME_PREFIX', 'string', '时间前缀'],
  ['POWERLEVEL9K_TRANSIENT_PROMPT', 'raw', 'Transient prompt'],
  ['POWERLEVEL9K_INSTANT_PROMPT', 'raw', 'Instant prompt'],
];

function showMessage(text, isError = false) {
  messageEl.hidden = false;
  messageEl.textContent = text;
  messageEl.style.color = isError ? '#9b1c1c' : '#0b6b57';
}

function hideMessage() {
  messageEl.hidden = true;
  messageEl.textContent = '';
}

async function api(path, options) {
  const res = await fetch(path, options);
  const contentType = res.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await res.json() : await res.text();
  if (!res.ok) throw new Error(payload.error || payload || res.statusText);
  return payload;
}

async function load() {
  hideMessage();
  try {
    state = await api(configApiPath());
    backendMode = 'real';
    saveButton.disabled = false;
    saveButton.textContent = '保存配置';
    selectDirButton.disabled = false;
    terminalOpenButton.disabled = false;
    terminalStartButton.disabled = false;
    terminalStopButton.disabled = true;
    configPathInput.disabled = false;
    previewDirInput.disabled = false;
    document.body.dataset.mode = 'real';
    document.querySelector('#config-path').textContent = `真实模式：正在编辑 ${state.path}`;
    configPathInput.value = state.path;
    configHelp.textContent = '已连接本机后端。修改路径后按回车或离开输入框会重新加载。';
    previewNote.textContent = '真实渲染。目录不会自动刷新。';
    settingsNote.innerHTML = '保存后执行 <code>source ~/.p10k.zsh</code> 或 <code>exec zsh</code> 生效。';
    if (!previewDirInput.value) {
      previewDirInput.value = state.home || state.path.replace(/\/\.p10k\.zsh$/, '');
    }
    rawEl.textContent = await api(rawApiPath());
    await loadSnapshot();
    await loadRealRender();
  } catch {
    backendMode = 'preview';
    state = previewState();
    saveButton.disabled = false;
    saveButton.textContent = '下载配置';
    selectDirButton.disabled = true;
    terminalOpenButton.disabled = true;
    terminalStartButton.disabled = true;
    terminalStopButton.disabled = true;
    document.body.dataset.mode = 'preview';
    document.querySelector('#config-path').textContent = '未连接本机后端。可以选择本地配置文件进行预览，并下载修改后的配置。';
    configPathInput.value = '~/.p10k.zsh';
    configPathInput.disabled = true;
    configHelp.textContent = '请选择 .p10k.zsh 文件。未选择时使用内置示例配置。';
    previewDirInput.value = '~';
    previewDirInput.disabled = true;
    previewNote.textContent = '模拟渲染。';
    settingsNote.textContent = '选择配置文件后，可以下载修改后的配置。';
    rawEl.textContent = '尚未选择配置文件。当前使用内置示例配置。';
    loadPreviewSnapshot();
  }
  render();
}

function configApiPath() {
  const value = configPathInput.value.trim();
  return value ? `api/config?path=${encodeURIComponent(value)}` : 'api/config';
}

function rawApiPath() {
  const value = configPathInput.value.trim();
  return value ? `api/raw?path=${encodeURIComponent(value)}` : 'api/raw';
}

async function loadSnapshot() {
  if (backendMode !== 'real') {
    loadPreviewSnapshot();
    return;
  }
  snapshot = await api(`api/snapshot?dir=${encodeURIComponent(previewDirInput.value)}`);
  previewDirInput.value = snapshot.dir;
  previewNote.textContent = snapshot.exists
    ? `正在读取：${snapshot.dir}`
    : `目录不存在，已回退到：${snapshot.dir}`;
}

function previewState() {
  return {
    path: uploadedFileName || '示例配置',
    left: ['dir', 'vcs', 'newline'],
    right: ['status', 'command_execution_time', 'go_version', 'node_version', 'time'],
    settings: {
      POWERLEVEL9K_PROMPT_ADD_NEWLINE: 'true',
      POWERLEVEL9K_MULTILINE_FIRST_PROMPT_GAP_CHAR: '·',
      POWERLEVEL9K_DIR_MAX_LENGTH: '80',
      POWERLEVEL9K_DIR_MIN_COMMAND_COLUMNS: '40',
      POWERLEVEL9K_COMMAND_EXECUTION_TIME_THRESHOLD: '3',
      POWERLEVEL9K_COMMAND_EXECUTION_TIME_PREFIX: 'took ',
      POWERLEVEL9K_TIME_FORMAT: '%D{%H:%M:%S}',
      POWERLEVEL9K_TIME_PREFIX: 'at ',
      POWERLEVEL9K_TRANSIENT_PROMPT: 'off',
      POWERLEVEL9K_INSTANT_PROMPT: 'verbose',
    },
    catalog: fallbackCatalog,
    settingsCatalog: fallbackSettingsCatalog,
  };
}

function loadPreviewSnapshot() {
  const now = new Date();
  const values = {};
  for (const [id] of fallbackCatalog) {
    values[id] = (segmentExamples[id] || ['', ''])[0];
  }
  values.dir = '~/Desktop/project';
  values.vcs = 'on main *1';
  values.status = '128 ✘';
  values.command_execution_time = 'took 8s';
  values.go_version = 'go1.22.0';
  values.node_version = 'v22.0.0';
  values.time = `at ${now.toLocaleTimeString('zh-CN', { hour12: false })}`;
  snapshot = {
    dir: previewDirInput.value,
    exists: false,
    values,
  };
}

async function loadRealRender() {
  if (backendMode !== 'real') {
    realRender = { ansi: '', error: '' };
    return;
  }
  realRender = await api(`api/render?dir=${encodeURIComponent(previewDirInput.value)}&columns=120`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      configPath: configPathInput.value.trim(),
      left: state.left,
      right: state.right,
      settings: state.settings,
    }),
  });
}

function scheduleRealRender() {
  if (backendMode !== 'real') {
    loadPreviewSnapshot();
    renderPreview();
    return;
  }
  if (renderTimer) clearTimeout(renderTimer);
  renderTimer = setTimeout(() => {
    loadRealRender().then(renderPreview).catch((err) => showMessage(err.message, true));
  }, 250);
}

function segmentInfo(id) {
  const found = state.catalog.find(([segment]) => segment === id);
  return found || [id, id, ''];
}

function render() {
  ensureUiOrder('left');
  ensureUiOrder('right');
  ensurePromptOrder('left');
  ensurePromptOrder('right');
  renderList('left', leftList);
  renderList('right', rightList);
  renderSettings();
  renderPreview();
}

function ensureUiOrder(side) {
  const key = `${side}Order`;
  if (state[key]) return;
  const catalogIds = state.catalog.map(([id]) => id);
  state[key] = [
    ...catalogIds,
    ...state[side].filter((id) => !catalogIds.includes(id)),
  ];
}

function ensurePromptOrder(side) {
  const key = `${side}PromptOrder`;
  if (!state[key]) {
    state[key] = [...state[side]];
    return;
  }
  const known = new Set(state[key]);
  state[key].push(...state[side].filter((id) => !known.has(id)));
}

function renderList(side, container) {
  const enabled = state[side];
  const enabledSet = new Set(enabled);
  const ordered = state[`${side}Order`];
  container.innerHTML = '';
  for (const id of ordered) {
    const [segment, label, description] = segmentInfo(id);
    const row = document.createElement('div');
    row.className = `segment ${enabledSet.has(segment) ? '' : 'disabled'}`;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = enabledSet.has(segment);
    checkbox.addEventListener('change', () => toggleSegment(side, segment, checkbox.checked));

    const text = document.createElement('div');
    text.innerHTML = `
      <span class="segment-title"></span>
      <span class="segment-description"></span>
      <span class="segment-id"></span>
    `;
    text.querySelector('.segment-title').textContent = label;
    text.querySelector('.segment-description').textContent = description;
    text.querySelector('.segment-id').textContent = `配置项：${segment}`;

    const controls = document.createElement('div');
    controls.className = 'segment-controls';
    const enabledIndex = enabled.indexOf(segment);
    const upButton = controlButton('上移', () => moveSegment(side, segment, -1));
    const downButton = controlButton('下移', () => moveSegment(side, segment, 1));
    upButton.disabled = enabledIndex <= 0;
    downButton.disabled = enabledIndex === -1 || enabledIndex >= enabled.length - 1;
    controls.append(upButton, downButton);

    row.append(checkbox, text, controls);
    container.append(row);
  }
}

function controlButton(label, onClick) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.textContent = label;
  btn.addEventListener('click', onClick);
  return btn;
}

function toggleSegment(side, id, checked) {
  ensurePromptOrder(side);
  const orderKey = `${side}PromptOrder`;
  if (!state[orderKey].includes(id)) {
    state[orderKey].push(id);
  }
  const enabled = new Set(state[side]);
  if (checked) {
    enabled.add(id);
  } else {
    enabled.delete(id);
  }
  state[side] = state[orderKey].filter((item) => enabled.has(item));
  render();
  scheduleRealRender();
}

function moveSegment(side, id, delta) {
  ensurePromptOrder(side);
  const orderKey = `${side}PromptOrder`;
  const list = [...state[side]];
  const index = list.indexOf(id);
  if (index < 0) return;
  const next = index + delta;
  if (next < 0 || next >= list.length) return;
  [list[index], list[next]] = [list[next], list[index]];
  state[side] = list;
  const disabled = state[orderKey].filter((item) => !list.includes(item));
  state[orderKey] = [...list, ...disabled];
  render();
  scheduleRealRender();
}

function renderSettings() {
  settingsEl.innerHTML = '';
  for (const [name, type, label] of state.settingsCatalog) {
    const wrap = document.createElement('div');
    wrap.className = 'setting';
    const id = `setting-${name}`;
    const labelEl = document.createElement('label');
    labelEl.setAttribute('for', id);
    labelEl.textContent = label;
    const input = type === 'boolean' || name === 'POWERLEVEL9K_TRANSIENT_PROMPT' || name === 'POWERLEVEL9K_INSTANT_PROMPT'
      ? document.createElement('select')
      : document.createElement('input');
    input.id = id;
    if (type === 'number') input.type = 'number';
    if (type === 'boolean') {
      addOption(input, 'true');
      addOption(input, 'false');
    } else if (name === 'POWERLEVEL9K_TRANSIENT_PROMPT') {
      ['off', 'always', 'same-dir'].forEach((value) => addOption(input, value));
    } else if (name === 'POWERLEVEL9K_INSTANT_PROMPT') {
      ['verbose', 'quiet', 'off'].forEach((value) => addOption(input, value));
    }
    input.value = state.settings[name] ?? '';
    input.addEventListener('input', () => {
      state.settings[name] = input.value;
      renderPreview();
      scheduleRealRender();
    });
    wrap.append(labelEl, input);
    settingsEl.append(wrap);
  }
}

function addOption(select, value) {
  const option = document.createElement('option');
  option.value = value;
  option.textContent = value;
  select.append(option);
}

function stateFromConfigText(text, name) {
  const left = parseArrayText(text, 'POWERLEVEL9K_LEFT_PROMPT_ELEMENTS')
    .filter((item) => item.enabled)
    .map((item) => item.id);
  const right = parseArrayText(text, 'POWERLEVEL9K_RIGHT_PROMPT_ELEMENTS')
    .filter((item) => item.enabled)
    .map((item) => item.id);
  const settings = Object.fromEntries(
    fallbackSettingsCatalog.map(([settingName]) => [settingName, parseScalarText(text, settingName)])
  );
  return {
    path: name,
    left: left.length ? left : ['dir', 'vcs', 'newline'],
    right: right.length ? right : ['status', 'time'],
    settings,
    catalog: fallbackCatalog,
    settingsCatalog: fallbackSettingsCatalog,
  };
}

function parseArrayText(text, name) {
  const start = text.match(new RegExp(`typeset -g ${name}=\\(`));
  if (!start) return [];
  const startIndex = start.index + start[0].length;
  const endIndex = text.indexOf('\n  )', startIndex);
  if (endIndex === -1) return [];
  return text
    .slice(startIndex, endIndex)
    .split('\n')
    .map((line) => line.match(/^\s*(#\s*)?([a-zA-Z0-9_]+)\s*(?:#\s*(.*))?$/))
    .filter(Boolean)
    .map((match) => ({
      id: match[2],
      enabled: !match[1],
      comment: match[3] || '',
    }));
}

function parseScalarText(text, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = text.match(new RegExp(`^\\s*typeset -g ${escaped}=([^\\n]*)`, 'm'));
  if (!match) return '';
  return match[1].trim().replace(/^'(.*)'$/, '$1');
}

function buildConfigText(input, source) {
  let next = replaceArrayText(source, 'POWERLEVEL9K_LEFT_PROMPT_ELEMENTS', input.left);
  next = replaceArrayText(next, 'POWERLEVEL9K_RIGHT_PROMPT_ELEMENTS', input.right);
  for (const [name, type] of fallbackSettingsCatalog) {
    if (Object.prototype.hasOwnProperty.call(input.settings || {}, name)) {
      next = replaceScalarText(next, name, type, input.settings[name]);
    }
  }
  return next;
}

function replaceArrayText(text, name, selected) {
  const rendered = renderArrayText(name, selected);
  const pattern = new RegExp(`typeset -g ${name}=\\([\\s\\S]*?\\n  \\)`);
  if (pattern.test(text)) return text.replace(pattern, rendered);
  return `${text.trimEnd()}\n\n  ${rendered}\n`;
}

function renderArrayText(name, selected) {
  const selectedSet = new Set(selected);
  const selectedLines = selected.map((id) => `    ${id.padEnd(24)}# ${labelForSegment(id)}`);
  const disabledLines = fallbackCatalog
    .map(([id]) => id)
    .filter((id) => !selectedSet.has(id))
    .map((id) => `    # ${id.padEnd(22)}# ${labelForSegment(id)}`);
  return [
    `typeset -g ${name}=(`,
    ...selectedLines,
    ...disabledLines,
    '  )',
  ].join('\n');
}

function labelForSegment(id) {
  const found = fallbackCatalog.find(([segment]) => segment === id);
  return found ? found[1] : id;
}

function replaceScalarText(text, name, type, value) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`^(\\s*typeset -g ${escaped}=).*`, 'm');
  const replacement = `$1${normalizeValueText(type, value)}`;
  if (pattern.test(text)) return text.replace(pattern, replacement);
  return `${text.trimEnd()}\n  typeset -g ${name}=${normalizeValueText(type, value)}\n`;
}

function normalizeValueText(type, value) {
  if (type === 'boolean') return value === true || value === 'true' ? 'true' : 'false';
  if (type === 'number') return String(Number(value || 0));
  if (type === 'raw') return String(value || '');
  return `'${String(value || '').replace(/'/g, "'\\''")}'`;
}

function fallbackConfigText() {
  return [
    '# Generated by Powerlevel10k Visual Editor preview mode.',
    'typeset -g POWERLEVEL9K_LEFT_PROMPT_ELEMENTS=(',
    '    dir                     # 当前目录',
    '    vcs                     # Git 状态',
    '    newline                 # 换到下一行',
    '  )',
    'typeset -g POWERLEVEL9K_RIGHT_PROMPT_ELEMENTS=(',
    '    status                  # 命令状态',
    '    command_execution_time  # 命令耗时',
    '    go_version              # Go 版本',
    '    node_version            # Node 版本',
    '    time                    # 当前时间',
    '  )',
    "typeset -g POWERLEVEL9K_PROMPT_ADD_NEWLINE=true",
    "typeset -g POWERLEVEL9K_MULTILINE_FIRST_PROMPT_GAP_CHAR='·'",
    'typeset -g POWERLEVEL9K_DIR_MAX_LENGTH=80',
    'typeset -g POWERLEVEL9K_DIR_MIN_COMMAND_COLUMNS=40',
    'typeset -g POWERLEVEL9K_COMMAND_EXECUTION_TIME_THRESHOLD=3',
    "typeset -g POWERLEVEL9K_COMMAND_EXECUTION_TIME_PREFIX='took '",
    "typeset -g POWERLEVEL9K_TIME_FORMAT='%D{%H:%M:%S}'",
    "typeset -g POWERLEVEL9K_TIME_PREFIX='at '",
    'typeset -g POWERLEVEL9K_TRANSIENT_PROMPT=off',
    'typeset -g POWERLEVEL9K_INSTANT_PROMPT=verbose',
    '',
  ].join('\n');
}

function renderPreview() {
  const leftLines = splitByNewline(state.left);
  const rightLines = splitByNewline(state.right);
  const usesNewline = state.left.includes('newline') || state.right.includes('newline');
  const line1 = document.querySelector('#preview-line-1');
  const line2 = document.querySelector('#preview-line-2');
  if (backendMode === 'real') {
    const realHtml = realRender.error
      ? `<span class="ansi-error">${escapeHtml(realRender.error)}</span>`
      : ansiToHtml(realRender.ansi);
    realPromptEl.innerHTML = [
      '<div class="preview-label">真实渲染</div>',
      realHtml || '<span class="ansi-error">暂无真实渲染输出</span>',
      '<div class="preview-label preview-label-secondary">模拟渲染</div>',
      renderStaticPrompt(leftLines, rightLines, usesNewline),
    ].join('');
  } else {
    realPromptEl.innerHTML = renderStaticPrompt(leftLines, rightLines, usesNewline);
  }
  realPromptEl.hidden = false;
  document.querySelector('#preview-left-frame').textContent = usesNewline ? '╭─' : '─';
  document.querySelector('#preview-right-frame').textContent = usesNewline ? '─╮' : '─';
  line1.classList.toggle('single-line', !usesNewline);
  line2.hidden = !usesNewline;
  document.querySelector('#left-preview').innerHTML = leftLines.before
    .map((id) => renderPreviewSegment(id))
    .join('');
  document.querySelector('#right-preview').innerHTML = rightLines.before
    .slice(0, 8)
    .map((id) => renderPreviewSegment(id))
    .join('');
}

function renderStaticPrompt(leftLines, rightLines, usesNewline) {
  const command = 'npm start';
  const left = leftLines.before.map((id) => staticSegment(id, 'left')).join('');
  const right = rightLines.before.slice(0, 8).map((id) => staticSegment(id, 'right')).join('');
  const gap = '<span class="static-gap">··································</span>';
  if (!usesNewline) {
    return `<div class="static-prompt-row">─${left}${gap}${right} ${command}─</div>`;
  }
  const bottomLeft = leftLines.after.map((id) => staticSegment(id, 'left')).join('');
  const bottomRight = rightLines.after.slice(0, 8).map((id) => staticSegment(id, 'right')).join('');
  return [
    `<div class="static-prompt-row">╭─${left}${gap}${right}─╮</div>`,
    `<div class="static-prompt-row">╰─${bottomLeft} ${command} <span class="static-gap">················</span>${bottomRight}─╯</div>`,
  ].join('');
}

function staticSegment(id, side) {
  const value = snapshot.values[id] || segmentInfo(id)[1] || id;
  return `<span class="static-segment ${side}">${escapeHtml(value)}</span>`;
}

function ansiToHtml(input) {
  let fg = '';
  let bg = '';
  let bold = false;
  let html = '';
  const parts = String(input).split(/(\x1b\[[0-9;]*m)/g);
  for (const part of parts) {
    const match = part.match(/^\x1b\[([0-9;]*)m$/);
    if (!match) {
      if (part) html += wrapAnsiText(part, fg, bg, bold);
      continue;
    }
    const codes = match[1] ? match[1].split(';').map(Number) : [0];
    for (let i = 0; i < codes.length; i += 1) {
      const code = codes[i];
      if (code === 0) {
        fg = '';
        bg = '';
        bold = false;
      } else if (code === 1) {
        bold = true;
      } else if (code === 22) {
        bold = false;
      } else if (code === 39) {
        fg = '';
      } else if (code === 49) {
        bg = '';
      } else if (code >= 30 && code <= 37) {
        fg = ANSI_COLORS[code - 30];
      } else if (code >= 90 && code <= 97) {
        fg = ANSI_COLORS[code - 90 + 8];
      } else if (code >= 40 && code <= 47) {
        bg = ANSI_COLORS[code - 40];
      } else if (code >= 100 && code <= 107) {
        bg = ANSI_COLORS[code - 100 + 8];
      } else if (code === 38 && codes[i + 1] === 5) {
        fg = xtermColor(codes[i + 2]);
        i += 2;
      } else if (code === 48 && codes[i + 1] === 5) {
        bg = xtermColor(codes[i + 2]);
        i += 2;
      } else if (code >= 3000 && code <= 3255) {
        fg = xtermColor(code - 3000);
      } else if (code >= 4000 && code <= 4255) {
        bg = xtermColor(code - 4000);
      }
    }
  }
  return html || '暂无可渲染内容';
}

function wrapAnsiText(text, fg, bg, bold) {
  const style = [
    fg ? `color:${fg}` : '',
    bg ? `background-color:${bg}` : '',
    bold ? 'font-weight:700' : '',
  ].filter(Boolean).join(';');
  const escaped = escapeHtml(text);
  return style ? `<span style="${style}">${escaped}</span>` : escaped;
}

function xtermColor(code) {
  if (code < 0 || code > 255 || Number.isNaN(code)) return '';
  if (code < 16) return ANSI_COLORS[code];
  if (code >= 232) {
    const level = 8 + (code - 232) * 10;
    return `rgb(${level},${level},${level})`;
  }
  const n = code - 16;
  const r = Math.floor(n / 36);
  const g = Math.floor((n % 36) / 6);
  const b = n % 6;
  const v = [r, g, b].map((value) => value === 0 ? 0 : 55 + value * 40);
  return `rgb(${v[0]},${v[1]},${v[2]})`;
}

function renderPreviewSegment(id) {
  const value = snapshot.values[id] || segmentInfo(id)[1] || id;
  return `<span title="${escapeHtml(segmentInfo(id)[1])}">${escapeHtml(value)}</span>`;
}

function splitByNewline(items) {
  const index = items.indexOf('newline');
  if (index === -1) {
    return { before: items.filter((id) => id !== 'newline'), after: [] };
  }
  return {
    before: items.slice(0, index).filter((id) => id !== 'newline'),
    after: items.slice(index + 1).filter((id) => id !== 'newline'),
  };
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function save() {
  hideMessage();
  if (backendMode !== 'real') {
    downloadConfig();
    showMessage('已生成修改后的配置文件下载。浏览器不能直接覆盖本机 ~/.p10k.zsh。');
    return;
  }
  const result = await api('api/config', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      configPath: configPathInput.value.trim(),
      left: state.left,
      right: state.right,
      settings: state.settings,
    }),
  });
  state = result.config;
  configPathInput.value = state.path;
  rawEl.textContent = await api(rawApiPath());
  render();
  showMessage(`已保存。原文件备份到：${result.backupPath}`);
}

async function loadConfigFromPath() {
  if (backendMode !== 'real') return;
  hideMessage();
  const previousPath = state && state.path;
  try {
    const config = await api(configApiPath());
    state = config;
    configPathInput.value = state.path;
    rawEl.textContent = await api(rawApiPath());
    await loadSnapshot();
    await loadRealRender();
    render();
    if (state.path !== previousPath) {
      showMessage(`已加载配置：${state.path}`);
    }
  } catch (err) {
    showMessage(`无法加载配置文件：${err.message}`, true);
  }
}

async function selectPreviewDirectory() {
  hideMessage();
  if (backendMode !== 'real') {
    showMessage('只有本机真实模式可以选择目录。', true);
    return;
  }
  selectDirButton.disabled = true;
  selectDirButton.textContent = '选择中...';
  try {
    const result = await api('api/select-dir');
    previewDirInput.value = result.path;
    await Promise.all([loadSnapshot(), loadRealRender()]);
    renderPreview();
    showMessage(`已选择预览目录：${result.path}`);
  } catch (err) {
    showMessage(`选择目录失败：${err.message}`, true);
  } finally {
    selectDirButton.disabled = false;
    selectDirButton.textContent = '选择目录';
  }
}

function terminalAvailable() {
  return typeof window.Terminal === 'function' && terminalEl;
}

function ensureTerminal() {
  if (!terminalAvailable()) {
    throw new Error('终端组件未加载。请确认已安装依赖并通过 npm start 启动。');
  }
  if (terminal) return terminal;
  terminal = new window.Terminal({
    cols: 120,
    rows: 28,
    cursorBlink: true,
    convertEol: true,
    fontFamily: '"MesloLGS NF", "MesloLGS Nerd Font", ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: 13,
    theme: {
      background: '#000000',
      foreground: '#e7f0ef',
      cursor: '#e7f0ef',
    },
  });
  terminal.open(terminalEl);
  terminal.onData((data) => {
    if (terminalSocket && terminalSocket.readyState === WebSocket.OPEN) {
      terminalSocket.send(JSON.stringify({ type: 'data', data }));
    }
  });
  return terminal;
}

function terminalPayload() {
  return {
    type: 'start',
    configPath: configPathInput.value.trim(),
    left: state.left,
    right: state.right,
    settings: state.settings,
    dir: previewDirInput.value,
    columns: terminal ? terminal.cols : 120,
    rows: terminal ? terminal.rows : 28,
  };
}

function websocketUrl(path) {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}${path}`;
}

function closeTerminalSocket() {
  if (!terminalSocket) return;
  terminalSocket.onclose = null;
  terminalSocket.close();
  terminalSocket = null;
}

function setTerminalButtons(running) {
  if (backendMode !== 'real') {
    terminalOpenButton.disabled = true;
    terminalStartButton.disabled = true;
    terminalStopButton.disabled = true;
    return;
  }
  terminalOpenButton.disabled = false;
  terminalStartButton.disabled = false;
  terminalStopButton.disabled = !running;
  terminalStartButton.textContent = running ? '重启' : '启动';
}

function terminalRunning() {
  return terminalSocket
    && (terminalSocket.readyState === WebSocket.OPEN || terminalSocket.readyState === WebSocket.CONNECTING);
}

function openTerminalDialog() {
  hideMessage();
  if (backendMode !== 'real') {
    showMessage('只有本机真实模式可以打开交互 zsh。', true);
    return;
  }
  if (!terminalDialog.open) {
    terminalDialog.showModal();
  }
  ensureTerminal();
  if (!terminalRunning()) startInteractiveTerminal();
}

function closeTerminalDialog() {
  stopInteractiveTerminal();
  if (terminalDialog.open) terminalDialog.close();
}

function startInteractiveTerminal() {
  hideMessage();
  if (backendMode !== 'real') {
    showMessage('只有本机真实模式可以启动交互 zsh。', true);
    return;
  }
  const term = ensureTerminal();
  closeTerminalSocket();
  const socket = new WebSocket(websocketUrl('/ws/terminal'));
  terminalSocket = socket;
  terminalStartButton.disabled = true;
  terminalStartButton.textContent = '启动中...';
  terminalStopButton.disabled = false;
  term.clear();
  socket.addEventListener('open', () => {
    socket.send(JSON.stringify(terminalPayload()));
    term.focus();
  });
  socket.addEventListener('message', (event) => {
    const payload = JSON.parse(event.data);
    if (payload.type === 'started') {
      setTerminalButtons(true);
      return;
    }
    if (payload.type === 'data') {
      term.write(payload.data);
      return;
    }
    if (payload.type === 'error') {
      showMessage(`交互 zsh 启动失败：${payload.message}`, true);
      term.write(`\r\n${payload.message}\r\n`);
      if (terminalSocket === socket) terminalSocket = null;
      socket.close();
      setTerminalButtons(false);
      return;
    }
    if (payload.type === 'exit') {
      term.write(`\r\n[zsh 已退出，退出码 ${payload.exitCode ?? '未知'}]\r\n`);
      if (terminalSocket === socket) terminalSocket = null;
      socket.close();
      setTerminalButtons(false);
      return;
    }
    if (payload.type === 'stopped') {
      term.write('\r\n[zsh 已停止]\r\n');
      if (terminalSocket === socket) terminalSocket = null;
      socket.close();
      setTerminalButtons(false);
    }
  });
  socket.addEventListener('close', () => {
    if (terminalSocket === socket) terminalSocket = null;
    setTerminalButtons(false);
  });
  socket.addEventListener('error', () => {
    showMessage('无法连接交互 zsh。请确认是通过 npm start 打开的本机页面。', true);
    setTerminalButtons(false);
  });
}

function stopInteractiveTerminal() {
  if (terminalSocket && terminalSocket.readyState === WebSocket.OPEN) {
    terminalSocket.send(JSON.stringify({ type: 'stop' }));
  } else {
    closeTerminalSocket();
    setTerminalButtons(false);
  }
}

function downloadConfig() {
  const source = uploadedConfigText || fallbackConfigText();
  const next = buildConfigText({
    left: state.left,
    right: state.right,
    settings: state.settings,
  }, source);
  const blob = new Blob([next], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = uploadedFileName || '.p10k.zsh';
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

document.querySelector('#reload').addEventListener('click', () => {
  load().catch((err) => showMessage(err.message, true));
});

document.querySelector('#save').addEventListener('click', () => {
  save().catch((err) => showMessage(err.message, true));
});

selectDirButton.addEventListener('click', () => {
  selectPreviewDirectory().catch((err) => showMessage(err.message, true));
});

terminalOpenButton.addEventListener('click', () => {
  try {
    openTerminalDialog();
  } catch (err) {
    showMessage(err.message, true);
  }
});

terminalStartButton.addEventListener('click', () => {
  try {
    startInteractiveTerminal();
  } catch (err) {
    showMessage(err.message, true);
  }
});

terminalStopButton.addEventListener('click', () => {
  stopInteractiveTerminal();
});

terminalCloseButton.addEventListener('click', () => {
  closeTerminalDialog();
});

terminalDialog.addEventListener('cancel', () => {
  stopInteractiveTerminal();
});

terminalDialog.addEventListener('close', () => {
  if (terminalSocket) stopInteractiveTerminal();
});

configPathInput.addEventListener('change', () => {
  loadConfigFromPath().catch((err) => showMessage(`无法加载配置文件：${err.message}`, true));
});

configPathInput.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter') return;
  event.preventDefault();
  configPathInput.blur();
});

configFileInput.addEventListener('change', () => {
  const file = configFileInput.files && configFileInput.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    uploadedConfigText = String(reader.result || '');
    uploadedFileName = file.name || '.p10k.zsh';
    if (backendMode !== 'real') {
      state = stateFromConfigText(uploadedConfigText, uploadedFileName);
      rawEl.textContent = uploadedConfigText;
      document.querySelector('#config-path').textContent = `已选择配置文件：${uploadedFileName}`;
      configHelp.textContent = '已从你选择的文件读取配置。保存会下载修改后的文件。';
      loadPreviewSnapshot();
      render();
      showMessage(`已读取配置文件：${uploadedFileName}`);
      return;
    }
    showMessage('已选择文件。当前是真实模式，如需直接写回某个路径，请在“配置路径”里填写路径后按回车。');
  };
  reader.onerror = () => showMessage('读取配置文件失败。', true);
  reader.readAsText(file);
});

previewDirInput.addEventListener('change', () => {
  if (backendMode !== 'real') {
    loadPreviewSnapshot();
    renderPreview();
    return;
  }
  Promise.all([loadSnapshot(), loadRealRender()])
    .then(renderPreview)
    .catch((err) => showMessage(err.message, true));
});

load().catch((err) => showMessage(err.message, true));
