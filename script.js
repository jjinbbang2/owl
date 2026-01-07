// ===== 설정 =====
const CONFIG = {
    dataUrl: './data/ranking.json' // 백업용
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

// 클래스별 아이콘 (마비노기 모바일 공식 아이콘)
const CLASS_ICONS = {
    // 전사 계열
    '견습 전사': 'https://lwi.nexon.com/m_mabinogim/brand/info/class/warrior_icon_1_65811EBD4BEC0285.png',
    '전사'    : 'https://lwi.nexon.com/m_mabinogim/brand/info/class/warrior_icon_2_82FBE98DCDF420BB.png',
    '대검전사' : 'https://lwi.nexon.com/m_mabinogim/brand/info/class/warrior_icon_3_753F0A05E1F5E2F8.png',
    '검술사'  : 'https://lwi.nexon.com/m_mabinogim/brand/info/class/warrior_icon_4_C1812DE239AB0EC8.png',
    // 궁수 계열
    '견습 궁수': 'https://lwi.nexon.com/m_mabinogim/brand/info/class/archer_icon_1_6C95C482C969A5DA.png',
    '궁수'    : 'https://lwi.nexon.com/m_mabinogim/brand/info/class/archer_icon_2_A336FF08A4F57E5A.png',
    '석궁사수' : 'https://lwi.nexon.com/m_mabinogim/brand/info/class/archer_icon_3_3406C778F7F364AF.png',
    '장궁병'  : 'https://lwi.nexon.com/m_mabinogim/brand/info/class/archer_icon_4_D99A386A246CC076.png',
    // 마법사 계열
    '견습 마법사': 'https://lwi.nexon.com/m_mabinogim/brand/info/class/mage_icon_1_3399B9475E5FD2BA.png',
    '마법사'  : 'https://lwi.nexon.com/m_mabinogim/brand/info/class/mage_icon_2_8A3C50B41D1A1A9E.png',
    '화염술사' : 'https://lwi.nexon.com/m_mabinogim/brand/info/class/mage_icon_3_A721D69252722705.png',
    '빙결술사' : 'https://lwi.nexon.com/m_mabinogim/brand/info/class/mage_icon_4_A4B1DBBE4891A929.png',
    '전격술사' : 'https://lwi.nexon.com/m_mabinogim/brand/info/class/mage_icon_5_EB114856CBE160D2.png',
    // 힐러 계열
    '견습 힐러': 'https://lwi.nexon.com/m_mabinogim/brand/info/class/healer_icon_1_697BB71C01BA77C7.png',
    '힐러'    : 'https://lwi.nexon.com/m_mabinogim/brand/info/class/healer_icon_2_15972371DB794119.png',
    '사제'    : 'https://lwi.nexon.com/m_mabinogim/brand/info/class/healer_icon_3_5F6E5C85FD70A719.png',
    '수도사'  : 'https://lwi.nexon.com/m_mabinogim/brand/info/class/healer_icon_4_D9E416836A696233.png',
    '암흑술사' : 'https://lwi.nexon.com/m_mabinogim/brand/info/class/healer_icon_5_589CF9A334A77B91.png',
    // 음유시인 계열
    '견습 음유시인': 'https://lwi.nexon.com/m_mabinogim/brand/info/class/bard_icon_1_410D309C3257989E.png',
    '음유시인' : 'https://lwi.nexon.com/m_mabinogim/brand/info/class/bard_icon_2_AD3BA497BA26AFE8.png',
    '댄서'    : 'https://lwi.nexon.com/m_mabinogim/brand/info/class/bard_icon_3_C866D0245C7D57D4.png',
    '악사'    : 'https://lwi.nexon.com/m_mabinogim/brand/info/class/bard_icon_4_A3E490DA005190F0.png',
    // 도적 계열
    '견습 도적': 'https://lwi.nexon.com/m_mabinogim/brand/info/class/thief_icon_1_A8450BD19314134E.png',
    '도적'    : 'https://lwi.nexon.com/m_mabinogim/brand/info/class/thief_icon_2_A8450BD19314134E.png',
    '격투가'  : 'https://lwi.nexon.com/m_mabinogim/brand/info/class/thief_icon_3_A8450BD19314134E.png',
    '듀얼블레이드': 'https://lwi.nexon.com/m_mabinogim/brand/info/class/thief_icon_4_A8450BD19314134E.png'
};

// 캐시 버스팅 버전 (아이콘 변경 시 숫자 증가)
const ICON_VERSION = 'v2';

function getClassIcon(className) {
    const iconUrl = CLASS_ICONS[className];
    if (iconUrl) {
        return `<img src="${iconUrl}?${ICON_VERSION}" alt="${className}" class="class-icon">`;
    }
    // 기본 아이콘 (알 수 없는 클래스)
    return `<img src="./images/classes/default.svg?${ICON_VERSION}" alt="${className}" class="class-icon">`;
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

    // visibility === 0(모두공개)인 멤버만 필터링 후 종합점수순으로 정렬
    const visibleMembers = guildMembers.filter(m => m.visibility === 0);
    const sortedMembers = [...visibleMembers].sort((a, b) => b.totalScore - a.totalScore);

    tbody.innerHTML = sortedMembers.map((member, index) => {
        const combatDisplay = member.visibility !== 2
            ? formatNumber(member.combatScore)
            : '비공개';
        return `
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
            <td class="detail-col">
                <div class="score-detail">
                    <span class="score-attack"><span class="score-label">전투력</span> ${combatDisplay}</span>
                    <span class="score-life"><span class="score-label">생활력</span> ${formatNumber(member.lifeScore)}</span>
                    <span class="score-charm"><span class="score-label">매력</span> ${formatNumber(member.charmScore)}</span>
                </div>
            </td>
            <td class="rank-col">
                <span class="rank-display">${member.rankDisplay}</span>
            </td>
        </tr>
    `;
    }).join('');
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

    // visibility === 0(모두공개)인 멤버만 필터링
    let visibleMembers = guildMembers.filter(m => m.visibility === 0);

    // 전투력 랭킹의 경우 visibility !== 2(비공개)도 체크
    if (scoreKey === 'combatScore') {
        visibleMembers = visibleMembers.filter(m => m.visibility !== 2);
    }

    const sortedMembers = [...visibleMembers].sort((a, b) => b[scoreKey] - a[scoreKey]);

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

// DB에서 데이터 로드
async function loadRankingData() {
    const tbody = document.getElementById('ranking-body');

    try {
        // rankings 테이블과 ranking_characters 테이블 조인하여 visibility 가져오기
        const { data: rankings, error: rankError } = await supabase
            .from('rankings')
            .select('*');

        if (rankError) throw rankError;

        const { data: characters, error: charError } = await supabase
            .from('ranking_characters')
            .select('name, visibility');

        if (charError) throw charError;

        // visibility 매핑
        const visibilityMap = {};
        characters.forEach(c => {
            visibilityMap[c.name] = c.visibility ?? 0;
        });

        // 데이터 변환
        guildMembers = rankings.map(r => ({
            name: r.name,
            rank: r.rank,
            rankDisplay: r.rank ? r.rank.toLocaleString() + '위' : '-',
            server: r.server,
            class: r.class,
            totalScore: r.total_score,
            totalScoreDisplay: r.total_score ? r.total_score.toLocaleString() : '-',
            combatScore: r.combat_score,
            lifeScore: r.life_score,
            charmScore: r.charm_score,
            source: r.source,
            visibility: visibilityMap[r.name] ?? 0
        }));

        // 가장 최근 updated_at 찾기
        if (rankings.length > 0) {
            const latestUpdate = rankings.reduce((max, r) =>
                new Date(r.updated_at) > new Date(max) ? r.updated_at : max,
                rankings[0].updated_at
            );
            lastUpdated = latestUpdate;
        }

        console.log(`[완료] ${guildMembers.length}명의 캐릭터 정보 로드됨 (DB)`);
        renderRankingTable();
        renderDetailRankings();
        renderLastUpdated();
    } catch (error) {
        console.error('[오류] DB 데이터 로드 실패:', error);

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
    // 라디오 버튼 초기화 (모두공개 선택)
    const defaultRadio = document.querySelector('input[name="addVisibility"][value="0"]');
    if (defaultRadio) defaultRadio.checked = true;
    document.getElementById('addStatus').classList.add('hidden');
    document.getElementById('addBtn').disabled = false;
    document.getElementById('addBtn').textContent = '등록';
}

// 캐릭터 등록 취소용 컨트롤러
let addCharacterController = null;

function closeAddModal() {
    // 진행 중인 캐릭터 확인 취소
    if (addCharacterController) {
        addCharacterController.abort();
        addCharacterController = null;
    }
    document.getElementById('addModal').classList.add('hidden');
    document.getElementById('addBtn').disabled = false;
    document.getElementById('addBtn').textContent = '등록';
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

// 모달 외부 클릭 시 닫기 (모달 배경 직접 클릭한 경우만)
document.addEventListener('click', function(e) {
    // e.target이 .modal 클래스를 가진 요소 자체인 경우만 처리
    // (모달 내부 요소인 .modal-content 등은 .modal 클래스가 없음)
    if (e.target.id === 'addModal' && e.target.classList.contains('modal')) {
        closeAddModal();
    } else if (e.target.id === 'deleteModal' && e.target.classList.contains('modal')) {
        closeDeleteModal();
    }
});

// 상태 메시지 표시
function showStatus(elementId, message, type) {
    const el = document.getElementById(elementId);
    el.textContent = message;
    el.className = `status-message ${type}`;
    el.classList.remove('hidden');
}

// 캐릭터 존재 확인 (API 호출 - CORS 프록시 사용, 10초 타임아웃)
async function verifyCharacterExists(characterName, signal) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    let userCancelled = false;

    // 외부 signal이 abort되면 내부 controller도 abort
    if (signal) {
        signal.addEventListener('abort', () => {
            userCancelled = true;
            controller.abort();
        });
    }

    try {
        const url = `${VERIFY_API_URL}${encodeURIComponent(characterName)}`;
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;

        const response = await fetch(proxyUrl, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (!response.ok) return false;

        const html = await response.text();
        const match = html.match(/window\.__SSR_DATA__\s*=\s*(\{[\s\S]*?\});/);
        if (!match) return false;

        const data = JSON.parse(match[1]);
        return data.userMetaData && data.userMetaData.length > 0;
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            if (userCancelled) {
                console.log('캐릭터 확인 취소됨 (사용자)');
                throw error; // 사용자 취소만 상위로 전파
            } else {
                console.log('캐릭터 확인 타임아웃 (10초)');
            }
        } else {
            console.error('캐릭터 확인 오류:', error);
        }
        return false;
    }
}

// 취소 가능한 딜레이 함수
function delay(ms, signal) {
    return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(resolve, ms);
        if (signal) {
            signal.addEventListener('abort', () => {
                clearTimeout(timeoutId);
                reject(new DOMException('Delay cancelled', 'AbortError'));
            });
        }
    });
}

// 캐릭터 등록
async function addCharacter() {
    const nameInput = document.getElementById('addCharacterName');
    const characterName = nameInput.value.trim();
    const visibilityRadio = document.querySelector('input[name="addVisibility"]:checked');
    const visibility = visibilityRadio ? parseInt(visibilityRadio.value) : 0;
    const btn = document.getElementById('addBtn');

    if (!characterName) {
        showStatus('addStatus', '캐릭터 닉네임을 입력해주세요.', 'error');
        return;
    }

    btn.disabled = true;

    // 취소용 컨트롤러 생성
    addCharacterController = new AbortController();
    const signal = addCharacterController.signal;

    // 이미 등록된 캐릭터인지 확인
    const { data: existing } = await supabase
        .from('ranking_characters')
        .select('id')
        .eq('name', characterName)
        .maybeSingle();

    if (existing) {
        showStatus('addStatus', '이미 등록된 캐릭터입니다.', 'error');
        btn.disabled = false;
        addCharacterController = null;
        return;
    }

    // 캐릭터 존재 확인 (2초 간격 최대 10회)
    let found = false;
    try {
        for (let i = 1; i <= 10; i++) {
            if (signal.aborted) break;

            showStatus('addStatus', `캐릭터 확인 중... (${i}/10)`, 'info');
            btn.textContent = `확인 중 (${i}/10)`;

            found = await verifyCharacterExists(characterName, signal);
            if (found) break;

            if (i < 10) {
                await delay(2000, signal);
            }
        }
    } catch (error) {
        if (error.name === 'AbortError') {
            console.log('캐릭터 등록 취소됨');
            addCharacterController = null;
            return;
        }
    }

    if (!found) {
        showStatus('addStatus', '캐릭터를 찾을 수 없습니다. 닉네임을 확인해주세요.', 'error');
        btn.disabled = false;
        btn.textContent = '등록';
        addCharacterController = null;
        return;
    }

    // Supabase에 등록
    try {
        const { error } = await supabase
            .from('ranking_characters')
            .insert({
                name: characterName,
                visibility: visibility
            });

        if (error) throw error;

        showStatus('addStatus', '캐릭터가 등록되었습니다! 랭킹 데이터 갱신 중...', 'success');
        btn.textContent = '완료!';
        addCharacterController = null;

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
        addCharacterController = null;
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

    try {
        // 해당 캐릭터를 본캐로 설정한 부캐들 조회
        const { data: altChars, error: altError } = await supabase
            .from('member_profiles')
            .select('character_name')
            .eq('main_character', characterName);

        if (altError) throw altError;

        const altNames = altChars?.map(a => a.character_name) || [];

        // 확인 메시지 생성
        let confirmMsg = `정말 "${characterName}" 캐릭터를 삭제하시겠습니까?`;
        if (altNames.length > 0) {
            confirmMsg += `\n\n※ 연결된 부캐 ${altNames.length}개도 함께 삭제됩니다:\n- ${altNames.join('\n- ')}`;
        }

        if (!confirm(confirmMsg)) {
            return;
        }

        // 본캐 삭제
        const { error } = await supabase
            .from('ranking_characters')
            .delete()
            .eq('id', characterId);

        if (error) throw error;

        // 부캐들도 삭제
        if (altNames.length > 0) {
            const { error: altDelError } = await supabase
                .from('ranking_characters')
                .delete()
                .in('name', altNames);

            if (altDelError) {
                console.error('부캐 삭제 오류:', altDelError);
            }

            // member_profiles에서 부캐 프로필도 삭제
            await supabase
                .from('member_profiles')
                .delete()
                .in('character_name', altNames);
        }

        // 본캐의 member_profiles도 삭제
        await supabase
            .from('member_profiles')
            .delete()
            .eq('character_name', characterName);

        const deletedCount = 1 + altNames.length;
        showStatus('deleteStatus', `${deletedCount}개 캐릭터가 삭제되었습니다!`, 'success');

        // 워크플로우 트리거 (백그라운드)
        triggerRankingUpdate();

        setTimeout(() => {
            closeDeleteModal();
        }, 1500);

    } catch (error) {
        showStatus('deleteStatus', '삭제 실패: ' + error.message, 'error');
    }
}

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', function () {
    renderRankingTable();
    loadRankingData();
});
