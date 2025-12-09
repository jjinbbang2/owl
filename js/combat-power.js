// 전투력 조회 유틸리티
// 1. ranking.json에서 먼저 조회
// 2. 없으면 API에서 조회

let rankingCache = null;

// ranking.json 데이터 로드 (캐시)
async function loadRankingData() {
    if (rankingCache) return rankingCache;

    try {
        // 절대 경로로 시도
        const basePath = window.location.pathname.includes('/owl/')
            ? '/owl/data/ranking.json'
            : './data/ranking.json';
        const response = await fetch(basePath + '?t=' + Date.now());
        if (response.ok) {
            rankingCache = await response.json();
            console.log('[ranking.json] 로드 성공:', rankingCache.members?.length || 0, '명');
            return rankingCache;
        }
    } catch (error) {
        console.warn('[ranking.json] 로드 실패:', error.message);
    }
    return null;
}

// ranking.json에서 전투력 찾기
function findInRanking(nickname) {
    if (!rankingCache || !rankingCache.members) return null;

    const member = rankingCache.members.find(m => m.name === nickname);
    return member ? member.combatScore : null;
}

// API에서 전투력 조회
async function fetchFromAPI(nickname) {
    const url = `https://mobinogi.net/user/6/${encodeURIComponent(nickname)}`;
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;

    const response = await fetch(proxyUrl);
    const html = await response.text();

    const match = html.match(/window\.__SSR_DATA__\s*=\s*(\{[\s\S]*?\});/);
    if (match) {
        const ssrData = JSON.parse(match[1]);
        if (ssrData.userMetaData && ssrData.userMetaData.length > 0) {
            // 전투력(level)이 가장 높은 클래스 데이터 찾기
            const user = ssrData.userMetaData.reduce((max, u) => u.level > max.level ? u : max);
            return user.level;
        }
    }
    return null;
}

// 전투력 조회 함수 (최대 3회 재시도)
async function fetchCombatPower(nicknameInputId, powerInputId, retryCount = 0) {
    const nicknameInput = document.getElementById(nicknameInputId);
    const powerInput = document.getElementById(powerInputId);
    const nickname = nicknameInput.value.trim();

    if (!nickname) {
        powerInput.value = '';
        powerInput.readOnly = true;
        return;
    }

    powerInput.value = '';
    powerInput.readOnly = true;
    powerInput.placeholder = '조회중...';

    // 1. ranking.json에서 먼저 조회
    await loadRankingData();
    const cachedPower = findInRanking(nickname);

    if (cachedPower) {
        powerInput.value = cachedPower;
        powerInput.placeholder = '자동입력';
        powerInput.readOnly = true;
        console.log(`[전투력] ${nickname}: ranking.json에서 조회 (${cachedPower})`);
        return;
    }

    // 2. API에서 조회
    powerInput.placeholder = retryCount > 0 ? `재시도 ${retryCount}/3...` : 'API 조회중...';

    try {
        const power = await fetchFromAPI(nickname);
        if (power) {
            powerInput.value = power;
            powerInput.placeholder = '자동입력';
            powerInput.readOnly = true;
            console.log(`[전투력] ${nickname}: API에서 조회 (${power})`);
            return;
        }
        throw new Error('데이터 없음');
    } catch (error) {
        console.error(`전투력 조회 실패 (${retryCount + 1}/3):`, error);

        if (retryCount < 2) {
            // 1초 후 재시도
            setTimeout(() => fetchCombatPower(nicknameInputId, powerInputId, retryCount + 1), 1000);
        } else {
            // 3회 실패 시 수기 입력 허용
            powerInput.placeholder = '직접 입력';
            powerInput.readOnly = false;
            powerInput.focus();
            alert('조회가 이뤄지지 않아 직접입력 또는 새로고침 후 재시도 부탁드립니다.');
        }
    }
}

// 닉네임 입력 엔터키 처리
function handleNicknameKeydown(event, powerInputId) {
    if (event.key === 'Enter') {
        event.preventDefault();
        event.target.blur();
    }
}
