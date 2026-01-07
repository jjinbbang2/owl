const { createClient } = require('@supabase/supabase-js');

// Supabase 설정
const SUPABASE_URL = 'https://eukkokvfvbucloforsmn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1a2tva3ZmdmJ1Y2xvZm9yc21uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxNzg1NzUsImV4cCI6MjA4MDc1NDU3NX0.EJtp0Rj4XbVRW7KqTLvultLAV1psqnIWnQeA7YeBaHY';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 길드별 캐릭터 목록
const GUILD_MEMBERS = {
    '부엉이': [
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
        // 'zl존아프로' 제외
        '로키쿠',
        '류진원',
        '텐버거',
        '읏챠',
        '고로정비',
        '지유쓰',
        '리트리부엉',
    ],
    '부엉국': [
        '풀뱅기사',
        '고진',
        '풀뱅맹구',
        '빵민',
        'Rabiatan',
        'yellosky',
        '빼쥬',
        '낙서쟁이',
        // '불도져츄러스' 제외
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
    ]
};

async function updateGuilds() {
    console.log('[시작] 길드 설정 업데이트...');

    // 1. 제외할 캐릭터 삭제
    console.log('\n[1단계] 제외 캐릭터 삭제...');
    const excludeCharacters = ['zl존아프로', '불도져츄러스'];

    for (const name of excludeCharacters) {
        const { error: deleteError } = await supabase
            .from('ranking_characters')
            .delete()
            .eq('name', name);

        if (deleteError) {
            console.error(`[오류] ${name} 삭제 실패:`, deleteError.message);
        } else {
            console.log(`[완료] ${name} 삭제됨`);
        }
    }

    // 2. 길드 설정 업데이트 (member_profiles 테이블)
    console.log('\n[2단계] 길드 설정 업데이트...');

    let updatedCount = 0;
    let errorCount = 0;

    for (const [guild, members] of Object.entries(GUILD_MEMBERS)) {
        console.log(`\n[${guild}] ${members.length}명 업데이트 중...`);

        for (const characterName of members) {
            const { error } = await supabase
                .from('member_profiles')
                .upsert({
                    character_name: characterName,
                    guild: guild
                }, { onConflict: 'character_name' });

            if (error) {
                console.error(`  - ${characterName}: 실패 (${error.message})`);
                errorCount++;
            } else {
                updatedCount++;
            }
        }
    }

    console.log(`\n[완료] 총 ${updatedCount}명 길드 설정 완료, ${errorCount}건 오류`);
}

updateGuilds().catch(error => {
    console.error('[오류]', error);
    process.exit(1);
});
