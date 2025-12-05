const https = require('https');
const fs = require('fs');
const path = require('path');

const CONFIG = {
    baseUrl   : 'https://mobinogi.net/user/6/',
    characters: [
        '풀뱅기사',
        '루야쫑쫑',
        '보노보노거인',
        '차력거인',
        '전퇴의거인',
        '갑옷거인',
    ],
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

async function main() {
    console.log('[시작] 랭킹 데이터 수집...');

    const members = [];

    for (let i = 0; i < CONFIG.characters.length; i++) {
        const name = CONFIG.characters[i];

        if (i > 0) {
            await delay(1500);
        }

        console.log(`[조회] ${name} (${i + 1}/${CONFIG.characters.length})`);

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
