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
        '검술사': '⚔️',
        '대검전사': '🗡️',
        '화염술사': '🔥',
        '빙결술사': '❄️',
        '전격술사': '⚡',
        '석궁사수': '🏹',
        '장궁병': '🎯',
        '힐러': '💚',
        '사제': '✨',
        '악사': '🎵'
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

// JSON 파일에서 데이터 로드
async function loadRankingData() {
    try {
        const response = await fetch(CONFIG.dataUrl);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        lastUpdated = data.updatedAt;
        guildMembers = data.characters || [];

        console.log(`[완료] ${guildMembers.length}명의 캐릭터 정보 로드됨`);
        renderRankingTable();
    } catch (error) {
        console.error('[오류] 데이터 로드 실패:', error);

        const tbody = document.getElementById('ranking-body');
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
