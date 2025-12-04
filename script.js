// ===== 설정 =====
const CONFIG = {
    apiBaseUrl: 'https://mabimobi.life/d/api/v1/search/rankings/v2',
    dataUrl: './data/ranking.json',
    server: '06', // 라사 서버
    characters: ['풀뱅기사', '운정', '루야쫑쫑', '보노보노거인'],
    cacheDuration: 24 * 60 * 60 * 1000 // 24시간 (밀리초)
};

// ===== 메인 로직 =====
let guildMembers = [];
let lastUpdated = null;

// 숫자 포맷 (1,234,567 형식)
function formatNumber(num) {
    return num.toLocaleString('ko-KR');
}

// 직업 코드 → 이름 변환
function getClassName(klassCode) {
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
    return klassNames[klassCode] || '알 수 없음';
}

// 클래스별 아이콘
function getClassIcon(className) {
    const classIcons = {
        '검술사': '⚔️',
        '대검전사': '🗡️',
        '전사': '🛡️',
        '화염술사': '🔥',
        '빙결술사': '❄️',
        '전격술사': '⚡',
        '마법사': '🔮',
        '석궁사수': '🏹',
        '장궁병': '🎯',
        '힐러': '💚',
        '사제': '✨',
        '악사': '🎵',
        '음유시인': '🎶',
        '권술사': '👊'
    };
    return classIcons[className] || '👤';
}

