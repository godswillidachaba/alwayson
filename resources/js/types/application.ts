export type GeoLocation = {
    lat: number;
    lng: number;
};

export type Address = {
    formattedAddress: string;
    street: string;
    city: string;
    state: string;
    country: string;
};

export type LocationData = GeoLocation & Address;

export type BillingAddress = {
    street: string;
    city: string;
    state: string;
    country: string;
};

export type LocationSuggestion = {
    displayName: string;
    lat: number;
    lng: number;
};
