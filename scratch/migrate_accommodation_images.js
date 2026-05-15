const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

// Use direct connection (port 5432) instead of pgbouncer (6543)
const connectionString = process.env.DATABASE_URL
  .replace(':6543/', ':5432/')
  .replace('?pgbouncer=true', '');

async function migrate() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log('Connected to database');

  try {
    // Create accommodation_images table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.accommodation_images (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        accommodation_id UUID NOT NULL REFERENCES public.accommodation(accommodation_id) ON DELETE CASCADE,
        url TEXT NOT NULL,
        storage_path TEXT NOT NULL,
        is_primary BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    console.log('✓ accommodation_images table created (or already exists)');

    // Index for fast lookups by accommodation
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_accommodation_images_accommodation_id
      ON public.accommodation_images (accommodation_id);
    `);
    console.log('✓ Index created');

    // Enable RLS
    await client.query(`ALTER TABLE public.accommodation_images ENABLE ROW LEVEL SECURITY;`);
    console.log('✓ RLS enabled');

    // Policy: allow service role full access (API routes use service role key)
    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies
          WHERE tablename = 'accommodation_images' AND policyname = 'service_role_all'
        ) THEN
          CREATE POLICY service_role_all ON public.accommodation_images
            FOR ALL TO service_role USING (true) WITH CHECK (true);
        END IF;
      END $$;
    `);
    console.log('✓ Service role policy set');

    // Policy: authenticated users can read
    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies
          WHERE tablename = 'accommodation_images' AND policyname = 'authenticated_read'
        ) THEN
          CREATE POLICY authenticated_read ON public.accommodation_images
            FOR SELECT TO authenticated USING (true);
        END IF;
      END $$;
    `);
    console.log('✓ Authenticated read policy set');

    console.log('\n✓ Migration complete!');
  } finally {
    await client.end();
  }
}

migrate().catch(err => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
