#!/usr/bin/env node
'use strict';

const fs = require('fs');
const http = require('http');
const path = require('path');
const os = require('os');
const childProcess = require('child_process');
const WebSocket = require('ws');
const pty = require('@homebridge/node-pty-prebuilt-multiarch');

const PORT = Number(process.env.PORT || 48731);
const HOST = '127.0.0.1';
const DEFAULT_CONFIG_PATH = process.env.P10K_CONFIG || path.join(os.homedir(), '.p10k.zsh');
const STATIC_FILES = new Map([
  ['/', 'index.html'],
  ['/index.html', 'index.html'],
  ['/app.js', 'app.js'],
  ['/style.css', 'style.css'],
  ['/xterm/xterm.js', 'node_modules/@xterm/xterm/lib/xterm.js'],
  ['/xterm/xterm.css', 'node_modules/@xterm/xterm/css/xterm.css'],
]);

const segmentCatalog = [
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
  ['dotnet_version', '.NET 版本', '显示 dotnet 版本'],
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

const segmentLabels = new Map(segmentCatalog.map(([id, label]) => [id, label]));

const settingsCatalog = [
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

function resolveConfigPath(inputPath) {
  return resolveUserPath(inputPath || DEFAULT_CONFIG_PATH);
}

function resolveUserPath(inputPath) {
  if (!inputPath) return DEFAULT_CONFIG_PATH;
  if (inputPath === '~') return os.homedir();
  if (inputPath.startsWith('~/')) return path.join(os.homedir(), inputPath.slice(2));
  return path.resolve(inputPath);
}

function readConfig(configPath = DEFAULT_CONFIG_PATH) {
  return fs.readFileSync(configPath, 'utf8');
}

function writeJson(res, status, data) {
  const body = JSON.stringify(data, null, 2);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(body),
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1024 * 1024) {
        req.destroy();
        reject(new Error('Request body is too large'));
      }
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function parseArray(text, name) {
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

function parseScalar(text, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = text.match(new RegExp(`^\\s*typeset -g ${escaped}=([^\\n]*)`, 'm'));
  if (!match) return '';
  return match[1].trim().replace(/^'(.*)'$/, '$1');
}

function parseConfig(configPath = DEFAULT_CONFIG_PATH) {
  const text = readConfig(configPath);
  const leftItems = parseArray(text, 'POWERLEVEL9K_LEFT_PROMPT_ELEMENTS');
  const rightItems = parseArray(text, 'POWERLEVEL9K_RIGHT_PROMPT_ELEMENTS');
  const left = leftItems.filter((item) => item.enabled).map((item) => item.id);
  const right = rightItems.filter((item) => item.enabled).map((item) => item.id);
  const settings = Object.fromEntries(
    settingsCatalog.map(([name]) => [name, parseScalar(text, name)])
  );
  return {
    path: configPath,
    home: os.homedir(),
    left,
    right,
    settings,
    catalog: catalogWithConfigSegments(leftItems, rightItems),
    settingsCatalog,
  };
}

function catalogWithConfigSegments(...groups) {
  const catalog = [...segmentCatalog];
  const known = new Set(catalog.map(([id]) => id));
  for (const item of groups.flat()) {
    if (known.has(item.id)) continue;
    known.add(item.id);
    catalog.push([item.id, item.comment || item.id, '这个段来自你的 .p10k.zsh，当前编辑器暂时没有内置中文说明']);
  }
  return catalog;
}

function runCommand(command, args, cwd) {
  try {
    return childProcess.execFileSync(command, args, {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 1200,
    }).trim();
  } catch {
    return '';
  }
}

function displayPath(dir) {
  const home = os.homedir();
  if (dir === home) return '~';
  if (dir.startsWith(`${home}${path.sep}`)) return `~/${path.relative(home, dir)}`;
  return dir;
}

function gitSnapshot(dir) {
  const top = runCommand('git', ['-C', dir, 'rev-parse', '--show-toplevel'], dir);
  if (!top) return '';
  const branch = runCommand('git', ['-C', dir, 'branch', '--show-current'], dir) ||
    runCommand('git', ['-C', dir, 'rev-parse', '--short', 'HEAD'], dir);
  const porcelain = runCommand('git', ['-C', dir, 'status', '--porcelain=v1', '--branch'], dir);
  const lines = porcelain.split('\n').filter(Boolean);
  const header = lines[0] || '';
  const changed = Math.max(lines.length - (header.startsWith('## ') ? 1 : 0), 0);
  const ahead = (header.match(/ahead (\d+)/) || [])[1];
  const behind = (header.match(/behind (\d+)/) || [])[1];
  const parts = [branch || 'HEAD'];
  if (changed) parts.push(`*${changed}`);
  if (ahead) parts.push(`⇡${ahead}`);
  if (behind) parts.push(`⇣${behind}`);
  return `on ${parts.join(' ')}`;
}

function packageSnapshot(dir) {
  const file = path.join(dir, 'package.json');
  try {
    const pkg = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (pkg.name && pkg.version) return `${pkg.name}@${pkg.version}`;
    return pkg.name || '';
  } catch {
    return '';
  }
}

function snapshotFor(dirInput) {
  const dir = dirInput ? resolveUserPath(dirInput) : process.cwd();
  const exists = fs.existsSync(dir) && fs.statSync(dir).isDirectory();
  const safeDir = exists ? dir : process.cwd();
  const now = new Date();
  const values = {
    newline: '',
    os_icon: process.platform === 'darwin' ? '' : os.type(),
    dir: displayPath(safeDir),
    vcs: gitSnapshot(safeDir) || 'on main *1',
    prompt_char: '❯',
    status: '128 ✘',
    command_execution_time: 'took 8s',
    background_jobs: '≡',
    direnv: process.env.DIRENV_DIR ? 'direnv' : 'direnv',
    asdf: 'nodejs 1.0.0',
    virtualenv: process.env.VIRTUAL_ENV ? path.basename(process.env.VIRTUAL_ENV) : 'venv',
    anaconda: process.env.CONDA_DEFAULT_ENV || 'base',
    pyenv: runCommand('pyenv', ['version-name'], safeDir) || '1.0.0',
    goenv: runCommand('goenv', ['version-name'], safeDir) || '1.0.0',
    nodenv: runCommand('nodenv', ['version-name'], safeDir) || '1.0.0',
    nvm: '1.0.0',
    nodeenv: process.env.NODE_VIRTUAL_ENV ? path.basename(process.env.NODE_VIRTUAL_ENV) : 'nodeenv',
    node_version: runCommand('node', ['--version'], safeDir) || 'v1.0.0',
    go_version: runCommand('go', ['version'], safeDir).replace(/^go version /, '').split(' ').slice(0, 1).join(' ') || 'go1.0.0',
    rust_version: runCommand('rustc', ['--version'], safeDir).split(' ').slice(0, 2).join(' ') || 'rustc 1.0.0',
    dotnet_version: runCommand('dotnet', ['--version'], safeDir) || '1.0.0',
    php_version: runCommand('php', ['-r', 'echo PHP_VERSION;'], safeDir) || '1.0.0',
    java_version: runCommand('java', ['-version'], safeDir).split('\n')[0] || 'java 1.0.0',
    package: packageSnapshot(safeDir) || 'project@1.0.0',
    rbenv: runCommand('rbenv', ['version-name'], safeDir) || '1.0.0',
    rvm: process.env.rvm_ruby_string || 'ruby-1.0.0',
    fvm: runCommand('fvm', ['--version'], safeDir) || '1.0.0',
    luaenv: runCommand('luaenv', ['version-name'], safeDir) || '1.0.0',
    jenv: runCommand('jenv', ['version-name'], safeDir) || '1.0.0',
    plenv: runCommand('plenv', ['version-name'], safeDir) || '1.0.0',
    perlbrew: process.env.PERLBREW_PERL || 'perl-1.0.0',
    phpenv: runCommand('phpenv', ['version-name'], safeDir) || '1.0.0',
    scalaenv: runCommand('scalaenv', ['version-name'], safeDir) || '1.0.0',
    haskell_stack: runCommand('stack', ['--resolver'], safeDir) || 'lts-1.0',
    kubecontext: runCommand('kubectl', ['config', 'current-context'], safeDir) || 'dev-cluster',
    terraform: runCommand('terraform', ['workspace', 'show'], safeDir) || 'default',
    terraform_version: runCommand('terraform', ['version', '-json'], safeDir).match(/"terraform_version"\s*:\s*"([^"]+)"/)?.[1] || '1.0.0',
    aws: [process.env.AWS_PROFILE, process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION].filter(Boolean).join(' ') || 'default us-east-1',
    aws_eb_env: 'eb-default',
    azure: 'default-account',
    gcloud: runCommand('gcloud', ['config', 'get-value', 'project'], safeDir) || 'demo-project',
    google_app_cred: process.env.GOOGLE_APPLICATION_CREDENTIALS ? path.basename(process.env.GOOGLE_APPLICATION_CREDENTIALS) : 'service-account.json',
    toolbox: process.env.P9K_TOOLBOX_NAME || 'toolbox',
    context: `${os.userInfo().username}@${os.hostname().split('.')[0]}`,
    nordvpn: 'VPN',
    ranger: process.env.RANGER_LEVEL || 'ranger 1',
    yazi: process.env.YAZI_LEVEL || 'yazi 1',
    nnn: process.env.NNNLVL || 'nnn 1',
    lf: process.env.LF_LEVEL || 'lf 1',
    xplr: process.env.XPLR_PID ? 'xplr' : 'xplr',
    vim_shell: process.env.VIMRUNTIME ? 'vim shell' : 'vim shell',
    midnight_commander: process.env.MC_TMPDIR ? 'mc' : 'mc',
    nix_shell: process.env.IN_NIX_SHELL ? 'nix shell' : 'nix shell',
    chezmoi_shell: process.env.CHEZMOI ? 'chezmoi' : 'chezmoi',
    vi_mode: 'NORMAL',
    todo: 'todo 3',
    timewarrior: 'coding 12m',
    taskwarrior: 'task 5',
    per_directory_history: 'local history',
    cpu_arch: os.arch(),
    time: `at ${now.toLocaleTimeString('zh-CN', { hour12: false })}`,
    ip: '192.168.1.8',
    public_ip: '203.0.113.8',
    proxy: process.env.HTTPS_PROXY || process.env.HTTP_PROXY ? 'proxy' : 'proxy',
    battery: '82%',
    wifi: 'Wi-Fi',
  };
  return { dir: safeDir, requestedDir: dir, exists, values };
}

function quoteForZsh(value) {
  return `'${String(value).replace(/'/g, "'\\''")}'`;
}

function stripScriptNoise(output) {
  return output
    .replace(/\x1b\][\s\S]*?(?:\x07|\x1b\\)/g, '')
    .replace(/\x1b\[[0-9;?]*[ -/]*[@-~]/g, (sequence) => sequence.endsWith('m') ? sequence : '')
    .replace(/^(?:\^D|\x04)?\x08+/, '')
    .replace(/^(?:\^D|\x04)/, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/^Restored session:[^\n]*(?:\n|$)/gm, '')
    .replace(/^Saving session\.\.\.(?:completed\.)?(?:\n|$)/gm, '')
    .replace(/Saving session\.\.\.completed\./g, '')
    .replace(/^\n+/, '')
    .trimEnd();
}

function renderPrompt(dirInput, columnsInput, configOverridePath) {
  const dir = dirInput ? resolveUserPath(dirInput) : process.cwd();
  const exists = fs.existsSync(dir) && fs.statSync(dir).isDirectory();
  const safeDir = exists ? dir : process.cwd();
  const columns = Math.max(60, Math.min(240, Number(columnsInput || 120)));
  const scriptBody = [
    `cd -- ${quoteForZsh(safeDir)} || exit 1`,
    configOverridePath ? `source ${quoteForZsh(configOverridePath)}` : '',
    'for f in $precmd_functions; do $f 2>/dev/null || true; done',
    'print -rP -- "${(e)PROMPT}"',
  ].filter(Boolean).join('; ');
  try {
    const ansi = childProcess.execFileSync('script', ['-q', '/dev/null', 'zsh', '-ic', scriptBody], {
      cwd: safeDir,
      encoding: 'utf8',
      env: shellEnv(columns),
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 5000,
    });
    return { dir: safeDir, requestedDir: dir, exists, columns, ansi: stripScriptNoise(ansi), error: '' };
  } catch (err) {
    return {
      dir: safeDir,
      requestedDir: dir,
      exists,
      columns,
      ansi: '',
      error: err.message || 'zsh render failed',
    };
  }
}

function executeCommand(dirInput, columnsInput, configOverridePath, commandInput) {
  const dir = dirInput ? resolveUserPath(dirInput) : process.cwd();
  const exists = fs.existsSync(dir) && fs.statSync(dir).isDirectory();
  const safeDir = exists ? dir : process.cwd();
  const columns = Math.max(60, Math.min(240, Number(columnsInput || 120)));
  const command = normalizeCommand(commandInput);
  const scriptBody = [
    `cd -- ${quoteForZsh(safeDir)} || exit 1`,
    'zmodload zsh/datetime 2>/dev/null || true',
    configOverridePath ? `source ${quoteForZsh(configOverridePath)}` : '',
    `__p10k_editor_command=${quoteForZsh(command)}`,
    'for f in $precmd_functions; do $f 2>/dev/null || true; done',
    'print -rnP -- "${(e)PROMPT}"',
    'print -r -- "$__p10k_editor_command"',
    '__p10k_editor_start=$EPOCHREALTIME',
    'eval "$__p10k_editor_command"',
    '__p10k_editor_status=$?',
    'typeset -gF P9K_COMMAND_DURATION_SECONDS=$((EPOCHREALTIME - __p10k_editor_start)) 2>/dev/null || true',
    'if (( $+functions[_p9k_precmd_impl] )); then __p9k_new_status=$__p10k_editor_status; __p9k_new_pipestatus=($__p10k_editor_status); _p9k_precmd_impl 2>/dev/null || true; else ( exit $__p10k_editor_status ); for f in $precmd_functions; do $f 2>/dev/null || true; done; fi',
    'print -rP -- "${(e)PROMPT}"',
    'exit $__p10k_editor_status',
  ].filter(Boolean).join('; ');
  try {
    const ansi = childProcess.execFileSync('script', ['-q', '/dev/null', 'zsh', '-ic', scriptBody], {
      cwd: safeDir,
      encoding: 'utf8',
      env: shellEnv(columns),
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 15000,
    });
    return { dir: safeDir, requestedDir: dir, exists, columns, command, exitCode: 0, ansi: stripScriptNoise(ansi), error: '' };
  } catch (err) {
    const ansi = err.stdout ? String(err.stdout) : '';
    return {
      dir: safeDir,
      requestedDir: dir,
      exists,
      columns,
      command,
      exitCode: typeof err.status === 'number' ? err.status : 1,
      ansi: stripScriptNoise(ansi),
      error: ansi ? '' : (err.message || 'zsh command failed'),
    };
  }
}

function shellEnv(columns) {
  return {
    ...process.env,
    TERM: 'xterm-256color',
    COLUMNS: String(columns),
    POWERLEVEL9K_INSTANT_PROMPT: 'off',
    SHELL_SESSIONS_DISABLE: '1',
    SHELL_SESSION_DID_INIT: '1',
    TERM_SESSION_ID: '',
  };
}

function normalizeCommand(commandInput) {
  return String(commandInput || '').replace(/\0/g, '').slice(0, 2000);
}

function buildConfig(input, original) {
  if (!Array.isArray(input.left) || !Array.isArray(input.right)) {
    throw new Error('left and right must be arrays');
  }
  const left = input.left.filter(isSegmentId);
  const right = input.right.filter(isSegmentId);
  let next = replaceArray(original, 'POWERLEVEL9K_LEFT_PROMPT_ELEMENTS', left);
  next = replaceArray(next, 'POWERLEVEL9K_RIGHT_PROMPT_ELEMENTS', right);
  for (const [name, type] of settingsCatalog) {
    if (Object.prototype.hasOwnProperty.call(input.settings || {}, name)) {
      next = replaceScalar(next, name, type, input.settings[name]);
    }
  }
  return next;
}

function isSegmentId(id) {
  return typeof id === 'string' && /^[a-zA-Z0-9_]+$/.test(id);
}

function renderPromptWithConfig(dirInput, columnsInput, input) {
  const configPath = resolveConfigPath(input.configPath);
  const tempPath = path.join(os.tmpdir(), `p10k-editor-preview-${process.pid}-${Date.now()}.zsh`);
  fs.writeFileSync(tempPath, buildConfig(input, readConfig(configPath)));
  try {
    return renderPrompt(dirInput, columnsInput, tempPath);
  } finally {
    fs.rmSync(tempPath, { force: true });
  }
}

function executeCommandWithConfig(dirInput, columnsInput, input) {
  const configPath = resolveConfigPath(input.configPath);
  const tempPath = path.join(os.tmpdir(), `p10k-editor-execute-${process.pid}-${Date.now()}.zsh`);
  fs.writeFileSync(tempPath, buildConfig(input, readConfig(configPath)));
  try {
    return executeCommand(dirInput, columnsInput, tempPath, input.command);
  } finally {
    fs.rmSync(tempPath, { force: true });
  }
}

function createInteractiveShell(input) {
  const configPath = resolveConfigPath(input.configPath);
  const dir = input.dir ? resolveUserPath(input.dir) : os.homedir();
  const exists = fs.existsSync(dir) && fs.statSync(dir).isDirectory();
  const safeDir = exists ? dir : os.homedir();
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'p10k-editor-pty-'));
  const tempConfigPath = path.join(tempDir, 'p10k.zsh');
  const tempZshrcPath = path.join(tempDir, '.zshrc');
  fs.writeFileSync(tempConfigPath, buildConfig(input, readConfig(configPath)));
  fs.writeFileSync(tempZshrcPath, [
    `[[ -f ${quoteZsh(path.join(os.homedir(), '.zshrc'))} ]] && source ${quoteZsh(path.join(os.homedir(), '.zshrc'))}`,
    `source ${quoteZsh(tempConfigPath)}`,
    `cd -- ${quoteZsh(safeDir)}`,
    '',
  ].join('\n'));
  const columns = Math.max(60, Math.min(240, Number(input.columns || 120)));
  const rows = Math.max(12, Math.min(80, Number(input.rows || 28)));
  const shell = pty.spawn(process.env.SHELL || 'zsh', ['-i'], {
    name: 'xterm-256color',
    cols: columns,
    rows,
    cwd: safeDir,
    env: {
      ...shellEnv(columns),
      ZDOTDIR: tempDir,
      HOME: os.homedir(),
    },
  });
  return { shell, tempDir };
}

