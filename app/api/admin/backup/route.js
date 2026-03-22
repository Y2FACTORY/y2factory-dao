import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

const BACKUP_TABLES = [
    'users',
    'databases',
    'points',
    'posts',
    'comments',
    'reactions',
    'proposals',
    'votes',
];

// GET - Export full backup as JSON
export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 });
        }

        const db = getDb();
        const backup = {
            version: 1,
            created_at: new Date().toISOString(),
            created_by: user.display_name,
            tables: {},
        };

        for (const table of BACKUP_TABLES) {
            try {
                const rows = db.prepare(`SELECT * FROM ${table}`).all();
                backup.tables[table] = rows;
            } catch (e) {
                console.warn(`Backup: skipping table ${table}:`, e.message);
                backup.tables[table] = [];
            }
        }

        return NextResponse.json(backup);
    } catch (error) {
        console.error('Backup export error:', error);
        return NextResponse.json({ error: 'バックアップの作成に失敗しました' }, { status: 500 });
    }
}

// POST - Restore from JSON backup
export async function POST(request) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 });
        }

        const backup = await request.json();

        if (!backup.tables || typeof backup.tables !== 'object') {
            return NextResponse.json({ error: '無効なバックアップファイルです' }, { status: 400 });
        }

        const db = getDb();
        const results = {};

        // Order matters due to foreign keys - restore parents first
        const restoreOrder = [
            'users',
            'databases',
            'points',
            'posts',
            'comments',
            'reactions',
            'proposals',
            'votes',
        ];

        const restoreTransaction = db.transaction(() => {
            for (const table of restoreOrder) {
                const rows = backup.tables[table];
                if (!rows || !Array.isArray(rows) || rows.length === 0) {
                    results[table] = { skipped: true, reason: 'データなし' };
                    continue;
                }

                let inserted = 0;
                let skipped = 0;

                for (const row of rows) {
                    const columns = Object.keys(row);
                    const placeholders = columns.map(() => '?').join(', ');
                    const values = columns.map(c => row[c]);

                    try {
                        db.prepare(
                            `INSERT OR IGNORE INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`
                        ).run(...values);
                        inserted++;
                    } catch (e) {
                        skipped++;
                    }
                }

                results[table] = { total: rows.length, inserted, skipped };
            }
        });

        restoreTransaction();

        return NextResponse.json({
            success: true,
            message: 'リストアが完了しました',
            results,
        });
    } catch (error) {
        console.error('Backup restore error:', error);
        return NextResponse.json({ error: `リストアに失敗しました: ${error.message}` }, { status: 500 });
    }
}
