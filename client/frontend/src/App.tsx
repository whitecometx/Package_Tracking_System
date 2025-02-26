import { useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl, Connection } from '@solana/web3.js';
import { AnchorProvider, Program } from '@coral-xyz/anchor';

import CreatePackageForm from './components/CreatePackageForm';
import TrackingPage from './components/TrackingPage';
import CourierDashboard from './components/CourierDashboard';
import './App';
import { CONFIG } from './config'; // Ensure this is correctly configured
import { PackageTracker } from './types/package_tracker';
import idl from './idl/package_tracker.json';
import { useEffect, useState } from 'react';
import { SolTrackProgram } from './types/program_types';

function App() {
  const network = 'localhost';
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);
  const [program, setProgram] = useState<SolTrackProgram | null>(null);
  const endpoint = CONFIG.RPC_URL || clusterApiUrl(network);
  const connection = useMemo(() => new Connection(endpoint, 'confirmed'), [endpoint]);

  useEffect(() => {
    const initializeProgram = async () => {
      // Check if window.solana exists before accessing it
      if (typeof window !== 'undefined' && window.solana) {
        try {
          // Ensure wallet is connected before creating the provider
          await window.solana.connect(); // Add this line to prompt connection

          const provider = new AnchorProvider(
            connection,
            window.solana,
            'confirmed'
          );
          
          // Type assertion for IDL

          const program = new Program<PackageTracker>(
            idl as PackageTracker,
            CONFIG.PROGRAM_ID,
            provider
          ) as SolTrackProgram;

          setProgram(program);
        } catch (error) {
          console.error("Error initializing program:", error);
          // Handle initialization error (e.g., display an error message)
        }
      } else {
        console.warn("Solana wallet not found. Please install Phantom or another compatible wallet.");
        // Handle case where Solana wallet is not available
      }
    };

    initializeProgram();
  }, [connection]);

  const renderRoutes = () => {
    if (!program) {
      return <div>Loading...</div>; // Or a more informative loading state
    }

    return (
      <Routes>
        <Route path="/" element={<CreatePackageForm program={program} />} />
        <Route path="/track/:pda" element={<TrackingPage program={program} />} />
        <Route path="/courier" element={<CourierDashboard program={program} />} />
      </Routes>
    );
  };

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <div className="App">
            <h1>SolTrack Package Tracker</h1>
            <Router>
              {renderRoutes()}
            </Router>
          </div>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export default App;
