const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase 설정
const SUPABASE_URL = 'https://eukkokvfvbucloforsmn.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1a2tva3ZmdmJ1Y2xvZm9yc21uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxNzg1NzUsImV4cCI6MjA4MDc1NDU3NX0.EJtp0Rj4XbVRW7KqTLvultLAV1psqnIWnQeA7YeBaHY';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 백업할 테이블 목록
const TABLES = [
    'rankings',
    'member_profiles',
    'ranking_characters',
    'abyss_parties',
    'abyss_members',
    'help_parties',
    'help_members',
    'help_teams',
    'help_team_members',
    'raid_parties',
    'raid_members'
];

// 백업 보관 기간 (일)
const RETENTION_DAYS = 30;

// 백업 디렉토리
const BACKUP_DIR = path.join(__dirname, '..', 'data', 'backups');

async function backupTable(tableName) {
    try {
        const { data, error } = await supabase
            .from(tableName)
            .select('*');

        if (error) {
            console.error(`Error fetching ${tableName}:`, error.message);
            return { table: tableName, data: [], error: error.message };
        }

        console.log(`✓ ${tableName}: ${data.length} rows`);
        return { table: tableName, data, count: data.length };
    } catch (err) {
        console.error(`Error backing up ${tableName}:`, err.message);
        return { table: tableName, data: [], error: err.message };
    }
}

async function createBackup() {
    console.log('Starting database backup...\n');

    // 백업 디렉토리 생성
    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    // 모든 테이블 백업
    const backupData = {
        timestamp: new Date().toISOString(),
        tables: {}
    };

    for (const table of TABLES) {
        const result = await backupTable(table);
        backupData.tables[table] = {
            count: result.data.length,
            data: result.data,
            error: result.error || null
        };
    }

    // 백업 파일 저장
    const today = new Date().toISOString().split('T')[0];
    const backupFile = path.join(BACKUP_DIR, `backup-${today}.json`);

    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
    console.log(`\n✓ Backup saved to: ${backupFile}`);

    // 통계 출력
    const totalRows = Object.values(backupData.tables).reduce((sum, t) => sum + t.count, 0);
    console.log(`✓ Total rows backed up: ${totalRows}`);

    return backupFile;
}

function cleanOldBackups() {
    console.log(`\nCleaning backups older than ${RETENTION_DAYS} days...`);

    if (!fs.existsSync(BACKUP_DIR)) {
        return;
    }

    const files = fs.readdirSync(BACKUP_DIR);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS);

    let deletedCount = 0;

    for (const file of files) {
        if (!file.startsWith('backup-') || !file.endsWith('.json')) {
            continue;
        }

        // 파일명에서 날짜 추출 (backup-YYYY-MM-DD.json)
        const dateMatch = file.match(/backup-(\d{4}-\d{2}-\d{2})\.json/);
        if (!dateMatch) {
            continue;
        }

        const fileDate = new Date(dateMatch[1]);
        if (fileDate < cutoffDate) {
            const filePath = path.join(BACKUP_DIR, file);
            fs.unlinkSync(filePath);
            console.log(`✓ Deleted old backup: ${file}`);
            deletedCount++;
        }
    }

    if (deletedCount === 0) {
        console.log('✓ No old backups to delete');
    } else {
        console.log(`✓ Deleted ${deletedCount} old backup(s)`);
    }
}

async function main() {
    try {
        await createBackup();
        cleanOldBackups();
        console.log('\n✓ Backup completed successfully!');
    } catch (error) {
        console.error('Backup failed:', error);
        process.exit(1);
    }
}

main();
