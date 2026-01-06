/**
 * 명단 페이지 JavaScript
 * preferred_times 구조: [{ start: "20:00", end: "23:00", tags: ["평일", "주말"] }, ...]
 */

// 전역 변수
let allMembers = [];
let rankingData = null;
let profilesData = [];

// 차트 인스턴스
let timeChart = null;
let tagChart = null;
let classPowerChart = null;
let classDistChart = null;

// 태그 목록
const TAG_OPTIONS = ['무관', '평일', '주말', '공휴일제외', '공휴일만'];

// 길드 옵션
const GUILD_OPTIONS = ['미설정', '부엉이', '부엉국'];

// 직업 아이콘 매핑 (랭킹 페이지와 동일)
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

const ICON_VERSION = 'v2';

function getClassIcon(className) {
    const iconUrl = CLASS_ICONS[className];
    if (iconUrl) {
        return `<img src="${iconUrl}?${ICON_VERSION}" alt="${className}" class="class-icon">`;
    }
    return `<span class="class-icon-placeholder">👤</span>`;
}

// ===== 초기화 =====
document.addEventListener('DOMContentLoaded', async function() {
    await loadAllData();
    renderMembersList();
    renderCharts();
    setupFilters();
    setupModalEvents();
});

// ===== 데이터 로드 =====
async function loadAllData() {
    try {
        rankingData = await loadRankingsFromDB();
        profilesData = await loadMemberProfiles();
        const visibilityData = await loadVisibilityData();
        allMembers = mergeData(rankingData?.members || [], profilesData, visibilityData);
        console.log('[명단] 데이터 로드 완료:', allMembers.length, '명');
    } catch (error) {
        console.error('[명단] 데이터 로드 실패:', error);
        allMembers = [];
    }
}

async function loadRankingsFromDB() {
    try {
        const { data, error } = await supabase
            .from('rankings')
            .select('*');

        if (error) {
            console.error('[rankings] DB 로드 실패:', error);
            return { members: [] };
        }

        // DB 데이터를 기존 형식으로 변환
        const members = data.map(r => ({
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
            source: r.source
        }));

        console.log('[rankings] DB 로드 성공:', members.length, '명');
        return { members };
    } catch (error) {
        console.error('[rankings] DB 로드 실패:', error);
        return { members: [] };
    }
}

async function loadMemberProfiles() {
    try {
        const { data, error } = await supabase
            .from('member_profiles')
            .select('*');
        if (error) {
            console.error('[member_profiles] 로드 실패:', error);
            return [];
        }
        return data || [];
    } catch (error) {
        console.error('[member_profiles] 로드 실패:', error);
        return [];
    }
}

async function loadVisibilityData() {
    try {
        const { data, error } = await supabase
            .from('ranking_characters')
            .select('name, visibility');
        if (error) {
            console.error('[ranking_characters] visibility 로드 실패:', error);
            return [];
        }
        return data || [];
    } catch (error) {
        console.error('[ranking_characters] visibility 로드 실패:', error);
        return [];
    }
}

function mergeData(rankingMembers, profiles, visibilityData) {
    const merged = rankingMembers.map(member => {
        const profile = profiles.find(p => p.character_name === member.name);
        const visRecord = visibilityData.find(v => v.name === member.name);
        return {
            ...member,
            guild: profile?.guild || '미설정',
            preferredTimes: profile?.preferred_times || [],
            visibility: visRecord?.visibility ?? member.visibility ?? 0,
            hasProfile: !!profile
        };
    });
    // 가나다순 정렬
    return merged.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
}

// ===== 명단 렌더링 =====
function renderMembersList() {
    const container = document.getElementById('membersList');
    if (!container) return;

    const filteredMembers = getFilteredMembers();

    if (filteredMembers.length === 0) {
        container.innerHTML = renderEmptyState();
        return;
    }

    container.innerHTML = filteredMembers.map(member =>
        renderDesktopCard(member) + renderMobileCard(member)
    ).join('');
}

function renderDesktopCard(member) {
    const timesWithTags = formatTimesWithTagsDesktop(member.preferredTimes);
    const visibilityText = getVisibilityText(member.visibility);
    const guildClass = member.guild === '부엉이' ? 'guild-owl' : member.guild === '부엉국' ? 'guild-nation' : 'guild-none';

    return `
    <div class="member-card">
        <div class="member-main">
            <div class="member-avatar">${getClassIcon(member.class)}</div>
            <div class="member-info">
                <span class="member-name">${escapeHtml(member.name)}</span>
                <span class="member-class">${member.class || '-'}</span>
            </div>
            <span class="member-guild ${guildClass}">${member.guild}</span>
            <div class="member-times-tags">${timesWithTags || '-'}</div>
            <span class="member-visibility">${visibilityText}</span>
            <button class="btn-edit-member" onclick="openEditModal('${escapeHtml(member.name)}')">수정</button>
        </div>
    </div>`;
}

