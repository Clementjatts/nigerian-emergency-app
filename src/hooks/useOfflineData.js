import { useState, useEffect } from 'react';
import offlineDataManager from '../services/offlineDataManager';
import networkManager from '../utils/networkManager';

export const useOfflineData = (key, fetchOnlineData, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOffline, setIsOffline] = useState(!networkManager.isConnected);

  useEffect(() => {
    const unsubscribe = networkManager.subscribe(setIsOffline);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let mounted = true;
    
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Try to get cached data first
        const cachedData = await offlineDataManager.getCachedData(key);
        if (cachedData && mounted) {
          setData(cachedData);
          setLoading(false);
        }

        // If we're online and have a fetch function, get fresh data
        if (networkManager.isConnected && fetchOnlineData) {
          const freshData = await fetchOnlineData();
          if (mounted) {
            setData(freshData);
            // Cache the fresh data
            await offlineDataManager.cacheData(key, freshData, options);
          }
        }
      } catch (err) {
        console.error('Error in useOfflineData:', err);
        if (mounted) {
          setError(err);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, [key, isOffline]);

  const refresh = async () => {
    if (!networkManager.isConnected || !fetchOnlineData) return;

    try {
      setLoading(true);
      setError(null);
      const freshData = await fetchOnlineData();
      await offlineDataManager.cacheData(key, freshData, options);
      setData(freshData);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return {
    data,
    loading,
    error,
    isOffline,
    refresh,
  };
};

export default useOfflineData;
