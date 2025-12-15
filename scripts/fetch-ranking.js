const https = require('https');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

// Stealth 플러그인 적용
puppeteer.use(StealthPlugin());

// Supabase 설정
const SUPABASE_URL = 'https://eukkokvfvbucloforsmn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1a2tva3ZmdmJ1Y2xvZm9yc21uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxNzg1NzUsImV4cCI6MjA4MDc1NDU3NX0.EJtp0Rj4XbVRW7KqTLvultLAV1psqnIWnQeA7YeBaHY';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const CONFIG = {
    baseUrl        : 'https://mobinogi.net/user/6/',
    mabiMobiBaseUrl: 'https://mabimobi.life/d/api/v1/search/rankings/v2',
    outputPath     : path.join(__dirname, '../data/ranking.json')
};

// 클래스 코드 → 클래스명 매핑
const CLASS_MAP = {
    '01': '전사',      '02': '대검전사',   '03': '검술사',
    '04': '궁수',      '05': '석궁사수',   '06': '장궁병',
    '07': '마법사',    '08': '화염술사',   '09': '빙결술사',
    '10': '힐러',      '11': '사제',       '12': '수도사',
    '13': '음유시인',  '14': '댄서',       '15': '악사',
    '16': '도적',      '17': '격투가',     '18': '듀얼블레이드',
    '19': '전격술사',  '20': '암흑술사'
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

// Puppeteer를 사용해 mabimobi.life에서 데이터 가져오기
let browser = null;

async function initBrowser() {
    if (!browser) {
        browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-blink-features=AutomationControlled',
                '--disable-infobars',
                '--window-size=1920,1080'
            ]
        });
    }
    return browser;
}

async function closeBrowser() {
    if (browser) {
        await browser.close();
        browser = null;
    }
}

async function fetchFromMabiMobi(characterName) {
    const b = await initBrowser();
    const page = await b.newPage();

    try {
        // 봇 감지 우회 설정
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36');
        await page.setExtraHTTPHeaders({
            'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
        });

        const url = `${CONFIG.mabiMobiBaseUrl}?server=06&character_name=${encodeURIComponent(characterName)}&sort_by=combat&sort_order=desc&page=1&per_page=20`;

        await page.goto(url, { waitUntil: 'networkidle2', timeout: 90000 });

        // Cloudflare 챌린지 통과 대기
        let content = '';
        for (let attempt = 0; attempt < 5; attempt++) {
            await delay(5000);
            content = await page.evaluate(() => document.body.innerText);

            // JSON 응답 확인 (배열로 시작하면 성공)
            if (content.trim().startsWith('[')) {
                break;
            }

            // Cloudflare 챌린지 감지
            if (content.includes('GTFO') || content.includes('Just a moment') || content.includes('Checking')) {
                console.log(`[mabimobi] Cloudflare 챌린지 대기 중... (${attempt + 1}/5)`);
                if (attempt < 4) {
                    await page.reload({ waitUntil: 'networkidle2', timeout: 90000 });
                }
            } else {
                break;
            }
        }

        const data = JSON.parse(content);

        if (Array.isArray(data) && data.length > 0) {
            // 정확히 일치하는 캐릭터 찾기
            const user = data.find(d => d.character_name === characterName);
            if (user) {
                return {
                    name             : user.character_name,
                    rank             : user.server_combat_rank,
                    rankDisplay      : user.server_combat_rank.toLocaleString() + '위',
                    server           : '라사',
                    class            : CLASS_MAP[user.klass] || user.klass,
                    totalScore       : user.total,
                    totalScoreDisplay: user.total.toLocaleString(),
                    combatScore      : user.combat,
                    lifeScore        : user.life_skill,
                    charmScore       : user.charm,
                    source           : 'mabimobi.life'
                };
            }
        }
        return null;
    } catch (e) {
        console.error(`[mabimobi 오류] ${characterName}:`, e.message);
        return null;
    } finally {
        await page.close();
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

    let members = [];
    let failCount = 0;
    let useMabiMobi = false;

    // 1차 시도: mobinogi.net
    for (let i = 0; i < characters.length; i++) {
        const name = characters[i];

        if (i > 0) {
            await delay(1500);
        }

        // 3회 이상 실패 시 mabimobi.life로 전환
        if (failCount >= 3) {
            console.log(`\n[전환] mobinogi.net ${failCount}회 실패 → mabimobi.life로 전환 (처음부터 재시작)`);
            useMabiMobi = true;
            break;
        }

        console.log(`[조회] ${name} (${i + 1}/${characters.length}) - mobinogi.net`);

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
                    charmScore       : charmScore,
                    source           : 'mobinogi.net'
                });

                console.log(`[성공] ${name} - ${user.class_name} (${user.server_rank}위) [mobinogi.net]`);
            } else {
                console.log(`[실패] ${name} - 데이터 없음`);
                failCount++;
            }
        } catch (error) {
            console.error(`[실패] ${name}:`, error.message);
            failCount++;
        }
    }

    // 2차 시도: mabimobi.life (3회 실패 시 처음부터 전체 재시도)
    if (useMabiMobi) {
        members = []; // 기존 데이터 초기화

        for (let i = 0; i < characters.length; i++) {
            const name = characters[i];

            if (i > 0) {
                await delay(2000);
            }

            console.log(`[조회] ${name} (${i + 1}/${characters.length}) - mabimobi.life`);

            const result = await fetchFromMabiMobi(name);
            if (result) {
                members.push(result);
                console.log(`[성공] ${name} - ${result.class} (${result.rank}위) [mabimobi.life]`);
            } else {
                console.log(`[실패] ${name} - mabimobi.life 실패`);
            }
        }

        await closeBrowser();
    }

    if (members.length > 0) {
        const result = {
            updatedAt: new Date().toISOString(),
            members  : members
        };

        fs.writeFileSync(CONFIG.outputPath, JSON.stringify(result, null, 2), 'utf8');
        console.log(`\n[완료] ${members.length}명 저장됨: ${CONFIG.outputPath}`);
    } else {
        console.log('[경고] 데이터를 가져오지 못했습니다.');
        process.exit(1);
    }
}

main().catch(async error => {
    console.error('[오류]', error);
    await closeBrowser();
    process.exit(1);
});
