/**
 * Server-Side Error Check
 * Prüft ob die Seiten ohne Runtime-Errors laden
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const baseUrl = 'http://localhost:3000';

const pages = [
  { path: '/login', name: 'Login' },
  { path: '/cache-test', name: 'Cache Test' },
];

console.log('🔍 Checking Server-Side Rendering...\n');

async function checkPage(page) {
  try {
    const { stdout, stderr } = await execAsync(`curl -s -o /dev/null -w "%{http_code}" ${baseUrl}${page.path}`);
    const statusCode = stdout.trim();
    
    if (statusCode === '200') {
      console.log(`✅ ${page.name} (${page.path}): OK (${statusCode})`);
      return true;
    } else if (statusCode === '307' || statusCode === '302') {
      console.log(`↪️  ${page.name} (${page.path}): Redirect (${statusCode})`);
      return true;
    } else {
      console.log(`❌ ${page.name} (${page.path}): Error (${statusCode})`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${page.name} (${page.path}): ${error.message}`);
    return false;
  }
}

async function runChecks() {
  const results = await Promise.all(pages.map(checkPage));
  const allPassed = results.every(r => r);
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  if (allPassed) {
    console.log('✅ All pages render without errors');
  } else {
    console.log('❌ Some pages have errors');
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  return allPassed;
}

runChecks().then(success => {
  process.exit(success ? 0 : 1);
});