function renderMobileCard(member) {
    const timesDisplay = formatPreferredTimesWithTags(member.preferredTimes);
    const visibilityText = getVisibilityText(member.visibility);
    const guildClass = member.guild === '부엉이' ? 'guild-owl' : member.guild === '부엉국' ? 'guild-nation' : 'guild-none';
    const safeId = member.name.replace(/[^a-zA-Z0-9가-힣]/g, '_');

    return `
    <div class="member-card-mobile">
        <div class="member-header-mobile" onclick="toggleAccordion('${safeId}')">
            <div class="member-main-info">
                <div class="member-avatar">${getClassIcon(member.class)}</div>
                <div class="member-info">
                    <span class="member-name">${escapeHtml(member.name)}</span>
                    <span class="member-class">${member.class || '-'}</span>
                </div>
                <span class="member-guild ${guildClass}">${member.guild}</span>
            </div>
            <span class="accordion-icon" id="icon-${safeId}">▼</span>
        </div>
        <div class="member-details-mobile" id="details-${safeId}">
            <div class="detail-row">
                <span class="detail-label">선호시간</span>
                <span class="detail-value">${timesDisplay || '-'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">공개설정</span>
                <span class="detail-value">${visibilityText}</span>
            </div>
            <div class="detail-row" style="justify-content: flex-end; border-bottom: none;">
                <button class="btn-edit-member" onclick="openEditModal('${escapeHtml(member.name)}')">수정</button>
            </div>
        </div>
    </div>`;
}

function renderEmptyState() {
    return `
    <div class="members-empty">
        <div class="members-empty-icon">📋</div>
        <p>등록된 길드원이 없습니다.</p>
    </div>`;
}

// ===== 차트 렌더링 =====
function renderCharts() {
    renderTimeChart();
    renderTagChart();
    renderClassPowerChart();
    renderClassDistChart();
}

function renderTimeChart() {
    const canvas = document.getElementById('timeChart');
    if (!canvas) return;

    const hourCounts = new Array(24).fill(0);

    allMembers.forEach(member => {
        if (member.preferredTimes && member.preferredTimes.length > 0) {
            member.preferredTimes.forEach(range => {
                if (!range.start || !range.end) return;
                const startHour = parseInt(range.start.split(':')[0]);
                const endHour = parseInt(range.end.split(':')[0]);

                if (startHour <= endHour) {
                    for (let h = startHour; h <= endHour; h++) {
                        hourCounts[h]++;
                    }
                } else {
                    for (let h = startHour; h < 24; h++) hourCounts[h]++;
                    for (let h = 0; h <= endHour; h++) hourCounts[h]++;
                }
            });
        }
    });

    const ctx = canvas.getContext('2d');
    if (timeChart) timeChart.destroy();

    // 1시간 단위 레이블 (0시~23시)
    const labels = Array.from({length: 24}, (_, i) => `${i}`);

    timeChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: '활동 가능 인원',
                data: hourCounts,
                backgroundColor: 'rgba(122, 162, 247, 0.6)',
                borderColor: 'rgba(122, 162, 247, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: { legend: { display: false } },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1, color: '#888' },
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    title: { display: true, text: '인원', color: '#888' }
                },
                x: {
                    ticks: { color: '#888' },
                    grid: { display: false },
                    title: { display: true, text: '시간', color: '#888' }
                }
            }
        }
    });
}

function renderTagChart() {
    const canvas = document.getElementById('tagChart');
    if (!canvas) return;

    const tagCounts = { '무관': 0, '평일': 0, '주말': 0, '공휴일제외': 0, '공휴일만': 0 };

    allMembers.forEach(member => {
        if (member.preferredTimes && member.preferredTimes.length > 0) {
            member.preferredTimes.forEach(range => {
                if (range.tags && Array.isArray(range.tags)) {
                    range.tags.forEach(tag => {
                        if (tagCounts.hasOwnProperty(tag)) {
                            tagCounts[tag]++;
                        }
                    });
                }
            });
        }
    });

    const ctx = canvas.getContext('2d');
    if (tagChart) tagChart.destroy();

    tagChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(tagCounts),
            datasets: [{
                data: Object.values(tagCounts),
                backgroundColor: [
                    'rgba(136, 136, 136, 0.7)',
                    'rgba(74, 222, 128, 0.7)',
                    'rgba(168, 85, 247, 0.7)',
                    'rgba(248, 113, 113, 0.7)',
                    'rgba(251, 146, 60, 0.7)'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: { legend: { position: 'bottom', labels: { color: '#ccc', padding: 15 } } }
        }
    });
}

