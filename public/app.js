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
let snapshot = { values: {} };
let realRender = { ansi: '', error: '' };
let snapshotTimer = null;
let renderTimer = null;

const segmentExamples = {
  newline: ['第一行显示路径，第二行输入命令', '所有内容尽量挤在同一行'],
  os_icon: [' ~/project', '~/project'],
  dir: ['~/Desktop/Github/UniAuth/uniauth-gf', '不显示当前位置'],
  vcs: ['on perf/i18n-zbw *1', '不显示 Git 分支和改动状态'],
  prompt_char: ['❯ gf run main.go', '直接从边框后开始输入'],
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
  package: ['uniauth@1.2.0', '不显示 package.json 版本'],
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
  context: ['dsanying@MacBook', '本机普通用户通常不显示'],
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
  ['context', '用户/主机', '显示 user@host'],
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

const settingExamples = {
  POWERLEVEL9K_PROMPT_ADD_NEWLINE: ['true：每个 prompt 前空一行，更清楚', 'false：更紧凑，不空行'],
  POWERLEVEL9K_MULTILINE_FIRST_PROMPT_GAP_CHAR: ['·：中间用点填满', '空格：中间留白，不显示点线'],
  POWERLEVEL9K_DIR_MAX_LENGTH: ['80：路径最多显示 80 个字符', '40：路径更短，长目录更早缩略'],
  POWERLEVEL9K_DIR_MIN_COMMAND_COLUMNS: ['40：至少给命令输入区留 40 列', '20：路径可以占更多空间'],
  POWERLEVEL9K_COMMAND_EXECUTION_TIME_THRESHOLD: ['3：超过 3 秒才显示耗时', '0：每条命令都显示耗时'],
  POWERLEVEL9K_COMMAND_EXECUTION_TIME_PREFIX: ['took：显示为 took 8s', '耗时：显示为 耗时 8s'],
  POWERLEVEL9K_TIME_FORMAT: ['%D{%H:%M:%S}：19:30:08', '%D{%H:%M}：19:30'],
  POWERLEVEL9K_TIME_PREFIX: ['at：显示为 at 19:30:08', '时间：显示为 时间 19:30:08'],
  POWERLEVEL9K_TRANSIENT_PROMPT: ['off：历史 prompt 保持完整', 'always：执行后把旧 prompt 简化'],
  POWERLEVEL9K_INSTANT_PROMPT: ['verbose：启动快，有问题会提示', 'quiet：启动快，但少显示提示'],
};

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
    state = await api('api/config');
    backendMode = 'real';
    saveButton.disabled = false;
    saveButton.textContent = '保存配置';
    document.body.dataset.mode = 'real';
    document.querySelector('#config-path').textContent = `真实模式：正在编辑 ${state.path}`;
    previewNote.textContent = '真实模式：使用本机 zsh + Powerlevel10k 在伪终端里渲染。';
    settingsNote.innerHTML = '这些参数会影响整体显示方式。每一项下面都有例子，保存后执行 <code>source ~/.p10k.zsh</code> 生效。';
    if (!previewDirInput.value) {
      previewDirInput.value = state.path.replace(/\/\.p10k\.zsh$/, '');
    }
    rawEl.textContent = await api('api/raw');
    await loadSnapshot();
    await loadRealRender();
    startSnapshotTimer();
  } catch {
    backendMode = 'preview';
    state = previewState();
    saveButton.disabled = true;
    saveButton.textContent = '静态预览不可保存';
    document.body.dataset.mode = 'preview';
    document.querySelector('#config-path').textContent = '静态预览模式：未连接本机后端，不会读取或保存 ~/.p10k.zsh';
    previewDirInput.value = '~/Desktop/Github/UniAuth/uniauth-gf';
    previewDirInput.disabled = true;
    previewNote.textContent = '静态预览模式：适用于 GitHub Pages，只展示近似效果；本机运行 npm start 后自动切换为真实 zsh 渲染。';
    settingsNote.textContent = '这些参数只影响当前页面预览。静态预览模式不会保存配置。';
    rawEl.textContent = '静态预览模式不会读取本机 ~/.p10k.zsh。请在本机运行 npm start 使用真实编辑和保存功能。';
    loadPreviewSnapshot();
  }
  render();
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

function startSnapshotTimer() {
  if (snapshotTimer) clearInterval(snapshotTimer);
  snapshotTimer = setInterval(() => {
    if (backendMode === 'real') {
      Promise.all([loadSnapshot(), loadRealRender()]).then(renderPreview).catch(() => {});
    } else {
      loadPreviewSnapshot();
      renderPreview();
    }
  }, 2000);
}

