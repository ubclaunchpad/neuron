import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { user } from "../src/server/db/schema/user";
import { eq } from "drizzle-orm";

async function makeAdmin() {
  const email = process.argv[2];
  
  if (!email) {
    console.error("Usage: npx tsx scripts/make-admin.ts <email>");
    process.exit(1);
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL not found in environment variables");
    process.exit(1);
  }

  const client = postgres(connectionString);
  const db = drizzle(client);

  try {
    const result = await db
      .update(user)
      .set({
        role: "admin",
        status: "active",
        emailVerified: true,
      })
      .where(eq(user.email, email))
      .returning();

    if (result.length === 0) {
      console.error(`❌ User with email ${email} not found`);
      await client.end();
      process.exit(1);
    }

    console.log(`✅ User ${email} is now an admin!`);
    await client.end();
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    await client.end();
    process.exit(1);
  }
}

makeAdmin();
