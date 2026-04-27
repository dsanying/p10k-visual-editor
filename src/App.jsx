import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Accordion,
  ActionIcon,
  AppShell,
  Badge,
  Box,
  Button,
  Card,
  Checkbox,
  Code,
  Container,
  FileButton,
  Grid,
  Group,
  Modal,
  NumberInput,
  Paper,
  ScrollArea,
  Select,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useLocalStorage } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconArrowDown,
  IconArrowUp,
  IconFolderOpen,
  IconMoon,
  IconRefresh,
  IconSun,
  IconTerminal2,
  IconUpload,
} from '@tabler/icons-react';
import { FitAddon } from '@xterm/addon-fit';
import { Terminal } from '@xterm/xterm';
import {
  buildConfigText,
  fallbackCatalog,
  fallbackConfigText,
  fallbackSettingsCatalog,
  normalizeEditorState,
  previewState,
  segmentExamples,
  stateFromConfigText,
} from './p10k.js';

const PREVIEW_COLUMNS = 96;
const LANGUAGE_OPTIONS = [
  { value: 'zh-CN', label: '中文' },
  { value: 'en', label: 'English' },
];
const PREVIEW_SEGMENT_STYLES = {
  left: { background: 'var(--mantine-color-blue-6)', color: 'var(--mantine-color-white)' },
  right: { background: 'var(--mantine-color-gray-2)', color: 'var(--mantine-color-dark-8)' },
};

