/**
 * Cloudflare Workers - 마비노기 모바일 랭킹 API 프록시
 *
 * 배포 방법:
 * 1. https://dash.cloudflare.com/ 접속 (회원가입 필요)
 * 2. Workers & Pages > Create application > Create Worker
 * 3. 이름 설정 (예: mabinogi-ranking-proxy)
 * 4. "Edit code" 클릭
 * 5. 이 파일 내용 전체 복사하여 붙여넣기
 * 6. "Deploy" 클릭
 * 7. 생성된 URL 복사 (예: https://mabinogi-ranking-proxy.your-name.workers.dev)
 * 8. script.js의 WORKER_URL 값을 이 URL로 변경
 */

export default {
    async fetch(request, env, ctx) {
        // CORS 헤더 설정
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        };

        // OPTIONS 요청 처리 (CORS preflight)
        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        // URL에서 검색어 추출
        const url = new URL(request.url);
        const searchName = url.searchParams.get('search') || '';
        const t = url.searchParams.get('t') || '4';
        const s = url.searchParams.get('s') || '6';
        const c = url.searchParams.get('c') || '0';

        // 마비노기 모바일 API URL
        const apiUrl = `https://mabinogimobile.nexon.com/Ranking/List/rankdata?t=${t}&pageno=1&s=${s}&c=${c}&search=${encodeURIComponent(searchName)}`;

        try {
            // API 호출
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Referer': 'https://mabinogimobile.nexon.com/Ranking/List',
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-Requested-With': 'XMLHttpRequest',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });

            const html = await response.text();

            // 응답 반환 (CORS 헤더 포함)
            return new Response(html, {
                status: 200,
                headers: {
                    ...corsHeaders,
                    'Content-Type': 'text/html; charset=utf-8',
                }
            });
        } catch (error) {
            return new Response(JSON.stringify({ error: error.message }), {
                status: 500,
                headers: {
                    ...corsHeaders,
                    'Content-Type': 'application/json',
                }
            });
        }
    },
};