function renderClassPowerChart() {
    const canvas = document.getElementById('classPowerChart');
    if (!canvas) return;

    // visibility !== 2인 멤버만 포함 (전투력 공개된 멤버)
    const visibleMembers = allMembers.filter(m => m.visibility !== 2 && m.combatScore);
    const classStats = {};

    // 데이터에 있는 모든 직업 수집
    visibleMembers.forEach(member => {
        if (!member.class) return;
        if (!classStats[member.class]) {
            classStats[member.class] = { total: 0, count: 0 };
        }
        classStats[member.class].total += member.combatScore;
        classStats[member.class].count++;
    });

    // 평균 전투력 기준 내림차순 정렬
    const sortedClasses = Object.keys(classStats).sort((a, b) =>
        (classStats[b].total / classStats[b].count) - (classStats[a].total / classStats[a].count)
    );

    const labels = sortedClasses;
    const averages = labels.map(cls => Math.round(classStats[cls].total / classStats[cls].count));

    // 직업 개수에 따라 차트 높이 동적 설정 (직업당 35px)
    const chartHeight = Math.max(150, labels.length * 35);
    canvas.style.height = chartHeight + 'px';
    canvas.parentElement.style.height = (chartHeight + 60) + 'px'; // 제목 공간 포함

    const ctx = canvas.getContext('2d');
    if (classPowerChart) classPowerChart.destroy();

    classPowerChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: '평균 전투력',
                data: averages,
                backgroundColor: 'rgba(212, 175, 55, 0.6)',
                borderColor: 'rgba(212, 175, 55, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: { legend: { display: false } },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: { color: '#888' },
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    title: { display: true, text: '전투력', color: '#888' }
                },
                y: {
                    ticks: { color: '#ccc' },
                    grid: { display: false }
                }
            }
        }
    });
}

function renderClassDistChart() {
    const canvas = document.getElementById('classDistChart');
    if (!canvas) return;

    const classCounts = {};
    allMembers.forEach(member => {
        if (!member.class) return;
        classCounts[member.class] = (classCounts[member.class] || 0) + 1;
    });

    const ctx = canvas.getContext('2d');
    if (classDistChart) classDistChart.destroy();

    classDistChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(classCounts),
            datasets: [{
                data: Object.values(classCounts),
                backgroundColor: generateColors(Object.keys(classCounts).length),
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: { legend: { position: 'bottom', labels: { color: '#ccc', padding: 15 } } }
        }
    });
}

// ===== 프로필 수정 모달 =====
function openEditModal(characterName) {
    const member = allMembers.find(m => m.name === characterName);
    if (!member) {
        alert('캐릭터를 찾을 수 없습니다.');
        return;
    }

    document.getElementById('editCharacterName').value = characterName;
    document.getElementById('editModalTitle').textContent = `${characterName} 프로필 수정`;

    // 길드 설정
    const guildRadio = document.querySelector(`input[name="editGuild"][value="${member.guild}"]`);
    if (guildRadio) guildRadio.checked = true;

    // 시간대+태그 설정
    renderTimeRanges(member.preferredTimes || []);

    // 공개설정
    const visibilityRadio = document.querySelector(`input[name="editVisibility"][value="${member.visibility ?? 0}"]`);
    if (visibilityRadio) visibilityRadio.checked = true;

    document.getElementById('editModal').classList.remove('hidden');
}

function closeEditModal() {
    document.getElementById('editModal').classList.add('hidden');
}

