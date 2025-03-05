import { useWallet } from '@solana/wallet-adapter-react';
//import { PublicKey } from '@solana/web3.js';
import { useState } from 'react';
import { updatePackageStatus, fetchPackage } from '../services/transactions';
import { derivePackageAddress } from '../utils/pda';
import { SolTrackProgram } from '../types/program_types';
import { PackageStatus } from '../types/package_tracker'; // Directly from IDL types
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import './styles/CourierDashboard.css';

interface CourierDashboardProps {
  program: SolTrackProgram;
}

export default function CourierDashboard({ program }: CourierDashboardProps) {
  const { publicKey, connected, connect } = useWallet();
  const [wallet] = useState(new PhantomWalletAdapter());
  const [formState, setFormState] = useState({
    packageId: '',
    status: 'Dispatched' as PackageStatus,
    latitude: '',
    longitude: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [packages, setPackages] = useState<any[]>([]);

  const statusOptions: PackageStatus[] = [
    'Dispatched', 'InTransit', 'OutForDelivery', 
    'Delivered', 'AttemptedDelivery', 'HeldAtCustoms', 
    'Delayed', 'Canceled', 'Lost'
  ];

  const handleConnect = async () => {
    try {
      await wallet.connect();
      if (wallet.connected && wallet.publicKey) {
        connect();
      }
    } catch (error) {
      setError('Failed to connect wallet');
      console.error('Connection error:', error);
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey || !connected) {
      setError('Wallet not connected');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const latitude = parseFloat(formState.latitude);
      const longitude = parseFloat(formState.longitude);
      
      if (isNaN(latitude) || isNaN(longitude)) {
        throw new Error('Invalid coordinates');
      }

      const pda = await derivePackageAddress(
        formState.packageId,
        publicKey,
      );
      
      const txSignature = await updatePackageStatus(
        program,
        formState.packageId,
        publicKey,
        { [formState.status]: {} },
        { lat: latitude, lng: longitude }
      );

      const updatedPackage = await fetchPackage(program, pda);
      setPackages(prev => [updatedPackage, ...prev.slice(0, 4)]);

      setSuccess(`Status updated successfully! TX: ${txSignature.slice(0, 10)}...`);
    } catch (err: any) {
      setError(err.message || 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  if (!connected) {
    return (
      <div className="dashboard-section">
        <h2>Courier Dashboard Access</h2>
        <button 
          onClick={handleConnect}
          className="connect-button"
          disabled={wallet.connecting}
        >
          {wallet.connecting ? 'Connecting...' : 'Connect Phantom Wallet'}
        </button>
        {error && <div className="error-message">{error}</div>}
      </div>
    );
  }

  return (
    <div className="dashboard-section">
      <div className="wallet-header">
        <h2>Courier Dashboard</h2>
        <div className="wallet-info">
          <span>Connected Wallet: {publicKey?.toBase58().slice(0, 6)}...{publicKey?.toBase58().slice(-4)}</span>
        </div>
      </div>
       
      <form onSubmit={handleUpdateStatus} className="status-form">

    <div className="form-group">

  <label>Package ID:</label>

  <input

    type="text"

    value={formState.packageId}

    onChange={(e) => setFormState(prev => ({

      ...prev,

      packageId: e.target.value

    }))}

    required

  />

    </div>

    <div className="form-group">
        <label>New Status:</label>
        <select value={formState.status}
            onChange={(e) => setFormState(prev => ({
            ...prev,
            status: e.target.value as PackageStatus
        }))} required>
        {statusOptions.map(option => (

        <option key={option} value={option}>
            {option}
        </option>
    ))}

        </select>
    </div>
    <div className="form-group">
        <label>Latitude:</label>
        <input
            type="number"
            step="any"
            value={formState.latitude}
            onChange={(e) => setFormState(prev => ({
                ...prev,
                latitude: e.target.value
            }))}
        required/>
    </div>
    <div className="form-group">
        <label>Longitude:</label>
        <input
            type="number"
            step="any"
            value={formState.longitude}
            onChange={(e) => setFormState(prev => ({
                ...prev,
                longitude: e.target.value
            }))}
        required/>
    </div>
    <button type="submit" disabled={loading}>
        {loading ? 'Updating...' : 'Update Status'}
    </button>

    {error && <div className="error-message">{error}</div>}
    {success && <div className="success-message">{success}</div>}
</form>

<div className="package-list">
    <h3>Recently Updated Packages</h3>
    {packages.length === 0 ? (
    <p>No recent package updates</p>
    ) : (
    packages.map((pkg, index) => (
        <div key={index} className="package-item">
            <p>Package ID: {pkg.package_id}</p>
            <p>Status: {pkg.status}</p>
            <p>Location: {pkg.location.lat.toFixed(4)}, {pkg.location.lng.toFixed(4)}</p>
            <p>Last Updated: {new Date(pkg.created_at * 1000).toLocaleString()}</p>
        </div>
        ))
    )}
</div>

</div>

);

}