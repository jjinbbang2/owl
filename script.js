// ===== 설정 =====
const CONFIG = {
    dataUrl: './data/ranking.json'
};

// ===== 네비게이션 =====
function toggleNav() {
    const navMenu = document.getElementById('navMenu');
    navMenu.classList.toggle('active');
}

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
                        <div class="character-class">${member.class}</div>
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

// ===== 캐릭터 등록/삭제 기능 =====
const DELETE_PASSWORD = '0328';
const VERIFY_API_URL = 'https://mobinogi.net/user/6/';

// GitHub 워크플로우 트리거
async function triggerRankingUpdate() {
    if (!GITHUB_CONFIG.pat) {
        console.log('[알림] GitHub PAT가 설정되지 않아 자동 갱신을 건너뜁니다.');
        return false;
    }

    try {
        const response = await fetch(
            `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/actions/workflows/${GITHUB_CONFIG.workflowId}/dispatches`,
            {
                method: 'POST',
                headers: {
                    'Accept': 'application/vnd.github.v3+json',
                    'Authorization': `Bearer ${GITHUB_CONFIG.pat}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ ref: 'main' })
            }
        );

        if (response.status === 204) {
            console.log('[성공] 랭킹 업데이트 워크플로우가 시작되었습니다.');
            return true;
        } else {
            console.error('[실패] 워크플로우 트리거 실패:', response.status);
            return false;
        }
    } catch (error) {
        console.error('[오류] 워크플로우 트리거 오류:', error);
        return false;
    }
}

// 모달 열기/닫기
function openAddModal() {
    document.getElementById('addModal').classList.remove('hidden');
    document.getElementById('addCharacterName').value = '';
    document.getElementById('addStatus').classList.add('hidden');
    document.getElementById('addBtn').disabled = false;
    document.getElementById('addBtn').textContent = '등록';
}

function closeAddModal() {
    document.getElementById('addModal').classList.add('hidden');
}

async function openDeleteModal() {
    document.getElementById('deleteModal').classList.remove('hidden');
    document.getElementById('deletePassword').value = '';
    document.getElementById('deleteStatus').classList.add('hidden');

    // Supabase에서 캐릭터 목록 가져오기
    const select = document.getElementById('deleteCharacterSelect');
    select.innerHTML = '<option value="">캐릭터를 선택하세요</option>';

    try {
        const { data, error } = await supabase
            .from('ranking_characters')
            .select('id, name')
            .order('name', { ascending: true });

        if (error) throw error;

        data.forEach(char => {
            const option = document.createElement('option');
            option.value = char.id;
            option.textContent = char.name;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('캐릭터 목록 로드 실패:', error);
    }
}

function closeDeleteModal() {
    document.getElementById('deleteModal').classList.add('hidden');
}

// 모달 외부 클릭 시 닫기
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        e.target.classList.add('hidden');
    }
});

// 상태 메시지 표시
function showStatus(elementId, message, type) {
    const el = document.getElementById(elementId);
    el.textContent = message;
    el.className = `status-message ${type}`;
    el.classList.remove('hidden');
}

// 캐릭터 존재 확인 (API 호출 - CORS 프록시 사용)
async function verifyCharacterExists(characterName) {
    try {
        const url = `${VERIFY_API_URL}${encodeURIComponent(characterName)}`;
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;

        const response = await fetch(proxyUrl);
        if (!response.ok) return false;

        const html = await response.text();
        const match = html.match(/window\.__SSR_DATA__\s*=\s*(\{[\s\S]*?\});/);
        if (!match) return false;

        const data = JSON.parse(match[1]);
        return data.userMetaData && data.userMetaData.length > 0;
    } catch (error) {
        console.error('캐릭터 확인 오류:', error);
        return false;
    }
}

// 딜레이 함수
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 캐릭터 등록
async function addCharacter() {
    const nameInput = document.getElementById('addCharacterName');
    const characterName = nameInput.value.trim();
    const btn = document.getElementById('addBtn');

    if (!characterName) {
        showStatus('addStatus', '캐릭터 닉네임을 입력해주세요.', 'error');
        return;
    }

    btn.disabled = true;

    // 이미 등록된 캐릭터인지 확인
    try {
        const { data: existing } = await supabase
            .from('ranking_characters')
            .select('id')
            .eq('name', characterName)
            .single();

        if (existing) {
            showStatus('addStatus', '이미 등록된 캐릭터입니다.', 'error');
            btn.disabled = false;
            return;
        }
    } catch (e) {
        // 없으면 에러가 나므로 정상
    }

    // 캐릭터 존재 확인 (2초 간격 최대 10회)
    let found = false;
    for (let i = 1; i <= 10; i++) {
        showStatus('addStatus', `캐릭터 확인 중... (${i}/10)`, 'info');
        btn.textContent = `확인 중 (${i}/10)`;

        found = await verifyCharacterExists(characterName);
        if (found) break;

        if (i < 10) {
            await delay(2000);
        }
    }

    if (!found) {
        showStatus('addStatus', '캐릭터를 찾을 수 없습니다. 닉네임을 확인해주세요.', 'error');
        btn.disabled = false;
        btn.textContent = '등록';
        return;
    }

    // Supabase에 등록
    try {
        const { error } = await supabase
            .from('ranking_characters')
            .insert({ name: characterName });

        if (error) throw error;

        showStatus('addStatus', '캐릭터가 등록되었습니다! 랭킹 데이터 갱신 중...', 'success');
        btn.textContent = '완료!';

        // 워크플로우 트리거
        const triggered = await triggerRankingUpdate();
        if (triggered) {
            showStatus('addStatus', '캐릭터가 등록되었습니다! 잠시 후 랭킹에 반영됩니다.', 'success');
        } else {
            showStatus('addStatus', '캐릭터가 등록되었습니다! 다음 자동 업데이트 시 반영됩니다.', 'success');
        }

        setTimeout(() => {
            closeAddModal();
        }, 2500);

    } catch (error) {
        showStatus('addStatus', '등록 실패: ' + error.message, 'error');
        btn.disabled = false;
        btn.textContent = '등록';
    }
}

// 캐릭터 삭제
async function deleteCharacter() {
    const select = document.getElementById('deleteCharacterSelect');
    const password = document.getElementById('deletePassword').value;
    const characterId = select.value;
    const characterName = select.options[select.selectedIndex].text;

    if (!characterId) {
        showStatus('deleteStatus', '삭제할 캐릭터를 선택해주세요.', 'error');
        return;
    }

    if (password !== DELETE_PASSWORD) {
        showStatus('deleteStatus', '비밀번호가 올바르지 않습니다.', 'error');
        return;
    }

    if (!confirm(`정말 "${characterName}" 캐릭터를 삭제하시겠습니까?`)) {
        return;
    }

    try {
        const { error } = await supabase
            .from('ranking_characters')
            .delete()
            .eq('id', characterId);

        if (error) throw error;

        showStatus('deleteStatus', '캐릭터가 삭제되었습니다! 랭킹 데이터 갱신 중...', 'success');

        // 워크플로우 트리거
        const triggered = await triggerRankingUpdate();
        if (triggered) {
            showStatus('deleteStatus', '캐릭터가 삭제되었습니다! 잠시 후 랭킹에 반영됩니다.', 'success');
        } else {
            showStatus('deleteStatus', '캐릭터가 삭제되었습니다! 다음 자동 업데이트 시 반영됩니다.', 'success');
        }

        setTimeout(() => {
            closeDeleteModal();
        }, 2000);

    } catch (error) {
        showStatus('deleteStatus', '삭제 실패: ' + error.message, 'error');
    }
}

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', function () {
    renderRankingTable();
    loadRankingData();
});
