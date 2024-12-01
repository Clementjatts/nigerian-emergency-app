const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getLocations,
  syncLocations,
  deleteLocation,
  getLocation,
  updateLocation
} = require('../controllers/locationController');

// All routes are protected and require authentication
router.use(protect);

// Get all locations and sync endpoints
router.get('/', getLocations);
router.post('/sync', syncLocations);

// Individual location operations
router.get('/:locationId', getLocation);
router.put('/:locationId', updateLocation);
router.delete('/:locationId', deleteLocation);

module.exports = router;
