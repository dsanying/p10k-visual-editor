import React from 'react';
import ReactDOM from 'react-dom/client';
import { MantineProvider } from '@mantine/core';
import { useLocalStorage } from '@mantine/hooks';
import { Notifications } from '@mantine/notifications';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@xterm/xterm/css/xterm.css';
import App from './App.jsx';

function Root() {
  const [colorScheme, setColorScheme] = useLocalStorage({
    key: 'p10k-editor-color-scheme',
    defaultValue: 'light',
  });
  const [language, setLanguage] = useLocalStorage({
    key: 'p10k-editor-language',
    defaultValue: 'zh-CN',
  });

  return (
    <MantineProvider forceColorScheme={colorScheme}>
      <Notifications position="top-right" />
      <App
        colorScheme={colorScheme}
        language={language}
        onColorSchemeChange={setColorScheme}
        onLanguageChange={setLanguage}
      />
    </MantineProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
