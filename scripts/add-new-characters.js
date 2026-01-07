const { createClient } = require('@supabase/supabase-js');

// Supabase 설정
const SUPABASE_URL = 'https://eukkokvfvbucloforsmn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1a2tva3ZmdmJ1Y2xvZm9yc21uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxNzg1NzUsImV4cCI6MjA4MDc1NDU3NX0.EJtp0Rj4XbVRW7KqTLvultLAV1psqnIWnQeA7YeBaHY';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 등록할 캐릭터 목록
const ALL_CHARACTERS = [
    // 부엉이 (26명)
    '시우쇠',
    '보리굴비',
    '바르다',
    '새벽숲부엉이',
    '통이',
    '퉁이',
    '플라시엘',
    'RIZ',
    'A5',
    '여니는여니여니해',
    '유키노하라유키',
    '린파란',
    '다큐',
    '카이릭스',
    '시울림',
    '도혜미',
    '시형',
    'zl존아프로',
    '로키쿠',
    '류진원',
    '텐버거',
    '읏챠',
    '고로정비',
    '지유쓰',
    '리트리부엉',
    // 부엉국 (26명)
    '풀뱅기사',
    '고진',
    '풀뱅맹구',
    '빵민',
    'Rabiatan',
    'yellosky',
    '빼쥬',
    '낙서쟁이',
    '불도져츄러스',
    '로거니우스',
    '운정',
    '낙화비검',
    '루야쫑쫑',
    '갑옷거인',
    '은월선비',
    '이카러스',
    '솥밥이',
    '동동삼이',
    '첫사랑소녀',
    '보노보노거인',
    '낭만감자',
    '설란',
    '프네',
    '깡설',
    '귤설',
    '꿀미호',
];

async function addNewCharacters() {
    console.log('[시작] 신규 캐릭터 등록...');
    console.log(`[정보] 등록 대상 캐릭터: ${ALL_CHARACTERS.length}명`);

    // 기존 등록된 캐릭터 조회
    const { data: existing, error: checkError } = await supabase
        .from('ranking_characters')
        .select('name');

    if (checkError) {
        console.error('[오류] 테이블 조회 실패:', checkError.message);
        return;
    }

    const existingNames = existing.map(r => r.name);
    console.log(`[정보] 현재 등록된 캐릭터: ${existingNames.length}명`);

    // 이미 등록된 캐릭터 출력
    const alreadyRegistered = ALL_CHARACTERS.filter(name => existingNames.includes(name));
    if (alreadyRegistered.length > 0) {
        console.log(`[정보] 이미 등록된 캐릭터 (${alreadyRegistered.length}명):`);
        alreadyRegistered.forEach(name => console.log(`  - ${name}`));
    }

    // 새로 추가할 캐릭터 필터링
    const newCharacters = ALL_CHARACTERS.filter(name => !existingNames.includes(name));

    if (newCharacters.length === 0) {
        console.log('[완료] 모든 캐릭터가 이미 등록되어 있습니다.');
        return;
    }

    console.log(`[정보] 새로 추가할 캐릭터: ${newCharacters.length}명`);

    // 비공개(visibility=2)로 캐릭터 추가
    const { data, error } = await supabase
        .from('ranking_characters')
        .insert(newCharacters.map(name => ({
            name,
            visibility: 2  // 비공개
        })))
        .select();

    if (error) {
        console.error('[오류] 캐릭터 추가 실패:', error.message);
        return;
    }

    console.log(`[완료] ${data.length}명의 캐릭터가 비공개로 추가되었습니다:`);
    data.forEach(char => console.log(`  - ${char.name} (visibility: ${char.visibility})`));
}

addNewCharacters().catch(error => {
    console.error('[오류]', error);
    process.exit(1);
});
