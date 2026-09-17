import { createClient } from '@libsql/client';

const client = createClient({
  url: 'libsql://orbitsaasportfolio-adnanshahria19.aws-ap-south-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzEwMDQ0OTMsImlkIjoiNzUyNzNlYWQtNDkzMy00MWZjLWIyOWYtNDA0OWFiYzZjOGY1IiwicmlkIjoiNTRkNTc2MDAtZmUzMy00NGZlLWJkN2EtNzg0YWUxMmQwMDExIn0.UEhVL3SNwBfugL8UOVJRpRiSOyFcLFWSvAWIrBgQJ0clajL0jF-BhQa7zMCjEPETC2TY7ItkCGfbkklMMQw1Cg',
});

function toCleanString(val: unknown): string | null {
  if (!val) return null;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    return trimmed || null;
  }
  if (typeof val === 'object' && val !== null) {
    const obj = val as Record<string, unknown>;
    return (
      toCleanString(obj.fallback) ||
      toCleanString(obj.primary) ||
      toCleanString(obj.url) ||
      toCleanString(obj.src) ||
      null
    );
  }
  return null;
}

function normalizeImages(data: any): { normalized: any; fixedCount: number } {
  let fixedCount = 0;

  function traverse(item: any): any {
    if (!item) return item;

    if (Array.isArray(item)) {
      return item.map(traverse);
    }

    if (typeof item === 'object' && item !== null) {
      // Check if it's an ImageUrl object
      if ('primary' in item) {
        let primaryStr = toCleanString(item.primary);
        let fallbackStr = toCleanString(item.fallback);

        // If fallback was an object, we fixed a nested fallback!
        if (item.fallback && typeof item.fallback !== 'string') {
          fixedCount++;
        }

        if (primaryStr) {
          if (fallbackStr && fallbackStr !== primaryStr) {
            return { primary: primaryStr, fallback: fallbackStr };
          }
          return { primary: primaryStr };
        }
      }

      const res: Record<string, any> = {};
      for (const [k, v] of Object.entries(item)) {
        res[k] = traverse(v);
      }
      return res;
    }

    return item;
  }

  const normalized = traverse(data);
  return { normalized, fixedCount };
}

async function run() {
  console.log('Connecting to Turso...');
  const rs = await client.execute('SELECT section, lang, data FROM site_content');
  console.log(`Found ${rs.rows.length} rows in site_content.`);

  let totalFixed = 0;
  const assembled: Record<string, Record<string, any>> = { en: {}, bn: {} };

  for (const row of rs.rows) {
    const section = row.section as string;
    const lang = row.lang as 'en' | 'bn';
    try {
      const rawData = JSON.parse(row.data as string);
      const { normalized, fixedCount } = normalizeImages(rawData);

      if (assembled[lang]) {
        assembled[lang][section] = normalized;
      }

      if (fixedCount > 0) {
        console.log(`Fixing ${section} (${lang}): ${fixedCount} nested fallbacks resolved.`);
        totalFixed += fixedCount;

        await client.execute({
          sql: 'UPDATE site_content SET data = ?, updated_at = datetime("now") WHERE section = ? AND lang = ?',
          args: [JSON.stringify(normalized), section, lang],
        });
      }
    } catch (err) {
      console.error(`Error processing ${section} (${lang}):`, err);
    }
  }

  // Rebuild content_cache for both languages
  console.log('\nUpdating content_cache for en and bn...');
  for (const lang of ['en', 'bn']) {
    if (Object.keys(assembled[lang] || {}).length > 0) {
      await client.execute({
        sql: `INSERT INTO content_cache (lang, data, updated_at)
              VALUES (?, ?, datetime('now'))
              ON CONFLICT(lang) DO UPDATE SET data = ?, updated_at = datetime('now')`,
        args: [lang, JSON.stringify(assembled[lang]), JSON.stringify(assembled[lang])],
      });
      console.log(`content_cache (${lang}) updated successfully.`);
    }
  }

  console.log(`\nAll done! Successfully flattened ${totalFixed} nested image fallbacks across all sections.`);
}

run().catch(console.error);