async function saveProfile() {
    const characterName = document.getElementById('editCharacterName').value;
    const guildRadio = document.querySelector('input[name="editGuild"]:checked');
    const visibilityRadio = document.querySelector('input[name="editVisibility"]:checked');

    if (!guildRadio || !visibilityRadio) {
        alert2('모든 설정을 선택해주세요.');
        return;
    }

    const guild = guildRadio.value;
    const preferredTimes = collectTimeRanges();
    const visibility = parseInt(visibilityRadio.value);

    try {
        const { error: profileError } = await supabase
            .from('member_profiles')
            .upsert({
                character_name: characterName,
                guild: guild,
                preferred_times: preferredTimes
            }, { onConflict: 'character_name' });

        if (profileError) throw profileError;

        console.log('[저장] visibility 업데이트 시도:', characterName, visibility);
        const { data: visData, error: visibilityError } = await supabase
            .from('ranking_characters')
            .update({ visibility: visibility })
            .eq('name', characterName)
            .select();

        console.log('[저장] visibility 업데이트 결과:', visData, visibilityError);

        if (visibilityError) throw visibilityError;
        if (!visData || visData.length === 0) {
            console.warn('[저장] visibility 업데이트된 행 없음 - ranking_characters에 캐릭터가 없을 수 있음');
        }

        await loadAllData();
        renderMembersList();
        renderCharts();
        closeEditModal();
        alert2('프로필이 저장되었습니다.', 'success');
    } catch (error) {
        console.error('저장 실패:', error);
        alert2('저장 실패: ' + error.message, 'error');
    }
}

// ===== 시간대+태그 범위 관리 =====
function renderTimeRanges(ranges) {
    const container = document.getElementById('timeRangeContainer');
    if (!container) return;
    container.innerHTML = '';

    if (!ranges || ranges.length === 0) {
        return;
    }

    ranges.forEach(range => {
        addTimeRange(range.start, range.end, range.tags || []);
    });
}

function addTimeRange(start = '20:00', end = '23:00', tags = []) {
    const container = document.getElementById('timeRangeContainer');
    if (!container) return;

    const id = Date.now() + Math.random().toString(36).substr(2, 9);

    const tagCheckboxes = TAG_OPTIONS.map(tag => `
        <label class="tag-checkbox">
            <input type="checkbox" value="${tag}" ${tags.includes(tag) ? 'checked' : ''}>
            <span class="member-tag tag-${tag}">${tag}</span>
        </label>
    `).join('');

    const html = `
    <div class="time-range-row" id="timeRange-${id}">
        <div class="time-range-times">
            <select class="time-start">
                ${generateTimeOptions(start)}
            </select>
            <span>~</span>
            <select class="time-end">
                ${generateTimeOptions(end)}
            </select>
            <button type="button" class="btn-remove-time" onclick="removeTimeRange('${id}')">×</button>
        </div>
        <div class="time-range-tags">
            ${tagCheckboxes}
        </div>
    </div>`;

    container.insertAdjacentHTML('beforeend', html);
}

function removeTimeRange(id) {
    const row = document.getElementById(`timeRange-${id}`);
    if (row) row.remove();
}

function generateTimeOptions(selected) {
    let options = '';
    for (let h = 0; h < 24; h++) {
        for (let m = 0; m < 60; m += 30) {
            const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
            options += `<option value="${time}" ${time === selected ? 'selected' : ''}>${time}</option>`;
        }
    }
    return options;
}

function collectTimeRanges() {
    const rows = document.querySelectorAll('.time-range-row');
    const ranges = [];

    rows.forEach(row => {
        const start = row.querySelector('.time-start')?.value;
        const end = row.querySelector('.time-end')?.value;
        const tagCheckboxes = row.querySelectorAll('.time-range-tags input[type="checkbox"]:checked');
        const tags = Array.from(tagCheckboxes).map(cb => cb.value);

        if (start && end) {
            ranges.push({ start, end, tags: tags.length > 0 ? tags : ['무관'] });
        }
    });

    return ranges;
}

// ===== 유틸리티 함수 =====
function formatPreferredTimes(times) {
    if (!times || times.length === 0) return '';
    return times.map(t => `${t.start}~${t.end}`).join(', ');
}

function formatPreferredTimesWithTags(times) {
    if (!times || times.length === 0) return '';
    return times.map(t => {
        const tagsStr = t.tags && t.tags.length > 0 ? `(${t.tags.join(',')})` : '';
        return `${t.start}~${t.end}${tagsStr}`;
    }).join('<br>');
}

function formatTimesWithTagsDesktop(times) {
    if (!times || times.length === 0) return '';
    return times.map(t => {
        const timeStr = `${t.start}~${t.end}`;
        const tagsStr = t.tags && t.tags.length > 0
            ? t.tags.map(tag => `<span class="tag-badge tag-${tag}">${tag}</span>`).join('')
            : '';
        return `<div class="time-tag-row"><span class="time-range">${timeStr}</span>${tagsStr}</div>`;
    }).join('');
}

