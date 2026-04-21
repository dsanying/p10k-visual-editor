import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActionIcon,
  AppShell,
  Badge,
  Box,
  Button,
  Card,
  Checkbox,
  Code,
  Container,
  Divider,
  FileButton,
  Grid,
  Group,
  Input,
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

const promptColors = {
  left: { bg: '#1c7ed6', color: '#fff' },
  right: { bg: '#dee2e6', color: '#111' },
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
  return value[0].repeat(240);
}

function SegmentChip({ value, side }) {
  return (
    <Box
      span="span"
      style={{
        display: 'inline-block',
        padding: '4px 8px',
        borderRadius: 6,
        marginRight: 4,
        background: promptColors[side].bg,
        color: promptColors[side].color,
        fontSize: 13,
      }}
    >
      {value}
    </Box>
  );
}

function PreviewPanel({ editorState, snapshot }) {
  const leftLines = splitByNewline(editorState.left);
  const rightLines = splitByNewline(editorState.right);
  const usesNewline = editorState.left.includes('newline') || editorState.right.includes('newline');
  const leadingBlank = boolSetting(editorState, 'POWERLEVEL9K_PROMPT_ADD_NEWLINE');
  const renderSegments = (items, side) =>
    items.map((id) => {
      const entry = editorState.catalog.find(([segment]) => segment === id);
      const label = entry ? entry[1] : id;
      const value = previewValue(editorState, snapshot, id, label);
      return value ? <SegmentChip key={`${side}-${id}`} value={value} side={side} /> : null;
    });
  const gap = (
    <Text span c="dimmed" style={{ flex: 1, overflow: 'hidden', whiteSpace: 'nowrap' }}>
      {gapFill(editorState)}
    </Text>
  );

  return (
    <Paper bg="#111719" c="#e9ecef" p="md" radius="md">
      <Stack gap={6}>
        {leadingBlank ? <Box h={12} /> : null}
        <Group gap={0} wrap="nowrap" align="center">
          <Text c="dimmed">{usesNewline ? '╭─' : '─'}</Text>
          {renderSegments(leftLines.before, 'left')}
          {gap}
          {renderSegments(rightLines.before, 'right')}
          <Text c="dimmed">{usesNewline ? '─╮' : '─'}</Text>
        </Group>
        {usesNewline ? (
          <Group gap={0} wrap="nowrap" align="center">
            <Text c="dimmed">╰─</Text>
            {renderSegments(leftLines.after, 'left')}
            <Text span px="xs">
              npm start
            </Text>
            {gap}
            {renderSegments(rightLines.after, 'right')}
            <Text c="dimmed">─╯</Text>
          </Group>
        ) : null}
      </Stack>
    </Paper>
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
  const terminalSocketRef = useRef(null);
  const syncTimerRef = useRef(null);
  const uploadedConfigRef = useRef('');

  const catalogMap = useMemo(
    () => new Map(editorState.catalog.map(([id, label, description]) => [id, { label, description }])),
    [editorState.catalog]
  );

  const notify = (message, color = 'teal') => notifications.show({ message, color });
  const notifyError = (message) => notifications.show({ message, color: 'red' });

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
      stopTerminal();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    term.open(terminalHostRef.current);
    term.onData((data) => {
      if (terminalSocketRef.current?.readyState === WebSocket.OPEN) {
        terminalSocketRef.current.send(JSON.stringify({ type: 'data', data }));
      }
    });
    terminalRef.current = term;
    return term;
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
        <Card key={`${side}-${id}`} withBorder radius="md" shadow="xs" opacity={enabled ? 1 : 0.58}>
          <Stack gap="xs">
            <Group justify="space-between" align="start">
              <Checkbox checked={enabled} onChange={(event) => toggleSegment(side, id, event.currentTarget.checked)} label={info.label} />
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
            <Text size="sm" c="dimmed">
              {info.description}
            </Text>
            <Code>{id}</Code>
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
            <Stack gap="md">
              <Group justify="space-between" align="start">
                <Stack gap={4}>
                  <Title order={1}>Powerlevel10k 配置编辑器</Title>
                  <Text c="dimmed">组件化界面，尽量减少自定义样式。</Text>
                  <Group gap="xs">
                    <Badge color={mode === 'real' ? 'teal' : 'gray'}>{mode === 'real' ? '真实模式' : '预览模式'}</Badge>
                    <Text c="dimmed" size="sm">
                      {mode === 'real' ? `正在编辑 ${editorState.path}` : '未连接本机后端'}
                    </Text>
                  </Group>
                </Stack>
                <Group>
                  <Button variant="default" leftSection={<IconRefresh size={16} />} onClick={() => handlePathReload()}>
                    重新读取
                  </Button>
                  <Button onClick={saveConfig}>保存配置</Button>
                </Group>
              </Group>

              <Paper withBorder radius="md" p="md">
                <Grid align="end">
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <TextInput
                      label="配置路径"
                      value={configPath}
                      disabled={mode !== 'real'}
                      onChange={(event) => setConfigPath(event.currentTarget.value)}
                      onBlur={handlePathReload}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') event.currentTarget.blur();
                      }}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 3 }}>
                    <FileButton onChange={handleFile} accept=".zsh,.txt,text/plain">
                      {(props) => (
                        <Button {...props} variant="default" fullWidth leftSection={<IconUpload size={16} />}>
                          选择文件
                        </Button>
                      )}
                    </FileButton>
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 3 }}>
                    <Text c="dimmed" size="sm">
                      {mode === 'real' ? '修改路径后按回车或离开输入框会重新加载。' : '选择 .p10k.zsh 文件后使用预览模式编辑。'}
                    </Text>
                  </Grid.Col>
                </Grid>
              </Paper>

              <Paper withBorder radius="md" p="md" pos="sticky" top={12} style={{ zIndex: 10 }}>
                <Grid align="end">
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <TextInput
                      label="预览目录"
                      value={previewDir}
                      disabled={mode !== 'real'}
                      onChange={(event) => setPreviewDir(event.currentTarget.value)}
                      onBlur={handlePreviewDirBlur}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 3 }}>
                    <Button
                      variant="default"
                      fullWidth
                      disabled={mode !== 'real'}
                      leftSection={<IconFolderOpen size={16} />}
                      onClick={handleSelectDir}
                    >
                      选择目录
                    </Button>
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 3 }}>
                    <Button
                      fullWidth
                      disabled={mode !== 'real'}
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
                  </Grid.Col>
                </Grid>
                <Box mt="md">
                  <PreviewPanel editorState={editorState} snapshot={snapshot} />
                </Box>
              </Paper>

              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                <Paper withBorder radius="md" p="md">
                  <Stack gap="md">
                    <div>
                      <Title order={3}>左侧显示</Title>
                      <Text c="dimmed" size="sm">
                        适合放路径、Git、换行等核心信息。
                      </Text>
                    </div>
                    <SimpleGrid cols={{ base: 1, xl: 2 }} spacing="sm">
                      {segmentCards('left')}
                    </SimpleGrid>
                  </Stack>
                </Paper>

                <Paper withBorder radius="md" p="md">
                  <Stack gap="md">
                    <div>
                      <Title order={3}>右侧显示</Title>
                      <Text c="dimmed" size="sm">
                        适合放状态、耗时、版本、时间等辅助信息。
                      </Text>
                    </div>
                    <SimpleGrid cols={{ base: 1, xl: 2 }} spacing="sm">
                      {segmentCards('right')}
                    </SimpleGrid>
                  </Stack>
                </Paper>
              </SimpleGrid>

              <Paper withBorder radius="md" p="md">
                <Stack gap="md">
                  <div>
                    <Title order={3}>常用参数</Title>
                    <Text c="dimmed" size="sm">
                      保存后执行 <Code>source ~/.p10k.zsh</Code> 或 <Code>exec zsh</Code> 生效。
                    </Text>
                  </div>
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

              <Paper withBorder radius="md" p="md">
                <Stack gap="sm">
                  <Title order={3}>原始配置</Title>
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
                </Stack>
              </Paper>
            </Stack>
          </Container>
        </AppShell.Main>
      </AppShell>

      <Modal
        opened={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="交互 zsh"
        size="xl"
        centered
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
              minHeight: 420,
              height: '68vh',
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
