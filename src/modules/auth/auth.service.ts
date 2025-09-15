// src/modules/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import {
  PutCommand,
  UpdateCommand,
  QueryCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { Auth } from './auth.model';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { UserService } from '../user/user.service';
import { JwtService } from '@/common/security/security.service';
import { User } from '../user/user.model';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  private readonly client: DynamoDBDocumentClient;
  private readonly tableName = 'Auth';

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {
    const dynamoClient = new DynamoDBClient({
      region: process.env.AWS_REGION || 'us-east-1',
      endpoint: process.env.DYNAMO_ENDPOINT || undefined,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'fake',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'fake',
      },
    });

    this.client = DynamoDBDocumentClient.from(dynamoClient);
  }

  async loginUser(
    email: string,
    password: string,
  ): Promise<{ accessToken: string; refreshToken: string } | null> {
    const user = await this.userService.getUserByEmail(email);
    const passwordHash = await this.jwtService.prepareHash(password);
    const result = await this.client.send(
      new QueryCommand({
        TableName: this.tableName,
        IndexName: 'userId-index',
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': user?.id,
        },
        Limit: 1,
      }),
    );

    if (!user) throw new Error('Account not found');
    if (result.Items?.[0]?.password !== passwordHash)
      throw new Error('Invalid credentials');

    const payload = {
      id: user.id,
    };
    const accessToken = this.jwtService.signAccessToken(payload);
    const refreshToken = this.jwtService.signRefreshToken(payload);

    // Store hashed refresh token securely in DB
    const hashed = await this.jwtService.prepareHash(refreshToken);
    await this.updateAuthDetailsByUserId(user.id, { refreshToken: hashed });

    return {
      accessToken,
      refreshToken,
    };
  }

  async getUserFromToken(token: string): Promise<User> {
    try {
      const payload: User = this.jwtService.verifyAccessToken(token);

      if (!payload?.id) {
        throw new UnauthorizedException('Invalid token payload');
      }

      const user = await this.userService.getUserById(payload.id);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      return user;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  async generateAndStoreRefreshToken(userId: string): Promise<string> {
    const refreshToken = randomBytes(64).toString('hex'); // 128-char secure token

    await this.updateAuthDetailsByUserId(userId, {
      refreshToken,
    });

    return refreshToken;
  }

  async generateAndStoreVerifyCode(userId: string): Promise<string> {
    const verifyCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
    const verifyCodeExpire = new Date(
      Date.now() + 10 * 60 * 1000,
    ).toISOString(); // expires in 10 minutes

    await this.updateAuthDetailsByUserId(userId, {
      verify_code: verifyCode,
      verify_code_expire: verifyCodeExpire,
    });

    return verifyCode;
  }

  async refreshAccessToken(
    refreshToken: string,
  ): Promise<{ accessToken: string }> {
    const authRecord = await this.getAuthDetailsByRefreshToken(refreshToken);

    if (!authRecord || authRecord.refreshToken !== refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Optional: rotate refresh token
    // const newRefreshToken = await this.generateAndStoreRefreshToken(authRecord.userId);

    const accessToken = this.jwtService.signAccessToken({
      userId: authRecord.userId,
    });

    return {
      accessToken,
      // refreshToken: newRefreshToken, // if rotating
    };
  }

  async createAuthDetails(data: Auth): Promise<Auth> {
    await this.client.send(
      new PutCommand({
        TableName: this.tableName,
        Item: data,
      }),
    );

    return data;
  }

  // ✅ READ (via userId, assume GSI exists if userId is not PK)
  async getAuthDetailsByUserId(userId: string): Promise<Auth | null> {
    const result = await this.client.send(
      new QueryCommand({
        TableName: this.tableName,
        IndexName: 'userId-index', // ✅ make sure this GSI exists
        KeyConditionExpression: 'userId = :uid',
        ExpressionAttributeValues: {
          ':uid': userId,
        },
        Limit: 1,
      }),
    );

    return (result.Items?.[0] as Auth) || null;
  }

  // ✅ UPDATE
  async updateAuthDetailsByUserId(
    userId: string,
    updates: Partial<Auth>,
  ): Promise<Auth> {
    const updateExpr: string[] = [];
    const exprAttrNames = {};
    const exprAttrValues = {};

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        updateExpr.push(`#${key} = :${key}`);
        exprAttrNames[`#${key}`] = key;
        exprAttrValues[`:${key}`] = value;
      }
    }

    const result = await this.client.send(
      new UpdateCommand({
        TableName: this.tableName,
        Key: { userId },
        UpdateExpression: 'SET ' + updateExpr.join(', '),
        ExpressionAttributeNames: exprAttrNames,
        ExpressionAttributeValues: exprAttrValues,
        ReturnValues: 'ALL_NEW',
      }),
    );

    return result.Attributes as Auth;
  }

  // ✅ DELETE
  async deleteAuthDetailsByUserId(userId: string): Promise<void> {
    await this.client.send(
      new DeleteCommand({
        TableName: this.tableName,
        Key: { userId },
      }),
    );
  }

  async getAuthDetailsByRefreshToken(
    refreshToken: string,
  ): Promise<Auth | null> {
    const result = await this.client.send(
      new QueryCommand({
        TableName: this.tableName,
        IndexName: 'refreshToken-index', // must exist in DynamoDB
        KeyConditionExpression: 'refreshToken = :token',
        ExpressionAttributeValues: {
          ':token': { S: refreshToken },
        },
        Limit: 1,
      }),
    );

    return (result.Items?.[0] as Auth) || null;
  }
}
