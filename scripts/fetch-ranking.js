const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');

// Stealth 플러그인 사용 (Cloudflare 우회)
puppeteer.use(StealthPlugin());

// 조회할 캐릭터명 배열
const CHARACTER_NAMES = [
    "보노보노거인",
    "루야쫑쫑",
    "운정",
    "풀뱅기사"
];

// 랭킹 페이지 URL
const RANKING_URL = 'https://mabinogimobile.nexon.com/Ranking/List?t=4';

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchCharacterRanking(page, characterName) {
    try {
        console.log(`[검색] ${characterName} 조회 중...`);

        // 검색창에 캐릭터명 입력
        await page.waitForSelector('input[name="search"]', { timeout: 10000 });

        // 기존 검색어 지우기
        await page.click('input[name="search"]', { clickCount: 3 });
        await page.keyboard.press('Backspace');

        // 새 검색어 입력
        await page.type('input[name="search"]', characterName, { delay: 50 });

        // 검색 버튼 클릭
        await page.click('button.btn_search');

        // 결과 로딩 대기
        await delay(3000);

        // 결과 파싱 - class="item on"인 요소 찾기
        const result = await page.evaluate((targetName) => {
            const items = document.querySelectorAll('li.item');

            for (const item of items) {
                const nameElement = item.querySelector('dd[data-charactername]');
                if (!nameElement) continue;

                const characterName = nameElement.getAttribute('data-charactername');

                // 검색한 캐릭터 또는 하이라이트된 캐릭터
                if (characterName === targetName || item.classList.contains('on')) {
                    // 순위
                    const rankElement = item.querySelector('dl > dt');
                    const rankText = rankElement ? rankElement.textContent.trim() : '';
                    const rank = rankText.replace('위', '').replace(/,/g, '').trim();

                    // 서버명
                    const serverElement = item.querySelectorAll('div > dl')[1]?.querySelector('dd');
                    const server = serverElement ? serverElement.textContent.trim() : '';

                    // 클래스
                    const classDD = item.querySelectorAll('div > dl')[3]?.querySelector('dd');
                    const characterClass = classDD ? classDD.textContent.trim() : '';

                    // 종합 점수
                    const scoreSpans = item.querySelectorAll('dl dt span');
                    const totalScoreDisplay = scoreSpans.length >= 2 ? scoreSpans[1].textContent.trim() : '';
                    const totalScore = totalScoreDisplay.replace(/,/g, '');

                    // 세부 점수
                    const type1 = item.querySelector('.type_1')?.textContent.trim().replace(/,/g, '') || '0';
                    const type2 = item.querySelector('.type_2')?.textContent.trim().replace(/,/g, '') || '0';
                    const type3 = item.querySelector('.type_3')?.textContent.trim().replace(/,/g, '') || '0';

                    return {
                        name: characterName,
                        rank: parseInt(rank) || 0,
                        rankDisplay: rankText,
                        server: server,
                        class: characterClass,
                        totalScore: parseInt(totalScore) || 0,
                        totalScoreDisplay: totalScoreDisplay,
                        attackScore: parseInt(type1) || 0,
                        defenseScore: parseInt(type3) || 0,
                        lifeScore: parseInt(type2) || 0
                    };
                }
            }
            return null;
        }, characterName);

        if (result) {
            console.log(`[성공] ${characterName}: ${result.rankDisplay} (${result.totalScoreDisplay})`);
        } else {
            console.log(`[실패] ${characterName}: 데이터를 찾을 수 없음`);
        }

        return result;
    } catch (error) {
        console.error(`[오류] ${characterName}:`, error.message);
        return null;
    }
}

async function main() {
    console.log('=== 마비노기 모바일 랭킹 수집 시작 ===\n');

    const browser = await puppeteer.launch({
        headless: 'new',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-features=IsolateOrigins,site-per-process',
            '--window-size=1920,1080'
        ]
    });

    try {
        const page = await browser.newPage();

        // 뷰포트 설정
        await page.setViewport({ width: 1920, height: 1080 });

        // User-Agent 설정
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // 언어 설정
        await page.setExtraHTTPHeaders({
            'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7'
        });

        // 페이지 이동
        console.log('[접속] 랭킹 페이지 로딩 중...');
        await page.goto(RANKING_URL, { waitUntil: 'networkidle2', timeout: 60000 });

        // Cloudflare 챌린지 통과 대기 (더 길게)
        console.log('[대기] 페이지 로딩 대기 중...');
        await delay(10000);

        // 페이지 로딩 완료 확인 (여러 번 시도)
        let attempts = 0;
        const maxAttempts = 5;

        while (attempts < maxAttempts) {
            try {
                await page.waitForSelector('li.item', { timeout: 10000 });
                console.log('[완료] 페이지 로딩 완료\n');
                break;
            } catch (e) {
                attempts++;
                console.log(`[재시도] 페이지 로딩 대기 중... (${attempts}/${maxAttempts})`);

                // 페이지 새로고침
                if (attempts < maxAttempts) {
                    await page.reload({ waitUntil: 'networkidle2' });
                    await delay(5000);
                }
            }
        }

        if (attempts >= maxAttempts) {
            // 디버그용 스크린샷 저장
            await page.screenshot({ path: 'debug-screenshot.png', fullPage: true });
            const html = await page.content();
            console.log('[디버그] 페이지 내용 일부:', html.substring(0, 500));
            throw new Error('페이지 로딩 실패: li.item을 찾을 수 없음');
        }

        // 각 캐릭터 조회
        const results = [];
        for (const characterName of CHARACTER_NAMES) {
            const data = await fetchCharacterRanking(page, characterName);
            if (data) {
                results.push(data);
            }
            await delay(2000); // 요청 간 딜레이
        }

        // 결과 저장
        const output = {
            updatedAt: new Date().toISOString(),
            characters: results
        };

        const outputPath = path.join(__dirname, '..', 'data', 'ranking.json');

        // data 디렉토리 생성
        const dataDir = path.dirname(outputPath);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');

        console.log(`\n=== 완료 ===`);
        console.log(`총 ${results.length}명 조회 완료`);
        console.log(`저장 위치: ${outputPath}`);

    } catch (error) {
        console.error('오류 발생:', error);
        process.exit(1);
    } finally {
        await browser.close();
    }
}

main();
