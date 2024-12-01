const Location = require('../models/Location');
const { validateObjectId } = require('../utils/validation');

// Get all locations for a user
exports.getLocations = async (req, res) => {
  try {
    const userId = req.user._id;
    const lastSync = req.query.lastSync ? new Date(req.query.lastSync) : null;

    let query = { userId, isDeleted: false };
    if (lastSync) {
      query.lastModified = { $gt: lastSync };
    }

    const locations = await Location.find(query)
      .sort({ lastModified: -1 })
      .select('-__v');

    res.json({
      success: true,
      data: locations
    });
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching locations',
      error: error.message
    });
  }
};

// Sync multiple locations
exports.syncLocations = async (req, res) => {
  try {
    const userId = req.user._id;
    const { locations } = req.body;

    if (!Array.isArray(locations)) {
      return res.status(400).json({
        success: false,
        message: 'Locations must be an array'
      });
    }

    const syncResults = await Promise.all(
      locations.map(async (location) => {
        try {
          // Check if location exists
          const existingLocation = await Location.findOne({
            userId,
            locationId: location.id
          });

          if (existingLocation) {
            // Update if the incoming location is newer
            if (new Date(location.timestamp) > existingLocation.lastModified) {
              const updated = await Location.findOneAndUpdate(
                { userId, locationId: location.id },
                {
                  name: location.name,
                  latitude: location.latitude,
                  longitude: location.longitude,
                  address: location.address,
                  timestamp: location.timestamp,
                  lastModified: new Date(),
                  isDeleted: false
                },
                { new: true }
              );
              return { success: true, location: updated, action: 'updated' };
            }
            return { success: true, location: existingLocation, action: 'unchanged' };
          }

          // Create new location
          const newLocation = await Location.create({
            userId,
            locationId: location.id,
            name: location.name,
            latitude: location.latitude,
            longitude: location.longitude,
            address: location.address,
            timestamp: location.timestamp,
            lastModified: new Date()
          });

          return { success: true, location: newLocation, action: 'created' };
        } catch (error) {
          return {
            success: false,
            locationId: location.id,
            error: error.message
          };
        }
      })
    );

    // Count successful and failed operations
    const summary = syncResults.reduce(
      (acc, result) => {
        if (result.success) {
          acc.successful++;
          acc[result.action]++;
        } else {
          acc.failed++;
        }
        return acc;
      },
      { successful: 0, failed: 0, created: 0, updated: 0, unchanged: 0 }
    );

    res.json({
      success: true,
      summary,
      results: syncResults
    });
  } catch (error) {
    console.error('Error syncing locations:', error);
    res.status(500).json({
      success: false,
      message: 'Error syncing locations',
      error: error.message
    });
  }
};

// Delete a location
exports.deleteLocation = async (req, res) => {
  try {
    const userId = req.user._id;
    const { locationId } = req.params;

    const location = await Location.findOneAndUpdate(
      { userId, locationId },
      { isDeleted: true, lastModified: new Date() },
      { new: true }
    );

    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Location not found'
      });
    }

    res.json({
      success: true,
      message: 'Location marked as deleted',
      data: location
    });
  } catch (error) {
    console.error('Error deleting location:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting location',
      error: error.message
    });
  }
};

// Get a single location
exports.getLocation = async (req, res) => {
  try {
    const userId = req.user._id;
    const { locationId } = req.params;

    const location = await Location.findOne({
      userId,
      locationId,
      isDeleted: false
    }).select('-__v');

    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Location not found'
      });
    }

    res.json({
      success: true,
      data: location
    });
  } catch (error) {
    console.error('Error fetching location:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching location',
      error: error.message
    });
  }
};

// Update a single location
exports.updateLocation = async (req, res) => {
  try {
    const userId = req.user._id;
    const { locationId } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated directly
    delete updateData._id;
    delete updateData.userId;
    delete updateData.locationId;
    delete updateData.isDeleted;

    const location = await Location.findOneAndUpdate(
      { userId, locationId },
      { ...updateData, lastModified: new Date() },
      { new: true }
    );

    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Location not found'
      });
    }

    res.json({
      success: true,
      data: location
    });
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating location',
      error: error.message
    });
  }
};
