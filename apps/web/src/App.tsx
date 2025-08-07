import { ConfigProvider } from 'antd';

import Router from './router';

function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1f1f1f',
        },
      }}
    >
      <Router />
    </ConfigProvider>
  );
}

export default App;
