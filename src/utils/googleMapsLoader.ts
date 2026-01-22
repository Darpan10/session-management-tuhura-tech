// Load Google Maps API dynamically
// API key is loaded from environment variable
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// Validate that API key is present
if (!GOOGLE_MAPS_API_KEY) {
  console.error('Google Maps API key is missing. Please add VITE_GOOGLE_MAPS_API_KEY to your .env file');
}

export const loadGoogleMapsAPI = async (): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    // Check if already loaded
    if (window.google && window.google.maps) {
      console.log('Google Maps already loaded');
      resolve();
      return;
    }

    // Check if script is already being loaded
    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
      console.log('Google Maps script already loading, waiting...');
      // Wait for it to load
      const checkLoaded = setInterval(() => {
        if (window.google && window.google.maps) {
          clearInterval(checkLoaded);
          console.log('Google Maps loaded from existing script');
          resolve();
        }
      }, 100);
      return;
    }

    try {
      console.log('Loading Google Maps script...');
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&region=NZ&loading=async`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        console.log('Google Maps script loaded, waiting for API...');
        // Wait for google.maps to be fully available
        const checkGoogleMaps = setInterval(() => {
          if (window.google && window.google.maps) {
            clearInterval(checkGoogleMaps);
            console.log('Google Maps API ready!');
            resolve();
          }
        }, 50);
      };
      
      script.onerror = () => {
        console.error('Failed to load Google Maps script');
        reject(new Error('Failed to load Google Maps API'));
      };

      document.head.appendChild(script);
    } catch (error) {
      console.error('Error in loadGoogleMapsAPI:', error);
      reject(error);
    }
  });
};
