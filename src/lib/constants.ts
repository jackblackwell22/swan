export const GARAGE_UNITS = [7, 8, 9, 10, 11, 12] as const;
export type GarageUnit = (typeof GARAGE_UNITS)[number];

export const LANDLORDS = [
  { id: "jack", name: "Jack Blackwell", code: "J" },
  { id: "david", name: "David Blackwell", code: "D" },
] as const;

export type LandlordId = (typeof LANDLORDS)[number]["id"];

export const SITE_NAME = "Swan Street Lock-Ups";
export const SITE_PLACE = "Royal Leamington Spa";
export const SITE_STREET = "Swan Street";
export const SITE_POSTCODE_AREA = "CV32";

/** OpenStreetMap pin for Swan Street itself (not a unit). */
export const OSM = {
  lat: 52.2927812,
  lon: -1.5309665,
  minLon: -1.5335,
  minLat: 52.2913,
  maxLon: -1.5285,
  maxLat: 52.2943,
} as const;

export const MONTH_CODES = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
] as const;

export const COOKIE_NAME = "swan_desk";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 14;
