const { createClient } = require('@supabase/supabase-js');

// Supabase 설정
const SUPABASE_URL = 'https://eukkokvfvbucloforsmn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1a2tva3ZmdmJ1Y2xvZm9yc21uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxNzg1NzUsImV4cCI6MjA4MDc1NDU3NX0.EJtp0Rj4XbVRW7KqTLvultLAV1psqnIWnQeA7YeBaHY';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 기존 캐릭터 목록
const INITIAL_CHARACTERS = [
    '풀뱅기사',
    '루야쫑쫑',
    '보노보노거인',
    '차력거인',
    '전퇴의거인',
    '갑옷거인',
    '새벽숲부엉이',
    '로거니우스',
    '운정',
];

async function migrateCharacters() {
    console.log('[시작] 캐릭터 마이그레이션...');

    // 기존 데이터 확인
    const { data: existing, error: checkError } = await supabase
        .from('ranking_characters')
        .select('name');

    if (checkError) {
        console.error('[오류] 테이블 조회 실패:', checkError.message);
        console.log('\n[안내] Supabase에서 다음 SQL을 실행하여 테이블을 생성하세요:');
        console.log(`
CREATE TABLE ranking_characters (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS 정책 설정
ALTER TABLE ranking_characters ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽기 가능
CREATE POLICY "Anyone can read ranking_characters" ON ranking_characters
    FOR SELECT USING (true);

-- 모든 사용자가 삽입 가능
CREATE POLICY "Anyone can insert ranking_characters" ON ranking_characters
    FOR INSERT WITH CHECK (true);

-- 모든 사용자가 삭제 가능
CREATE POLICY "Anyone can delete ranking_characters" ON ranking_characters
    FOR DELETE USING (true);
`);
        return;
    }

    const existingNames = existing.map(r => r.name);
    console.log(`[정보] 기존 등록된 캐릭터: ${existingNames.length}명`);

    // 새로 추가할 캐릭터 필터링
    const newCharacters = INITIAL_CHARACTERS.filter(name => !existingNames.includes(name));

    if (newCharacters.length === 0) {
        console.log('[완료] 모든 캐릭터가 이미 등록되어 있습니다.');
        return;
    }

    console.log(`[정보] 새로 추가할 캐릭터: ${newCharacters.length}명`);

    // 캐릭터 추가
    const { data, error } = await supabase
        .from('ranking_characters')
        .insert(newCharacters.map(name => ({ name })))
        .select();

    if (error) {
        console.error('[오류] 캐릭터 추가 실패:', error.message);
        return;
    }

    console.log(`[완료] ${data.length}명의 캐릭터가 추가되었습니다.`);
    data.forEach(char => console.log(`  - ${char.name}`));
}

migrateCharacters().catch(error => {
    console.error('[오류]', error);
    process.exit(1);
});
