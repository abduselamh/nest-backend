import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { hash } from 'bcrypt';
import {
  JWT_ACCESS_SECRET,
  JWT_ACCESS_EXPIRES_IN,
  JWT_REFRESH_SECRET,
  JWT_REFRESH_EXPIRES_IN,
} from './security.constants';

@Injectable()
export class JwtService {
  signAccessToken(payload: Record<string, any>): string {
    return jwt.sign(payload, JWT_ACCESS_SECRET, {
      expiresIn: JWT_ACCESS_EXPIRES_IN,
    });
  }

  signRefreshToken(payload: Record<string, any>): string {
    return jwt.sign(payload, JWT_REFRESH_SECRET, {
      expiresIn: JWT_REFRESH_EXPIRES_IN,
    });
  }

  verifyAccessToken<T = any>(token: string): T {
    return jwt.verify(token, JWT_ACCESS_SECRET) as T;
  }

  verifyRefreshToken<T = any>(token: string): T {
    return jwt.verify(token, JWT_REFRESH_SECRET) as T;
  }

  async prepareHash(
    data: string,
    salt_rounds: number = parseInt(process.env.SALT_ROUNDS || '10'),
  ): Promise<string> {
    const passwordHash = await hash(data, salt_rounds);
    return passwordHash;
  }
}
