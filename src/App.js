import Header from './Components/Header';
import './App.css';
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Groups from './pages/Groups';
import GroupDetail from './pages/GroupDetail';
import Budgets from './pages/Budgets';
import { ToastContainer } from 'react-toastify';
import { ConfigProvider } from 'antd';
import 'react-toastify/dist/ReactToastify.css';

const theme = {
  token: {
    colorPrimary: '#E2136E',
    colorInfo: '#E2136E',
    colorSuccess: '#0E6E5C',
    colorWarning: '#B4860F',
    colorError: '#B3261E',
    colorTextBase: '#1B1712',
    colorBgLayout: '#F7F4EC',
    colorBorder: '#E6DFD0',
    colorBorderSecondary: '#E6DFD0',
    colorLink: '#E2136E',
    borderRadius: 8,
    fontFamily: 'Manrope, system-ui, -apple-system, sans-serif',
  },
  components: {
    Table: { headerBg: 'transparent', rowHoverBg: '#FBF8F1' },
    Modal: { borderRadiusLG: 14 },
  },
};

function App() {
  return (
    <>
    <ConfigProvider theme={theme}>
    <ToastContainer/>
    <Router>
      <Routes>
        <Route path="/" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/groups" element={<Groups />} />
        <Route path="/groups/:groupId" element={<GroupDetail />} />
        <Route path="/budgets" element={<Budgets />} />
      </Routes>
    </Router>
    </ConfigProvider>
    </>
  );
}

export default App;