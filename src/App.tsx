import { createAppKit } from '@reown/appkit/react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Navbar from './components/Navbar';
import './App.css';

import { projectId, metadata, networks, wagmiAdapter } from './config/config';

import ParentComponent from './components/ParentComponent';

import Available from './final/Available';

const queryClient = new QueryClient();

const generalConfig = {
  projectId,
  metadata,
  networks,
};

// Initialize AppKit Modal
createAppKit({
  adapters: [wagmiAdapter],
  ...generalConfig,
});

// In App.tsx
export function App() {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
          <Navbar />
         <ParentComponent />
        
         <Available/>
        </div>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;