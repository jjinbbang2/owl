/**
 * 통계 페이지 JavaScript
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

// ===== 초기화 =====
document.addEventListener('DOMContentLoaded', async function() {
    await loadAllData();
    renderCharts();
});

// ===== 데이터 로드 =====
async function loadAllData() {
    try {
        rankingData = await loadRankingsFromDB();
        profilesData = await loadMemberProfiles();
        const visibilityData = await loadVisibilityData();
        allMembers = mergeData(rankingData?.members || [], profilesData, visibilityData);
        console.log('[통계] 데이터 로드 완료:', allMembers.length, '명');
    } catch (error) {
        console.error('[통계] 데이터 로드 실패:', error);
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
    return merged.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
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
    canvas.parentElement.style.height = (chartHeight + 60) + 'px';

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

function generateColors(count) {
    const baseColors = [
        'rgba(212, 175, 55, 0.7)',
        'rgba(122, 162, 247, 0.7)',
        'rgba(74, 222, 128, 0.7)',
        'rgba(168, 85, 247, 0.7)',
        'rgba(248, 113, 113, 0.7)',
        'rgba(251, 146, 60, 0.7)',
        'rgba(56, 189, 248, 0.7)',
        'rgba(244, 114, 182, 0.7)',
        'rgba(163, 230, 53, 0.7)',
        'rgba(236, 72, 153, 0.7)'
    ];

    const colors = [];
    for (let i = 0; i < count; i++) {
        colors.push(baseColors[i % baseColors.length]);
    }
    return colors;
}

// ===== 네비게이션 토글 =====
function toggleNav() {
    const navMenu = document.getElementById('navMenu');
    navMenu.classList.toggle('active');
}
