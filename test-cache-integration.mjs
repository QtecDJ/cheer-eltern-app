/**
 * Test Script für Content-Cache Integration
 * Prüft ob alle Komponenten korrekt funktionieren
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

console.log('🧪 Testing Content Cache Integration...\n');

const tests = [
  {
    name: 'Events Content',
    file: 'src/app/events/events-content.tsx',
    checks: [
      { pattern: /import.*useVersionedContent/i, desc: 'useVersionedContent imported' },
      { pattern: /EventDescription/i, desc: 'EventDescription component exists' },
      { pattern: /const \{ content \}/i, desc: 'Uses correct "content" property' },
    ]
  },
  {
    name: 'Training Content',
    file: 'src/app/training/training-content.tsx',
    checks: [
      { pattern: /import.*useVersionedContent/i, desc: 'useVersionedContent imported' },
      { pattern: /TrainingDescription/i, desc: 'TrainingDescription component exists' },
      { pattern: /const \{ content \}/i, desc: 'Uses correct "content" property' },
    ]
  },
  {
    name: 'Home Content',
    file: 'src/app/home-content.tsx',
    checks: [
      { pattern: /import.*useVersionedContent/i, desc: 'useVersionedContent imported' },
      { pattern: /AnnouncementContent/i, desc: 'AnnouncementContent component exists' },
      { pattern: /const \{ content: cachedContent \}/i, desc: 'Uses correct "content" property with alias' },
    ]
  },
  {
    name: 'Layout',
    file: 'src/app/layout.tsx',
    checks: [
      { pattern: /import.*ContentCacheInit/i, desc: 'ContentCacheInit imported' },
      { pattern: /<ContentCacheInit \/>/i, desc: 'ContentCacheInit rendered in body' },
    ]
  },
  {
    name: 'Login Actions',
    file: 'src/app/login/actions.ts',
    checks: [
      { pattern: /import.*clearContentCache/i, desc: 'clearContentCache imported' },
      { pattern: /clearContentCache\(\)/i, desc: 'clearContentCache called in logout' },
    ]
  },
  {
    name: 'Content Cache Init Component',
    file: 'src/components/content-cache-init.tsx',
    checks: [
      { pattern: /useContentCacheManager/i, desc: 'useContentCacheManager imported' },
      { pattern: /return null/i, desc: 'No UI rendered (background only)' },
    ]
  }
];

let passed = 0;
let failed = 0;

tests.forEach(test => {
  console.log(`📄 ${test.name}`);
  try {
    const filePath = join(__dirname, test.file);
    const content = readFileSync(filePath, 'utf-8');
    
    test.checks.forEach(check => {
      if (check.pattern.test(content)) {
        console.log(`  ✅ ${check.desc}`);
        passed++;
      } else {
        console.log(`  ❌ ${check.desc}`);
        failed++;
      }
    });
  } catch (err) {
    console.log(`  ❌ File not found: ${test.file}`);
    failed += test.checks.length;
  }
  console.log('');
});

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`📊 Results: ${passed} passed, ${failed} failed`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

if (failed === 0) {
  console.log('✅ All integration tests passed!');
  process.exit(0);
} else {
  console.log('❌ Some tests failed!');
  process.exit(1);
}
