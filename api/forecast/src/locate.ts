import { readFileSync } from "node:fs";
import { Reader } from "mmdb-lib";
import type { CityResponse } from "mmdb-lib";

/** An approximate city: what the forecast needs and nothing more. */
export type Place = {
  city: string;
  country: string;
  latitude: number;
  longitude: number;
};

/** Finds the approximate city for a public address. */
export type Locator = (address: string) => Place | null;

const round = (value: number) => Math.round(value * 100) / 100;

/**
 * Reads one DB-IP city record into a place, rounding the city-centre coordinates to two
 * decimals. Records without a city, country or finite coordinates give null.
 *
 * @param record - A raw database record; its shape is checked, not trusted.
 * @returns The place, or null.
 */
export function toPlace(record: unknown): Place | null {
  if (!record || typeof record !== "object") return null;
  const { city, country, location } = record as Partial<CityResponse>;
  const name = city?.names.en;
  const code = country?.iso_code;
  const latitude = location?.latitude;
  const longitude = location?.longitude;
  if (
    typeof name !== "string" ||
    !name.trim() ||
    typeof code !== "string" ||
    !/^[A-Z]{2}$/.test(code) ||
    typeof latitude !== "number" ||
    typeof longitude !== "number" ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    Math.abs(latitude) > 90 ||
    Math.abs(longitude) > 180
  )
    return null;
  return {
    city: name.trim().slice(0, 80),
    country: code,
    latitude: round(latitude),
    longitude: round(longitude),
  };
}

/**
 * Opens the local DB-IP Lite city database. Lookups never leave the process.
 *
 * @param path - The .mmdb file.
 * @returns A locator, or null when the database is missing or unreadable.
 */
export function openLocator(path: string): Locator | null {
  let reader: Reader<CityResponse>;
  try {
    reader = new Reader<CityResponse>(readFileSync(path));
  } catch {
    return null;
  }
  return (address) => {
    try {
      return toPlace(reader.get(address));
    } catch {
      return null;
    }
  };
}
