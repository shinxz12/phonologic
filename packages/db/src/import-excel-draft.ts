import { createDbClient } from './index';
import { learningContentDrafts } from './schema/learning';
import { INITIAL_SOURCE_RULES } from './initial-draft-rules';
import { eq } from 'drizzle-orm';
import type { ContentBundle } from '@phonologic/shared-types';

export async function importExcelDraft(databaseUrl?: string): Promise<void> {
  const url =
    databaseUrl ||
    process.env.DATABASE_URL ||
    'postgres://postgres:postgres@localhost:5432/phonologic';

  const db = createDbClient(url);

  console.log('📦 Bắt đầu nhập 155 dòng quy tắc nguồn vào bản nháp ContentBundle...');

  const existing = await db
    .select({ id: learningContentDrafts.id, bundle: learningContentDrafts.bundle })
    .from(learningContentDrafts)
    .where(eq(learningContentDrafts.id, 'current'))
    .limit(1);

  if (existing.length === 0) {
    const draftBundle: ContentBundle = {
      notationVersion: '0.1.0-draft',
      notationConfirmed: false,
      rules: INITIAL_SOURCE_RULES,
      lessons: [],
      readings: [],
    };

    await db.insert(learningContentDrafts).values({
      id: 'current',
      notationVersion: '0.1.0-draft',
      notationConfirmed: false,
      bundle: draftBundle,
      updatedAt: new Date(),
    });
    console.log(`✅ Đã tạo bản nháp với ${INITIAL_SOURCE_RULES.length} quy tắc nguồn từ Excel.`);
  } else {
    const currentBundle = existing[0].bundle as ContentBundle;
    // If rules are empty or missing, preserve existing lessons/readings while populating rules
    const mergedBundle: ContentBundle = {
      ...currentBundle,
      rules: currentBundle.rules && currentBundle.rules.length > 0
        ? currentBundle.rules
        : INITIAL_SOURCE_RULES,
    };
    await db
      .update(learningContentDrafts)
      .set({
        bundle: mergedBundle,
        updatedAt: new Date(),
      })
      .where(eq(learningContentDrafts.id, 'current'));
    console.log(`ℹ️ Bản nháp đã tồn tại, đã đảm bảo ${mergedBundle.rules.length} quy tắc nguồn.`);
  }
}

if (typeof process !== 'undefined' && process.argv[1]?.endsWith('import-excel-draft.ts')) {
  importExcelDraft()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Lỗi khi nhập bản nháp:', err);
      process.exit(1);
    });
}
