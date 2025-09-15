// src/modules/user/user.service.ts
import { Injectable } from '@nestjs/common';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  PutCommand,
  QueryCommand,
  DynamoDBDocumentClient,
  ScanCommand,
  UpdateCommand,
  GetCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';
import { v4 as uuid } from 'uuid';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './user.model';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  private readonly client: DynamoDBDocumentClient;
  private readonly tableName = 'Users'; // ✅ replace with your real table name

  constructor() {
    const dynamoClient = new DynamoDBClient({
      region: process.env.AWS_REGION || 'us-east-1',
      endpoint: process.env.DYNAMO_ENDPOINT || undefined, // ✅ for LocalStack
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'fake',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'fake',
      },
    });
    this.client = DynamoDBDocumentClient.from(dynamoClient);
  }

  async createUser(data: CreateUserDto) {
    const user: User = {
      id: uuid(), // generate unique ID
      firstName: data.firstName,
      lastName: data.lastName,
      nickName: data.nickName,
      userName: data.userName,
      bio: data.bio,
      birthDate: data.birthDate.toISOString(),
      photo: data.photo,
      email: data.email,
      phone: data.phone,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await this.client.send(
      new PutCommand({
        TableName: this.tableName,
        Item: user,
      }),
    );

    return user;
  }

  async getUsers(): Promise<User[]> {
    const result = await this.client.send(
      new ScanCommand({
        TableName: this.tableName,
      }),
    );

    return (result.Items || []) as User[];
  }

  async getUserById(id: string): Promise<User | null> {
    const result = await this.client.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { id },
      }),
    );
    console.log(id);
    console.log(result);
    return (result.Item as User) || null;
  }

  async getUserByUsername(username: string): Promise<User | null> {
    const result = await this.client.send(
      new QueryCommand({
        TableName: this.tableName,
        IndexName: 'username-index',
        KeyConditionExpression: 'userName = :username',
        ExpressionAttributeValues: {
          ':username': username,
        },
        Limit: 1,
      }),
    );
    console.log(username);
    console.log(result);
    return (result.Items?.[0] as User) || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const result = await this.client.send(
      new QueryCommand({
        TableName: this.tableName,
        IndexName: 'email-index',
        KeyConditionExpression: 'email = :email',
        ExpressionAttributeValues: {
          ':email': email,
        },
        Limit: 1,
      }),
    );

    return (result.Items?.[0] as User) || null;
  }

  async getUserByPhone(phone: string): Promise<User | null> {
    const result = await this.client.send(
      new QueryCommand({
        TableName: this.tableName,
        IndexName: 'phone-index',
        KeyConditionExpression: 'phone = :phone',
        ExpressionAttributeValues: {
          ':phone': phone,
        },
        Limit: 1,
      }),
    );

    return (result.Items?.[0] as User) || null;
  }

  async updateUser(id: string, updates: UpdateUserDto): Promise<User> {
    const updateExpression: string[] = [];
    const expressionAttrNames = {};
    const expressionAttrValues = {};

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        updateExpression.push(`#${key} = :${key}`);
        expressionAttrNames[`#${key}`] = key;
        expressionAttrValues[`:${key}`] = value;
      }
    }

    if (updateExpression.length === 0) {
      throw new Error('No valid fields provided for update');
    }

    const result = await this.client.send(
      new UpdateCommand({
        TableName: this.tableName,
        Key: { id },
        UpdateExpression: 'SET ' + updateExpression.join(', '),
        ExpressionAttributeNames: expressionAttrNames,
        ExpressionAttributeValues: expressionAttrValues,
        ReturnValues: 'ALL_NEW',
      }),
    );

    return result.Attributes as User;
  }

  async deleteUser(id: string): Promise<{ deleted: boolean }> {
    try {
      await this.client.send(
        new DeleteCommand({
          TableName: this.tableName,
          Key: { id },
        }),
      );

      return { deleted: true };
    } catch (err) {
      console.error('Delete failed:', err);
      throw new Error('Could not delete user');
    }
  }
}
