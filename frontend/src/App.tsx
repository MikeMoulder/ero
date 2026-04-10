import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { WalletProvider } from './context/WalletContext';
import { Layout } from './components/layout/Layout';
import Home from './pages/Home';
import ProductDetails from './pages/ProductDetails';
import Dashboard from './pages/Dashboard';
import GatewayPanel from './pages/GatewayPanel';
import Playground from './pages/Playground';
import Payments from './pages/Payments';

function App() {
  return (
    <WalletProvider>
      <BrowserRouter>
        <Routes>
          {/* Public pages without layout */}
          <Route path="/" element={<Home />} />
          <Route path="/product" element={<ProductDetails />} />

          {/* Pages with layout */}
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/gateway" element={<GatewayPanel />} />
            <Route path="/playground" element={<Playground />} />
            <Route path="/payments" element={<Payments />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </WalletProvider>
  );
}

export default App;
