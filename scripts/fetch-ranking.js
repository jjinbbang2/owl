const https = require('https');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Supabase 설정
const SUPABASE_URL = 'https://eukkokvfvbucloforsmn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1a2tva3ZmdmJ1Y2xvZm9yc21uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxNzg1NzUsImV4cCI6MjA4MDc1NDU3NX0.EJtp0Rj4XbVRW7KqTLvultLAV1psqnIWnQeA7YeBaHY';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const CONFIG = {
    baseUrl   : 'https://mobinogi.net/user/6/',
    outputPath: path.join(__dirname, '../data/ranking.json')
};

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function fetchPage(characterName) {
    return new Promise((resolve, reject) => {
        const url = `${CONFIG.baseUrl}${encodeURIComponent(characterName)}`;

        https.get(url, {
            headers: {
                'User-Agent'     : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept'         : 'text/html,application/xhtml+xml',
                'Accept-Language': 'ko-KR,ko;q=0.9'
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

function parseSSRData(html) {
    const match = html.match(/window\.__SSR_DATA__\s*=\s*(\{[\s\S]*?\});/);
    if (!match) return null;

    try {
        return JSON.parse(match[1]);
    } catch (e) {
        console.error('[파싱 오류]', e.message);
        return null;
    }
}

// Supabase에서 캐릭터 목록 가져오기
async function fetchCharacterList() {
    const { data, error } = await supabase
        .from('ranking_characters')
        .select('name')
        .order('created_at', { ascending: true });

    if (error) {
        console.error('[오류] Supabase에서 캐릭터 목록 조회 실패:', error.message);
        return [];
    }

    return data.map(row => row.name);
}

async function main() {
    console.log('[시작] 랭킹 데이터 수집...');

    // Supabase에서 캐릭터 목록 가져오기
    const characters = await fetchCharacterList();

    if (characters.length === 0) {
        console.log('[경고] 등록된 캐릭터가 없습니다.');
        process.exit(1);
    }

    console.log(`[정보] ${characters.length}명의 캐릭터 조회 예정`);

    const members = [];

    for (let i = 0; i < characters.length; i++) {
        const name = characters[i];

        if (i > 0) {
            await delay(1500);
        }

        console.log(`[조회] ${name} (${i + 1}/${characters.length})`);

        try {
            const html = await fetchPage(name);
            const ssrData = parseSSRData(html);

            if (ssrData && ssrData.userMetaData && ssrData.userMetaData.length > 0) {
                // 전투력(level)이 가장 높은 클래스 데이터 찾기
                const user = ssrData.userMetaData.reduce((max, u) => u.level > max.level ? u : max);

                const combatScore = user.level;
                const lifeScore = user.attractiveness;
                const charmScore = user.vitality;
                const totalScore = combatScore + lifeScore + charmScore;

                members.push({
                    name             : user.user_id,
                    rank             : user.server_rank,
                    rankDisplay      : user.server_rank.toLocaleString() + '위',
                    server           : user.server_name,
                    class            : user.class_name,
                    totalScore       : totalScore,
                    totalScoreDisplay: totalScore.toLocaleString(),
                    combatScore      : combatScore,
                    lifeScore        : lifeScore,
                    charmScore       : charmScore
                });

                console.log(`[성공] ${name} - ${user.class_name} (${user.server_rank}위)`);
            } else {
                console.log(`[실패] ${name} - 데이터 없음`);
            }
        } catch (error) {
            console.error(`[실패] ${name}:`, error.message);
        }
    }

    if (members.length > 0) {
        const result = {
            updatedAt: new Date().toISOString(),
            members  : members
        };

        fs.writeFileSync(CONFIG.outputPath, JSON.stringify(result, null, 2), 'utf8');
        console.log(`[완료] ${members.length}명 저장됨: ${CONFIG.outputPath}`);
    } else {
        console.log('[경고] 데이터를 가져오지 못했습니다.');
        process.exit(1);
    }
}

main().catch(error => {
    console.error('[오류]', error);
    process.exit(1);
});
