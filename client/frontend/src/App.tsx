import { useMemo, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { CONFIG } from './config';
import CreatePackageForm from './components/CreatePackageForm';
import TrackingPage from './components/TrackingPage';
import CourierDashboard from './components/CourierDashboard';
import './App';

function App() {
  const network = WalletAdapterNetwork.Devnet;
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  return (
    <ConnectionProvider endpoint={CONFIG.RPC_URL}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <div className="App">
            <h1>SolTrack Package Tracker</h1>
            <Router>
              <Routes>
                <Route path="/" element={<CreatePackageForm />} />
                <Route path="/track/:pda" element={<TrackingPage />} />
                <Route path="/courier" element={<CourierDashboard />} />
              </Routes>
            </Router>
          </div>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export default App;