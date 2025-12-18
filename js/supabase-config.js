// SweetAlert2 래퍼 함수 (전역)
function alert2(message, type = 'warning', title = '') {
    const titles = {
        'warning': '알림',
        'error': '오류',
        'success': '완료',
        'info': '안내'
    };
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            icon: type,
            title: title || titles[type] || '알림',
            text: message
        });
    } else {
        alert(message);
    }
}

// Supabase 설정 (중복 로드 방지)
if (typeof window._supabaseClient === 'undefined') {
    const SUPABASE_URL = 'https://eukkokvfvbucloforsmn.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1a2tva3ZmdmJ1Y2xvZm9yc21uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxNzg1NzUsImV4cCI6MjA4MDc1NDU3NX0.EJtp0Rj4XbVRW7KqTLvultLAV1psqnIWnQeA7YeBaHY';
    window._supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
var supabase = window._supabaseClient;

// 공통 유틸리티
function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR');
}

// 네비게이션 토글
function toggleNav() {
    const navMenu = document.getElementById('navMenu');
    navMenu.classList.toggle('active');
}
