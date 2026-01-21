const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('Missing DATABASE_URL environment variable. Aborting.');
  process.exit(1);
}

async function analyzeDatabase() {
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('=== DATENBANKANALYSE ===\n');

    // Alle Tabellen abrufen
    const tablesResult = await client.query(`
      SELECT table_name, table_type 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('📋 TABELLEN:');
    console.log('-'.repeat(50));
    
    if (tablesResult.rows.length === 0) {
      console.log('Keine Tabellen gefunden.');
    } else {
      for (const table of tablesResult.rows) {
        console.log(`  • ${table.table_name} (${table.table_type})`);
      }
    }
    console.log('');

    // Für jede Tabelle: Spalten, Datentypen, Constraints
    for (const table of tablesResult.rows) {
      const tableName = table.table_name;
      
      console.log(`\n📊 TABELLE: ${tableName}`);
      console.log('='.repeat(50));
      
      // Spalten
      const columnsResult = await client.query(`
        SELECT 
          column_name, 
          data_type, 
          character_maximum_length,
          column_default,
          is_nullable
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position
      `, [tableName]);
      
      console.log('\n  Spalten:');
      for (const col of columnsResult.rows) {
        let type = col.data_type;
        if (col.character_maximum_length) {
          type += `(${col.character_maximum_length})`;
        }
        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
        console.log(`    - ${col.column_name}: ${type} ${nullable}${defaultVal}`);
      }
      
      // Primary Keys
      const pkResult = await client.query(`
        SELECT kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
          ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_schema = 'public' 
          AND tc.table_name = $1 
          AND tc.constraint_type = 'PRIMARY KEY'
      `, [tableName]);
      
      if (pkResult.rows.length > 0) {
        console.log('\n  Primary Key:', pkResult.rows.map(r => r.column_name).join(', '));
      }
      
      // Foreign Keys
      const fkResult = await client.query(`
        SELECT
          kcu.column_name,
          ccu.table_name AS foreign_table,
          ccu.column_name AS foreign_column
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.table_schema = 'public'
          AND tc.table_name = $1
          AND tc.constraint_type = 'FOREIGN KEY'
      `, [tableName]);
      
      if (fkResult.rows.length > 0) {
        console.log('\n  Foreign Keys:');
        for (const fk of fkResult.rows) {
          console.log(`    - ${fk.column_name} → ${fk.foreign_table}.${fk.foreign_column}`);
        }
      }
      
      // Indexes
      const indexResult = await client.query(`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE schemaname = 'public' AND tablename = $1
      `, [tableName]);
      
      if (indexResult.rows.length > 0) {
        console.log('\n  Indexes:');
        for (const idx of indexResult.rows) {
          console.log(`    - ${idx.indexname}`);
        }
      }
      
      // Zeilenanzahl
      const countResult = await client.query(`SELECT COUNT(*) FROM "${tableName}"`);
      console.log(`\n  Anzahl Datensätze: ${countResult.rows[0].count}`);
      
      // Sample-Daten (erste 3 Zeilen)
      const sampleResult = await client.query(`SELECT * FROM "${tableName}" LIMIT 3`);
      if (sampleResult.rows.length > 0) {
        console.log('\n  Beispieldaten (max. 3 Zeilen):');
        console.log(JSON.stringify(sampleResult.rows, null, 2).split('\n').map(l => '    ' + l).join('\n'));
      }
    }

    // Enums
    console.log('\n\n📌 ENUMS/CUSTOM TYPES:');
    console.log('-'.repeat(50));
    const enumsResult = await client.query(`
      SELECT t.typname AS enum_name, 
             array_agg(e.enumlabel ORDER BY e.enumsortorder) AS enum_values
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid  
      JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public'
      GROUP BY t.typname
    `);
    
    if (enumsResult.rows.length === 0) {
      console.log('Keine Enums gefunden.');
    } else {
      for (const e of enumsResult.rows) {
        console.log(`  • ${e.enum_name}: [${e.enum_values.join(', ')}]`);
      }
    }

    // Views
    console.log('\n\n👁️ VIEWS:');
    console.log('-'.repeat(50));
    const viewsResult = await client.query(`
      SELECT table_name 
      FROM information_schema.views 
      WHERE table_schema = 'public'
    `);
    
    if (viewsResult.rows.length === 0) {
      console.log('Keine Views gefunden.');
    } else {
      for (const v of viewsResult.rows) {
        console.log(`  • ${v.table_name}`);
      }
    }

    // Functions
    console.log('\n\n⚙️ FUNKTIONEN:');
    console.log('-'.repeat(50));
    const functionsResult = await client.query(`
      SELECT routine_name, data_type
      FROM information_schema.routines
      WHERE routine_schema = 'public' AND routine_type = 'FUNCTION'
    `);
    
    if (functionsResult.rows.length === 0) {
      console.log('Keine benutzerdefinierten Funktionen gefunden.');
    } else {
      for (const f of functionsResult.rows) {
        console.log(`  • ${f.routine_name}() → ${f.data_type}`);
      }
    }

    // Beziehungsdiagramm
    console.log('\n\n🔗 BEZIEHUNGEN (ER-Übersicht):');
    console.log('-'.repeat(50));
    const relationsResult = await client.query(`
      SELECT
        tc.table_name AS source_table,
        kcu.column_name AS source_column,
        ccu.table_name AS target_table,
        ccu.column_name AS target_column
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.table_schema = 'public'
        AND tc.constraint_type = 'FOREIGN KEY'
    `);
    
    if (relationsResult.rows.length === 0) {
      console.log('Keine Fremdschlüssel-Beziehungen gefunden.');
    } else {
      for (const rel of relationsResult.rows) {
        console.log(`  ${rel.source_table}.${rel.source_column} ──→ ${rel.target_table}.${rel.target_column}`);
      }
    }

    console.log('\n\n=== ANALYSE ABGESCHLOSSEN ===');

  } catch (err) {
    console.error('Fehler:', err.message);
  } finally {
    await client.end();
  }
}

analyzeDatabase();
