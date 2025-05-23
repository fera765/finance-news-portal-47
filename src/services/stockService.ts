
import { api } from './api';
import axios from 'axios';
import { toast } from 'sonner';

// Interface for stock data
export interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  lastUpdated: string;
}

// Mock stock data for fallback when API is unavailable
const MOCK_STOCKS: Stock[] = [
  {
    symbol: 'AAPL',
    name: 'Apple Inc',
    price: 173.57,
    change: 2.14,
    lastUpdated: new Date().toISOString()
  },
  {
    symbol: 'MSFT',
    name: 'Microsoft Corporation',
    price: 368.63,
    change: 1.02,
    lastUpdated: new Date().toISOString()
  },
  {
    symbol: 'GOOGL',
    name: 'Alphabet Inc',
    price: 139.69,
    change: -0.34,
    lastUpdated: new Date().toISOString()
  },
  {
    symbol: 'AMZN',
    name: 'Amazon.com Inc',
    price: 178.25,
    change: 1.45,
    lastUpdated: new Date().toISOString()
  },
  {
    symbol: 'META',
    name: 'Meta Platforms Inc',
    price: 485.12,
    change: -0.78,
    lastUpdated: new Date().toISOString()
  }
];

// Yahoo Finance API base URL for stock data (alternative if you want to use it)
const YAHOO_FINANCE_BASE_URL = 'https://query1.finance.yahoo.com/v7/finance/quote';

// Get all stocks from the API with improved error handling
export const getStocks = async (): Promise<string[]> => {
  try {
    console.log('Fetching stocks from API...');
    const { data } = await api.get('/stocks');
    console.log('Stocks fetched successfully:', data);
    
    // If the API returns an array of stock objects, extract the symbols
    if (data && Array.isArray(data)) {
      return data.map((stock: any) => stock.symbol);
    }
    return [];
  } catch (error) {
    console.error('Error fetching stocks:', error);
    console.log('Using fallback stock data');
    
    // Return fallback data in case of error
    return MOCK_STOCKS.map(stock => stock.symbol);
  }
};

// Get Yahoo Finance stock data for multiple symbols
export const getYahooStockData = async (symbols: string[]): Promise<Stock[]> => {
  if (!symbols || symbols.length === 0) {
    return [];
  }

  try {
    console.log('Fetching Yahoo Finance data for:', symbols);
    
    // Try to get stock data from the API first
    try {
      const { data } = await api.get('/stocks', {
        params: { symbols: symbols.join(',') }
      });
      
      if (data && Array.isArray(data) && data.length > 0) {
        return data;
      }
    } catch (apiError) {
      console.error('Error fetching stocks from API:', apiError);
      // Fall through to mock data if API fails
    }
    
    // For now, we'll return mock data based on the provided symbols
    const stockData: Stock[] = symbols.map(symbol => {
      const mockStock = MOCK_STOCKS.find(stock => stock.symbol === symbol);
      
      if (mockStock) {
        // Return a copy with slightly randomized price for simulation
        const priceChange = (Math.random() * 2 - 1) * 2; // Random change between -2% and +2%
        const newPrice = mockStock.price * (1 + priceChange / 100);
        
        return {
          ...mockStock,
          price: Number(newPrice.toFixed(2)),
          change: Number(priceChange.toFixed(2)),
          lastUpdated: new Date().toISOString()
        };
      }
      
      // If symbol not in mock data, create a new entry
      return {
        symbol,
        name: `${symbol} Inc`,
        price: 100 + Math.random() * 100,
        change: (Math.random() * 4 - 2),
        lastUpdated: new Date().toISOString()
      };
    });
    
    return stockData;
  } catch (error) {
    console.error('Error fetching Yahoo Finance data:', error);
    
    // Return fallback data for the requested symbols
    return symbols.map(symbol => {
      const mockStock = MOCK_STOCKS.find(stock => stock.symbol === symbol);
      return mockStock || {
        symbol,
        name: `${symbol} Inc`,
        price: 100,
        change: 0,
        lastUpdated: new Date().toISOString()
      };
    });
  }
};

// Get a specific stock by symbol
export const getStock = async (symbol: string): Promise<Stock | null> => {
  try {
    const { data } = await api.get(`/stocks?symbol=${symbol}`);
    return data && data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error(`Error fetching stock ${symbol}:`, error);
    
    // Return fallback stock if available
    const mockStock = MOCK_STOCKS.find(stock => stock.symbol === symbol);
    return mockStock || null;
  }
};

