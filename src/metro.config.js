/**
 * Metro configuration for Expo/React Native
 * Use @expo/metro-config's getDefaultConfig so asset registry paths
 * and Expo-specific defaults are configured correctly.
 */
const { getDefaultConfig } = require('@expo/metro-config');

// Get the default Expo Metro config and ensure the transformer has a
// valid assetRegistryPath. When this option is missing Metro injects
// an import to "missing-asset-registry-path" into binary assets which
// causes the error you're seeing.
const defaultConfig = getDefaultConfig(__dirname);

defaultConfig.transformer = defaultConfig.transformer || {};
try {
	// Use the React Native AssetRegistry implementation so image requires
	// are rewritten to the proper registry path at bundle-time.
	defaultConfig.transformer.assetRegistryPath = require.resolve('react-native/Libraries/Image/AssetRegistry');
} catch (e) {
	// Fallback (best-effort) — if require.resolve fails keep the default
	// config and Metro will log a clearer error.
	// eslint-disable-next-line no-console
	console.warn('Could not resolve react-native AssetRegistry for transformer.assetRegistryPath:', e.message);
}

module.exports = defaultConfig;
