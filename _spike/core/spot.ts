import { z } from "zod";
import { CoordinatesSchema } from "./geo";

export const FOOD_AMENITIES = [
  "restaurant",
  "fast_food",
  "cafe",
  "bar",
  "pub",
  "food_court",
  "ice_cream",
] as const;

export const AmenitySchema = z.enum(FOOD_AMENITIES);
export type Amenity = z.infer<typeof AmenitySchema>;

export const SpotSchema = z.object({
  id: z.string(),
  name: z.string(),
  amenity: AmenitySchema,
  coordinates: CoordinatesSchema,
  openingHours: z.string().optional(),
  cuisine: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
});
export type Spot = z.infer<typeof SpotSchema>;
