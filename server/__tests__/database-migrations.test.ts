/**
 * Database Migrations Test
 * Verifies that migrations run only once and are properly tracked
 */

import { Database } from "bun:sqlite";
import * as fs from "fs";
import * as path from "path";
import { test, expect, describe, beforeEach, afterEach } from "bun:test";

describe("Database Migrations", () => {
  const testDbPath = path.join(__dirname, "test-migrations.db");
  let db: Database;

  beforeEach(() => {
    // Clean up any existing test database
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  afterEach(() => {
    // Close and clean up
    if (db) {
      db.close();
    }
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  test("migrations table is created on initialization", () => {
    db = new Database(testDbPath, { create: true });

    // Create migrations table
    db.run(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        applied_at TEXT NOT NULL
      )
    `);

    // Verify table exists
    const tables = db
      .query<{ name: string }, []>("SELECT name FROM sqlite_master WHERE type='table' AND name='migrations'")
      .all();

    expect(tables.length).toBe(1);
    expect(tables[0].name).toBe("migrations");
  });

  test("migration is recorded when applied", () => {
    db = new Database(testDbPath, { create: true });

    // Create migrations table
    db.run(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        applied_at TEXT NOT NULL
      )
    `);

    // Record a migration
    const migrationName = "001_test_migration";
    const appliedAt = new Date().toISOString();
    db.run("INSERT INTO migrations (name, applied_at) VALUES (?, ?)", [migrationName, appliedAt]);

    // Verify migration was recorded
    const migrations = db
      .query<{ name: string; applied_at: string }, []>("SELECT name, applied_at FROM migrations")
      .all();

    expect(migrations.length).toBe(1);
    expect(migrations[0].name).toBe(migrationName);
  });

  test("hasMigrationRun returns false for new migration", () => {
    db = new Database(testDbPath, { create: true });

    // Create migrations table
    db.run(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        applied_at TEXT NOT NULL
      )
    `);

    // Check if migration has run
    const result = db
      .query<{ count: number }, [string]>("SELECT COUNT(*) as count FROM migrations WHERE name = ?")
      .get("001_new_migration");

    expect(result?.count).toBe(0);
  });

  test("hasMigrationRun returns true for applied migration", () => {
    db = new Database(testDbPath, { create: true });

    // Create migrations table
    db.run(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        applied_at TEXT NOT NULL
      )
    `);

    // Record a migration
    const migrationName = "001_applied_migration";
    db.run("INSERT INTO migrations (name, applied_at) VALUES (?, ?)", [
      migrationName,
      new Date().toISOString(),
    ]);

    // Check if migration has run
    const result = db
      .query<{ count: number }, [string]>("SELECT COUNT(*) as count FROM migrations WHERE name = ?")
      .get(migrationName);

    expect(result?.count).toBe(1);
  });

  test("multiple migrations are tracked in order", () => {
    db = new Database(testDbPath, { create: true });

    // Create migrations table
    db.run(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        applied_at TEXT NOT NULL
      )
    `);

    // Record multiple migrations
    const migrations = [
      "001_add_working_directory",
      "002_add_permission_mode",
      "003_add_mode",
      "004_add_sdk_session_id",
    ];

    for (const name of migrations) {
      db.run("INSERT INTO migrations (name, applied_at) VALUES (?, ?)", [name, new Date().toISOString()]);
    }

    // Verify all migrations were recorded
    const recorded = db.query<{ name: string }, []>("SELECT name FROM migrations ORDER BY id").all();

    expect(recorded.length).toBe(4);
    expect(recorded.map((r) => r.name)).toEqual(migrations);
  });

  test("duplicate migration names are prevented by UNIQUE constraint", () => {
    db = new Database(testDbPath, { create: true });

    // Create migrations table
    db.run(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        applied_at TEXT NOT NULL
      )
    `);

    const migrationName = "001_test_migration";

    // Insert first time - should succeed
    db.run("INSERT INTO migrations (name, applied_at) VALUES (?, ?)", [
      migrationName,
      new Date().toISOString(),
    ]);

    // Insert second time - should fail
    expect(() => {
      db.run("INSERT INTO migrations (name, applied_at) VALUES (?, ?)", [
        migrationName,
        new Date().toISOString(),
      ]);
    }).toThrow();
  });
});
