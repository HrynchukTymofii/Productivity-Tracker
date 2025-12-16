import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export const getDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  if (!db) {
    db = await SQLite.openDatabaseAsync('productivity_tracker.db');
  }
  return db;
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
};

export const closeDatabase = async (): Promise<void> => {
  if (db) {
    await db.closeAsync();
    db = null;
  }
};
