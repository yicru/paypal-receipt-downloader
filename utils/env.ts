import dotenv from "dotenv";
import z from "zod";

dotenv.config();

const envSchema = z.object({
  PAYPAL_AUTH_EMAIL: z.string(),
  PAYPAL_AUTH_PASSWORD: z.string(),
  FILTER_START_DATE: z.string(),
  FILTER_END_DATE: z.string(),
});

export const env = envSchema.parse(process.env);
