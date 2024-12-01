import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';
import * as turf from '@turf/turf';

class OfflineRoutingService {
  constructor() {
    this.db = SQLite.openDatabase('offlineRouting.db');
    this.initDatabase();
  }

  async initDatabase() {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        // Create tables for road network and routing data
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS road_network (
            id TEXT PRIMARY KEY,
            geometry TEXT,
            type TEXT,
            name TEXT,
            speed_limit INTEGER
          )`,
          [],
          () => {
            tx.executeSql(
              `CREATE TABLE IF NOT EXISTS favorite_locations (
                id TEXT PRIMARY KEY,
                name TEXT,
                latitude REAL,
                longitude REAL,
                address TEXT,
                timestamp INTEGER
              )`,
              [],
              () => resolve(),
              (_, error) => reject(error)
            );
          },
          (_, error) => reject(error)
        );
      });
    });
  }

  async saveRoadNetwork(roadData) {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        roadData.features.forEach(feature => {
          tx.executeSql(
            'INSERT OR REPLACE INTO road_network (id, geometry, type, name, speed_limit) VALUES (?, ?, ?, ?, ?)',
            [
              feature.id,
              JSON.stringify(feature.geometry),
              feature.properties.type,
              feature.properties.name,
              feature.properties.speed_limit
            ]
          );
        });
      }, reject, resolve);
    });
  }

  async findRoute(startPoint, endPoint) {
    // Implement A* pathfinding algorithm for offline routing
    const route = await this.calculateRoute(startPoint, endPoint);
    return route;
  }

  async calculateRoute(startPoint, endPoint) {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        // Get nearby road segments for start and end points
        tx.executeSql(
          `SELECT * FROM road_network 
           WHERE geometry LIKE '%${startPoint.longitude},${startPoint.latitude}%'
           OR geometry LIKE '%${endPoint.longitude},${endPoint.latitude}%'`,
          [],
          (_, { rows }) => {
            const roadSegments = rows._array;
            
            // Implement A* algorithm here
            const route = this.aStarPathfinding(roadSegments, startPoint, endPoint);
            resolve(route);
          },
          (_, error) => reject(error)
        );
      });
    });
  }

  aStarPathfinding(roadSegments, start, end) {
    // Basic A* implementation
    const openSet = new Set([start]);
    const cameFrom = new Map();
    const gScore = new Map();
    const fScore = new Map();

    gScore.set(start, 0);
    fScore.set(start, this.heuristic(start, end));

    while (openSet.size > 0) {
      const current = this.getLowestFScore(openSet, fScore);
      
      if (this.isGoal(current, end)) {
        return this.reconstructPath(cameFrom, current);
      }

      openSet.delete(current);
      const neighbors = this.getNeighbors(current, roadSegments);

      for (const neighbor of neighbors) {
        const tentativeGScore = gScore.get(current) + this.distance(current, neighbor);

        if (!gScore.has(neighbor) || tentativeGScore < gScore.get(neighbor)) {
          cameFrom.set(neighbor, current);
          gScore.set(neighbor, tentativeGScore);
          fScore.set(neighbor, tentativeGScore + this.heuristic(neighbor, end));

          if (!openSet.has(neighbor)) {
            openSet.add(neighbor);
          }
        }
      }
    }

    return null; // No path found
  }

  heuristic(point1, point2) {
    // Calculate straight-line distance using Haversine formula
    return turf.distance(
      turf.point([point1.longitude, point1.latitude]),
      turf.point([point2.longitude, point2.latitude])
    );
  }

  distance(point1, point2) {
    // Calculate actual road distance
    return this.heuristic(point1, point2);
  }

  getNeighbors(point, roadSegments) {
    // Find connected road segments
    return roadSegments.filter(segment => {
      const geometry = JSON.parse(segment.geometry);
      return geometry.coordinates.some(coord => 
        this.isPointNearCoordinate(point, { longitude: coord[0], latitude: coord[1] })
      );
    });
  }

  isPointNearCoordinate(point1, point2, threshold = 0.0001) {
    return Math.abs(point1.latitude - point2.latitude) < threshold &&
           Math.abs(point1.longitude - point2.longitude) < threshold;
  }

  getLowestFScore(openSet, fScore) {
    return Array.from(openSet).reduce((lowest, current) => 
      (fScore.get(current) < fScore.get(lowest)) ? current : lowest
    );
  }

  reconstructPath(cameFrom, current) {
    const path = [current];
    while (cameFrom.has(current)) {
      current = cameFrom.get(current);
      path.unshift(current);
    }
    return path;
  }

  async saveFavoriteLocation(location) {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          `INSERT OR REPLACE INTO favorite_locations 
           (id, name, latitude, longitude, address, timestamp) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            location.id,
            location.name,
            location.latitude,
            location.longitude,
            location.address,
            Date.now()
          ],
          () => resolve(),
          (_, error) => reject(error)
        );
      });
    });
  }

  async getFavoriteLocations() {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM favorite_locations ORDER BY timestamp DESC',
          [],
          (_, { rows }) => resolve(rows._array),
          (_, error) => reject(error)
        );
      });
    });
  }

  async removeFavoriteLocation(id) {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          'DELETE FROM favorite_locations WHERE id = ?',
          [id],
          () => resolve(),
          (_, error) => reject(error)
        );
      });
    });
  }
}

export default new OfflineRoutingService();
