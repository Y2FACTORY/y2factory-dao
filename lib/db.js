const Database = require('better-sqlite3');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(process.cwd(), 'data', 'y2factory.db');

let db;

function getDb() {
  if (!db) {
    const fs = require('fs');
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initTables(db);
    migrateDb(db);
    seedAdmin(db);
  }
  return db;
}

function migrateDb(db) {
  // Add avatar_emoji column if not exists
  try {
    db.prepare("SELECT avatar_emoji FROM users LIMIT 1").get();
  } catch {
    db.exec("ALTER TABLE users ADD COLUMN avatar_emoji TEXT DEFAULT ''");
  }
  // Add avatar_image column if not exists
  try {
    db.prepare("SELECT avatar_image FROM users LIMIT 1").get();
  } catch {
    db.exec("ALTER TABLE users ADD COLUMN avatar_image TEXT DEFAULT ''");
  }
  // Add member_number column if not exists
  try {
    db.prepare("SELECT member_number FROM users LIMIT 1").get();
  } catch {
    db.exec("ALTER TABLE users ADD COLUMN member_number TEXT DEFAULT ''");
  }
  // Add admin_memo column if not exists
  try {
    db.prepare("SELECT admin_memo FROM users LIMIT 1").get();
  } catch {
    db.exec("ALTER TABLE users ADD COLUMN admin_memo TEXT DEFAULT ''");
  }
  // Add display_role column if not exists
  try {
    db.prepare("SELECT display_role FROM users LIMIT 1").get();
  } catch {
    db.exec("ALTER TABLE users ADD COLUMN display_role TEXT DEFAULT 'Y2FDメンバー'");
  }
  // Add discord_id column if not exists
  try {
    db.prepare("SELECT discord_id FROM users LIMIT 1").get();
  } catch {
    db.exec("ALTER TABLE users ADD COLUMN discord_id TEXT DEFAULT ''");
  }
  // Add raw_password column if not exists (for admin password viewing)
  try {
    db.prepare("SELECT raw_password FROM users LIMIT 1").get();
  } catch {
    db.exec("ALTER TABLE users ADD COLUMN raw_password TEXT DEFAULT ''");
  }
  // Add title column to posts
  try {
    db.prepare("SELECT title FROM posts LIMIT 1").get();
  } catch {
    db.exec("ALTER TABLE posts ADD COLUMN title TEXT DEFAULT ''");
  }
  // Fix notification links from old /dashboard to /reports
  try {
    db.prepare("UPDATE notifications SET link = '/reports' WHERE link = '/dashboard'").run();
  } catch {}
  // Migrate posts table to allow 'roadmap' post_type
  try {
    db.pragma('foreign_keys = OFF');
    db.prepare("INSERT INTO posts (id, user_id, content, post_type) VALUES ('__test__', '__test__', 'test', 'roadmap')").run();
    db.prepare("DELETE FROM posts WHERE id = '__test__'").run();
    db.pragma('foreign_keys = ON');
  } catch {
    // Recreate posts table with updated CHECK constraint
    db.pragma('foreign_keys = OFF');
    db.exec(`
      CREATE TABLE IF NOT EXISTS posts_new (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        content TEXT NOT NULL,
        post_type TEXT DEFAULT 'normal' CHECK(post_type IN ('normal','announcement','roadmap')),
        title TEXT DEFAULT '',
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
      INSERT INTO posts_new (id, user_id, content, post_type, title, created_at)
        SELECT id, user_id, content, post_type, COALESCE(title, ''), created_at FROM posts;
      DROP TABLE posts;
      ALTER TABLE posts_new RENAME TO posts;
    `);
    db.pragma('foreign_keys = ON');
  }
  // Create notifications table if not exists (migration for existing DBs)
  db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT DEFAULT 'vote_result',
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      link TEXT,
      is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);
  // Create inquiries table if not exists
  db.exec(`
    CREATE TABLE IF NOT EXISTS inquiries (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT DEFAULT 'open' CHECK(status IN ('open','replied','closed')),
      admin_reply TEXT DEFAULT '',
      replied_by TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      replied_at TEXT DEFAULT '',
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);
  // Remove UNIQUE(proposal_id, user_id) from votes table to support distribution voting
  try {
    // Test if we can insert duplicate proposal_id+user_id
    const testVote = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='votes'").get();
    if (testVote && testVote.sql && testVote.sql.includes('UNIQUE')) {
      db.pragma('foreign_keys = OFF');
      db.exec(`
        CREATE TABLE IF NOT EXISTS votes_new (
          id TEXT PRIMARY KEY,
          proposal_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          chosen_option TEXT NOT NULL,
          point_weight INTEGER NOT NULL,
          created_at TEXT DEFAULT (datetime('now')),
          FOREIGN KEY (proposal_id) REFERENCES proposals(id),
          FOREIGN KEY (user_id) REFERENCES users(id)
        );
        INSERT INTO votes_new SELECT * FROM votes;
        DROP TABLE votes;
        ALTER TABLE votes_new RENAME TO votes;
      `);
      db.pragma('foreign_keys = ON');
    }
  } catch(e) { console.log('votes migration note:', e.message); }

  // Shop items table
  db.exec(`
    CREATE TABLE IF NOT EXISTS shop_items (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      image_url TEXT NOT NULL,
      link_url TEXT NOT NULL,
      description TEXT DEFAULT '',
      sort_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_by TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );
  `);

  // Idea collection tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS idea_requests (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      target_roles TEXT DEFAULT '[]',
      deadline TEXT,
      is_active INTEGER DEFAULT 1,
      created_by TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS idea_submissions (
      id TEXT PRIMARY KEY,
      request_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (request_id) REFERENCES idea_requests(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  // Subscriptions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      paypal_subscription_id TEXT UNIQUE NOT NULL,
      plan_id TEXT NOT NULL,
      status TEXT DEFAULT 'ACTIVE',
      failure_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);
}

function initTables(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      display_name TEXT NOT NULL,
      role TEXT DEFAULT 'member' CHECK(role IN ('member','admin')),
      rank TEXT DEFAULT 'ブロンズ',
      avatar_color TEXT DEFAULT '#6C63FF',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS databases (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS points (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      db_name TEXT NOT NULL DEFAULT 'default',
      amount INTEGER NOT NULL,
      reason TEXT,
      granted_by TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (granted_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      content TEXT NOT NULL,
      post_type TEXT DEFAULT 'normal' CHECK(post_type IN ('normal','announcement')),
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (post_id) REFERENCES posts(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS reactions (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      type TEXT DEFAULT 'like',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (post_id) REFERENCES posts(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(post_id, user_id, type)
    );

    CREATE TABLE IF NOT EXISTS proposals (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      options TEXT NOT NULL,
      status TEXT DEFAULT 'active' CHECK(status IN ('active','closed','cancelled')),
      db_name TEXT NOT NULL DEFAULT 'default',
      created_by TEXT NOT NULL,
      deadline TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS votes (
      id TEXT PRIMARY KEY,
      proposal_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      chosen_option TEXT NOT NULL,
      point_weight INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (proposal_id) REFERENCES proposals(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT DEFAULT 'vote_result',
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      link TEXT,
      is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      paypal_subscription_id TEXT UNIQUE NOT NULL,
      plan_id TEXT NOT NULL,
      status TEXT DEFAULT 'ACTIVE',
      failure_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);
}

function seedAdmin(db) {
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@y2factory.dao');
  if (!existing) {
    const id = uuidv4();
    const hash = bcrypt.hashSync('admin123', 10);
    db.prepare(
      'INSERT INTO users (id, email, password_hash, display_name, role, rank) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(id, 'admin@y2factory.dao', hash, '運営管理者', 'admin', 'ダイヤモンド');

    // Create default database
    const dbId = uuidv4();
    db.prepare(
      'INSERT INTO databases (id, name, description) VALUES (?, ?, ?)'
    ).run(dbId, 'default', '総合ポイントDB');

    // Give admin some initial points
    const pId = uuidv4();
    db.prepare(
      'INSERT INTO points (id, user_id, db_name, amount, reason) VALUES (?, ?, ?, ?, ?)'
    ).run(pId, id, 'default', 1000, '初期管理者ポイント');
  }
}

function getUserPoints(userId, dbName = 'default') {
  const result = db.prepare(
    'SELECT COALESCE(SUM(amount), 0) as total FROM points WHERE user_id = ? AND db_name = ?'
  ).get(userId, dbName);
  return result.total;
}

module.exports = { getDb, getUserPoints };