function cleanupInteractiveShell(session) {
  if (!session || session.cleaned) return;
  session.cleaned = true;
  try {
    if (!session.exited) session.shell.kill();
  } catch {}
  fs.rmSync(session.tempDir, { recursive: true, force: true });
}

function sendTerminalMessage(ws, payload) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}

function quoteZsh(value) {
  return `'${String(value).replace(/'/g, "'\\''")}'`;
}

function renderArray(name, selected, sourceItems = []) {
  const selectedSet = new Set(selected);
  const selectedLines = selected.map((id) => `    ${id.padEnd(24)}# ${labelFor(id)}`);
  const sourceLabels = new Map(sourceItems.map((item) => [item.id, item.comment]));
  const disabledIds = uniqueIds([
    ...sourceItems.map((item) => item.id),
    ...segmentCatalog.map(([id]) => id),
  ]);
  const disabledLines = disabledIds
    .filter((id) => !selectedSet.has(id))
    .map((id) => `    # ${id.padEnd(22)}# ${sourceLabels.get(id) || labelFor(id)}`);
  return [
    `typeset -g ${name}=(`,
    ...selectedLines,
    ...disabledLines,
    '  )',
  ].join('\n');
}

function uniqueIds(ids) {
  const seen = new Set();
  return ids.filter((id) => {
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

function labelFor(id) {
  return segmentLabels.get(id) || id;
}

function replaceArray(text, name, selected) {
  const pattern = new RegExp(`typeset -g ${name}=\\([\\s\\S]*?\\n  \\)`);
  if (!pattern.test(text)) throw new Error(`Cannot find ${name}`);
  return text.replace(pattern, renderArray(name, selected, parseArray(text, name)));
}

function normalizeValue(type, value) {
  if (type === 'boolean') return value === true || value === 'true' ? 'true' : 'false';
  if (type === 'number') return String(Number(value || 0));
  if (type === 'raw') return String(value || '');
  return quoteZsh(value || '');
}

function replaceScalar(text, name, type, value) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`^(\\s*typeset -g ${escaped}=).*`, 'm');
  const replacement = `$1${normalizeValue(type, value)}`;
  if (!pattern.test(text)) return `${text}\n  typeset -g ${name}=${normalizeValue(type, value)}\n`;
  return text.replace(pattern, replacement);
}

function saveConfig(input) {
  const configPath = resolveConfigPath(input.configPath);
  const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '');
  const backupPath = `${configPath}.p10k-editor.${timestamp}.bak`;
  const original = readConfig(configPath);
  fs.copyFileSync(configPath, backupPath);
  const next = buildConfig(input, original);
  fs.writeFileSync(configPath, next);
  return { backupPath };
}

