// Type declarations for Google Maps API loaded via script tag
declare global {
  interface Window {
    google: typeof google;
  }
}

// Declare google namespace for Places API types
declare namespace google.maps {
  class LatLng {
    constructor(lat: number, lng: number);
    lat(): number;
    lng(): number;
  }

  namespace places {
    interface PlaceResult {
      formatted_address?: string;
      url?: string;
      geometry?: {
        location: LatLng;
      };
      name?: string;
    }

    interface AutocompleteOptions {
      componentRestrictions?: {
        country: string | string[];
      };
      fields?: string[];
      types?: string[];
    }

    class Autocomplete {
      constructor(
        inputField: HTMLInputElement,
        opts?: AutocompleteOptions
      );
      addListener(
        eventName: string,
        handler: () => void
      ): google.maps.MapsEventListener;
      getPlace(): PlaceResult;
    }
  }

  interface MapsEventListener {
    remove(): void;
  }

  namespace event {
    function removeListener(listener: MapsEventListener): void;
  }
}

export {};
