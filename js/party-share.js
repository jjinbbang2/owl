/**
 * 파티 공유 공통 모듈
 * 클립보드 복사 및 카카오톡 공유 기능
 */

const PartyShare = (function() {
    // 요일 이름
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

    // 일정 포맷팅
    function formatSchedule(date) {
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hour = String(date.getHours()).padStart(2, '0');
        const minute = String(date.getMinutes()).padStart(2, '0');
        const dayName = dayNames[date.getDay()];
        return `${month}/${day} ${hour}:${minute}(${dayName})`;
    }

    // 카카오 SDK 초기화
    function initKakaoSDK(appKey) {
        if (window.Kakao && !window.Kakao.isInitialized()) {
            window.Kakao.init(appKey);
            console.log('Kakao SDK initialized');
        }
    }

    // 드롭다운 메뉴 토글
    function toggleShareDropdown(partyId) {
        const dropdown = document.getElementById(`shareDropdown-${partyId}`);
        if (!dropdown) return;

        // 다른 드롭다운 닫기
        document.querySelectorAll('.share-dropdown').forEach(d => {
            if (d.id !== `shareDropdown-${partyId}`) {
                d.classList.add('hidden');
            }
        });

        dropdown.classList.toggle('hidden');
    }

    // 외부 클릭 시 드롭다운 닫기
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.share-container')) {
            document.querySelectorAll('.share-dropdown').forEach(d => {
                d.classList.add('hidden');
            });
        }
    });

    // 클립보드 복사
    async function copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            alert('파티 정보가 복사되었습니다!\n카카오톡에 붙여넣기 하세요.');
        } catch (err) {
            // 클립보드 API 실패 시 대체 방법
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            alert('파티 정보가 복사되었습니다!\n카카오톡에 붙여넣기 하세요.');
        }

        // 드롭다운 닫기
        document.querySelectorAll('.share-dropdown').forEach(d => {
            d.classList.add('hidden');
        });
    }

    // 파티 정보 텍스트 생성
    function generatePartyText(party, pageType) {
        const scheduleDate = party.schedule ? new Date(party.schedule) : null;
        const scheduleDisplay = scheduleDate ? formatSchedule(scheduleDate) : '-';

        let text = '';
        let memberList = '';
        let url = '';
        let title = '';
        let memberCount = 0;
        let maxMembers = 4;

        switch(pageType) {
            case 'abyss':
                memberCount = party.abyss_members.length;
                memberList = party.abyss_members.map(member => {
                    let line = `- ${member.nickname}`;
                    const roles = [];
                    if (member.is_tanker) roles.push('탱커');
                    if (member.is_healer) roles.push('힐러');
                    if (roles.length > 0) line += ` [${roles.join(', ')}]`;
                    return line;
                }).join('\n');

                text = `[부엉공화국] 어비스 파티 모집

일정: ${scheduleDisplay}
난이도: ${party.difficulty || '매우 어려움'}
현재 인원: ${memberCount}/4

참가자:
${memberList}

참가하기: https://jjinbbang2.github.io/owl/abyss.html`;
                url = 'https://jjinbbang2.github.io/owl/abyss.html';
                title = `어비스 파티 모집 (${memberCount}/4)`;
                break;

            case 'help':
                memberCount = party.help_members.length;
                memberList = party.help_members.map(member => {
                    let line = `- 본캐: ${member.main_nickname}`;
                    if (member.main_power) line += ` (${member.main_power.toLocaleString()})`;
                    if (member.sub_nickname) {
                        line += ` / 부캐: ${member.sub_nickname}`;
                        if (member.sub_power) line += ` (${member.sub_power.toLocaleString()})`;
                    }
                    return line;
                }).join('\n');

                text = `[부엉공화국] 품앗이 파티 모집

일정: ${scheduleDisplay}
난이도: ${party.difficulty || '지옥 4'}
현재 인원: ${memberCount}/4

참가자:
${memberList}

참가하기: https://jjinbbang2.github.io/owl/abyss-help.html`;
                url = 'https://jjinbbang2.github.io/owl/abyss-help.html';
                title = `품앗이 파티 모집 (${memberCount}/4)`;
                break;

            case 'raid':
                const raidType = party.raid_type || '글라스기브넨';
                maxMembers = (raidType === '화이트 서큐버스' || raidType === '에르그 퀘이크') ? 4 : 8;
                memberCount = party.raid_members.length;

                memberList = party.raid_members.map(member => {
                    let line = `- ${member.nickname}`;
                    if (member.combat_power) line += ` (${member.combat_power.toLocaleString()})`;
                    const roles = [];
                    if (member.is_tanker) roles.push('탱커');
                    if (member.is_healer) roles.push('힐러');
                    if (roles.length > 0) line += ` [${roles.join(', ')}]`;
                    return line;
                }).join('\n');

                text = `[부엉공화국] 레이드 파티 모집

일정: ${scheduleDisplay}
레이드: ${raidType}
난이도: ${party.difficulty || '어려움'}
현재 인원: ${memberCount}/${maxMembers}

참가자:
${memberList}

참가하기: https://jjinbbang2.github.io/owl/raid.html`;
                url = 'https://jjinbbang2.github.io/owl/raid.html';
                title = `${raidType} 파티 모집 (${memberCount}/${maxMembers})`;
                break;
        }

        return { text, url, scheduleDisplay, title, memberCount, maxMembers };
    }

    // 레이드 보스별 이미지 URL 매핑 (정사각형 800x800)
    const raidImageMap = {
        '글라스기브넨': 'https://jjinbbang2.github.io/owl/images/raids/kakao-glas.png',
        '화이트 서큐버스': 'https://jjinbbang2.github.io/owl/images/raids/kakao-succubus.png',
        '타바르타스': 'https://jjinbbang2.github.io/owl/images/raids/kakao-tavartas.png'
    };

    // 어비스/품앗이 이미지 URL
    const abyssImageUrl = 'https://jjinbbang2.github.io/owl/images/abyss/kakao-abyss.png';
    const helpImageUrl = 'https://jjinbbang2.github.io/owl/images/abyss/kakao-help.png';

    // 카카오톡 피드 템플릿 공유
    function shareToKakao(party, pageType) {
        if (!window.Kakao || !window.Kakao.isInitialized()) {
            alert('카카오 SDK가 초기화되지 않았습니다.');
            return;
        }

        const { url, scheduleDisplay, title } = generatePartyText(party, pageType);

        // 페이지 타입별 이미지 설정
        let imageUrl = 'https://jjinbbang2.github.io/owl/og-image.png';
        switch(pageType) {
            case 'abyss':
                imageUrl = abyssImageUrl;
                break;
            case 'help':
                imageUrl = helpImageUrl;
                break;
            case 'raid':
                if (party.raid_type) {
                    imageUrl = raidImageMap[party.raid_type] || imageUrl;
                }
                break;
        }

        let description = '';
        switch(pageType) {
            case 'abyss':
                description = `일정: ${scheduleDisplay}\n난이도: ${party.difficulty || '매우 어려움'}`;
                break;
            case 'help':
                description = `일정: ${scheduleDisplay}\n난이도: ${party.difficulty || '지옥 4'}`;
                break;
            case 'raid':
                description = `일정: ${scheduleDisplay}\n레이드: ${party.raid_type || '글라스기브넨'}\n난이도: ${party.difficulty || '어려움'}`;
                break;
        }

        try {
            window.Kakao.Share.sendDefault({
                objectType: 'feed',
                content: {
                    title: title,
                    description: description,
                    imageUrl: imageUrl,
                    link: {
                        mobileWebUrl: url,
                        webUrl: url
                    }
                },
                buttons: [
                    {
                        title: '참가하기',
                        link: {
                            mobileWebUrl: url,
                            webUrl: url
                        }
                    }
                ]
            });
        } catch (error) {
            console.error('카카오톡 공유 실패:', error);
            alert('카카오톡 공유에 실패했습니다.\n클립보드 복사를 사용해주세요.');
        }

        // 드롭다운 닫기
        document.querySelectorAll('.share-dropdown').forEach(d => {
            d.classList.add('hidden');
        });
    }

    // 공개 API
    return {
        initKakaoSDK,
        toggleShareDropdown,
        copyToClipboard,
        generatePartyText,
        shareToKakao
    };
})();
