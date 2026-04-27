export const segmentExamples = {
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

export const fallbackCatalog = [
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

export const fallbackSettingsCatalog = [
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

const knownSegmentIds = new Set(fallbackCatalog.map(([id]) => id));

export function previewState() {
  return normalizeEditorState({
    path: '示例配置',
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
  });
}

export function normalizeEditorState(base) {
  const catalog = base.catalog || fallbackCatalog;
  const catalogIds = catalog.map(([id]) => id);
  const left = [...(base.left || [])].filter((id) => knownSegmentIds.has(id));
  const right = [...(base.right || [])].filter((id) => knownSegmentIds.has(id));
  const settings = { ...Object.fromEntries(fallbackSettingsCatalog.map(([name]) => [name, ''])), ...(base.settings || {}) };
  return {
    ...base,
    left,
    right,
    settings,
    catalog,
    settingsCatalog: base.settingsCatalog || fallbackSettingsCatalog,
    leftOrder: [...catalogIds],
    rightOrder: [...catalogIds],
    leftPromptOrder: [...left],
    rightPromptOrder: [...right],
  };
}

export function stateFromConfigText(text, name) {
  const left = parseArrayText(text, 'POWERLEVEL9K_LEFT_PROMPT_ELEMENTS')
    .filter((item) => item.enabled)
    .filter((item) => knownSegmentIds.has(item.id))
    .map((item) => item.id);
  const right = parseArrayText(text, 'POWERLEVEL9K_RIGHT_PROMPT_ELEMENTS')
    .filter((item) => item.enabled)
    .filter((item) => knownSegmentIds.has(item.id))
    .map((item) => item.id);
  const settings = Object.fromEntries(
    fallbackSettingsCatalog.map(([settingName]) => [settingName, parseScalarText(text, settingName)])
  );
  return normalizeEditorState({
    path: name,
    left: left.length ? left : ['dir', 'vcs', 'newline'],
    right: right.length ? right : ['status', 'time'],
    settings,
    catalog: fallbackCatalog,
    settingsCatalog: fallbackSettingsCatalog,
  });
}

export function parseArrayText(text, name) {
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

export function parseScalarText(text, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = text.match(new RegExp(`^\\s*typeset -g ${escaped}=([^\\n]*)`, 'm'));
  if (!match) return '';
  return match[1].trim().replace(/^'(.*)'$/, '$1');
}

export function buildConfigText(input, source) {
  let next = replaceArrayText(source, 'POWERLEVEL9K_LEFT_PROMPT_ELEMENTS', input.left);
  next = replaceArrayText(next, 'POWERLEVEL9K_RIGHT_PROMPT_ELEMENTS', input.right);
  for (const [name, type] of fallbackSettingsCatalog) {
    if (Object.prototype.hasOwnProperty.call(input.settings || {}, name)) {
      next = replaceScalarText(next, name, type, input.settings[name]);
    }
  }
  return next;
}

export function fallbackConfigText() {
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
    'typeset -g POWERLEVEL9K_PROMPT_ADD_NEWLINE=true',
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

function replaceArrayText(text, name, selected) {
  const rendered = renderArrayText(name, selected, parseArrayText(text, name));
  const pattern = new RegExp(`typeset -g ${name}=\\([\\s\\S]*?\\n  \\)`);
  if (pattern.test(text)) return text.replace(pattern, rendered);
  return `${text.trimEnd()}\n\n${rendered}\n`;
}

function renderArrayText(name, selected, sourceItems = []) {
  const selectedSet = new Set(selected);
  const selectedLines = selected.map((id) => `    ${id.padEnd(24)}# ${labelForSegment(id)}`);
  const passthroughUnknownLines = sourceItems
    .filter((item) => !knownSegmentIds.has(item.id))
    .map((item) =>
      item.enabled
        ? `    ${item.id.padEnd(24)}# ${item.comment || item.id}`
        : `    # ${item.id.padEnd(22)}# ${item.comment || item.id}`
    );
  const disabledLines = fallbackCatalog
    .map(([id]) => id)
    .filter((id) => !selectedSet.has(id))
    .map((id) => `    # ${id.padEnd(22)}# ${labelForSegment(id)}`);
  return [`typeset -g ${name}=(`, ...selectedLines, ...passthroughUnknownLines, ...disabledLines, '  )'].join('\n');
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
