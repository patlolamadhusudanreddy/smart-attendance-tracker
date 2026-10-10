/**
 * Calculates the great-circle distance between two geographical coordinates
 * using the Haversine formula on a spherical Earth model.
 *
 * @param {number} lat1 Latitude of point 1 in degrees
 * @param {number} lon1 Longitude of point 1 in degrees
 * @param {number} lat2 Latitude of point 2 in degrees
 * @param {number} lon2 Longitude of point 2 in degrees
 * @returns {number} Distance in meters
 */
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const toRadians = (deg) => (deg * Math.PI) / 180;

  const φ1 = toRadians(lat1);
  const φ2 = toRadians(lat2);
  const Δφ = toRadians(lat2 - lat1);
  const Δλ = toRadians(lon2 - lon1);

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // In meters
}

/**
 * Validates whether user coordinates reside within a classroom geofence
 *
 * @param {number} userLat
 * @param {number} userLon
 * @param {number} classLat
 * @param {number} classLon
 * @param {number} allowedRadiusMeters Default 30 meters
 * @returns {{ isInside: boolean, distanceMeters: number }}
 */
function verifyGeofence(userLat, userLon, classLat, classLon, allowedRadiusMeters = 30) {
  const distanceMeters = calculateHaversineDistance(
    Number(userLat),
    Number(userLon),
    Number(classLat),
    Number(classLon)
  );

  const roundedDistance = Math.round(distanceMeters * 10) / 10;
  return {
    isInside: distanceMeters <= allowedRadiusMeters,
    distanceMeters: roundedDistance,
    allowedRadiusMeters,
  };
}

module.exports = {
  calculateHaversineDistance,
  verifyGeofence,
};
