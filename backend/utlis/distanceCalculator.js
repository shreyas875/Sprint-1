// Haversine formula helper to compute the great-circle distance (in km)
// between two lat/lng points. Used as a JS fallback; the nearby-events
// SQL query below also computes this directly in MySQL for efficiency.
function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371; // Earth radius in km

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Raw SQL expression (MySQL) to compute distance in km between a fixed
// point (:lat, :lng) and each row's latitude/longitude columns.
// Usage: pass this string into a SELECT and bind lat/lng twice via '?' placeholders.
const HAVERSINE_SQL = `
  (6371 * ACOS(
    COS(RADIANS(?)) * COS(RADIANS(latitude)) *
    COS(RADIANS(longitude) - RADIANS(?)) +
    SIN(RADIANS(?)) * SIN(RADIANS(latitude))
  ))
`;

module.exports = { haversineDistanceKm, HAVERSINE_SQL };