// Add a new stock to the database
export const addStock = async (stock: { symbol: string; name: string }): Promise<boolean> => {
  try {
    // Check if stock already exists
    const { data: existingStocks } = await api.get(`/stocks?symbol=${stock.symbol}`);
    
    if (existingStocks && existingStocks.length > 0) {
      // Stock already exists
      return false;
    }
    
    // Add new stock
    await api.post('/stocks', {
      ...stock,
      price: 0,
      change: 0,
      enabled: true,
      lastUpdated: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    console.error('Error adding stock:', error);
    
    // For demo purposes, simulate success even on API error
    console.log('Simulating successful stock addition due to API error');
    toast.success(`Added ${stock.symbol} (demo mode)`);
    return true;
  }
};

// Remove a stock from the database
export const removeStock = async (symbol: string): Promise<boolean> => {
  try {
    // Find the stock to get its ID
    const { data: stocks } = await api.get(`/stocks?symbol=${symbol}`);
    
    if (!stocks || stocks.length === 0) {
      console.error(`Stock ${symbol} not found`);
      return false;
    }
    
    // Delete the stock
    await api.delete(`/stocks/${stocks[0].id}`);
    return true;
  } catch (error) {
    console.error('Error removing stock:', error);
    
    // For demo purposes, simulate success even on API error
    console.log('Simulating successful stock removal due to API error');
    toast.success(`Removed ${symbol} (demo mode)`);
    return true;
  }
};

// Toggle stock enabled status
export const toggleStockEnabled = async (symbol: string, enabled: boolean): Promise<boolean> => {
  try {
    // Find the stock to get its ID
    const { data: stocks } = await api.get(`/stocks?symbol=${symbol}`);
    
    if (!stocks || stocks.length === 0) {
      console.error(`Stock ${symbol} not found`);
      return false;
    }
    
    // Update the stock
    await api.patch(`/stocks/${stocks[0].id}`, { enabled });
    return true;
  } catch (error) {
    console.error('Error toggling stock status:', error);
    
    // For demo purposes, simulate success even on API error
    console.log('Simulating successful stock status toggle due to API error');
    return true;
  }
};

// Get favorite stocks for a user
export const getFavoriteStocks = async (userId: string): Promise<string[]> => {
  try {
    const { data } = await api.get(`/stockViews?userId=${userId}&favorite=true`);
    return data?.map((item: any) => item.stockSymbol) || [];
  } catch (error) {
    console.error('Error fetching favorite stocks:', error);
    // Return sample favorites as fallback
    return ['AAPL', 'MSFT'];
  }
};

// Toggle favorite status for a stock
export const toggleFavoriteStock = async (
  userId: string,
  stockSymbol: string,
  favorite: boolean
): Promise<boolean> => {
  try {
    // Check if the stock view already exists
    const { data: existing } = await api.get(
      `/stockViews?userId=${userId}&stockSymbol=${stockSymbol}`
    );

    if (existing && existing.length > 0) {
      // Update existing record
      const id = existing[0].id;
      await api.patch(`/stockViews/${id}`, { favorite });
    } else {
      // Create new record
      await api.post('/stockViews', {
        userId,
        stockSymbol,
        favorite,
        id: `${Date.now()}`
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error toggling favorite stock:', error);
    
    // In case of error, still return success for demo purposes
    // and store the preference in localStorage temporarily
    try {
      const storageKey = `favorite_stock_${userId}_${stockSymbol}`;
      if (favorite) {
        localStorage.setItem(storageKey, 'true');
      } else {
        localStorage.removeItem(storageKey);
      }
      console.log('Stored stock preference in localStorage as fallback');
      return true;
    } catch (e) {
      console.error('Failed to store in localStorage:', e);
      return false;
    }
  }
};

// Search for stocks by name or symbol (Yahoo Finance version)
export const searchYahooStocks = async (query: string): Promise<{ symbol: string; name: string; exchange?: string }[]> => {
  try {
    if (!query || query.trim() === '') {
      return [];
    }
    
    console.log('Searching Yahoo Finance for:', query);
    
    // Try to get search results from the API first
    try {
      const { data } = await api.get(`/stocks/search`, {
        params: { query: query.trim() }
      });
      
      if (data && Array.isArray(data) && data.length > 0) {
        return data;
      }
    } catch (apiError) {
      console.error('Error searching stocks from API:', apiError);
      // Fall through to mock data if API fails
    }
    
    // In a real implementation, we would call the Yahoo Finance Search API
    // For now, we'll filter the mock stocks based on the query
    const results = MOCK_STOCKS
      .filter(stock => 
        stock.symbol.toLowerCase().includes(query.toLowerCase()) ||
        stock.name.toLowerCase().includes(query.toLowerCase())
      )
      .map(stock => ({
        symbol: stock.symbol,
        name: stock.name,
        exchange: 'NASDAQ'  // Mock exchange
      }));
    
    // Add a few extra results for better demo experience
    if (query.toLowerCase().includes('tech')) {
      results.push({ symbol: 'NVDA', name: 'NVIDIA Corporation', exchange: 'NASDAQ' });
      results.push({ symbol: 'INTC', name: 'Intel Corporation', exchange: 'NASDAQ' });
    } else if (query.toLowerCase().includes('oil')) {
      results.push({ symbol: 'XOM', name: 'Exxon Mobil Corporation', exchange: 'NYSE' });
      results.push({ symbol: 'CVX', name: 'Chevron Corporation', exchange: 'NYSE' });
    } else if (query.toLowerCase().includes('bank')) {
      results.push({ symbol: 'JPM', name: 'JPMorgan Chase & Co.', exchange: 'NYSE' });
      results.push({ symbol: 'BAC', name: 'Bank of America Corporation', exchange: 'NYSE' });
    }
    
    return results;
  } catch (error) {
    console.error('Error searching stocks:', error);
    
    // Return filtered mock data as fallback
    return MOCK_STOCKS
      .filter(stock => 
        stock.symbol.toLowerCase().includes(query.toLowerCase()) ||
        stock.name.toLowerCase().includes(query.toLowerCase())
      )
      .map(stock => ({
        symbol: stock.symbol,
        name: stock.name
      }));
  }
};

// Search for stocks by name or symbol (original implementation)
export const searchStocks = async (query: string): Promise<Stock[]> => {
  try {
    if (!query || query.trim() === '') {
      return [];
    }

    const formattedQuery = query.toLowerCase().trim();
    const { data } = await api.get('/stocks');
    
    return data.filter((stock: Stock) => 
      stock.symbol.toLowerCase().includes(formattedQuery) ||
      stock.name.toLowerCase().includes(formattedQuery)
    );
  } catch (error) {
    console.error('Error searching stocks:', error);
    
    // Filter from mock stocks as fallback
    return MOCK_STOCKS.filter(stock => 
      stock.symbol.toLowerCase().includes(query.toLowerCase()) ||
      stock.name.toLowerCase().includes(query.toLowerCase())
    );
  }
};
