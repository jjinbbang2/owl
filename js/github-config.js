// GitHub 워크플로우 트리거 설정
// 주의: fine-grained PAT 사용 권장 (Actions: Read and Write 권한만)
const GITHUB_CONFIG = {
    owner: 'jjinbbang2',
    repo: 'owl',
    workflowId: 'update-ranking.yml',
    // GitHub Personal Access Token (fine-grained)
    // Settings > Developer settings > Personal access tokens > Fine-grained tokens
    // Repository access: owl 레포만 선택
    // Permissions: Actions (Read and Write)
    pat: '' // 여기에 PAT 입력
};
