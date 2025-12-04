// ===== 설정 =====
const API_CONFIG = {
    // Cloudflare Workers 프록시 URL (배포 후 변경 필요)
    workerUrl    : 'owl.jang9561.workers.dev',
    cacheDuration: 60 * 60 * 1000 // 1시간 (밀리초)
};

// ===== 조회할 캐릭터명 배열 =====
const CHARACTER_NAMES = [
    "보노보노거인",
    "루야쫑쫑",
    "운정",
    "풀뱅기사"
    // 여기에 조회할 캐릭터명 추가
];

// ===== 로컬스토리지 캐시 관리 =====
const CacheManager = {
    CACHE_KEY: 'mabinogi_ranking_cache',

    // 캐시 가져오기
    getCache() {
        try {
            const cache = localStorage.getItem(this.CACHE_KEY);
            return cache ? JSON.parse(cache) : {};
        } catch (e) {
            console.error('캐시 로드 실패:', e);
            return {};
        }
    },

    // 캐시 저장
    setCache(cache) {
        try {
            localStorage.setItem(this.CACHE_KEY, JSON.stringify(cache));
        } catch (e) {
            console.error('캐시 저장 실패:', e);
        }
    },

    // 캐릭터 정보 캐시에서 가져오기 (10분 이내면 반환, 아니면 null)
    getCachedCharacter(characterName) {
        const cache = this.getCache();
        const cached = cache[characterName];

        if (cached) {
            const now = Date.now();
            const elapsed = now - cached.timestamp;

            if (elapsed < API_CONFIG.cacheDuration) {
                console.log(`[캐시] ${characterName}: 캐시에서 로드 (${Math.floor((API_CONFIG.cacheDuration - elapsed) / 1000)}초 남음)`);
                return cached.data;
            } else {
                console.log(`[캐시] ${characterName}: 캐시 만료`);
            }
        }
        return null;
    },

    // 캐릭터 정보 캐시에 저장
    setCachedCharacter(characterName, data) {
        const cache = this.getCache();
        cache[characterName] = {
            data     : data,
            timestamp: Date.now()
        };
        this.setCache(cache);
        console.log(`[캐시] ${characterName}: 캐시에 저장됨`);
    },

    // 만료된 캐시 정리
    cleanExpiredCache() {
        const cache = this.getCache();
        const now = Date.now();
        let cleaned = false;

        Object.keys(cache).forEach(key => {
            if (now - cache[key].timestamp >= API_CONFIG.cacheDuration) {
                delete cache[key];
                cleaned = true;
            }
        });

        if (cleaned) {
            this.setCache(cache);
        }
    }
};

