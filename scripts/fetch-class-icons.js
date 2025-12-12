const puppeteer = require('puppeteer');

async function fetchClassIcons() {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();

        // 랭킹 페이지로 이동
        console.log('Loading ranking page...');
        await page.goto('https://mabinogimobile.nexon.com/Ranking/List?t=4', {
            waitUntil: 'networkidle2',
            timeout: 60000
        });

        // 페이지 로드 대기
        await page.waitForSelector('select', { timeout: 30000 });

        // 클래스 선택 셀렉트박스 찾기
        const classData = await page.evaluate(() => {
            const results = [];

            // 모든 이미지 태그에서 클래스 아이콘 찾기
            const images = document.querySelectorAll('img');
            images.forEach(img => {
                const src = img.src;
                if (src.includes('lwi.nexon.com') && src.includes('class') && src.includes('icon')) {
                    results.push({
                        src: src,
                        alt: img.alt || ''
                    });
                }
            });

            // 셀렉트박스 옵션에서 데이터 찾기
            const selects = document.querySelectorAll('select');
            selects.forEach(select => {
                const options = select.querySelectorAll('option');
                options.forEach(opt => {
                    if (opt.dataset && opt.dataset.icon) {
                        results.push({
                            value: opt.value,
                            text: opt.textContent,
                            icon: opt.dataset.icon
                        });
                    }
                });
            });

            // 페이지 내 모든 스크립트에서 클래스 데이터 찾기
            const scripts = document.querySelectorAll('script');
            scripts.forEach(script => {
                const content = script.textContent;
                if (content.includes('lwi.nexon.com') && content.includes('icon')) {
                    const matches = content.match(/https:\/\/lwi\.nexon\.com[^"'\s]+icon[^"'\s]+\.png/g);
                    if (matches) {
                        matches.forEach(url => {
                            results.push({ iconUrl: url });
                        });
                    }
                }
            });

            return results;
        });

        console.log('Found class data:', JSON.stringify(classData, null, 2));

        // 페이지 HTML 전체에서 아이콘 URL 추출
        const html = await page.content();
        const iconMatches = html.match(/https:\/\/lwi\.nexon\.com[^"'\s>]+icon[^"'\s>]+\.png/g);

        if (iconMatches) {
            console.log('\nAll icon URLs found in page:');
            const uniqueUrls = [...new Set(iconMatches)];
            uniqueUrls.forEach(url => console.log(url));
        }

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await browser.close();
    }
}

fetchClassIcons();
