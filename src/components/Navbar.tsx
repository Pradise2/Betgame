import React, { useEffect, useState } from 'react';
import { Coins, Plus } from 'lucide-react';

const Navbar: React.FC = () => {
  const [ethPrice, setEthPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchEthPrice = async () => {
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
        const data = await response.json();
        setEthPrice(data.ethereum.usd);
      } catch (error) {
        console.error('Error fetching ETH price:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEthPrice();
    const interval = setInterval(fetchEthPrice, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <nav className="bg-slate-800/90 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-50 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between h-auto sm:h-20 py-4 sm:py-0 space-y-4 sm:space-y-0">
          {/* Logo Section */}
          <div className="flex items-center">
            <div className="flex items-center gap-3 group cursor-pointer">
              <Coins className="w-8 h-8 text-yellow-500 transition-transform group-hover:rotate-12" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-500 to-yellow-300 bg-clip-text text-transparent">
                PVP Flip
              </h1>
            </div>
          </div>

          {/* ETH Price Section */}
          <div className="flex items-center">
            <div className="flex items-center gap-3 bg-slate-700/50 rounded-full px-6 py-2.5 border border-slate-600 hover:border-slate-500 transition-colors">
              <div className="flex items-center gap-2">
                <img
                  className="w-5 h-5"
                  src="https://ethereum.org/static/6b935ac0e6194247347855dc3d328e83/13c43/eth-diamond-black.png"
                  alt="ETH"
                />
                <span className="text-slate-200 font-medium">
                  {loading ? (
                    <div className="animate-pulse">Loading...</div>
                  ) : (
                    <span>
                      {ethPrice 
                        ? `$${ethPrice.toLocaleString(undefined, { 
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2 
                          })}`
                        : 'Failed to load'
                      }
                    </span>
                  )}
                </span>
              </div>
              <div className="h-5 w-px bg-slate-600"></div>
              <Plus className="w-4 h-4 text-slate-400" />
            </div>
          </div>

          {/* Connect Button Section */}
          <div className="flex items-center">
            <appkit-button 
            size='sm'
            balance='hide' />
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;