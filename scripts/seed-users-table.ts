// scripts/seed-users-table.ts
import 'dotenv/config';
import {
  DynamoDBClient,
  CreateTableCommand,
  DeleteTableCommand,
} from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuid } from 'uuid';
import { faker } from '@faker-js/faker';
import { User } from '@/modules/user/user.model';

const REGION = process.env.AWS_REGION || 'us-east-1';
const ENDPOINT = process.env.DYNAMO_ENDPOINT;
const TABLE_NAME = process.env.USERS_TABLE_NAME || 'Users';

const client = new DynamoDBClient({
  region: REGION,
  endpoint: ENDPOINT,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'fake',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'fake',
  },
});

const docClient = DynamoDBDocumentClient.from(client);

async function resetTable() {
  try {
    console.log(`Deleting table: ${TABLE_NAME}...`);
    await client.send(new DeleteTableCommand({ TableName: TABLE_NAME }));
  } catch (err) {
    if (err instanceof Error) {
      console.warn(`Could not delete (maybe doesn't exist): ${err.message}`);
    } else {
      console.warn('Unknown error during table deletion:', err);
    }
  }

  console.log(`Creating table: ${TABLE_NAME}...`);
  await client.send(
    new CreateTableCommand({
      TableName: TABLE_NAME,
      KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'username-index',
          KeySchema: [{ AttributeName: 'userName', KeyType: 'HASH' }],
          Projection: { ProjectionType: 'ALL' },
        },
        {
          IndexName: 'email-index',
          KeySchema: [{ AttributeName: 'email', KeyType: 'HASH' }],
          Projection: { ProjectionType: 'ALL' },
        },
        {
          IndexName: 'phone-index',
          KeySchema: [{ AttributeName: 'phone', KeyType: 'HASH' }],
          Projection: { ProjectionType: 'ALL' },
        },
      ],
      AttributeDefinitions: [
        { AttributeName: 'id', AttributeType: 'S' },
        { AttributeName: 'userName', AttributeType: 'S' },
        { AttributeName: 'email', AttributeType: 'S' },
        { AttributeName: 'phone', AttributeType: 'S' },
      ],
      BillingMode: 'PAY_PER_REQUEST',
    }),
  );
}

function generateFakeUser(max: number = 10) {
  const birthDate = faker.date.birthdate({ min: 18, max: 60, mode: 'age' });
  const users: User[] = [];
  for (let i = 0; i < max; i++) {
    users.push({
      id: uuid(),
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      nickName: faker.internet.username(),
      userName: faker.internet.username().toLowerCase(),
      bio: faker.lorem.sentence(),
      birthDate: birthDate.toISOString(),
      photo: faker.image.avatar(),
      email: faker.internet.email(),
      phone: faker.phone.number({ style: 'international' }),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  return users;
}

async function seedUsers() {
  const users = generateFakeUser();

  for (const user of users) {
    await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: user }));
    console.log(`Seeded user: ${user.userName}`);
  }
}

async function main() {
  await resetTable();
  await seedUsers();
  console.log('✅ Users table created and seeded');
}

main().catch((err) => {
  console.error('❌ Failed to seed table:', err);
  process.exit(1);
});
