import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;
let isInitialized = false;

export const getDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  if (!db) {
    db = await SQLite.openDatabaseAsync('productivity_tracker.db');
  }

  // Test the connection with a simple query
  try {
    await db.getFirstAsync('SELECT 1');
  } catch (error) {
    // Connection is stale, re-open
    console.log('Database connection stale, reopening...');
    db = await SQLite.openDatabaseAsync('productivity_tracker.db');
  }

  return db;
};

export const ensureDatabaseReady = (): boolean => {
  return isInitialized && db !== null;
};

export const initializeDatabase = async (): Promise<void> => {
  const database = await getDatabase();

  // Create tasks table
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_name TEXT NOT NULL,
      color TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME
    );
  `);

  // Create time_entries table
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS time_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL,
      start_time DATETIME NOT NULL,
      end_time DATETIME,
      duration_seconds INTEGER,
      is_paused INTEGER DEFAULT 0,
      paused_at DATETIME,
      accumulated_seconds INTEGER DEFAULT 0,
      notes TEXT,
      date DATE NOT NULL,
      FOREIGN KEY (task_id) REFERENCES tasks(id)
    );
  `);

  // Create settings table
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      color_palette TEXT DEFAULT 'ocean_breeze',
      language TEXT DEFAULT 'en',
      dark_mode INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME
    );
  `);

  // Create index on time_entries date field for performance
  await database.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_time_entries_date ON time_entries(date);
  `);

  // Create index on time_entries task_id
  await database.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_time_entries_task_id ON time_entries(task_id);
  `);

  // Insert default settings if not exists
  await database.runAsync(`
    INSERT OR IGNORE INTO settings (id, color_palette, language, dark_mode)
    VALUES (1, 'ocean_breeze', 'en', 0);
  `);

  // Migration: Add notes column if it doesn't exist
  try {
    await database.execAsync(`
      ALTER TABLE time_entries ADD COLUMN notes TEXT;
    `);
  } catch (error) {
    // Column might already exist, ignore error
  }

  // Migration: Add theme_mode column and migrate from dark_mode
  try {
    await database.execAsync(`
      ALTER TABLE settings ADD COLUMN theme_mode TEXT DEFAULT 'system';
    `);
    // Migrate existing dark_mode values to theme_mode
    await database.runAsync(`
      UPDATE settings SET theme_mode = CASE WHEN dark_mode = 1 THEN 'dark' ELSE 'system' END WHERE theme_mode = 'system' OR theme_mode IS NULL;
    `);
  } catch (error) {
    // Column might already exist, ignore error
  }

  isInitialized = true;
};

export const closeDatabase = async (): Promise<void> => {
  if (db) {
    await db.closeAsync();
    db = null;
    isInitialized = false;
  }
};
