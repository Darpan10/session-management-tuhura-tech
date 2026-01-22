import { useEffect, useRef, useState } from 'react';
import { loadGoogleMapsAPI } from '../utils/googleMapsLoader';

export const useGooglePlacesAutocomplete = (
  inputRef: React.RefObject<HTMLInputElement>,
  onPlaceSelected: (place: google.maps.places.PlaceResult) => void
) => {
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    console.log('useGooglePlacesAutocomplete: Starting to load Google Maps API...');
    // Load Google Maps API first
    loadGoogleMapsAPI()
      .then(() => {
        console.log('useGooglePlacesAutocomplete: Google Maps API loaded successfully');
        setIsLoaded(true);
      })
      .catch((error) => {
        console.error('useGooglePlacesAutocomplete: Failed to load Google Maps:', error);
        setError(error);
        // Don't throw - just disable autocomplete functionality
      });
  }, []);

  useEffect(() => {
    if (!inputRef.current) {
      console.log('useGooglePlacesAutocomplete: No input ref');
      return;
    }
    if (!isLoaded) {
      console.log('useGooglePlacesAutocomplete: API not loaded yet');
      return;
    }
    if (!window.google) {
      console.log('useGooglePlacesAutocomplete: window.google not available');
      return;
    }
    if (error) {
      console.log('useGooglePlacesAutocomplete: Error present, skipping initialization');
      return;
    }

    try {
      console.log('useGooglePlacesAutocomplete: Initializing autocomplete...');
      // Initialize autocomplete with NZ restriction
      autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
        componentRestrictions: { country: 'nz' },
        fields: ['formatted_address', 'name', 'geometry', 'url'],
        types: ['establishment', 'geocode'],
      });

      console.log('useGooglePlacesAutocomplete: Autocomplete initialized, adding listener...');
      
      // Listen for place selection
      const listener = autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current?.getPlace();
        console.log('useGooglePlacesAutocomplete: Place selected:', place);
        if (place) {
          onPlaceSelected(place);
        }
      });

      console.log('useGooglePlacesAutocomplete: Setup complete!');

      return () => {
        if (listener) {
          google.maps.event.removeListener(listener);
        }
      };
    } catch (err) {
      console.error('useGooglePlacesAutocomplete: Failed to initialize:', err);
    }
  }, [inputRef, onPlaceSelected, isLoaded, error]);

  return autocompleteRef;
};
