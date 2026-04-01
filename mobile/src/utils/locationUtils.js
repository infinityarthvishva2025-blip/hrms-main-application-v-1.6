/**
 * locationUtils.js
 * ─────────────────────────────────────────────────────────
 * Reusable geo‑location utilities with caching, permission
 * handling, mock detection, accuracy thresholds.
 * ─────────────────────────────────────────────────────────
 */
import * as Location from 'expo-location';
import { Alert, Linking, Platform } from 'react-native';

let lastLocation = null;
let lastLocationTimestamp = 0;
const LOCATION_CACHE_MAX_AGE = 60 * 1000; // 1 minute
const ACCURACY_THRESHOLD_METERS = 100;

// ──────────────────────────────────────────────────────────
// Permission Handling
// ──────────────────────────────────────────────────────────
export const requestLocationPermission = async () => {
  const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();
  if (status === 'granted') return true;
  if (!canAskAgain) {
    Alert.alert(
      'Location Blocked',
      'Please enable location in your device settings to use geo attendance.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open Settings',
          onPress: () => {
            if (Platform.OS === 'ios') Linking.openURL('app-settings:');
            else Linking.openSettings();
          },
        },
      ]
    );
  } else {
    Alert.alert('Permission Required', 'Location permission is needed for geo check‑in/out.');
  }
  return false;
};

// ──────────────────────────────────────────────────────────
// Mock Location Detection
// ──────────────────────────────────────────────────────────
const isMockLocation = (locationResult) => {
  if (Platform.OS === 'android') {
    return locationResult?.mocked === true;
  }
  return false;
};

// ──────────────────────────────────────────────────────────
// Location Fetching (with caching and accuracy checks)
// ──────────────────────────────────────────────────────────
export const getCurrentLocation = async (options = {}) => {
  const {
    useCache = true,
    maxAgeMs = LOCATION_CACHE_MAX_AGE,
    timeoutMs = 10000,
    accuracyThreshold = null, // if provided, cached location must have accuracy ≤ threshold
  } = options;

  // Check cache first if allowed
  if (useCache && lastLocation && Date.now() - lastLocationTimestamp < maxAgeMs) {
    if (accuracyThreshold === null || lastLocation.accuracy <= accuracyThreshold) {
      return lastLocation;
    }
  }

  const granted = await requestLocationPermission();
  if (!granted) return null;

  const enabled = await Location.hasServicesEnabledAsync();
  if (!enabled) {
    Alert.alert('GPS Disabled', 'Please enable GPS to use geo attendance.');
    return null;
  }

  try {
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
      timeout: timeoutMs,
    }).catch(async (err) => {
      console.warn('getCurrentPositionAsync failed, trying last known', err);
      return await Location.getLastKnownPositionAsync({ maxAge: 60000 });
    });

    if (!location) throw new Error('Location could not be determined');

    const result = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy,
      mocked: location.mocked || false,
    };

    lastLocation = result;
    lastLocationTimestamp = Date.now();

    return result;
  } catch (error) {
    console.error('Location fetch error:', error);
    if (lastLocation) {
      Alert.alert('Using approximate location', 'Could not get precise GPS. Using last known location.');
      return lastLocation;
    }
    Alert.alert('Location Error', 'Unable to determine your location.');
    return null;
  }
};

// ──────────────────────────────────────────────────────────
// Strict Location for Attendance (Mock + Accuracy checks)
// ──────────────────────────────────────────────────────────
export const getLocationForAttendance = async () => {
  // First try cached location within last 5 seconds that meets accuracy
  const location = await getCurrentLocation({
    useCache: true,
    maxAgeMs: 5000, // 5 seconds
    accuracyThreshold: ACCURACY_THRESHOLD_METERS,
    timeoutMs: 5000, // shorter timeout for fresh fetch if needed
  });

  if (!location) return null;

  if (location.mocked) {
    Alert.alert(
      '⚠️ Mock Location Detected',
      'Your device appears to be using a fake/mock location. Geo attendance cannot be recorded with spoofed GPS data. Please disable any mock location apps and try again.'
    );
    return null;
  }

  if (location.accuracy > ACCURACY_THRESHOLD_METERS) {
    Alert.alert(
      'Low GPS Accuracy',
      `Your current GPS accuracy is ±${Math.round(location.accuracy)}m, which is too low for attendance recording (requires ±${ACCURACY_THRESHOLD_METERS}m or better).\n\nTry moving to an open area or wait for better GPS signal.`
    );
    return null;
  }

  return location;
};

export const clearLocationCache = () => {
  lastLocation = null;
  lastLocationTimestamp = 0;
};

export const formatCoordinates = (latitude, longitude) => {
  if (latitude == null || longitude == null) return 'Fetching...';
  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
};

export const getAccuracyLabel = (accuracyMeters) => {
  if (accuracyMeters == null) return 'Unknown';
  const rounded = Math.round(accuracyMeters);
  if (rounded <= 10) return `High (±${rounded}m)`;
  if (rounded <= 30) return `Medium (±${rounded}m)`;
  return `Low (±${rounded}m)`;
};