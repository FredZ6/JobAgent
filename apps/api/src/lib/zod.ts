import { BadRequestException } from "@nestjs/common";
import { ZodSchema } from "zod";

export function parseOrThrow<T>(schema: ZodSchema<T>, input: unknown): T {
  const result = schema.safeParse(input);

  if (!result.success) {
    throw new BadRequestException({
      message: "Validation failed",
      issues: result.error.flatten()
    });
  }

  return result.data;
}