function previewState() {
  return {
    path: 'GitHub Pages 静态预览',
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
  values.dir = '~/Desktop/Github/UniAuth/uniauth-gf';
  values.vcs = 'on perf/i18n-zbw *1';
  values.status = '128 ✘';
  values.command_execution_time = 'took 8s';
  values.go_version = 'go1.26.1';
  values.node_version = 'v22.11.0';
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
  renderList('left', leftList);
  renderList('right', rightList);
  renderSettings();
  renderPreview();
}

function ensureUiOrder(side) {
  const key = `${side}Order`;
  if (state[key]) return;
  const enabled = new Set(state[side]);
  state[key] = [
    ...state[side],
    ...state.catalog.map(([id]) => id).filter((id) => !enabled.has(id)),
  ];
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
      <span class="segment-example on"></span>
      <span class="segment-example off"></span>
      <span class="segment-id"></span>
    `;
    text.querySelector('.segment-title').textContent = label;
    text.querySelector('.segment-description').textContent = description;
    text.querySelector('.segment-example.on').textContent = `开启示例：${exampleFor(segment)[0]}`;
    text.querySelector('.segment-example.off').textContent = `关闭效果：${exampleFor(segment)[1]}`;
    text.querySelector('.segment-id').textContent = `配置项：${segment}`;

    const controls = document.createElement('div');
    controls.className = 'segment-controls';
    controls.append(controlButton('上移', () => moveSegment(side, segment, -1)));
    controls.append(controlButton('下移', () => moveSegment(side, segment, 1)));

    row.append(checkbox, text, controls);
    container.append(row);
  }
}

function exampleFor(id) {
  return segmentExamples[id] || [`显示 ${id}`, `不显示 ${id}`];
}

function controlButton(label, onClick) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.textContent = label;
  btn.addEventListener('click', onClick);
  return btn;
}

function toggleSegment(side, id, checked) {
  const enabled = new Set(state[side]);
  if (checked) {
    enabled.add(id);
  } else {
    enabled.delete(id);
  }
  state[side] = state[`${side}Order`].filter((item) => enabled.has(item));
  render();
  scheduleRealRender();
}

function moveSegment(side, id, delta) {
  const orderKey = `${side}Order`;
  const list = [...state[orderKey]];
  const index = list.indexOf(id);
  if (index < 0) return;
  const next = index + delta;
  if (next < 0 || next >= list.length) return;
  [list[index], list[next]] = [list[next], list[index]];
  state[orderKey] = list;
  const enabled = new Set(state[side]);
  state[side] = list.filter((item) => enabled.has(item));
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
    const help = document.createElement('div');
    help.className = 'setting-help';
    help.textContent = (settingExamples[name] || ['修改这个参数会影响 prompt 显示', '保持原值则不改变这一项']).join('；');
    wrap.append(labelEl, input, help);
    settingsEl.append(wrap);
  }
}

function addOption(select, value) {
  const option = document.createElement('option');
  option.value = value;
  option.textContent = value;
  select.append(option);
}

function renderPreview() {
  const leftBeforeNewline = itemsBeforeNewline(state.left);
  const rightBeforeNewline = itemsBeforeNewline(state.right);
  const usesNewline = state.left.includes('newline') || state.right.includes('newline');
  const line1 = document.querySelector('#preview-line-1');
  const line2 = document.querySelector('#preview-line-2');
  realPromptEl.innerHTML = backendMode === 'real'
    ? (realRender.error ? `<span class="ansi-error">${escapeHtml(realRender.error)}</span>` : ansiToHtml(realRender.ansi))
    : renderStaticPrompt(leftBeforeNewline, rightBeforeNewline, usesNewline);
  realPromptEl.hidden = backendMode === 'real' && !realRender.ansi && !realRender.error;
  document.querySelector('#preview-left-frame').textContent = usesNewline ? '╭─' : '─';
  document.querySelector('#preview-right-frame').textContent = usesNewline ? '─╮' : '─';
  line1.classList.toggle('single-line', !usesNewline);
  line2.hidden = !usesNewline;
  document.querySelector('#left-preview').innerHTML = leftBeforeNewline
    .map((id) => renderPreviewSegment(id))
    .join('');
  document.querySelector('#right-preview').innerHTML = rightBeforeNewline
    .slice(0, 8)
    .map((id) => renderPreviewSegment(id))
    .join('');
}

function renderStaticPrompt(leftItems, rightItems, usesNewline) {
  const left = leftItems.map((id) => staticSegment(id, 'left')).join('');
  const right = rightItems.slice(0, 8).map((id) => staticSegment(id, 'right')).join('');
  const gap = '<span class="static-gap">··································</span>';
  if (!usesNewline) {
    return `<div class="static-prompt-row">─${left}${gap}${right}─</div>`;
  }
  return [
    `<div class="static-prompt-row">╭─${left}${gap}${right}─╮</div>`,
    '<div class="static-prompt-row">╰─ gf run main.go <span class="static-gap">················</span>─╯</div>',
  ].join('');
}

function staticSegment(id, side) {
  const value = snapshot.values[id];
  if (!value) return '';
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
  const value = snapshot.values[id];
  if (!value) return '';
  return `<span title="${escapeHtml(segmentInfo(id)[1])}">${escapeHtml(value)}</span>`;
}

function itemsBeforeNewline(items) {
  const index = items.indexOf('newline');
  const visible = index === -1 ? items : items.slice(0, index);
  return visible.filter((id) => id !== 'newline');
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
    showMessage('当前是静态预览模式，无法保存。请在本机运行 npm start 后使用真实模式。', true);
    return;
  }
  const result = await api('api/config', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      left: state.left,
      right: state.right,
      settings: state.settings,
    }),
  });
  state = result.config;
  rawEl.textContent = await api('/api/raw');
  render();
  showMessage(`已保存。原文件备份到：${result.backupPath}`);
}

document.querySelector('#reload').addEventListener('click', () => {
  load().catch((err) => showMessage(err.message, true));
});

document.querySelector('#save').addEventListener('click', () => {
  save().catch((err) => showMessage(err.message, true));
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