function selectDirectory() {
  if (process.platform !== 'darwin') {
    throw new Error('当前系统暂不支持目录选择器，请手动输入目录路径。');
  }
  const script = 'POSIX path of (choose folder with prompt "选择 Powerlevel10k 预览目录")';
  const output = childProcess.execFileSync('osascript', ['-e', script], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: 120000,
  }).trim();
  if (!output) throw new Error('未选择目录');
  return output.length > 1 ? output.replace(/\/$/, '') : output;
}

function serveStatic(req, res) {
  const requestPath = decodeURIComponent(new URL(req.url, `http://${HOST}:${PORT}`).pathname);
  const staticFile = STATIC_FILES.get(requestPath);
  if (!staticFile) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }
  const filePath = path.join(__dirname, staticFile);
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    const ext = path.extname(filePath);
    const type = ext === '.js' ? 'application/javascript' : ext === '.css' ? 'text/css' : 'text/html';
    res.writeHead(200, { 'content-type': `${type}; charset=utf-8` });
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'GET' && req.url === '/api/config') {
      writeJson(res, 200, parseConfig());
      return;
    }
    if (req.method === 'GET' && req.url.startsWith('/api/config')) {
      const requestUrl = new URL(req.url, `http://${HOST}:${PORT}`);
      writeJson(res, 200, parseConfig(resolveConfigPath(requestUrl.searchParams.get('path'))));
      return;
    }
    if (req.method === 'GET' && req.url.startsWith('/api/raw')) {
      const requestUrl = new URL(req.url, `http://${HOST}:${PORT}`);
      const raw = readConfig(resolveConfigPath(requestUrl.searchParams.get('path')));
      res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' });
      res.end(raw);
      return;
    }
    if (req.method === 'GET' && req.url.startsWith('/api/snapshot')) {
      const requestUrl = new URL(req.url, `http://${HOST}:${PORT}`);
      writeJson(res, 200, snapshotFor(requestUrl.searchParams.get('dir')));
      return;
    }
    if (req.method === 'GET' && req.url.startsWith('/api/select-dir')) {
      writeJson(res, 200, { path: selectDirectory() });
      return;
    }
    if (req.method === 'GET' && req.url.startsWith('/api/render')) {
      const requestUrl = new URL(req.url, `http://${HOST}:${PORT}`);
      writeJson(res, 200, renderPrompt(
        requestUrl.searchParams.get('dir'),
        requestUrl.searchParams.get('columns')
      ));
      return;
    }
    if (req.method === 'POST' && req.url.startsWith('/api/render')) {
      const requestUrl = new URL(req.url, `http://${HOST}:${PORT}`);
      const body = await readBody(req);
      writeJson(res, 200, renderPromptWithConfig(
        requestUrl.searchParams.get('dir'),
        requestUrl.searchParams.get('columns'),
        JSON.parse(body)
      ));
      return;
    }
    if (req.method === 'POST' && req.url.startsWith('/api/execute')) {
      const requestUrl = new URL(req.url, `http://${HOST}:${PORT}`);
      const body = await readBody(req);
      writeJson(res, 200, executeCommandWithConfig(
        requestUrl.searchParams.get('dir'),
        requestUrl.searchParams.get('columns'),
        JSON.parse(body)
      ));
      return;
    }
    if (req.method === 'POST' && req.url === '/api/config') {
      const body = await readBody(req);
      const parsed = JSON.parse(body);
      const result = saveConfig(parsed);
      writeJson(res, 200, {
        ok: true,
        ...result,
        config: parseConfig(resolveConfigPath(parsed.configPath)),
      });
      return;
    }
    serveStatic(req, res);
  } catch (err) {
    writeJson(res, 500, { ok: false, error: err.message });
  }
});

