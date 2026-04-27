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
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconArrowDown, IconArrowUp, IconFolderOpen, IconRefresh, IconTerminal2, IconUpload } from '@tabler/icons-react';
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
const PREVIEW_SEGMENT_STYLES = {
  left: { background: 'var(--mantine-color-blue-6)', color: 'var(--mantine-color-white)' },
  right: { background: 'var(--mantine-color-gray-2)', color: 'var(--mantine-color-dark-8)' },
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

function buildPreviewLines(editorState, snapshot) {
  const leftLines = splitByNewline(editorState.left);
  const rightLines = splitByNewline(editorState.right);
  const usesNewline = editorState.left.includes('newline') || editorState.right.includes('newline');
  const commandSample = 'npm start';
  const renderValues = (items, side) =>
    items
      .map((id) => {
        const entry = editorState.catalog.find(([segment]) => segment === id);
        const label = entry ? entry[1] : id;
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

function PreviewPanel({ editorState, snapshot }) {
  const lines = buildPreviewLines(editorState, snapshot);
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

function App() {
  const [mode, setMode] = useState('detecting');
  const [editorState, setEditorState] = useState(previewState());
  const [snapshot, setSnapshot] = useState({ values: {} });
  const [rawConfig, setRawConfig] = useState('读取中...');
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

  const catalogMap = useMemo(
    () => new Map(editorState.catalog.map(([id, label, description]) => [id, { label, description }])),
    [editorState.catalog]
  );

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
        setRawConfig('尚未选择配置文件。当前使用内置示例配置。');
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
      notifyError('只有本机真实模式可以打开交互 zsh。');
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
      if (payload.type === 'error' && !silent) notifyError(`交互 zsh 启动失败：${payload.message}`);
      if (payload.type === 'started' || payload.type === 'updated') setTimeout(() => fitTerminal(), 0);
    });
    socket.addEventListener('error', () => {
      if (!silent) notifyError('无法连接交互 zsh。');
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
        notify('已下载修改后的配置文件');
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
      notify(`已保存，备份：${result.backupPath}`);
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
      notifyError(`选择目录失败：${error.message}`);
    }
  }

  async function handlePathReload() {
    if (mode !== 'real') return;
    try {
      const nextState = await loadConfig(configPath);
      await loadSnapshot(previewDir || nextState.home || nextState.path.replace(/\/\.p10k\.zsh$/, ''), 'real');
      notify(`已加载配置：${configPath}`);
    } catch (error) {
      notifyError(`无法加载配置文件：${error.message}`);
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
        notify(`已读取配置文件：${file.name}`);
        return;
      }
      notify('已选择文件。真实模式下请把目标路径填到“配置路径”。');
    };
    reader.onerror = () => notifyError('读取配置文件失败。');
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
      const info = catalogMap.get(id) || { label: id, description: '' };
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
                {side === 'left' ? '左侧' : '右侧'}
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
                style={{ background: 'linear-gradient(180deg, #f7faf8 0%, #ffffff 100%)' }}
              >
                <Group justify="space-between" align="start">
                  <Stack gap={6}>
                    <Title order={1}>Powerlevel10k 配置编辑器</Title>
                    <Group gap="xs">
                      <Badge color={usesRealMode ? 'teal' : 'gray'}>{usesRealMode ? '真实模式' : '预览模式'}</Badge>
                      <Badge variant="light" color="blue">{leftEnabledCount} 个左侧段</Badge>
                      <Badge variant="light" color="gray">{rightEnabledCount} 个右侧段</Badge>
                    </Group>
                    <Text c="dimmed" size="sm">
                      {usesRealMode ? `正在编辑 ${editorState.path}` : '当前未连接本机后端'}
                    </Text>
                  </Stack>
                  <Group>
                    <Button variant="default" leftSection={<IconRefresh size={16} />} onClick={() => handlePathReload()}>
                      重新读取
                    </Button>
                    <Button onClick={saveConfig}>保存配置</Button>
                  </Group>
                </Group>
              </Paper>

              <Paper withBorder radius="md" p="lg" pos="sticky" top={12} style={{ zIndex: 10 }}>
                <Stack gap="lg">
                  <SectionHeading
                    title="预览工作台"
                    description="先看 prompt 排布，再调整段位和参数。"
                    right={
                      <Group gap="xs">
                        <Badge variant="light" color="teal">{usesRealMode ? '可保存' : '仅预览'}</Badge>
                        <Badge variant="dot" color="gray">{previewDir}</Badge>
                      </Group>
                    }
                  />
                  <Grid gutter="lg" align="start">
                    <Grid.Col span={{ base: 12, xl: 8 }}>
                      <PreviewPanel editorState={editorState} snapshot={snapshot} />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, xl: 4 }}>
                      <Stack gap="sm">
                        <TextInput
                          label="配置路径"
                          value={configPath}
                          disabled={!usesRealMode}
                          onChange={(event) => setConfigPath(event.currentTarget.value)}
                          onBlur={handlePathReload}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') event.currentTarget.blur();
                          }}
                        />
                        <TextInput
                          label="预览目录"
                          value={previewDir}
                          disabled={!usesRealMode}
                          onChange={(event) => setPreviewDir(event.currentTarget.value)}
                          onBlur={handlePreviewDirBlur}
                        />
                        <SimpleGrid cols={2} spacing="sm">
                          <FileButton onChange={handleFile} accept=".zsh,.txt,text/plain">
                            {(props) => (
                              <Button {...props} variant="default" fullWidth leftSection={<IconUpload size={16} />}>
                                选择文件
                              </Button>
                            )}
                          </FileButton>
                          <Button
                            variant="default"
                            fullWidth
                            disabled={!usesRealMode}
                            leftSection={<IconFolderOpen size={16} />}
                            onClick={handleSelectDir}
                          >
                            选择目录
                          </Button>
                        </SimpleGrid>
                        <Button
                          fullWidth
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
                          打开交互 zsh
                        </Button>
                        <Text c="dimmed" size="sm">
                          {usesRealMode ? '路径或目录改完后离开输入框会自动重读。' : '可导入 .p10k.zsh 文件做模拟编辑。'}
                        </Text>
                      </Stack>
                    </Grid.Col>
                  </Grid>
                </Stack>
              </Paper>

              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                <Paper withBorder radius="md" p="lg">
                  <Stack gap="md">
                    <SectionHeading
                      title="左侧显示"
                      description="路径、Git、换行等主要信息。"
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
                      title="右侧显示"
                      description="状态、耗时、版本、时间等辅助信息。"
                      right={<Badge variant="light" color="gray">{rightEnabledCount} / {editorState.rightOrder.length}</Badge>}
                    />
                    <SimpleGrid cols={{ base: 1, md: 2, xl: 3 }} spacing="sm">
                      {segmentCards('right')}
                    </SimpleGrid>
                  </Stack>
                </Paper>
              </SimpleGrid>

              <SimpleGrid cols={{ base: 1, xl: 2 }} spacing="md">
                <Paper withBorder radius="md" p="lg">
                  <Stack gap="md">
                    <SectionHeading
                      title="常用参数"
                      description="直接改常用开关和格式。"
                    />
                    <Text c="dimmed" size="sm">
                      保存后执行 <Code>source ~/.p10k.zsh</Code> 或 <Code>exec zsh</Code> 生效。
                    </Text>
                    <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                      {editorState.settingsCatalog.map(([name, type, label]) => {
                        if (type === 'number') {
                          return (
                            <NumberInput
                              key={name}
                              label={label}
                              value={Number(editorState.settings[name] || 0)}
                              onChange={(value) =>
                                setEditorState((current) => ({ ...current, settings: { ...current.settings, [name]: String(value || 0) } }))
                              }
                            />
                          );
                        }
                        if (type === 'boolean' || name === 'POWERLEVEL9K_TRANSIENT_PROMPT' || name === 'POWERLEVEL9K_INSTANT_PROMPT') {
                          const data = type === 'boolean'
                            ? ['true', 'false']
                            : name === 'POWERLEVEL9K_TRANSIENT_PROMPT'
                              ? ['off', 'always', 'same-dir']
                              : ['verbose', 'quiet', 'off'];
                          return (
                            <Select
                              key={name}
                              label={label}
                              data={data}
                              value={editorState.settings[name] || data[0]}
                              onChange={(value) =>
                                setEditorState((current) => ({ ...current, settings: { ...current.settings, [name]: value || '' } }))
                              }
                            />
                          );
                        }
                        return (
                          <TextInput
                            key={name}
                            label={label}
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
                  </Stack>
                </Paper>

                <Paper withBorder radius="md" p="lg">
                  <Accordion variant="separated" radius="md" defaultValue="raw-config">
                    <Accordion.Item value="raw-config">
                      <Accordion.Control>
                        <SectionHeading
                          title="原始配置"
                          description="需要时再展开查看完整内容。"
                        />
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
            </Stack>
          </Container>
        </AppShell.Main>
      </AppShell>

      <Modal
        opened={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="交互 zsh"
        size="95vw"
        centered
        styles={{ content: { maxWidth: 1400 }, body: { paddingTop: 0 } }}
      >
        <Stack gap="md">
          <Group justify="space-between">
            <Text c="dimmed" size="sm">
              关闭弹窗不会终止后台会话。
            </Text>
            <Button
              variant="default"
              leftSection={<IconRefresh size={16} />}
              onClick={() => startTerminal({ preserve: false })}
            >
              重启
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
