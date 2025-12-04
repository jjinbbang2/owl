const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const CONFIG = {
    apiBaseUrl: 'https://mabimobi.life/d/api/v1/search/rankings/v2',
    server: '06',
    characters: ['풀뱅기사', '운정', '루야쫑쫑', '보노보노거인'],
    outputPath: path.join(__dirname, '../data/ranking.json')
};

const klassNames = {
    '01': '전사',
    '02': '대검전사',
    '03': '검술사',
    '04': '석궁사수',
    '05': '장궁병',
    '06': '화염술사',
    '07': '마법사',
    '08': '빙결술사',
    '09': '전격술사',
    '10': '힐러',
    '11': '사제',
    '12': '악사',
    '19': '음유시인',
    '26': '권술사'
};

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchCharacterData(page, characterName) {
    const url = `${CONFIG.apiBaseUrl}?server=${CONFIG.server}&character_name=${encodeURIComponent(characterName)}&sort_by=combat&sort_order=desc&page=1&per_page=20`;

    try {
        const response = await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
        const text = await response.text();

        // JSON 파싱 시도
        try {
            return JSON.parse(text);
        } catch {
            // pre 태그 안에 JSON이 있을 수 있음
            const match = text.match(/<pre[^>]*>([\s\S]*?)<\/pre>/);
            if (match) {
                return JSON.parse(match[1]);
            }
            throw new Error('JSON 파싱 실패');
        }
    } catch (error) {
        console.error(`[실패] ${characterName}: ${error.message}`);
        return null;
    }
}

async function main() {
    console.log('[시작] 랭킹 데이터 수집...');

    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    const members = [];

    for (let i = 0; i < CONFIG.characters.length; i++) {
        const name = CONFIG.characters[i];

        if (i > 0) {
            await delay(2000);
        }

        console.log(`[조회] ${name} (${i + 1}/${CONFIG.characters.length})`);
        const data = await fetchCharacterData(page, name);

        if (data && Array.isArray(data)) {
            const char = data.find(c => c.character_name === name);
            if (char) {
                members.push({
                    name: char.character_name,
                    rank: char.server_combat_rank,
                    rankDisplay: char.server_combat_rank.toLocaleString() + '위',
                    server: '라사',
                    class: klassNames[char.klass] || '알 수 없음',
                    totalScore: char.total,
                    totalScoreDisplay: char.total.toLocaleString(),
                    attackScore: char.combat,
                    defenseScore: char.charm,
                    lifeScore: char.life_skill
                });
                console.log(`[성공] ${name}`);
            }
        }
    }

    await browser.close();

    if (members.length > 0) {
        const result = {
            updatedAt: new Date().toISOString(),
            members: members
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