function englishSegmentLabel(id) {
  return String(id)
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function englishSegmentDescription(id) {
  return `Show ${englishSegmentLabel(id).toLowerCase()}.`;
}

function translateSegmentMeta(id, fallbackLabel, fallbackDescription, language) {
  if (language === 'zh-CN') {
    return { label: fallbackLabel, description: fallbackDescription };
  }
  return {
    label: englishSegmentLabel(id),
    description: englishSegmentDescription(id),
  };
}

function translateSettingLabel(name, fallbackLabel, language) {
  if (language === 'zh-CN') return SETTINGS_LABELS_ZH[name] || fallbackLabel;
  return SETTINGS_LABELS_EN[name] || fallbackLabel;
}

const UI_TEXT = {
  'zh-CN': {
    appTitle: 'Powerlevel10k 配置编辑器',
    realMode: '真实模式',
    previewMode: '预览模式',
    leftCount: (count) => `${count} 个左侧段`,
    rightCount: (count) => `${count} 个右侧段`,
    reload: '重新读取',
    save: '保存配置',
    workspace: '工作台',
    saveable: '可保存',
    previewOnly: '仅预览',
    configPath: '配置路径',
    previewDir: '预览目录',
    pickConfig: '选择配置文件',
    pickDir: '选择目录',
    commonSettings: '常用参数',
    rawConfig: '原始配置',
    previewWorkbench: '预览工作台',
    openInteractiveZsh: '打开交互 zsh',
    leftSegments: '左侧显示',
    rightSegments: '右侧显示',
    leftBadge: '左侧',
    rightBadge: '右侧',
    interactiveZsh: '交互 zsh',
    closeDoesNotStop: '关闭弹窗不会终止后台会话。',
    restart: '重启',
    enabled: '开启',
    disabled: '关闭',
    transientAlways: '始终简化',
    transientSameDir: '同目录时简化',
    instantVerbose: '完整',
    instantQuiet: '静默',
    loadFailed: '读取配置文件失败。',
    realOnlyTerminal: '只有本机真实模式可以打开交互 zsh。',
    terminalConnectFailed: '无法连接交互 zsh。',
    terminalStartFailed: '交互 zsh 启动失败：',
    downloadedConfig: '已下载修改后的配置文件',
    savedBackup: (path) => `已保存，备份：${path}`,
    selectedDirFailed: (message) => `选择目录失败：${message}`,
    loadedConfig: (path) => `已加载配置：${path}`,
    configLoadFailed: (message) => `无法加载配置文件：${message}`,
    readConfigFile: (name) => `已读取配置文件：${name}`,
    fileSelectedNotice: '已选择文件。真实模式下请把目标路径填到“配置路径”。',
    sourcePlaceholder: '尚未选择配置文件。当前使用内置示例配置。',
  },
  en: {
    appTitle: 'Powerlevel10k Config Editor',
    realMode: 'Live Mode',
    previewMode: 'Preview Mode',
    leftCount: (count) => `${count} left segments`,
    rightCount: (count) => `${count} right segments`,
    reload: 'Reload',
    save: 'Save Config',
    workspace: 'Workspace',
    saveable: 'Writable',
    previewOnly: 'Preview Only',
    configPath: 'Config Path',
    previewDir: 'Preview Directory',
    pickConfig: 'Choose Config',
    pickDir: 'Choose Directory',
    commonSettings: 'Common Settings',
    rawConfig: 'Raw Config',
    previewWorkbench: 'Preview Workbench',
    openInteractiveZsh: 'Open Interactive zsh',
    leftSegments: 'Left Segments',
    rightSegments: 'Right Segments',
    leftBadge: 'Left',
    rightBadge: 'Right',
    interactiveZsh: 'Interactive zsh',
    closeDoesNotStop: 'Closing this dialog keeps the background shell alive.',
    restart: 'Restart',
    enabled: 'On',
    disabled: 'Off',
    transientAlways: 'Always simplify',
    transientSameDir: 'Simplify in same dir',
    instantVerbose: 'Verbose',
    instantQuiet: 'Quiet',
    loadFailed: 'Failed to read the config file.',
    realOnlyTerminal: 'Interactive zsh is only available in live mode.',
    terminalConnectFailed: 'Unable to connect to interactive zsh.',
    terminalStartFailed: 'Interactive zsh failed to start: ',
    downloadedConfig: 'Downloaded the updated config file.',
    savedBackup: (path) => `Saved. Backup: ${path}`,
    selectedDirFailed: (message) => `Failed to choose directory: ${message}`,
    loadedConfig: (path) => `Loaded config: ${path}`,
    configLoadFailed: (message) => `Failed to load config file: ${message}`,
    readConfigFile: (name) => `Loaded config file: ${name}`,
    fileSelectedNotice: 'File selected. In live mode, put the target path into "Config Path".',
    sourcePlaceholder: 'No config file selected. Using the built-in sample config.',
  },
};

const SETTINGS_LABELS_ZH = {
  POWERLEVEL9K_PROMPT_ADD_NEWLINE: 'Prompt 前空一行',
  POWERLEVEL9K_MULTILINE_FIRST_PROMPT_GAP_CHAR: '第一行填充字符',
  POWERLEVEL9K_DIR_MAX_LENGTH: '目录最大长度',
  POWERLEVEL9K_DIR_MIN_COMMAND_COLUMNS: '命令区最小列数',
  POWERLEVEL9K_COMMAND_EXECUTION_TIME_THRESHOLD: '耗时显示阈值（秒）',
  POWERLEVEL9K_COMMAND_EXECUTION_TIME_PREFIX: '耗时前缀',
  POWERLEVEL9K_TIME_FORMAT: '时间格式',
  POWERLEVEL9K_TIME_PREFIX: '时间前缀',
  POWERLEVEL9K_TRANSIENT_PROMPT: '瞬态提示',
  POWERLEVEL9K_INSTANT_PROMPT: '即时提示',
};

const SETTINGS_LABELS_EN = {
  POWERLEVEL9K_PROMPT_ADD_NEWLINE: 'Blank Line Before Prompt',
  POWERLEVEL9K_MULTILINE_FIRST_PROMPT_GAP_CHAR: 'First Line Gap Character',
  POWERLEVEL9K_DIR_MAX_LENGTH: 'Directory Max Length',
  POWERLEVEL9K_DIR_MIN_COMMAND_COLUMNS: 'Min Command Columns',
  POWERLEVEL9K_COMMAND_EXECUTION_TIME_THRESHOLD: 'Execution Time Threshold (s)',
  POWERLEVEL9K_COMMAND_EXECUTION_TIME_PREFIX: 'Execution Time Prefix',
  POWERLEVEL9K_TIME_FORMAT: 'Time Format',
  POWERLEVEL9K_TIME_PREFIX: 'Time Prefix',
  POWERLEVEL9K_TRANSIENT_PROMPT: 'Transient Prompt',
  POWERLEVEL9K_INSTANT_PROMPT: 'Instant Prompt',
};

function api(path, options) {
  return fetch(path, options).then(async (res) => {
    const contentType = res.headers.get('content-type') || '';
    const payload = contentType.includes('application/json') ? await res.json() : await res.text();
    if (!res.ok) throw new Error(payload.error || payload || res.statusText);
    return payload;
  });
}

function boolSetting(state, name) {
  return String(state.settings?.[name] ?? '').trim() === 'true';
}

function numberSetting(state, name, fallback) {
  const value = Number(state.settings?.[name]);
  return Number.isFinite(value) ? value : fallback;
}

function stringSetting(state, name, fallback) {
  const value = state.settings?.[name];
  return value == null || value === '' ? fallback : String(value);
}

function splitByNewline(items) {
  const index = items.indexOf('newline');
  if (index === -1) return { before: items.filter((id) => id !== 'newline'), after: [] };
  return {
    before: items.slice(0, index).filter((id) => id !== 'newline'),
    after: items.slice(index + 1).filter((id) => id !== 'newline'),
  };
}

function shortenValue(value, maxLength) {
  const max = Math.max(8, Number(maxLength || 80));
  if (value.length <= max) return value;
  const keep = Math.max(3, max - 4);
  const head = Math.ceil(keep * 0.45);
  const tail = Math.floor(keep * 0.55);
  return `${value.slice(0, head)}...${value.slice(-tail)}`;
}

function formatPreviewTime(format) {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  return String(format || '%D{%H:%M:%S}')
    .replace('%D{%H:%M:%S}', `${hh}:${mm}:${ss}`)
    .replace('%D{%H:%M}', `${hh}:${mm}`);
}

function previewValue(editorState, snapshot, id, label) {
  const raw = snapshot.values?.[id] || label || id;
  if (id === 'dir') return shortenValue(String(raw), numberSetting(editorState, 'POWERLEVEL9K_DIR_MAX_LENGTH', 80));
  if (id === 'command_execution_time') {
    const seconds = 8;
    if (seconds < numberSetting(editorState, 'POWERLEVEL9K_COMMAND_EXECUTION_TIME_THRESHOLD', 3)) return '';
    return `${stringSetting(editorState, 'POWERLEVEL9K_COMMAND_EXECUTION_TIME_PREFIX', 'took ')}${seconds}s`;
  }
  if (id === 'time') {
    return `${stringSetting(editorState, 'POWERLEVEL9K_TIME_PREFIX', 'at ')}${formatPreviewTime(
      stringSetting(editorState, 'POWERLEVEL9K_TIME_FORMAT', '%D{%H:%M:%S}')
    )}`;
  }
  return raw;
}

function gapFill(editorState) {
  const value = stringSetting(editorState, 'POWERLEVEL9K_MULTILINE_FIRST_PROMPT_GAP_CHAR', '·');
  if (!value.trim()) return '\u00a0';
  return value[0];
}

function createSegmentToken(text, side) {
  return {
    kind: 'segment',
    text: String(text),
    side,
    width: String(text).length + 3,
  };
}

function createTextToken(text) {
  return {
    kind: 'text',
    text: String(text),
    width: String(text).length,
  };
}

function buildPreviewLine({ prefix, left, right, filler, suffix, width }) {
  const leftTokens = left.map((item) => (typeof item === 'string' ? createTextToken(item) : item));
  const rightTokens = right.map((item) => (typeof item === 'string' ? createTextToken(item) : item));
  const leftWidth = leftTokens.reduce((sum, token) => sum + token.width, 0);
  const rightWidth = rightTokens.reduce((sum, token) => sum + token.width, 0);
  const safeWidth = Math.max(40, width);
  const frameWidth = prefix.length + suffix.length;
  const contentWidth = Math.max(8, safeWidth - frameWidth);
  const minimumGap = 1;
  const fillerChar = (filler || ' ')[0];
  const freeSpace = Math.max(minimumGap, contentWidth - leftWidth - rightWidth);
  return {
    prefix,
    left: leftTokens,
    gap: fillerChar.repeat(freeSpace),
    right: rightTokens,
    suffix,
  };
}

function buildPreviewLines(editorState, snapshot, language) {
  const leftLines = splitByNewline(editorState.left);
  const rightLines = splitByNewline(editorState.right);
  const usesNewline = editorState.left.includes('newline') || editorState.right.includes('newline');
  const commandSample = 'npm start';
  const renderValues = (items, side) =>
    items
      .map((id) => {
        const entry = editorState.catalog.find(([segment]) => segment === id);
        const { label } = translateSegmentMeta(id, entry ? entry[1] : id, entry ? entry[2] : '', language);
        const value = previewValue(editorState, snapshot, id, label);
        return value ? createSegmentToken(value, side) : null;
      })
      .filter(Boolean);

  const leadingBlank = boolSetting(editorState, 'POWERLEVEL9K_PROMPT_ADD_NEWLINE');
  const topLine = buildPreviewLine({
    prefix: usesNewline ? '╭─ ' : '',
    left: renderValues(leftLines.before, 'left'),
    right: renderValues(rightLines.before, 'right'),
    filler: usesNewline ? gapFill(editorState) : ' ',
    suffix: usesNewline ? ' ─╮' : '',
    width: PREVIEW_COLUMNS,
  });

  if (!usesNewline) {
    const oneLine = buildPreviewLine({
      prefix: '',
      left: [...renderValues(leftLines.before, 'left'), createTextToken(commandSample)],
      right: renderValues(rightLines.before, 'right'),
      filler: ' ',
      suffix: '',
      width: PREVIEW_COLUMNS,
    });
    return [leadingBlank ? '' : null, oneLine].filter((line) => line != null);
  }

  const bottomLine = buildPreviewLine({
    prefix: '╰─ ',
    left: [...renderValues(leftLines.after, 'left'), createTextToken(commandSample)],
    right: renderValues(rightLines.after, 'right'),
    filler: ' ',
    suffix: ' ─╯',
    width: PREVIEW_COLUMNS,
  });
  return [leadingBlank ? '' : null, topLine, bottomLine].filter((line) => line != null);
}

function PreviewPanel({ editorState, snapshot, language }) {
  const lines = buildPreviewLines(editorState, snapshot, language);
  const renderToken = (token, index) => {
    if (token.kind === 'segment') {
      return (
        <Box
          key={index}
          component="span"
          px={6}
          mr={4}
          style={{
            display: 'inline-block',
            borderRadius: 4,
            ...PREVIEW_SEGMENT_STYLES[token.side],
          }}
        >
          {token.text}
        </Box>
      );
    }
    return <React.Fragment key={index}>{token.text}</React.Fragment>;
  };

  return (
    <Box bg="#111719" c="#e9ecef" p="md" style={{ borderRadius: 8 }}>
      <Stack gap={0}
        style={{
          fontSize: 14,
          lineHeight: 1.55,
          fontFamily:
            'ui-monospace, SFMono-Regular, SF Mono, Menlo, Monaco, Consolas, Liberation Mono, monospace',
        }}
      >
        {lines.map((line, lineIndex) =>
          line === '' ? (
            <Box key={lineIndex} h={18} />
          ) : (
            <ScrollArea key={lineIndex} type="never" offsetScrollbars={false}>
              <Box component="div" style={{ whiteSpace: 'pre', minWidth: 'max-content' }}>
                {line.prefix}
                {line.left.map(renderToken)}
                {line.gap}
                {line.right.map(renderToken)}
                {line.suffix}
              </Box>
            </ScrollArea>
          )
        )}
      </Stack>
    </Box>
  );
}

function SectionHeading({ title, description, right }) {
  return (
    <Group justify="space-between" align="end">
      <Stack gap={2}>
        <Title order={3}>{title}</Title>
        {description ? (
          <Text c="dimmed" size="sm">
            {description}
          </Text>
        ) : null}
      </Stack>
      {right}
    </Group>
  );
}

function App({ colorScheme, language, onColorSchemeChange, onLanguageChange }) {
  const [mode, setMode] = useState('detecting');
  const [editorState, setEditorState] = useState(previewState());
  const [snapshot, setSnapshot] = useState({ values: {} });
  const [rawConfig, setRawConfig] = useState('');
  const [configPath, setConfigPath] = useState('~/.p10k.zsh');
  const [previewDir, setPreviewDir] = useState('~');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploadedName, setUploadedName] = useState('.p10k.zsh');
  const terminalHostRef = useRef(null);
  const terminalRef = useRef(null);
  const fitAddonRef = useRef(null);
  const terminalSocketRef = useRef(null);
  const resizeObserverRef = useRef(null);
  const syncTimerRef = useRef(null);
  const uploadedConfigRef = useRef('');
  const [commonSettingsOpen, setCommonSettingsOpen] = useLocalStorage({
    key: 'p10k-editor-common-settings-open',
    defaultValue: false,
  });
  const [rawConfigOpen, setRawConfigOpen] = useLocalStorage({
    key: 'p10k-editor-raw-config-open',
    defaultValue: false,
  });

  const catalogMap = useMemo(
    () => new Map(editorState.catalog.map(([id, label, description]) => [id, { label, description }])),
    [editorState.catalog]
  );
  const t = UI_TEXT[language] || UI_TEXT['zh-CN'];

  const notify = (message, color = 'teal') => notifications.show({ message, color });
  const notifyError = (message) => notifications.show({ message, color: 'red' });
  const leftEnabledCount = editorState.left.length;
  const rightEnabledCount = editorState.right.length;
  const usesRealMode = mode === 'real';

  async function loadSnapshot(nextDir, nextMode = mode) {
    if (nextMode !== 'real') {
      const now = new Date();
      const values = Object.fromEntries(fallbackCatalog.map(([id]) => [id, (segmentExamples[id] || ['', ''])[0]]));
      values.dir = nextDir || '~';
      values.vcs = 'on main *1';
      values.status = '128 ✘';
      values.command_execution_time = 'took 8s';
      values.go_version = 'go 1.22.0';
      values.node_version = 'node 22.0.0';
      values.time = `at ${now.toLocaleTimeString('zh-CN', { hour12: false })}`;
      setSnapshot({ dir: nextDir, exists: false, values });
      return;
    }
    const next = await api(`api/snapshot?dir=${encodeURIComponent(nextDir)}`);
    setSnapshot(next);
    setPreviewDir(next.dir);
  }

  async function loadConfig(pathValue = configPath) {
    const config = await api(pathValue ? `api/config?path=${encodeURIComponent(pathValue)}` : 'api/config');
    const raw = await api(pathValue ? `api/raw?path=${encodeURIComponent(pathValue)}` : 'api/raw');
    const nextState = normalizeEditorState(config);
    setEditorState(nextState);
    setConfigPath(config.path);
    setRawConfig(raw);
    if (!previewDir) setPreviewDir(config.home || config.path.replace(/\/\.p10k\.zsh$/, ''));
    return nextState;
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const nextState = await loadConfig();
        if (cancelled) return;
        setMode('real');
        const dir = previewDir || nextState.home || nextState.path.replace(/\/\.p10k\.zsh$/, '');
        setPreviewDir(dir);
        await loadSnapshot(dir, 'real');
      } catch {
        if (cancelled) return;
        const fallback = previewState();
        setMode('preview');
        setEditorState(fallback);
        setConfigPath('~/.p10k.zsh');
        setPreviewDir('~');
        setRawConfig(t.sourcePlaceholder);
        await loadSnapshot('~', 'preview');
      }
    })();
    return () => {
      cancelled = true;
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
      resizeObserverRef.current?.disconnect();
      stopTerminal();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const placeholders = Object.values(UI_TEXT).map((item) => item.sourcePlaceholder);
    if (mode === 'preview' && placeholders.includes(rawConfig)) {
      setRawConfig(t.sourcePlaceholder);
    }
  }, [mode, rawConfig, t.sourcePlaceholder]);

  useEffect(() => {
    if (!dialogOpen || !terminalRef.current) return undefined;
    const timer = setTimeout(() => {
      fitTerminal();
      terminalRef.current?.focus();
    }, 40);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialogOpen]);

  useEffect(() => {
    if (!terminalSocketRef.current || terminalSocketRef.current.readyState !== WebSocket.OPEN) return;
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => {
      terminalSocketRef.current?.send(
        JSON.stringify({
          type: 'update',
          configPath,
          left: editorState.left,
          right: editorState.right,
          settings: editorState.settings,
        })
      );
    }, 250);
    return () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    };
  }, [editorState.left, editorState.right, editorState.settings, configPath]);

  function ensureTerminal() {
    if (terminalRef.current) return terminalRef.current;
    const term = new Terminal({
      cols: 120,
      rows: 28,
      cursorBlink: true,
      convertEol: true,
      fontSize: 13,
      theme: { background: '#000000', foreground: '#e9ecef', cursor: '#e9ecef' },
    });
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalHostRef.current);
    fitAddonRef.current = fitAddon;
    resizeObserverRef.current?.disconnect();
    if (typeof ResizeObserver !== 'undefined' && terminalHostRef.current) {
      resizeObserverRef.current = new ResizeObserver(() => {
        if (dialogOpen) fitTerminal();
      });
      resizeObserverRef.current.observe(terminalHostRef.current);
    }
    term.onData((data) => {
      if (terminalSocketRef.current?.readyState === WebSocket.OPEN) {
        terminalSocketRef.current.send(JSON.stringify({ type: 'data', data }));
      }
    });
    terminalRef.current = term;
    setTimeout(() => fitTerminal(), 0);
    return term;
  }

  function fitTerminal() {
    const term = terminalRef.current;
    const fitAddon = fitAddonRef.current;
    if (!term || !fitAddon || !terminalHostRef.current) return;
    fitAddon.fit();
    if (terminalSocketRef.current?.readyState === WebSocket.OPEN) {
      terminalSocketRef.current.send(
        JSON.stringify({
          type: 'resize',
          columns: term.cols,
          rows: term.rows,
        })
      );
    }
  }

  function terminalRunning() {
    return terminalSocketRef.current
      && [WebSocket.OPEN, WebSocket.CONNECTING].includes(terminalSocketRef.current.readyState);
  }

  function startTerminal({ silent = false, preserve = false } = {}) {
    if (mode !== 'real') {
      notifyError(t.realOnlyTerminal);
      return;
    }
    const term = ensureTerminal();
    if (!preserve) term.clear();
    if (terminalSocketRef.current) {
      terminalSocketRef.current.onclose = null;
      terminalSocketRef.current.close();
      terminalSocketRef.current = null;
    }
    const socket = new WebSocket(`${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/terminal`);
    terminalSocketRef.current = socket;
    socket.addEventListener('open', () => {
      fitTerminal();
      socket.send(
        JSON.stringify({
          type: 'start',
          configPath,
          left: editorState.left,
          right: editorState.right,
          settings: editorState.settings,
          dir: previewDir,
          columns: term.cols,
          rows: term.rows,
        })
      );
      if (dialogOpen) term.focus();
    });
    socket.addEventListener('message', (event) => {
      const payload = JSON.parse(event.data);
      if (payload.type === 'data') term.write(payload.data);
      if (payload.type === 'error' && !silent) notifyError(`${t.terminalStartFailed}${payload.message}`);
      if (payload.type === 'started' || payload.type === 'updated') setTimeout(() => fitTerminal(), 0);
    });
    socket.addEventListener('error', () => {
      if (!silent) notifyError(t.terminalConnectFailed);
    });
  }

  function stopTerminal() {
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    if (terminalSocketRef.current?.readyState === WebSocket.OPEN) {
      terminalSocketRef.current.send(JSON.stringify({ type: 'stop' }));
    }
    if (terminalSocketRef.current) {
      terminalSocketRef.current.onclose = null;
      terminalSocketRef.current.close();
      terminalSocketRef.current = null;
    }
  }

  function updateSide(side, updater) {
    setEditorState((current) => normalizeEditorState({ ...current, ...updater(current) }));
  }

  function toggleSegment(side, id, checked) {
    updateSide(side, (current) => {
      const orderKey = `${side}PromptOrder`;
      const enabled = new Set(current[side]);
      const promptOrder = current[orderKey].includes(id) ? [...current[orderKey]] : [...current[orderKey], id];
      if (checked) enabled.add(id);
      else enabled.delete(id);
      return {
        [orderKey]: promptOrder,
        [side]: promptOrder.filter((item) => enabled.has(item)),
      };
    });
  }

  function moveSegment(side, id, delta) {
    updateSide(side, (current) => {
      const orderKey = `${side}PromptOrder`;
      const list = [...current[side]];
      const index = list.indexOf(id);
      if (index < 0) return {};
      const next = index + delta;
      if (next < 0 || next >= list.length) return {};
      [list[index], list[next]] = [list[next], list[index]];
      const disabled = current[orderKey].filter((item) => !list.includes(item));
      return {
        [side]: list,
        [orderKey]: [...list, ...disabled],
      };
    });
  }

  async function saveConfig() {
    try {
      if (mode !== 'real') {
        const blob = new Blob(
          [buildConfigText({ left: editorState.left, right: editorState.right, settings: editorState.settings }, uploadedConfigRef.current || fallbackConfigText())],
          { type: 'text/plain;charset=utf-8' }
        );
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = uploadedName || '.p10k.zsh';
        link.click();
        URL.revokeObjectURL(url);
        notify(t.downloadedConfig);
        return;
      }
      const result = await api('api/config', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          configPath,
          left: editorState.left,
          right: editorState.right,
          settings: editorState.settings,
        }),
      });
      const nextState = normalizeEditorState(result.config);
      setEditorState(nextState);
      setConfigPath(nextState.path);
      setRawConfig(await api(`api/raw?path=${encodeURIComponent(nextState.path)}`));
      notify(t.savedBackup(result.backupPath));
    } catch (error) {
      notifyError(error.message);
    }
  }

  async function handleSelectDir() {
    try {
      const result = await api('api/select-dir');
      setPreviewDir(result.path);
      await loadSnapshot(result.path, mode);
    } catch (error) {
      notifyError(t.selectedDirFailed(error.message));
    }
  }

  async function handlePathReload() {
    if (mode !== 'real') return;
    try {
      const nextState = await loadConfig(configPath);
      await loadSnapshot(previewDir || nextState.home || nextState.path.replace(/\/\.p10k\.zsh$/, ''), 'real');
      notify(t.loadedConfig(configPath));
    } catch (error) {
      notifyError(t.configLoadFailed(error.message));
    }
  }

  function handleFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || '');
      uploadedConfigRef.current = text;
      setUploadedName(file.name || '.p10k.zsh');
      if (mode !== 'real') {
        const nextState = stateFromConfigText(text, file.name || '.p10k.zsh');
        setEditorState(nextState);
        setRawConfig(text);
        loadSnapshot(previewDir, 'preview');
        notify(t.readConfigFile(file.name));
        return;
      }
      notify(t.fileSelectedNotice);
    };
    reader.onerror = () => notifyError(t.loadFailed);
    reader.readAsText(file);
  }

  async function handlePreviewDirBlur() {
    try {
      await loadSnapshot(previewDir, mode);
    } catch (error) {
      notifyError(error.message);
    }
  }

  function segmentCards(side) {
    return editorState[`${side}Order`].map((id) => {
      const enabled = editorState[side].includes(id);
      const sourceInfo = catalogMap.get(id) || { label: id, description: '' };
      const info = translateSegmentMeta(id, sourceInfo.label, sourceInfo.description, language);
      const index = editorState[side].indexOf(id);
      return (
        <Card
          key={`${side}-${id}`}
          withBorder
          radius="md"
          padding="sm"
          shadow="xs"
          style={{
            opacity: enabled ? 1 : 0.56,
            background: enabled ? 'var(--mantine-color-body)' : 'var(--mantine-color-gray-0)',
          }}
        >
          <Stack gap={8}>
            <Group justify="space-between" align="start" wrap="nowrap">
              <Checkbox
                checked={enabled}
                onChange={(event) => toggleSegment(side, id, event.currentTarget.checked)}
                label={info.label}
              />
              <Group gap={4}>
                <ActionIcon variant="light" disabled={index <= 0} onClick={() => moveSegment(side, id, -1)}>
                  <IconArrowUp size={16} />
                </ActionIcon>
                <ActionIcon
                  variant="light"
                  disabled={index < 0 || index >= editorState[side].length - 1}
                  onClick={() => moveSegment(side, id, 1)}
                >
                  <IconArrowDown size={16} />
                </ActionIcon>
              </Group>
            </Group>
            <Group gap={6}>
              <Code>{id}</Code>
              <Badge variant="light" color={side === 'left' ? 'blue' : 'gray'}>
                {side === 'left' ? t.leftBadge : t.rightBadge}
              </Badge>
            </Group>
            {info.description ? (
              <Text size="sm" c="dimmed" lineClamp={2}>
                {info.description}
              </Text>
            ) : null}
          </Stack>
        </Card>
      );
    });
  }

  return (
    <>
      <AppShell header={{ height: 0 }} padding="md">
        <AppShell.Main>
          <Container size={1440}>
            <Stack gap="lg">
              <Paper
                withBorder
                radius="md"
                p="lg"
                style={{
                  background: colorScheme === 'dark'
                    ? 'linear-gradient(180deg, #182027 0%, #101418 100%)'
                    : 'linear-gradient(180deg, #f7faf8 0%, #ffffff 100%)',
                }}
              >
                <Group justify="space-between" align="start">
                  <Stack gap={6}>
                    <Title order={1}>{t.appTitle}</Title>
                    <Group gap="xs">
                      <Badge color={usesRealMode ? 'teal' : 'gray'}>{usesRealMode ? t.realMode : t.previewMode}</Badge>
                      <Badge variant="light" color="blue">{t.leftCount(leftEnabledCount)}</Badge>
                      <Badge variant="light" color="gray">{t.rightCount(rightEnabledCount)}</Badge>
                    </Group>
                  </Stack>
                  <Stack gap="sm" align="end">
                    <Group gap="sm">
                      <SegmentedControl
                        size="sm"
                        value={language}
                        onChange={onLanguageChange}
                        data={LANGUAGE_OPTIONS}
                      />
                      <SegmentedControl
                        size="sm"
                        value={colorScheme}
                        onChange={onColorSchemeChange}
                        data={[
                          {
                            value: 'light',
                            label: (
                              <Group gap={6} wrap="nowrap">
                                <IconSun size={14} />
                                <span>{language === 'zh-CN' ? '浅色' : 'Light'}</span>
                              </Group>
                            ),
                          },
                          {
                            value: 'dark',
                            label: (
                              <Group gap={6} wrap="nowrap">
                                <IconMoon size={14} />
                                <span>{language === 'zh-CN' ? '深色' : 'Dark'}</span>
                              </Group>
                            ),
                          },
                        ]}
                      />
                    </Group>
                    <Group>
                      <Button variant="default" leftSection={<IconRefresh size={16} />} onClick={() => handlePathReload()}>
                        {t.reload}
                      </Button>
                      <Button onClick={saveConfig}>{t.save}</Button>
                    </Group>
                  </Stack>
                </Group>
              </Paper>

              <Paper withBorder radius="md" p="lg">
                <Stack gap="lg">
                  <SectionHeading
                    title={t.workspace}
                    right={
                      <Group gap="xs">
                        <Badge variant="light" color="teal">{usesRealMode ? t.saveable : t.previewOnly}</Badge>
                        <Badge variant="dot" color="gray">{previewDir}</Badge>
                      </Group>
                    }
                  />
                  <Grid gutter="md" align="end">
                    <Grid.Col span={{ base: 12, xl: 6 }}>
                      <FileButton onChange={handleFile} accept=".zsh,.txt,text/plain">
                        {(props) => (
                          <TextInput
                            label={t.configPath}
                            value={configPath}
                            disabled={!usesRealMode}
                            onChange={(event) => setConfigPath(event.currentTarget.value)}
                            onBlur={handlePathReload}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter') event.currentTarget.blur();
                            }}
                            rightSection={
                              <ActionIcon {...props} variant="subtle" size="sm" aria-label={t.pickConfig}>
                                <IconUpload size={16} />
                              </ActionIcon>
                            }
                          />
                        )}
                      </FileButton>
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, xl: 6 }}>
                      <TextInput
                        label={t.previewDir}
                        value={previewDir}
                        disabled={!usesRealMode}
                        onChange={(event) => setPreviewDir(event.currentTarget.value)}
                        onBlur={handlePreviewDirBlur}
                        rightSection={
                          <ActionIcon
                            variant="subtle"
                            size="sm"
                            aria-label={t.pickDir}
                            disabled={!usesRealMode}
                            onClick={handleSelectDir}
                          >
                            <IconFolderOpen size={16} />
                          </ActionIcon>
                        }
                      />
                    </Grid.Col>
                  </Grid>
                </Stack>
              </Paper>

              <SimpleGrid cols={{ base: 1, xl: 2 }} spacing="md">
                <Paper withBorder radius="md" p="lg">
                  <Accordion
                    variant="separated"
                    radius="md"
                    value={commonSettingsOpen ? 'common-settings' : null}
                    onChange={(value) => setCommonSettingsOpen(value === 'common-settings')}
                  >
                    <Accordion.Item value="common-settings">
                      <Accordion.Control>
                        <SectionHeading title={t.commonSettings} />
                      </Accordion.Control>
                      <Accordion.Panel>
                        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                          {editorState.settingsCatalog.map(([name, type, label]) => {
                            if (type === 'number') {
                              return (
                                <NumberInput
                                  key={name}
                                  label={translateSettingLabel(name, label, language)}
                                  value={Number(editorState.settings[name] || 0)}
                                  onChange={(value) =>
                                    setEditorState((current) => ({ ...current, settings: { ...current.settings, [name]: String(value || 0) } }))
                                  }
                                />
                              );
                            }
                            if (type === 'boolean' || name === 'POWERLEVEL9K_TRANSIENT_PROMPT' || name === 'POWERLEVEL9K_INSTANT_PROMPT') {
                              const data = type === 'boolean'
                                ? [
                                  { value: 'true', label: t.enabled },
                                  { value: 'false', label: t.disabled },
                                ]
                                : name === 'POWERLEVEL9K_TRANSIENT_PROMPT'
                                  ? [
                                    { value: 'off', label: t.disabled },
                                    { value: 'always', label: t.transientAlways },
                                    { value: 'same-dir', label: t.transientSameDir },
                                  ]
                                  : [
                                    { value: 'verbose', label: t.instantVerbose },
                                    { value: 'quiet', label: t.instantQuiet },
                                    { value: 'off', label: t.disabled },
                                  ];
                              return (
                                <Select
                                  key={name}
                                  label={translateSettingLabel(name, label, language)}
                                  data={data}
                                  value={editorState.settings[name] || data[0].value}
                                  onChange={(value) =>
                                    setEditorState((current) => ({ ...current, settings: { ...current.settings, [name]: value || '' } }))
                                  }
                                />
                              );
                            }
                            return (
                              <TextInput
                                key={name}
                                label={translateSettingLabel(name, label, language)}
                                value={editorState.settings[name] || ''}
                                onChange={(event) =>
                                  setEditorState((current) => ({
                                    ...current,
                                    settings: { ...current.settings, [name]: event.currentTarget.value },
                                  }))
                                }
                              />
                            );
                          })}
                        </SimpleGrid>
                      </Accordion.Panel>
                    </Accordion.Item>
                  </Accordion>
                </Paper>

                <Paper withBorder radius="md" p="lg">
                  <Accordion
                    variant="separated"
                    radius="md"
                    value={rawConfigOpen ? 'raw-config' : null}
                    onChange={(value) => setRawConfigOpen(value === 'raw-config')}
                  >
                    <Accordion.Item value="raw-config">
                      <Accordion.Control>
                        <SectionHeading title={t.rawConfig} />
                      </Accordion.Control>
                      <Accordion.Panel>
                        <Box
                          component="pre"
                          style={{
                            margin: 0,
                            padding: 16,
                            borderRadius: 8,
                            background: '#111719',
                            color: '#e9ecef',
                            overflow: 'auto',
                            maxHeight: 420,
                          }}
                        >
                          {rawConfig}
                        </Box>
                      </Accordion.Panel>
                    </Accordion.Item>
                  </Accordion>
                </Paper>
              </SimpleGrid>

              <Paper withBorder radius="md" p="lg" pos="sticky" top={12} style={{ zIndex: 10 }}>
                <Stack gap="md">
                  <SectionHeading
                    title={t.previewWorkbench}
                    right={
                      <Button
                        disabled={!usesRealMode}
                        leftSection={<IconTerminal2 size={16} />}
                        onClick={() => {
                          setDialogOpen(true);
                          setTimeout(() => {
                            if (!terminalRunning()) startTerminal();
                            else terminalRef.current?.focus();
                          }, 0);
                        }}
                      >
                        {t.openInteractiveZsh}
                      </Button>
                    }
                  />
                  <PreviewPanel editorState={editorState} snapshot={snapshot} language={language} />
                </Stack>
              </Paper>

              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                <Paper withBorder radius="md" p="lg">
                  <Stack gap="md">
                    <SectionHeading
                      title={t.leftSegments}
                      right={<Badge variant="light" color="blue">{leftEnabledCount} / {editorState.leftOrder.length}</Badge>}
                    />
                    <SimpleGrid cols={{ base: 1, md: 2, xl: 3 }} spacing="sm">
                      {segmentCards('left')}
                    </SimpleGrid>
                  </Stack>
                </Paper>

                <Paper withBorder radius="md" p="lg">
                  <Stack gap="md">
                    <SectionHeading
                      title={t.rightSegments}
                      right={<Badge variant="light" color="gray">{rightEnabledCount} / {editorState.rightOrder.length}</Badge>}
                    />
                    <SimpleGrid cols={{ base: 1, md: 2, xl: 3 }} spacing="sm">
                      {segmentCards('right')}
                    </SimpleGrid>
                  </Stack>
                </Paper>
              </SimpleGrid>
            </Stack>
          </Container>
        </AppShell.Main>
      </AppShell>

      <Modal
        opened={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={t.interactiveZsh}
        size="95vw"
        centered
        styles={{ content: { maxWidth: 1400 }, body: { paddingTop: 0 } }}
      >
        <Stack gap="md">
          <Group justify="space-between">
            <Text c="dimmed" size="sm">
              {t.closeDoesNotStop}
            </Text>
            <Button
              variant="default"
              leftSection={<IconRefresh size={16} />}
              onClick={() => startTerminal({ preserve: false })}
            >
              {t.restart}
            </Button>
          </Group>
          <Box
            ref={terminalHostRef}
            style={{
              minHeight: 460,
              height: '72vh',
              borderRadius: 8,
              overflow: 'hidden',
              border: '1px solid var(--mantine-color-default-border)',
              background: '#000',
            }}
          />
        </Stack>
      </Modal>
    </>
  );
}

export default App;
