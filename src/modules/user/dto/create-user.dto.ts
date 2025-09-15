import { z } from 'zod';
import { CreateUserSchema } from '../user.schema';

export type CreateUserDto = z.infer<typeof CreateUserSchema>;