const terminalServer = new WebSocket.Server({ server, path: '/ws/terminal' });

terminalServer.on('connection', (ws) => {
  let session = null;

  function stopSession(notify = false) {
    const current = session;
    session = null;
    cleanupInteractiveShell(current);
    if (notify) sendTerminalMessage(ws, { type: 'stopped' });
  }

  ws.on('message', (message) => {
    try {
      const payload = JSON.parse(String(message));
      if (payload.type === 'start') {
        stopSession(false);
        const current = createInteractiveShell(payload);
        session = current;
        current.shell.onData((data) => {
          sendTerminalMessage(ws, { type: 'data', data });
        });
        current.shell.onExit(({ exitCode, signal }) => {
          current.exited = true;
          cleanupInteractiveShell(current);
          if (session === current) {
            session = null;
            sendTerminalMessage(ws, { type: 'exit', exitCode, signal });
          }
        });
        sendTerminalMessage(ws, { type: 'started' });
        return;
      }
      if (payload.type === 'data') {
        if (session) session.shell.write(String(payload.data || ''));
        return;
      }
      if (payload.type === 'resize') {
        if (session) {
          const columns = Math.max(60, Math.min(240, Number(payload.columns || 120)));
          const rows = Math.max(12, Math.min(80, Number(payload.rows || 28)));
          session.shell.resize(columns, rows);
        }
        return;
      }
      if (payload.type === 'stop') {
        stopSession(true);
        return;
      }
      throw new Error('未知终端消息类型');
    } catch (err) {
      sendTerminalMessage(ws, { type: 'error', message: err.message });
    }
  });

  ws.on('close', () => {
    stopSession(false);
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Powerlevel10k editor: http://${HOST}:${PORT}`);
  console.log(`Default config: ${DEFAULT_CONFIG_PATH}`);
});