// ===== API 호출 및 파싱 =====
const RankingAPI = {
    // Cloudflare Workers 프록시를 통해 캐릭터 정보 가져오기
    async fetchCharacterRanking(characterName) {
        const params = new URLSearchParams({
            t     : '4',        // 랭킹 타입
            s     : '6',        // 서버 (전체)
            c     : '0',        // 클래스 (전체)
            search: characterName
        });

        try {
            const response = await fetch(`${API_CONFIG.workerUrl}?${params.toString()}`, {
                method: 'GET'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const html = await response.text();
            return this.parseRankingHTML(html, characterName);
        } catch (error) {
            console.error(`[API] ${characterName} 조회 실패:`, error);
            return null;
        }
    },

    // HTML 응답에서 캐릭터 정보 파싱
    parseRankingHTML(html, targetCharacter) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // class="item on" 또는 data-charactername으로 찾기
        const items = doc.querySelectorAll('li.item');

        for (const item of items) {
            const nameElement = item.querySelector('dd[data-charactername]');
            if (!nameElement) continue;

            const characterName = nameElement.getAttribute('data-charactername');

            if (characterName === targetCharacter || item.classList.contains('on')) {
                // 순위 추출
                const rankElement = item.querySelector('dl > dt');
                const rankText = rankElement ? rankElement.textContent.trim() : '';
                const rank = rankText.replace('위', '').replace(/,/g, '').trim();

                // 서버명 추출
                const serverElement = item.querySelectorAll('div > dl')[1]?.querySelector('dd');
                const server = serverElement ? serverElement.textContent.trim() : '';

                // 클래스 추출
                const classElement = item.querySelector('dl dt:contains("클래스")');
                const classDD = item.querySelectorAll('div > dl')[3]?.querySelector('dd');
                const characterClass = classDD ? classDD.textContent.trim() : '';

                // 종합 점수 추출
                const scoreContainer = item.querySelector('dl dt span:last-child');
                const totalScore = scoreContainer ? scoreContainer.textContent.trim().replace(/,/g, '') : '';

                // 세부 점수 추출
                const type1 = item.querySelector('.type_1')?.textContent.trim().replace(/,/g, '') || '';
                const type2 = item.querySelector('.type_2')?.textContent.trim().replace(/,/g, '') || '';
                const type3 = item.querySelector('.type_3')?.textContent.trim().replace(/,/g, '') || '';

                return {
                    name             : characterName,
                    rank             : parseInt(rank) || 0,
                    rankDisplay      : rankText,
                    server           : server,
                    class            : characterClass,
                    totalScore       : parseInt(totalScore) || 0,
                    totalScoreDisplay: scoreContainer ? scoreContainer.textContent.trim() : '',
                    attackScore      : parseInt(type1) || 0,
                    defenseScore     : parseInt(type3) || 0,
                    lifeScore        : parseInt(type2) || 0
                };
            }
        }

        return null;
    }
};

// ===== 메인 로직 =====
let guildMembers = []; // API에서 가져온 캐릭터 데이터

// 숫자 포맷 (1,234,567 형식)
function formatNumber(num) {
    return num.toLocaleString('ko-KR');
}

// 클래스별 아이콘
function getClassIcon(className) {
    const classIcons = {
        '검술사' : '⚔️',
        '대검전사': '🗡️',
        '화염술사': '🔥',
        '빙결술사': '❄️',
        '전격술사': '⚡',
        '석궁사수': '🏹',
        '장궁병' : '🎯',
        '힐러'  : '💚',
        '사제'  : '✨',
        '악사'  : '🎵'
    };
    return classIcons[className] || '👤';
}

// 랭킹 테이블 렌더링
function renderRankingTable() {
    const tbody = document.getElementById('ranking-body');
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

    // 순위순으로 정렬
    const sortedMembers = [...guildMembers].sort((a, b) => a.rank - b.rank);

    tbody.innerHTML = sortedMembers.map((member, index) => `
        <tr>
            <td class="rank ${index < 3 ? 'rank-' + (index + 1) : ''}">
                ${index < 3
        ? `<span class="rank-badge">${member.rank.toLocaleString()}</span>`
        : member.rank.toLocaleString()}
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
                    <span class="score-attack" title="공격">${formatNumber(member.attackScore)}</span>
                    <span class="score-defense" title="방어">${formatNumber(member.defenseScore)}</span>
                    <span class="score-life" title="생명">${formatNumber(member.lifeScore)}</span>
                </div>
            </td>
            <td class="hide-mobile">
                <span class="rank-display">${member.rankDisplay}</span>
            </td>
        </tr>
    `).join('');
}

// 모든 캐릭터 조회
async function fetchAllCharacters() {
    console.log('[시작] 캐릭터 랭킹 조회 시작');

    // 만료된 캐시 정리
    CacheManager.cleanExpiredCache();

    const results = [];
    const fetchPromises = [];

    for (const characterName of CHARACTER_NAMES) {
        // 캐시 확인
        const cached = CacheManager.getCachedCharacter(characterName);

        if (cached) {
            results.push(cached);
        } else {
            // API 호출 (Promise 배열에 추가)
            fetchPromises.push(
                RankingAPI.fetchCharacterRanking(characterName).then(data => {
                    if (data) {
                        CacheManager.setCachedCharacter(characterName, data);
                        results.push(data);
                    } else {
                        console.warn(`[경고] ${characterName}: 데이터를 찾을 수 없음`);
                    }
                })
            );
        }
    }

    // 모든 API 호출 완료 대기
    if (fetchPromises.length > 0) {
        await Promise.all(fetchPromises);
    }

    console.log(`[완료] ${results.length}명의 캐릭터 정보 로드됨`);
    guildMembers = results;
    renderRankingTable();
}

// 새로고침 버튼 핸들러
function refreshRanking() {
    // 캐시 강제 삭제
    localStorage.removeItem(CacheManager.CACHE_KEY);
    guildMembers = [];
    renderRankingTable();
    fetchAllCharacters();
}

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', function () {
    renderRankingTable();
    fetchAllCharacters();
});
