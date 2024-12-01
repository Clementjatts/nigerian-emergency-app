import * as FileSystem from 'expo-file-system';
import { decode as atob } from 'base-64';
import * as SQLite from 'expo-sqlite';

const TILE_SERVER_URL = 'https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles';
const MAPBOX_ACCESS_TOKEN = 'YOUR_MAPBOX_ACCESS_TOKEN'; // Replace with your token
const TILE_SIZE = 256;
const MAX_ZOOM = 15;
const MIN_ZOOM = 10;

class MapTileManager {
  constructor() {
    this.db = SQLite.openDatabase('offlineMaps.db');
    this.initDatabase();
  }

  async initDatabase() {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS tiles (
            x INTEGER,
            y INTEGER,
            z INTEGER,
            tile BLOB,
            timestamp INTEGER,
            PRIMARY KEY (x, y, z)
          )`,
          [],
          () => resolve(),
          (_, error) => reject(error)
        );
      });
    });
  }

  async downloadTile(x, y, z) {
    const url = `${TILE_SERVER_URL}/${z}/${x}/${y}?access_token=${MAPBOX_ACCESS_TOKEN}`;
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  async saveTile(x, y, z, tileData) {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          'INSERT OR REPLACE INTO tiles (x, y, z, tile, timestamp) VALUES (?, ?, ?, ?, ?)',
          [x, y, z, tileData, Date.now()],
          () => resolve(),
          (_, error) => reject(error)
        );
      });
    });
  }

  async getTile(x, y, z) {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          'SELECT tile FROM tiles WHERE x = ? AND y = ? AND z = ?',
          [x, y, z],
          (_, { rows }) => resolve(rows.length > 0 ? rows.item(0).tile : null),
          (_, error) => reject(error)
        );
      });
    });
  }

  async downloadRegion(centerLat, centerLng, radiusKm) {
    const tiles = this.calculateTilesInRegion(centerLat, centerLng, radiusKm);
    const total = tiles.length;
    let completed = 0;

    for (const tile of tiles) {
      try {
        const tileData = await this.downloadTile(tile.x, tile.y, tile.z);
        await this.saveTile(tile.x, tile.y, tile.z, tileData);
        completed++;
        if (this.onProgress) {
          this.onProgress(completed / total);
        }
      } catch (error) {
        console.error('Error downloading tile:', error);
      }
    }
  }

  calculateTilesInRegion(centerLat, centerLng, radiusKm) {
    const tiles = [];
    const zoom = 14; // Default zoom level for offline areas

    // Convert radius to tile coordinates
    const metersPerPixel = 156543.03392 * Math.cos(centerLat * Math.PI / 180) / Math.pow(2, zoom);
    const tileRadius = Math.ceil((radiusKm * 1000) / (metersPerPixel * TILE_SIZE));

    const centerTile = this.latLngToTile(centerLat, centerLng, zoom);

    for (let x = -tileRadius; x <= tileRadius; x++) {
      for (let y = -tileRadius; y <= tileRadius; y++) {
        tiles.push({
          x: centerTile.x + x,
          y: centerTile.y + y,
          z: zoom,
        });
      }
    }

    return tiles;
  }

  latLngToTile(lat, lng, zoom) {
    const x = Math.floor((lng + 180) / 360 * Math.pow(2, zoom));
    const y = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
    return { x, y, z: zoom };
  }

  setProgressCallback(callback) {
    this.onProgress = callback;
  }

  async clearOldTiles(maxAge = 30 * 24 * 60 * 60 * 1000) { // 30 days
    const cutoff = Date.now() - maxAge;
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          'DELETE FROM tiles WHERE timestamp < ?',
          [cutoff],
          () => resolve(),
          (_, error) => reject(error)
        );
      });
    });
  }
}

export default new MapTileManager();
