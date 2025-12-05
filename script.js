// ===== 설정 =====
const CONFIG = {
    dataUrl: './data/ranking.json'
};

// ===== 메인 로직 =====
let guildMembers = [];
let lastUpdated = null;

// 숫자 포맷 (1,234,567 형식)
function formatNumber(num) {
    return num.toLocaleString('ko-KR');
}

// 클래스별 아이콘
function getClassIcon(className) {
    const classIcons = {
        '검술사' : '⚔️',
        '대검전사': '🗡️',
        '전사'  : '🛡️',
        '화염술사': '🔥',
        '빙결술사': '❄️',
        '전격술사': '⚡',
        '마법사' : '🔮',
        '석궁사수': '🏹',
        '장궁병' : '🎯',
        '힐러'  : '💚',
        '사제'  : '✨',
        '악사'  : '🎵',
        '음유시인': '🎶',
        '권술사' : '👊'
    };
    return classIcons[className] || '👤';
}

// 종합 랭킹 테이블 렌더링
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

    // 종합점수순으로 정렬
    const sortedMembers = [...guildMembers].sort((a, b) => b.totalScore - a.totalScore);

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
                    <span class="score-attack">전투력 ${formatNumber(member.combatScore)}</span>
                    <span class="score-life">생활력 ${formatNumber(member.lifeScore)}</span>
                    <span class="score-charm">매력 ${formatNumber(member.charmScore)}</span>
                </div>
            </td>
            <td class="hide-mobile">
                <span class="rank-display">${member.rankDisplay}</span>
            </td>
        </tr>
    `).join('');
}

// 마지막 업데이트 시간 표시
function renderLastUpdated() {
    const element = document.getElementById('last-updated');
    if (!element || !lastUpdated) return;

    const date = new Date(lastUpdated);
    const options = {
        year  : 'numeric',
        month : 'long',
        day   : 'numeric',
        hour  : '2-digit',
        minute: '2-digit',
        hour12: false
    };
    const formattedDate = date.toLocaleDateString('ko-KR', options);
    element.textContent = `마지막 업데이트: ${formattedDate}`;
}

// 세부 점수 랭킹 테이블 렌더링
function renderDetailRankings() {
    renderDetailTable('combat-ranking-body', 'combatScore', 'score-attack');
    renderDetailTable('life-ranking-body', 'lifeScore', 'score-life');
    renderDetailTable('charm-ranking-body', 'charmScore', 'score-charm');
}

function renderDetailTable(tbodyId, scoreKey, scoreClass) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody || guildMembers.length === 0) return;

    const sortedMembers = [...guildMembers].sort((a, b) => b[scoreKey] - a[scoreKey]);

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
                        <div class="character-class">${member.class}</div>
                    </div>
                </div>
            </td>
            <td class="${scoreClass}">${formatNumber(member[scoreKey])}</td>
        </tr>
    `).join('');
}

// JSON 파일에서 데이터 로드
async function loadRankingData() {
    const tbody = document.getElementById('ranking-body');

    try {
        const response = await fetch(`${CONFIG.dataUrl}?t=${Date.now()}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        guildMembers = data.members || [];
        lastUpdated = data.updatedAt;

        console.log(`[완료] ${guildMembers.length}명의 캐릭터 정보 로드됨`);
        renderRankingTable();
        renderDetailRankings();
        renderLastUpdated();
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

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', function () {
    renderRankingTable();
    loadRankingData();
});
