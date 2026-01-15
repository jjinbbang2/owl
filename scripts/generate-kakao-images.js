const { createCanvas, registerFont, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

// 폰트 등록
const fontsDir = path.join(__dirname, '..', 'fonts');
registerFont(path.join(fontsDir, 'NotoSansKR-Bold.otf'), { family: 'Noto Sans KR', weight: 'bold' });
registerFont(path.join(fontsDir, 'NotoSansKR-Regular.otf'), { family: 'Noto Sans KR', weight: 'normal' });

// 이미지 크기 (정사각형)
const SIZE = 800;

// 레이드 보스 정보
const raidBosses = [
  {
    id: 'glas',
    name: '글라스기브넨',
    imageFile: 'glas.png',
    color: '#ff4444',
    bgGradient: ['#1a0a0a', '#2d1515', '#0f0808'],
    members: 8
  },
  {
    id: 'succubus',
    name: '화이트 서큐버스',
    imageFile: 'succubus.png',
    color: '#ff69b4',
    bgGradient: ['#1a0a15', '#2d1525', '#0f0810'],
    members: 4
  },
  {
    id: 'tavartas',
    name: '타바르타스',
    imageFile: 'tavartas.png',
    color: '#ffd700',
    bgGradient: ['#1a1508', '#2d2510', '#0f0d05'],
    members: 8
  },
  {
    id: 'erel',
    name: '에이렐',
    imageFile: 'erel.png',
    color: '#66ccff',
    bgGradient: ['#0a141a', '#15252d', '#08100f'],
    members: 4
  }
];

// 레이드 보스 이미지 생성
async function generateRaidBossImage(boss) {
  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext('2d');

  // 배경 그라데이션
  const bgGrad = ctx.createLinearGradient(0, 0, SIZE, SIZE);
  bgGrad.addColorStop(0, boss.bgGradient[0]);
  bgGrad.addColorStop(0.5, boss.bgGradient[1]);
  bgGrad.addColorStop(1, boss.bgGradient[2]);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // 장식용 원들
  ctx.globalAlpha = 0.05;
  ctx.fillStyle = boss.color;
  ctx.beginPath();
  ctx.arc(100, 100, 150, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(700, 700, 200, 0, Math.PI * 2);
  ctx.fill();

  // 보스 이미지 로드 및 그리기
  try {
    const imagePath = path.join(__dirname, '..', 'images', 'raids', boss.imageFile);
    const bossImage = await loadImage(imagePath);

    ctx.save();
    ctx.globalAlpha = 1;

    // 원형 클리핑 마스크 (상단 중앙)
    const centerX = SIZE / 2;
    const centerY = 280;
    const radius = 200;

    // 테두리 글로우
    ctx.shadowColor = boss.color;
    ctx.shadowBlur = 40;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 6, 0, Math.PI * 2);
    ctx.strokeStyle = boss.color;
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // 원형 마스크
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.clip();

    // 이미지 그리기
    const imgSize = Math.max(bossImage.width, bossImage.height);
    const scale = (radius * 2.3) / imgSize;
    const drawWidth = bossImage.width * scale;
    const drawHeight = bossImage.height * scale;

    ctx.drawImage(
      bossImage,
      centerX - drawWidth / 2,
      centerY - drawHeight / 2,
      drawWidth,
      drawHeight
    );

    ctx.restore();
  } catch (err) {
    console.error(`이미지 로드 실패 (${boss.name}):`, err.message);
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = boss.color;
    ctx.beginPath();
    ctx.arc(SIZE / 2, 280, 180, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 1;

  // 부엉이공화국 (상단)
  ctx.font = 'bold 32px "Noto Sans KR"';
  ctx.fillStyle = '#ffd700';
  ctx.textAlign = 'center';
  ctx.fillText('부엉이공화국', SIZE / 2, 50);

  // 보스 이름
  ctx.shadowColor = boss.color;
  ctx.shadowBlur = 25;
  ctx.font = 'bold 72px "Noto Sans KR"';
  ctx.fillStyle = boss.color;
  ctx.fillText(boss.name, SIZE / 2, 560);
  ctx.shadowBlur = 0;

  // 레이드 파티 모집
  ctx.font = '36px "Noto Sans KR"';
  ctx.fillStyle = '#e8e8e8';
  ctx.fillText('레이드 파티 모집', SIZE / 2, 620);

  // 인원수 태그
  ctx.globalAlpha = 0.2;
  ctx.fillStyle = boss.color;
  ctx.beginPath();
  ctx.roundRect(SIZE / 2 - 70, 660, 140, 50, 25);
  ctx.fill();

  ctx.globalAlpha = 1;
  ctx.font = 'bold 26px "Noto Sans KR"';
  ctx.fillStyle = boss.color;
  ctx.fillText(`${boss.members}인 레이드`, SIZE / 2, 695);

  // 하단 라인
  ctx.globalAlpha = 0.3;
  ctx.strokeStyle = boss.color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(100, 750);
  ctx.lineTo(700, 750);
  ctx.stroke();

  // URL
  ctx.globalAlpha = 0.6;
  ctx.font = '20px "Noto Sans KR"';
  ctx.fillStyle = '#888';
  ctx.fillText('jjinbbang2.github.io/owl', SIZE / 2, 780);

  // PNG 저장
  const buffer = canvas.toBuffer('image/png');
  const outputPath = path.join(__dirname, '..', 'images', 'raids', `kakao-${boss.id}.png`);
  fs.writeFileSync(outputPath, buffer);
  console.log(`Generated: kakao-${boss.id}.png (${buffer.length} bytes)`);
}

// 어비스 이미지 생성
async function generateAbyssImage() {
  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext('2d');

  // 배경 그라데이션 (보라색/어둠 테마)
  const bgGrad = ctx.createLinearGradient(0, 0, SIZE, SIZE);
  bgGrad.addColorStop(0, '#0a0a1a');
  bgGrad.addColorStop(0.5, '#151528');
  bgGrad.addColorStop(1, '#08080f');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, SIZE, SIZE);

  const mainColor = '#a855f7'; // 보라색

  // 장식용 원들
  ctx.globalAlpha = 0.05;
  ctx.fillStyle = mainColor;
  ctx.beginPath();
  ctx.arc(100, 100, 150, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(700, 700, 200, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = 1;

  // 어비스 아이콘 (소용돌이/심연)
  const centerX = SIZE / 2;
  const centerY = 280;

  // 외곽 글로우
  ctx.shadowColor = mainColor;
  ctx.shadowBlur = 50;
  ctx.strokeStyle = mainColor;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(centerX, centerY, 180, 0, Math.PI * 2);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // 소용돌이 패턴
  for (let i = 0; i < 5; i++) {
    ctx.globalAlpha = 0.3 - i * 0.05;
    ctx.strokeStyle = mainColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 160 - i * 30, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 중앙 심볼
  ctx.globalAlpha = 1;
  ctx.fillStyle = mainColor;
  ctx.shadowColor = mainColor;
  ctx.shadowBlur = 30;
  ctx.beginPath();
  ctx.arc(centerX, centerY, 60, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // 내부 어둠
  const innerGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 50);
  innerGrad.addColorStop(0, '#1a1a2e');
  innerGrad.addColorStop(1, mainColor);
  ctx.fillStyle = innerGrad;
  ctx.beginPath();
  ctx.arc(centerX, centerY, 45, 0, Math.PI * 2);
  ctx.fill();

  // 부엉이공화국
  ctx.font = 'bold 32px "Noto Sans KR"';
  ctx.fillStyle = '#ffd700';
  ctx.textAlign = 'center';
  ctx.fillText('부엉이공화국', SIZE / 2, 50);

  // 어비스
  ctx.shadowColor = mainColor;
  ctx.shadowBlur = 25;
  ctx.font = 'bold 80px "Noto Sans KR"';
  ctx.fillStyle = mainColor;
  ctx.fillText('어비스', SIZE / 2, 560);
  ctx.shadowBlur = 0;

  // 파티 모집
  ctx.font = '36px "Noto Sans KR"';
  ctx.fillStyle = '#e8e8e8';
  ctx.fillText('파티 모집', SIZE / 2, 620);

  // 4인 태그
  ctx.globalAlpha = 0.2;
  ctx.fillStyle = mainColor;
  ctx.beginPath();
  ctx.roundRect(SIZE / 2 - 60, 660, 120, 50, 25);
  ctx.fill();

  ctx.globalAlpha = 1;
  ctx.font = 'bold 26px "Noto Sans KR"';
  ctx.fillStyle = mainColor;
  ctx.fillText('4인 파티', SIZE / 2, 695);

  // 하단 라인
  ctx.globalAlpha = 0.3;
  ctx.strokeStyle = mainColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(100, 750);
  ctx.lineTo(700, 750);
  ctx.stroke();

  // URL
  ctx.globalAlpha = 0.6;
  ctx.font = '20px "Noto Sans KR"';
  ctx.fillStyle = '#888';
  ctx.fillText('jjinbbang2.github.io/owl', SIZE / 2, 780);

  // PNG 저장
  const buffer = canvas.toBuffer('image/png');
  fs.mkdirSync(path.join(__dirname, '..', 'images', 'abyss'), { recursive: true });
  const outputPath = path.join(__dirname, '..', 'images', 'abyss', 'kakao-abyss.png');
  fs.writeFileSync(outputPath, buffer);
  console.log(`Generated: kakao-abyss.png (${buffer.length} bytes)`);
}

// 품앗이 이미지 생성
async function generateHelpImage() {
  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext('2d');

  // 배경 그라데이션 (녹색/협동 테마)
  const bgGrad = ctx.createLinearGradient(0, 0, SIZE, SIZE);
  bgGrad.addColorStop(0, '#0a1a0a');
  bgGrad.addColorStop(0.5, '#152815');
  bgGrad.addColorStop(1, '#080f08');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, SIZE, SIZE);

  const mainColor = '#4ade80'; // 녹색

  // 장식용 원들
  ctx.globalAlpha = 0.05;
  ctx.fillStyle = mainColor;
  ctx.beginPath();
  ctx.arc(100, 100, 150, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(700, 700, 200, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = 1;

  // 품앗이 아이콘 (손 맞잡기 / 협동)
  const centerX = SIZE / 2;
  const centerY = 280;

  // 외곽 원
  ctx.shadowColor = mainColor;
  ctx.shadowBlur = 50;
  ctx.strokeStyle = mainColor;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(centerX, centerY, 180, 0, Math.PI * 2);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // 4명의 사람 아이콘 (원형 배치)
  const personRadius = 140;
  const positions = [
    { angle: -Math.PI / 2 },      // 상단
    { angle: Math.PI / 2 },       // 하단
    { angle: 0 },                 // 우측
    { angle: Math.PI }            // 좌측
  ];

  positions.forEach((pos, i) => {
    const px = centerX + Math.cos(pos.angle) * personRadius;
    const py = centerY + Math.sin(pos.angle) * personRadius;

    // 머리
    ctx.fillStyle = mainColor;
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.arc(px, py - 15, 25, 0, Math.PI * 2);
    ctx.fill();

    // 몸통
    ctx.beginPath();
    ctx.ellipse(px, py + 25, 20, 30, 0, 0, Math.PI * 2);
    ctx.fill();
  });

  // 중앙 하트 (협동 심볼)
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#ff6b6b';
  ctx.shadowColor = '#ff6b6b';
  ctx.shadowBlur = 20;

  // 하트 그리기
  ctx.beginPath();
  ctx.moveTo(centerX, centerY + 20);
  ctx.bezierCurveTo(centerX - 40, centerY - 10, centerX - 40, centerY - 40, centerX, centerY - 25);
  ctx.bezierCurveTo(centerX + 40, centerY - 40, centerX + 40, centerY - 10, centerX, centerY + 20);
  ctx.fill();
  ctx.shadowBlur = 0;

  // 부엉이공화국
  ctx.font = 'bold 32px "Noto Sans KR"';
  ctx.fillStyle = '#ffd700';
  ctx.textAlign = 'center';
  ctx.fillText('부엉이공화국', SIZE / 2, 50);

  // 품앗이
  ctx.shadowColor = mainColor;
  ctx.shadowBlur = 25;
  ctx.font = 'bold 80px "Noto Sans KR"';
  ctx.fillStyle = mainColor;
  ctx.fillText('품앗이', SIZE / 2, 560);
  ctx.shadowBlur = 0;

  // 파티 모집
  ctx.font = '36px "Noto Sans KR"';
  ctx.fillStyle = '#e8e8e8';
  ctx.fillText('파티 모집', SIZE / 2, 620);

  // 4인 태그
  ctx.globalAlpha = 0.2;
  ctx.fillStyle = mainColor;
  ctx.beginPath();
  ctx.roundRect(SIZE / 2 - 60, 660, 120, 50, 25);
  ctx.fill();

  ctx.globalAlpha = 1;
  ctx.font = 'bold 26px "Noto Sans KR"';
  ctx.fillStyle = mainColor;
  ctx.fillText('4인 파티', SIZE / 2, 695);

  // 하단 라인
  ctx.globalAlpha = 0.3;
  ctx.strokeStyle = mainColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(100, 750);
  ctx.lineTo(700, 750);
  ctx.stroke();

  // URL
  ctx.globalAlpha = 0.6;
  ctx.font = '20px "Noto Sans KR"';
  ctx.fillStyle = '#888';
  ctx.fillText('jjinbbang2.github.io/owl', SIZE / 2, 780);

  // PNG 저장
  const buffer = canvas.toBuffer('image/png');
  fs.mkdirSync(path.join(__dirname, '..', 'images', 'abyss'), { recursive: true });
  const outputPath = path.join(__dirname, '..', 'images', 'abyss', 'kakao-help.png');
  fs.writeFileSync(outputPath, buffer);
  console.log(`Generated: kakao-help.png (${buffer.length} bytes)`);
}

async function main() {
  console.log('카카오링크 이미지 생성 시작 (800x800 정사각형)...\n');

  console.log('=== 레이드 보스 이미지 ===');
  for (const boss of raidBosses) {
    await generateRaidBossImage(boss);
  }

  console.log('\n=== 어비스 이미지 ===');
  await generateAbyssImage();

  console.log('\n=== 품앗이 이미지 ===');
  await generateHelpImage();

  console.log('\n모든 이미지 생성 완료!');
}

main().catch(console.error);
