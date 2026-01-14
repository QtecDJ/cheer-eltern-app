// Icon-Generator für PWA
// Führe aus mit: node generate-icons.js

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const SOURCE_LOGO = './public/logo.webp';
const OUTPUT_DIR = './public/icons';

async function generateIcons() {
  // Output-Verzeichnis erstellen falls nicht vorhanden
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log('🎨 Generiere PWA Icons aus logo.webp...\n');

  for (const size of ICON_SIZES) {
    const outputPath = path.join(OUTPUT_DIR, `icon-${size}.png`);
    
    try {
      await sharp(SOURCE_LOGO)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 15, g: 23, b: 42, alpha: 1 } // slate-900
        })
        .png()
        .toFile(outputPath);
      
      console.log(`✅ icon-${size}.png erstellt`);
    } catch (error) {
      console.error(`❌ Fehler bei icon-${size}.png:`, error.message);
    }
  }

  // Favicon erstellen
  try {
    await sharp(SOURCE_LOGO)
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 15, g: 23, b: 42, alpha: 1 }
      })
      .png()
      .toFile('./public/favicon.png');
    console.log(`✅ favicon.png erstellt`);
  } catch (error) {
    console.error(`❌ Fehler bei favicon.png:`, error.message);
  }

  console.log('\n🎉 Alle Icons wurden generiert!');
  console.log('📁 Ausgabe-Verzeichnis:', OUTPUT_DIR);
}

generateIcons();
