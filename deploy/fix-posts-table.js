#!/usr/bin/env node
// Fix posts table CHECK constraint to allow 'roadmap' post_type
// Run on server: node deploy/fix-posts-table.js

const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(process.cwd(), 'data', 'y2factory.db');
console.log('DB Path:', DB_PATH);

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

// Check current posts schema
const schema = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='posts'").get();
console.log('Current posts schema:', schema?.sql);

if (schema?.sql && !schema.sql.includes('roadmap')) {
    console.log('\n-> posts table needs migration (missing roadmap in CHECK constraint)');
    
    db.pragma('foreign_keys = OFF');
    
    // Check if title column exists
    const hasTitle = schema.sql.includes('title');
    console.log('Has title column:', hasTitle);
    
    db.exec(`
        CREATE TABLE posts_new (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            content TEXT NOT NULL,
            post_type TEXT DEFAULT 'normal' CHECK(post_type IN ('normal','announcement','roadmap')),
            title TEXT DEFAULT '',
            created_at TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
    `);
    
    if (hasTitle) {
        db.exec(`
            INSERT INTO posts_new (id, user_id, content, post_type, title, created_at)
                SELECT id, user_id, content, post_type, COALESCE(title, ''), created_at FROM posts;
        `);
    } else {
        db.exec(`
            INSERT INTO posts_new (id, user_id, content, post_type, created_at)
                SELECT id, user_id, content, post_type, created_at FROM posts;
        `);
    }
    
    const count = db.prepare('SELECT COUNT(*) as cnt FROM posts_new').get();
    console.log('Migrated rows:', count.cnt);
    
    db.exec('DROP TABLE posts;');
    db.exec('ALTER TABLE posts_new RENAME TO posts;');
    
    db.pragma('foreign_keys = ON');
    
    // Verify
    const newSchema = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='posts'").get();
    console.log('\nNew posts schema:', newSchema?.sql);
    console.log('\n✅ Migration complete!');
} else if (schema?.sql && schema.sql.includes('roadmap')) {
    console.log('\n✅ posts table already has roadmap CHECK - no migration needed');
    
    // But check if title column exists
    if (!schema.sql.includes('title')) {
        console.log('-> Adding missing title column...');
        db.exec("ALTER TABLE posts ADD COLUMN title TEXT DEFAULT ''");
        console.log('✅ title column added');
    }
} else {
    console.log('⚠️ posts table not found!');
}

db.close();
