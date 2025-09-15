import { z } from 'zod';
import { UpdateUserSchema } from '../user.schema';

export type UpdateUserDto = z.infer<typeof UpdateUserSchema>;