function formatAllTags(times) {
    if (!times || times.length === 0) return '';
    const allTags = new Set();
    times.forEach(t => {
        if (t.tags && Array.isArray(t.tags)) {
            t.tags.forEach(tag => allTags.add(tag));
        }
    });
    if (allTags.size === 0) return '';
    return Array.from(allTags).map(tag =>
        `<span class="member-tag tag-${tag}">${tag}</span>`
    ).join(' ');
}

function getVisibilityText(visibility) {
    const texts = { 0: '모두공개', 1: '전투력만', 2: '비공개' };
    return texts[visibility] || '모두공개';
}

function toggleAccordion(id) {
    const details = document.getElementById(`details-${id}`);
    const icon = document.getElementById(`icon-${id}`);
    if (details) details.classList.toggle('show');
    if (icon) icon.classList.toggle('expanded');
}

function getFilteredMembers() {
    const guildFilter = document.getElementById('filterGuild')?.value || '';
    const classFilter = document.getElementById('filterClass')?.value || '';
    const timeFilter = document.getElementById('filterTime')?.value || '';
    const tagFilter = document.getElementById('filterTag')?.value || '';

    return allMembers.filter(m => {
        // 길드 필터
        if (guildFilter && m.guild !== guildFilter) return false;

        // 직업 필터
        if (classFilter && m.class !== classFilter) return false;

        // 시간대 필터
        if (timeFilter) {
            const [startRange, endRange] = timeFilter.split('-').map(Number);
            const hasTimeInRange = m.preferredTimes?.some(pt => {
                if (!pt.start || !pt.end) return false;
                const startHour = parseInt(pt.start.split(':')[0]);
                const endHour = parseInt(pt.end.split(':')[0]);

                // 시간대가 필터 범위와 겹치는지 확인
                if (startHour <= endHour) {
                    return startHour < endRange && endHour >= startRange;
                } else {
                    // 자정을 넘는 경우 (예: 22:00 ~ 02:00)
                    return startHour < endRange || endHour >= startRange;
                }
            });
            if (!hasTimeInRange) return false;
        }

        // 태그 필터
        if (tagFilter) {
            const hasThatTag = m.preferredTimes?.some(pt =>
                pt.tags && pt.tags.includes(tagFilter)
            );
            if (!hasThatTag) return false;
        }
        return true;
    });
}

function setupFilters() {
    const guildSelect = document.getElementById('filterGuild');
    const classSelect = document.getElementById('filterClass');
    const timeSelect = document.getElementById('filterTime');
    const tagSelect = document.getElementById('filterTag');

    // 직업 필터 동적 생성
    populateClassFilter();

    if (guildSelect) guildSelect.addEventListener('change', renderMembersList);
    if (classSelect) classSelect.addEventListener('change', renderMembersList);
    if (timeSelect) timeSelect.addEventListener('change', renderMembersList);
    if (tagSelect) tagSelect.addEventListener('change', renderMembersList);

    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(renderMembersList, 100);
    });
}

function populateClassFilter() {
    const classSelect = document.getElementById('filterClass');
    if (!classSelect) return;

    // 데이터에서 모든 직업 수집
    const classes = new Set();
    allMembers.forEach(m => {
        if (m.class) classes.add(m.class);
    });

    // 가나다순 정렬
    const sortedClasses = Array.from(classes).sort((a, b) => a.localeCompare(b, 'ko'));

    // 옵션 추가
    sortedClasses.forEach(cls => {
        const option = document.createElement('option');
        option.value = cls;
        option.textContent = cls;
        classSelect.appendChild(option);
    });
}

function setupModalEvents() {
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.classList.add('hidden');
        }
    });
}

function generateColors(count) {
    const baseColors = [
        'rgba(122, 162, 247, 0.7)', 'rgba(212, 175, 55, 0.7)', 'rgba(74, 222, 128, 0.7)',
        'rgba(248, 113, 113, 0.7)', 'rgba(168, 85, 247, 0.7)', 'rgba(244, 114, 182, 0.7)',
        'rgba(251, 146, 60, 0.7)', 'rgba(34, 211, 238, 0.7)', 'rgba(163, 230, 53, 0.7)', 'rgba(217, 70, 239, 0.7)'
    ];
    return Array.from({ length: count }, (_, i) => baseColors[i % baseColors.length]);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
