import { z } from 'zod';

export const CreateUserSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  nickName: z.string(),
  userName: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, {
      message: 'Username must be alphanumeric with optional underscores',
    }),
  bio: z.string(),
  birthDate: z.coerce.date(),
  photo: z.string(),
  email: z.email(),
  phone: z.string(),
});

export const UpdateUserSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  nickName: z.string(),
  bio: z.string(),
  photo: z.string(),
  email: z.email(),
  phone: z.string(),
});

export const GetUserByIdSchema = z.object({
  id: z.uuid({ message: 'Invalid UUID format for id' }),
});

export const GetUserByEmailSchema = z.object({
  email: z.email({ message: 'Invalid email address' }),
});
export const GetUserByPhoneSchema = z.object({
  phone: z
    .string()
    .min(9)
    .max(15)
    .regex(/^\+?[0-9]+$/, {
      message: 'Phone must be numeric with optional leading +',
    }),
});

export const GetUserByUsernameSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, {
      message: 'Username must be alphanumeric with optional underscores',
    }),
});
