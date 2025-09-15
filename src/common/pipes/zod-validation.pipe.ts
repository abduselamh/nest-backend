// src/common/pipes/zod-validation.pipe.ts
import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { ZodType, z } from 'zod';

@Injectable()
export class ZodValidationPipe<T = any> implements PipeTransform<any, T> {
  constructor(private schema: ZodType<T>) {}

  transform(value: unknown, metadata: ArgumentMetadata): T {
    const result = this.schema.safeParse(value);

    if (!result.success) {
      const errorTree = z.treeifyError(result.error);

      throw new BadRequestException({
        message: 'Validation failed',
        type: metadata.type,
        errors: errorTree,
      });
    }

    return result.data;
  }
}
