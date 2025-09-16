import 'dotenv/config';
import {
  DynamoDBClient,
  CreateTableCommand,
  DeleteTableCommand,
} from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  ScanCommand,
  PutCommand,
} from '@aws-sdk/lib-dynamodb';
import { randomBytes } from 'crypto';

const TABLE_NAME = 'AuthDetails';
const USERS_TABLE = 'Users';

const lowLevelClient = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  endpoint: process.env.DYNAMO_ENDPOINT || undefined,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'fake',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'fake',
  },
});

console.log("DYNAMO CONNXN", lowLevelClient)

const client = DynamoDBDocumentClient.from(lowLevelClient, {
  marshallOptions: {
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  },
  unmarshallOptions: {
    wrapNumbers: false,
  },
});

type UserItem = {
  id: string;
};

const generateAuth = (userId: string) => {
  const now = new Date();
  return {
    id: `auth-${userId}`, // primary key
    userId,
    password: `hashed-${userId}`,
    old_passwords: [],
    refreshToken: randomBytes(64).toString('hex'),
    verify_account: false,
    verify_code: Math.floor(100000 + Math.random() * 900000).toString(),
    verify_code_expire: new Date(now.getTime() + 10 * 60 * 1000).toISOString(),
    reset_password_code: Math.floor(100000 + Math.random() * 900000).toString(),
    reset_password_code_expire: new Date(
      now.getTime() + 10 * 60 * 1000,
    ).toISOString(),
    social_id: '',
    social_provider: '',
  };
};

async function resetAuthTable() {
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
      AttributeDefinitions: [
        { AttributeName: 'id', AttributeType: 'S' },
        { AttributeName: 'userId', AttributeType: 'S' },
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'userId-index',
          KeySchema: [{ AttributeName: 'userId', KeyType: 'HASH' }],
          Projection: { ProjectionType: 'ALL' },
        },
      ],
      BillingMode: 'PAY_PER_REQUEST',
    }),
  );

  console.log('✅ AuthDetails table reset complete.');
}

async function seedAuthFromUsers() {
  const usersResponse = await client.send(
    new ScanCommand({
      TableName: USERS_TABLE,
      ProjectionExpression: 'id',
    }),
  );

  const users = (usersResponse.Items || []) as UserItem[];

  if (users.length === 0) {
    console.warn('No users found to seed auth data.');
    return;
  }

  for (const user of users) {
    const item = generateAuth(user.id);

    try {
      await client.send(
        new PutCommand({
          TableName: TABLE_NAME,
          Item: item,
        }),
      );
      console.log(`✅ Seeded auth for userId: ${user.id}`);
    } catch (err) {
      console.error(`❌ Failed to insert auth for ${user.id}`, err);
    }
  }

  console.log('🎉 Auth seeding complete!');
}

async function main() {
  await resetAuthTable();
  await seedAuthFromUsers();
  console.log('✅ Users table created and seeded');
}

main().catch((err) => {
  console.error('❌ Failed to seed table:', err);
  process.exit(1);
});
