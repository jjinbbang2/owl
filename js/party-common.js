/**
 * 파티 모집 공통 모듈
 * 어비스, 품앗이, 레이드 페이지에서 공통으로 사용하는 유틸리티
 */

const PartyCommon = (function() {
    // 요일 배열
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

    // Flatpickr 인스턴스
    let schedulePicker = null;
    let selectedScheduleDate = null;

    /**
     * 전투력 만단위 포맷팅 (소수점 1자리, 버림)
     * ex) 47532 → "4.7"
     */
    function formatPowerShort(power) {
        if (!power) return '-';
        const inManUnit = Math.floor(power / 1000) / 10;
        return inManUnit.toFixed(1);
    }

    /**
     * 날짜 포맷팅: "2025-12-08 21:30(월)" 형식
     */
    function formatSchedule(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hour = String(date.getHours()).padStart(2, '0');
        const minute = String(date.getMinutes()).padStart(2, '0');
        const dayName = dayNames[date.getDay()];
        return `${year}-${month}-${day} ${hour}:${minute}(${dayName})`;
    }

    /**
     * 남은 시간 계산
     */
    function getTimeRemaining(targetDate) {
        const now = new Date();
        const diff = targetDate - now;

        if (diff <= 0) {
            return '<span style="color: #f87171;">종료됨</span>';
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (days > 0) {
            return `<span style="color: #4ade80;">${days}일 ${hours}시간 ${minutes}분 남음</span>`;
        } else if (hours > 0) {
            return `<span style="color: #fbbf24;">${hours}시간 ${minutes}분 남음</span>`;
        } else {
            return `<span style="color: #f87171;">${minutes}분 남음</span>`;
        }
    }

    /**
     * 파티 정렬: 시간이 얼마 안 남은 순서대로, 종료된 파티는 제일 아래로
     */
    function sortParties(parties) {
        const now = new Date();
        return [...parties].sort((a, b) => {
            const aDate = a.schedule ? new Date(a.schedule) : null;
            const bDate = b.schedule ? new Date(b.schedule) : null;
            const aExpired = !aDate || aDate <= now;
            const bExpired = !bDate || bDate <= now;

            // 종료된 파티는 아래로
            if (aExpired && !bExpired) return 1;
            if (!aExpired && bExpired) return -1;

            // 둘 다 종료되지 않은 경우: 시간이 가까운 순서대로
            if (!aExpired && !bExpired) {
                return aDate - bDate;
            }

            // 둘 다 종료된 경우: 최근 종료된 것 먼저
            return bDate - aDate;
        });
    }

    /**
     * 만료된 파티 삭제 (모집 시간 + 3시간 지난 파티)
     */
    async function deleteExpiredParties(tableName) {
        const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();

        const { error } = await supabase
            .from(tableName)
            .delete()
            .lt('schedule', threeHoursAgo);

        if (error) {
            console.error('만료 파티 삭제 실패:', error);
        }
    }

    /**
     * Flatpickr 초기화
     */
    function initSchedulePicker(inputSelector, defaultHour = 21) {
        schedulePicker = flatpickr(inputSelector, {
            locale: "ko",
            enableTime: true,
            noCalendar: false,
            dateFormat: "Y-m-d H:i",
            time_24hr: true,
            minuteIncrement: 30,
            defaultHour: defaultHour,
            minDate: "today",
            disableMobile: true,
            onChange: function(selectedDates, dateStr, instance) {
                if (selectedDates.length > 0) {
                    selectedScheduleDate = selectedDates[0];
                    instance.element.value = formatSchedule(selectedDates[0]);
                }
            }
        });
        return schedulePicker;
    }

    /**
     * 선택된 날짜 가져오기
     */
    function getSelectedScheduleDate() {
        return selectedScheduleDate;
    }

    /**
     * 선택된 날짜 초기화
     */
    function clearScheduleDate() {
        if (schedulePicker) {
            schedulePicker.clear();
        }
        selectedScheduleDate = null;
    }

    /**
     * 새 파티 폼 토글
     */
    function toggleNewPartyForm() {
        document.getElementById('newPartyForm').classList.toggle('hidden');
    }

    /**
     * 멤버 추가 폼 토글
     */
    function toggleAddMemberForm(partyId) {
        document.getElementById(`addMemberForm-${partyId}`).classList.toggle('hidden');
    }

    /**
     * 남은 시간 업데이트 (DOM에서 .party-card 요소들 갱신)
     */
    function updateTimeRemaining() {
        document.querySelectorAll('.party-card').forEach(card => {
            const schedule = card.dataset.schedule;
            if (schedule) {
                const timeRemainingEl = card.querySelector('.time-remaining');
                if (timeRemainingEl) {
                    timeRemainingEl.innerHTML = getTimeRemaining(new Date(schedule));
                }
            }
        });
    }

    /**
     * 빈 상태 HTML 생성
     */
    function renderEmptyState(message = '아직 등록된 파티가 없습니다.', subMessage = '새 파티를 만들어보세요!') {
        return `
            <div class="empty-state">
                <p>${message}</p>
                <p style="font-size: 0.85rem; margin-top: 10px;">${subMessage}</p>
            </div>
        `;
    }

    /**
     * 에러 상태 HTML 생성
     */
    function renderErrorState(errorMessage) {
        return `
            <div class="empty-state">
                <p>데이터를 불러오는데 실패했습니다.</p>
                <p style="font-size: 0.85rem; margin-top: 10px;">${errorMessage}</p>
            </div>
        `;
    }

    /**
     * 공유 래퍼 함수 생성
     */
    function createShareWrappers(getCurrentParties, pageType) {
        return {
            copyPartyInfo: function(partyId) {
                const party = getCurrentParties().find(p => p.id === partyId);
                if (!party) {
                    alert('파티 정보를 찾을 수 없습니다.');
                    return;
                }
                const { text } = PartyShare.generatePartyText(party, pageType);
                PartyShare.copyToClipboard(text);
            },
            shareToKakao: function(partyId) {
                const party = getCurrentParties().find(p => p.id === partyId);
                if (!party) {
                    alert('파티 정보를 찾을 수 없습니다.');
                    return;
                }
                PartyShare.shareToKakao(party, pageType);
            }
        };
    }

    /**
     * 파티 페이지 초기화 (공통 패턴)
     */
    async function initPartyPage(config) {
        const {
            partyTable,
            deleteExpired = true,
            loadParties,
            scheduleInputSelector = '#newSchedule',
            defaultHour = 21,
            updateInterval = 60000
        } = config;

        // 만료된 파티 삭제
        if (deleteExpired) {
            await deleteExpiredParties(partyTable);
        }

        // 파티 목록 로드
        await loadParties();

        // 날짜 선택기 초기화
        initSchedulePicker(scheduleInputSelector, defaultHour);

        // 주기적 업데이트
        setInterval(async () => {
            if (deleteExpired) {
                await deleteExpiredParties(partyTable);
            }
            updateTimeRemaining();
        }, updateInterval);
    }

    // 공개 API
    return {
        formatPowerShort,
        formatSchedule,
        getTimeRemaining,
        sortParties,
        deleteExpiredParties,
        initSchedulePicker,
        getSelectedScheduleDate,
        clearScheduleDate,
        toggleNewPartyForm,
        toggleAddMemberForm,
        updateTimeRemaining,
        renderEmptyState,
        renderErrorState,
        createShareWrappers,
        initPartyPage
    };
})();
