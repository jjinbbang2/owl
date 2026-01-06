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

// ranking.json에서 전투력과 클래스 찾기
function findInRanking(nickname) {
    if (!rankingCache || !rankingCache.members) return null;

    const member = rankingCache.members.find(m => m.name === nickname);
    if (member) {
        return {
            combatPower: member.combatScore,
            className: member.class,
            showCombatPower: member.showCombatPower !== false
        };
    }
    return null;
}

// 파티 페이지용: 전투력 비공개 여부 확인하여 표시값 반환
function getDisplayPower(nickname, combatPower) {
    // ranking.json에서 해당 닉네임의 설정 조회
    if (rankingCache && rankingCache.members) {
        const member = rankingCache.members.find(m => m.name === nickname);
        if (member && member.showCombatPower === false) {
            return '비공개';
        }
    }
    // 설정이 없거나 공개인 경우 정상 표시
    if (!combatPower) return '-';
    const inManUnit = Math.floor(combatPower / 1000) / 10;
    return inManUnit.toFixed(1);
}

// API에서 전투력과 클래스 조회 (5초 타임아웃)
async function fetchFromAPI(nickname) {
    const url = `https://mobinogi.net/user/6/${encodeURIComponent(nickname)}`;
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
        const response = await fetch(proxyUrl, { signal: controller.signal });
        clearTimeout(timeoutId);
        const html = await response.text();

        const match = html.match(/window\.__SSR_DATA__\s*=\s*(\{[\s\S]*?\});/);
        if (match) {
            const ssrData = JSON.parse(match[1]);
            if (ssrData.userMetaData && ssrData.userMetaData.length > 0) {
                // 전투력(level)이 가장 높은 클래스 데이터 찾기
                const user = ssrData.userMetaData.reduce((max, u) => u.level > max.level ? u : max);
                return {
                    combatPower: user.level,
                    className: user.class_name || null
                };
            }
        }
        return null;
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            console.error('API 호출 타임아웃 (5초)');
        }
        throw error;
    }
}

// 전투력 조회 함수 (최대 3회 재시도)
// classInputId가 제공되면 클래스도 자동 입력
async function fetchCombatPower(nicknameInputId, powerInputId, classInputId = null, retryCount = 0) {
    const nicknameInput = document.getElementById(nicknameInputId);
    const powerInput = document.getElementById(powerInputId);
    const classInput = classInputId ? document.getElementById(classInputId) : null;
    const nickname = nicknameInput.value.trim();

    if (!nickname) {
        powerInput.value = '';
        powerInput.readOnly = true;
        if (classInput) classInput.value = '';
        return;
    }

    powerInput.value = '';
    powerInput.readOnly = true;
    powerInput.placeholder = '조회중...';
    if (classInput) classInput.value = '';

    // 1. ranking.json에서 먼저 조회
    await loadRankingData();
    const cachedData = findInRanking(nickname);

    if (cachedData) {
        // 전투력 비공개 설정 확인
        if (cachedData.showCombatPower === false) {
            powerInput.type = 'text';
            powerInput.value = '비공개';
            powerInput.placeholder = '비공개';
            powerInput.readOnly = true;
            powerInput.dataset.actualPower = cachedData.combatPower; // 실제 값은 data 속성에 저장
        } else {
            powerInput.type = 'number';
            powerInput.value = cachedData.combatPower;
            powerInput.placeholder = '자동입력';
            powerInput.readOnly = true;
            delete powerInput.dataset.actualPower;
        }
        if (classInput && cachedData.className) {
            classInput.value = cachedData.className;
        }
        console.log(`[전투력] ${nickname}: ranking.json에서 조회 (${cachedData.combatPower}, ${cachedData.className}, 공개: ${cachedData.showCombatPower})`);
        return;
    }

    // 2. API에서 조회
    powerInput.placeholder = retryCount > 0 ? `재시도 ${retryCount}/3...` : 'API 조회중...';

    try {
        const data = await fetchFromAPI(nickname);
        if (data) {
            powerInput.value = data.combatPower;
            powerInput.placeholder = '자동입력';
            powerInput.readOnly = true;
            if (classInput && data.className) {
                classInput.value = data.className;
            }
            console.log(`[전투력] ${nickname}: API에서 조회 (${data.combatPower}, ${data.className})`);
            return;
        }
        throw new Error('데이터 없음');
    } catch (error) {
        console.error(`전투력 조회 실패 (${retryCount + 1}/3):`, error);

        if (retryCount < 2) {
            // 1초 후 재시도
            setTimeout(() => fetchCombatPower(nicknameInputId, powerInputId, classInputId, retryCount + 1), 1000);
        } else {
            // 3회 실패 시 수기 입력 허용
            powerInput.placeholder = '직접 입력';
            powerInput.readOnly = false;
            if (classInput) {
                classInput.placeholder = '직접 입력';
                classInput.readOnly = false;
            }
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

// 전투력 입력 필드에서 실제 값 가져오기
// 비공개인 경우 data-actual-power 속성에서 가져옴
function getActualPowerValue(powerInputId) {
    const powerInput = document.getElementById(powerInputId);
    if (!powerInput) return null;

    // 비공개인 경우 실제 값은 data 속성에 저장됨
    if (powerInput.dataset.actualPower) {
        return parseInt(powerInput.dataset.actualPower, 10);
    }

    // 일반적인 경우
    const value = powerInput.value;
    if (!value || value === '비공개') return null;
    return parseInt(value, 10);
}
