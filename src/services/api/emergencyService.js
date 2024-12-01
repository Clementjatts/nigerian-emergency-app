import apiClient from './apiClient';
import offlineDataManager from '../offlineDataManager';
import Config from '../../config';

const CACHE_KEYS = {
  FACILITIES: 'emergency_facilities',
  FACILITY_TYPES: 'facility_types',
};

class EmergencyService {
  constructor() {
    this.cache = new Map();
  }

  async getFacilities(params = {}) {
    const cacheKey = `${CACHE_KEYS.FACILITIES}_${JSON.stringify(params)}`;

    try {
      // Check cache first
      const cachedData = await offlineDataManager.getCachedData(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      // Fetch fresh data
      const response = await apiClient.get('/facilities', { params });
      const facilities = response.data;

      // Cache the response
      await offlineDataManager.cacheData(cacheKey, facilities, {
        maxAge: Config.CACHE_TTL,
      });

      return facilities;
    } catch (error) {
      // If offline and no cache, throw custom error
      if (!navigator.onLine && !cachedData) {
        throw new Error('No cached data available offline');
      }
      throw error;
    }
  }

  async getFacilityById(id) {
    const cacheKey = `${CACHE_KEYS.FACILITIES}_${id}`;

    try {
      // Check cache first
      const cachedData = await offlineDataManager.getCachedData(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      // Fetch fresh data
      const response = await apiClient.get(`/facilities/${id}`);
      const facility = response.data;

      // Cache the response
      await offlineDataManager.cacheData(cacheKey, facility, {
        maxAge: Config.CACHE_TTL,
      });

      return facility;
    } catch (error) {
      if (!navigator.onLine && !cachedData) {
        throw new Error('No cached data available offline');
      }
      throw error;
    }
  }

  async searchFacilities(query = {}) {
    const cacheKey = `${CACHE_KEYS.FACILITIES}_search_${JSON.stringify(query)}`;

    try {
      // For search results, we might want a shorter cache time
      const cachedData = await offlineDataManager.getCachedData(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      const response = await apiClient.get('/facilities/search', {
        params: query,
      });
      const results = response.data;

      await offlineDataManager.cacheData(cacheKey, results, {
        maxAge: Config.CACHE_TTL / 2, // Shorter cache for search results
      });

      return results;
    } catch (error) {
      if (!navigator.onLine && !cachedData) {
        throw new Error('No cached data available offline');
      }
      throw error;
    }
  }

  async getNearbyFacilities(coords, radius = 5000, type = 'all') {
    const params = {
      latitude: coords.latitude,
      longitude: coords.longitude,
      radius,
      type,
    };

    const cacheKey = `${CACHE_KEYS.FACILITIES}_nearby_${JSON.stringify(params)}`;

    try {
      const cachedData = await offlineDataManager.getCachedData(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      const response = await apiClient.get('/facilities/nearby', { params });
      const facilities = response.data;

      await offlineDataManager.cacheData(cacheKey, facilities, {
        maxAge: Config.CACHE_TTL,
      });

      return facilities;
    } catch (error) {
      if (!navigator.onLine && !cachedData) {
        throw new Error('No cached data available offline');
      }
      throw error;
    }
  }

  async getFacilityTypes() {
    try {
      const cachedData = await offlineDataManager.getCachedData(
        CACHE_KEYS.FACILITY_TYPES
      );
      if (cachedData) {
        return cachedData;
      }

      const response = await apiClient.get('/facilities/types');
      const types = response.data;

      await offlineDataManager.cacheData(CACHE_KEYS.FACILITY_TYPES, types, {
        maxAge: Config.CACHE_TTL * 24, // Cache types longer as they change less frequently
      });

      return types;
    } catch (error) {
      if (!navigator.onLine && !cachedData) {
        throw new Error('No cached data available offline');
      }
      throw error;
    }
  }

  async reportFacility(facilityId, report) {
    // No caching for POST requests
    try {
      const response = await apiClient.post(`/facilities/${facilityId}/reports`, report);
      return response.data;
    } catch (error) {
      if (!navigator.onLine) {
        // Store the report for later submission
        await offlineDataManager.addToSyncQueue({
          type: 'REPORT_FACILITY',
          data: { facilityId, report },
        });
        return { status: 'queued', message: 'Report will be submitted when online' };
      }
      throw error;
    }
  }

  async updateFacilityInfo(facilityId, updates) {
    try {
      const response = await apiClient.patch(`/facilities/${facilityId}`, updates);
      
      // Update cache if successful
      const cacheKey = `${CACHE_KEYS.FACILITIES}_${facilityId}`;
      await offlineDataManager.removeCachedData(cacheKey);
      
      return response.data;
    } catch (error) {
      if (!navigator.onLine) {
        await offlineDataManager.addToSyncQueue({
          type: 'UPDATE_FACILITY',
          data: { facilityId, updates },
        });
        return { status: 'queued', message: 'Update will be applied when online' };
      }
      throw error;
    }
  }
}

export default new EmergencyService();
