import React, { useState, useEffect } from 'react';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const TokenPrice: React.FC = () => {
  const [price, setPrice] = useState<string | null>(null);
  const [priceChange, setPriceChange] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const response = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=weatherxm&vs_currencies=usd&include_24hr_change=true',
          {
            headers: {
              'x-cg-pro-api-key': process.env.REACT_APP_COINGECKO_API_KEY || ''
            }
          }
        );
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.error || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        // Check if weatherxm is listed on CoinGecko
        if (!data.weatherxm) {
          setError('WXM is not currently listed on CoinGecko');
          setErrorDetails('The WXM token is not yet listed on CoinGecko. Price data will be available once the token is listed.');
          setLoading(false);
          return;
        }

        setPrice(data.weatherxm.usd.toFixed(2));
        setPriceChange(data.weatherxm.usd_24h_change);
        setLoading(false);
        setError(null);
        setErrorDetails(null);
      } catch (err) {
        console.error('Error fetching price:', err);
        setError('Failed to fetch price');
        setErrorDetails(err instanceof Error ? err.message : 'An unknown error occurred while fetching the price data.');
        setLoading(false);
      }
    };

    fetchPrice();
    // Update price every 60 minutes
    const interval = setInterval(fetchPrice, 3600000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="animate-pulse h-4 w-20 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col space-y-1">
        <div className="flex items-center space-x-2">
          <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />
          <span className="text-gray-600">WXM Price:</span>
          <span className="text-gray-400 italic">{error}</span>
        </div>
        {errorDetails && (
          <span className="text-xs text-gray-500 ml-6">{errorDetails}</span>
        )}
      </div>
    );
  }

  if (!price) {
    return (
      <div className="flex flex-col space-y-1">
        <div className="flex items-center space-x-2">
          <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />
          <span className="text-gray-600">WXM Price:</span>
          <span className="text-gray-400 italic">Not listed on CoinGecko</span>
        </div>
        <span className="text-xs text-gray-500 ml-6">
          The WXM token is not yet listed on CoinGecko. Price data will be available once the token is listed.
        </span>
      </div>
    );
  }

  const isPositive = priceChange !== null && priceChange >= 0;
  const priceChangeColor = isPositive ? 'text-green-500' : 'text-red-500';
  const priceChangeIcon = isPositive ? ArrowTrendingUpIcon : ArrowTrendingDownIcon;

  return (
    <div className="flex items-center space-x-2">
      <span className="text-gray-600">WXM Price:</span>
      <span className="font-semibold">${price}</span>
      {priceChange !== null && (
        <div className={`flex items-center ${priceChangeColor}`}>
          {React.createElement(priceChangeIcon, { className: 'h-4 w-4' })}
          <span>{Math.abs(priceChange).toFixed(2)}%</span>
        </div>
      )}
    </div>
  );
};

export default TokenPrice; 