// 업데이트 시간 표시
function formatUpdateTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// 랭킹 테이블 렌더링
function renderRankingTable() {
    const tbody = document.getElementById('ranking-body');
    const updateInfo = document.getElementById('update-info');

    if (!tbody) return;

    if (guildMembers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 40px; color: #888;">
                    <div>데이터를 불러오는 중...</div>
                    <div style="font-size: 0.8rem; margin-top: 10px;">잠시만 기다려주세요</div>
                </td>
            </tr>
        `;
        return;
    }

    // 업데이트 시간 표시
    if (updateInfo && lastUpdated) {
        updateInfo.textContent = `마지막 업데이트: ${formatUpdateTime(lastUpdated)}`;
    }

    // 순위순으로 정렬
    const sortedMembers = [...guildMembers].sort((a, b) => a.rank - b.rank);

    tbody.innerHTML = sortedMembers.map((member, index) => `
        <tr>
            <td class="rank ${index < 3 ? 'rank-' + (index + 1) : ''}">
                ${index < 3
                    ? `<span class="rank-badge">${index + 1}</span>`
                    : index + 1}
            </td>
            <td>
                <div class="character-info">
                    <div class="character-avatar">${getClassIcon(member.class)}</div>
                    <div>
                        <div class="character-name">${member.name}</div>
                        <div class="character-class">${member.class} · ${member.server}</div>
                    </div>
                </div>
            </td>
            <td class="total-score">${member.totalScoreDisplay}</td>
            <td class="hide-mobile">
                <div class="score-detail">
                    <span class="score-attack">전투력 ${formatNumber(member.attackScore)}</span>
                    <span class="score-defense">매력 ${formatNumber(member.defenseScore)}</span>
                    <span class="score-life">생활력 ${formatNumber(member.lifeScore)}</span>
                </div>
            </td>
            <td class="hide-mobile">
                <span class="rank-display">${member.rankDisplay}</span>
            </td>
        </tr>
    `).join('');
}

// API에서 캐릭터 데이터 조회
async function fetchCharacterData(characterName) {
    const url = `${CONFIG.apiBaseUrl}?server=${CONFIG.server}&character_name=${encodeURIComponent(characterName)}&sort_by=combat&sort_order=desc&page=1&per_page=20`;

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
}

// 딜레이 함수
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// JSON 파일에서 캐시 로드
async function loadCacheFromFile() {
    try {
        const response = await fetch(CONFIG.dataUrl);
        if (!response.ok) return null;

        const data = await response.json();
        const cacheTime = new Date(data.updatedAt).getTime();
        const now = Date.now();

        if (now - cacheTime < CONFIG.cacheDuration) {
            console.log('[파일] 유효한 캐시 데이터 사용');
            return data;
        } else {
            console.log('[파일] 캐시 만료 (24시간 경과)');
            return { expired: true, data };
        }
    } catch (error) {
        console.log('[파일] 캐시 파일 없음, API 호출 필요');
        return null;
    }
}

// API에서 새 데이터 가져오기
async function fetchAllCharacters() {
    console.log('[API] 캐릭터 정보 조회 중...');

    const results = [];
    for (let i = 0; i < CONFIG.characters.length; i++) {
        const name = CONFIG.characters[i];

        // 첫 번째 요청 이후에는 1.5초 딜레이
        if (i > 0) {
            await delay(1500);
        }

        try {
            const data = await fetchCharacterData(name);
            console.log(`[API] ${name} 조회 성공 (${i + 1}/${CONFIG.characters.length})`);
            results.push({ name, data });
        } catch (error) {
            console.error(`[API] ${name} 조회 실패:`, error);
            results.push({ name, data: null });
        }
    }

    // 결과 파싱 (정확한 닉네임만 필터링)
    const members = [];
    for (const result of results) {
        const { name: searchName, data } = result;

        if (!data || !Array.isArray(data) || data.length === 0) continue;

        // 정확한 닉네임 매칭
        const char = data.find(c => c.character_name === searchName);
        if (!char) continue;

        members.push({
            name: char.character_name,
            rank: char.server_combat_rank,
            rankDisplay: char.server_combat_rank.toLocaleString() + '위',
            server: '라사',
            class: getClassName(char.klass),
            totalScore: char.total,
            totalScoreDisplay: char.total.toLocaleString(),
            attackScore: char.combat,
            defenseScore: char.charm,
            lifeScore: char.life_skill
        });
    }

    return members;
}

// 모든 캐릭터 데이터 로드
async function loadRankingData() {
    const tbody = document.getElementById('ranking-body');

    try {
        // 1. 파일 캐시 확인
        const cached = await loadCacheFromFile();

        // 캐시에 없는 캐릭터 찾기
        const cachedNames = (cached?.members || cached?.data?.members || []).map(m => m.name);
        const missingCharacters = CONFIG.characters.filter(name => !cachedNames.includes(name));

        if (cached && !cached.expired && cached.members && cached.members.length > 0 && missingCharacters.length === 0) {
            // 24시간 이내 + 모든 캐릭터 있음 → 파일 데이터 사용
            guildMembers = cached.members;
            lastUpdated = cached.updatedAt;
            console.log(`[파일] ${guildMembers.length}명의 캐릭터 정보 로드됨`);
            renderRankingTable();
            return;
        }

        if (missingCharacters.length > 0) {
            console.log(`[확인] 누락된 캐릭터: ${missingCharacters.join(', ')}`);
        }

        // 2. 캐시 만료 또는 누락 캐릭터 있음 → API 호출
        const members = await fetchAllCharacters();

        if (members.length > 0) {
            guildMembers = members;
            lastUpdated = new Date().toISOString();

            // 콘솔에 JSON 출력 (복사해서 ranking.json에 붙여넣기용)
            const jsonData = {
                updatedAt: lastUpdated,
                members: members
            };
            console.log('[저장용 JSON] 아래 내용을 data/ranking.json에 저장하세요:');
            console.log(JSON.stringify(jsonData, null, 2));

            console.log(`[API] ${guildMembers.length}명의 캐릭터 정보 로드됨`);
            renderRankingTable();
        } else if (cached && cached.expired) {
            // API 실패 시 만료된 캐시라도 사용
            guildMembers = cached.data.members;
            lastUpdated = cached.data.updatedAt;
            console.log(`[파일] 만료된 캐시 사용 (${guildMembers.length}명)`);
            renderRankingTable();
        }
    } catch (error) {
        console.error('[오류] 데이터 로드 실패:', error);

        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 40px; color: #f87171;">
                        <div>데이터를 불러올 수 없습니다</div>
                        <div style="font-size: 0.8rem; margin-top: 10px;">잠시 후 다시 시도해주세요</div>
                    </td>
                </tr>
            `;
        }
    }
}

// 새로고침 버튼 핸들러
function refreshRanking() {
    guildMembers = [];
    renderRankingTable();
    loadRankingData();
}

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', function() {
    renderRankingTable();
    loadRankingData();
});
