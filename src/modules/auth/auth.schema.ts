// src/modules/auth/auth.schema.ts
import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
});

export const RegisterSchema = z.object({
  userId: z.string(),
  password: z.string().min(6),
});
