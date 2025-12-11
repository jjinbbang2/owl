const { createCanvas, registerFont } = require('canvas');
const fs = require('fs');
const path = require('path');

// 폰트 등록
const fontsDir = path.join(__dirname, '..', 'fonts');
registerFont(path.join(fontsDir, 'NotoSansKR-Bold.otf'), { family: 'Noto Sans KR', weight: 'bold' });
registerFont(path.join(fontsDir, 'NotoSansKR-Regular.otf'), { family: 'Noto Sans KR', weight: 'normal' });

// 캔버스 생성 (OG 이미지 권장 사이즈)
const width = 1200;
const height = 630;
const canvas = createCanvas(width, height);
const ctx = canvas.getContext('2d');

// 배경 그라데이션
const bgGrad = ctx.createLinearGradient(0, 0, width, height);
bgGrad.addColorStop(0, '#1a1a2e');
bgGrad.addColorStop(0.5, '#16213e');
bgGrad.addColorStop(1, '#0f0f23');
ctx.fillStyle = bgGrad;
ctx.fillRect(0, 0, width, height);

// 장식용 원들 (은은한 배경)
ctx.globalAlpha = 0.03;
ctx.fillStyle = '#ffd700';
ctx.beginPath();
ctx.arc(150, 100, 200, 0, Math.PI * 2);
ctx.fill();

ctx.fillStyle = '#4ecdc4';
ctx.beginPath();
ctx.arc(1050, 530, 250, 0, Math.PI * 2);
ctx.fill();

ctx.globalAlpha = 0.02;
ctx.fillStyle = '#ff6b6b';
ctx.beginPath();
ctx.arc(600, 50, 150, 0, Math.PI * 2);
ctx.fill();

ctx.fillStyle = '#ffd700';
ctx.beginPath();
ctx.arc(1100, 150, 100, 0, Math.PI * 2);
ctx.fill();

// 작은 별 장식들
ctx.globalAlpha = 0.4;
ctx.fillStyle = '#ffd700';
const stars = [
  { x: 100, y: 200, r: 2 },
  { x: 200, y: 550, r: 1.5 },
  { x: 350, y: 80, r: 2 },
  { x: 1000, y: 100, r: 2 },
  { x: 1100, y: 400, r: 1.5 },
  { x: 950, y: 550, r: 2 },
  { x: 800, y: 50, r: 1.5 }
];
stars.forEach(star => {
  ctx.beginPath();
  ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
  ctx.fill();
});

ctx.globalAlpha = 1;

// 부엉이 그리기 (멋진 버전)
function drawOwl(x, y, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // 그림자 효과
  ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
  ctx.shadowBlur = 20;
  ctx.shadowOffsetX = 5;
  ctx.shadowOffsetY = 5;

  // 날개 (뒤쪽)
  ctx.fillStyle = '#4a3a2d';
  ctx.beginPath();
  ctx.ellipse(-70, 30, 40, 70, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(70, 30, 40, 70, 0.3, 0, Math.PI * 2);
  ctx.fill();

  // 날개 깃털 디테일
  ctx.fillStyle = '#3d2f24';
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.ellipse(-75 + i * 8, 50 + i * 15, 8, 25, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(75 - i * 8, 50 + i * 15, 8, 25, 0.2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // 몸통 (그라데이션)
  const bodyGrad = ctx.createRadialGradient(0, 50, 0, 0, 50, 90);
  bodyGrad.addColorStop(0, '#7a6555');
  bodyGrad.addColorStop(0.7, '#5c4a3d');
  bodyGrad.addColorStop(1, '#4a3a2d');
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.ellipse(0, 50, 85, 75, 0, 0, Math.PI * 2);
  ctx.fill();

  // 머리 (그라데이션)
  const headGrad = ctx.createRadialGradient(0, -25, 0, 0, -25, 85);
  headGrad.addColorStop(0, '#9a8570');
  headGrad.addColorStop(0.6, '#7a6555');
  headGrad.addColorStop(1, '#5c4a3d');
  ctx.fillStyle = headGrad;
  ctx.beginPath();
  ctx.arc(0, -25, 80, 0, Math.PI * 2);
  ctx.fill();

  // 귀 깃털 (더 날카롭게)
  ctx.fillStyle = '#5c4a3d';
  ctx.beginPath();
  ctx.moveTo(-55, -85);
  ctx.quadraticCurveTo(-65, -60, -35, -40);
  ctx.quadraticCurveTo(-55, -55, -75, -50);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(55, -85);
  ctx.quadraticCurveTo(65, -60, 35, -40);
  ctx.quadraticCurveTo(55, -55, 75, -50);
  ctx.closePath();
  ctx.fill();

  // 귀 깃털 하이라이트
  ctx.fillStyle = '#7a6555';
  ctx.beginPath();
  ctx.moveTo(-50, -80);
  ctx.quadraticCurveTo(-55, -65, -40, -50);
  ctx.quadraticCurveTo(-50, -60, -60, -55);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(50, -80);
  ctx.quadraticCurveTo(55, -65, 40, -50);
  ctx.quadraticCurveTo(50, -60, 60, -55);
  ctx.closePath();
  ctx.fill();

  // 얼굴 무늬 (하트 모양)
  ctx.fillStyle = '#c4a574';
  ctx.beginPath();
  ctx.moveTo(0, 10);
  ctx.bezierCurveTo(-50, -10, -60, -50, 0, -70);
  ctx.bezierCurveTo(60, -50, 50, -10, 0, 10);
  ctx.closePath();
  ctx.fill();

  // 얼굴 무늬 안쪽
  ctx.fillStyle = '#d4b584';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(-35, -15, -45, -45, 0, -60);
  ctx.bezierCurveTo(45, -45, 35, -15, 0, 0);
  ctx.closePath();
  ctx.fill();

  // 눈 테두리 (더 큰 원)
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.arc(-28, -30, 35, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(28, -30, 35, 0, Math.PI * 2);
  ctx.fill();

  // 눈 흰자위
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(-28, -30, 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(28, -30, 30, 0, Math.PI * 2);
  ctx.fill();

  // 눈동자 (빛나는 그라데이션)
  const eyeGrad1 = ctx.createRadialGradient(-28, -35, 0, -28, -30, 24);
  eyeGrad1.addColorStop(0, '#ffed4a');
  eyeGrad1.addColorStop(0.5, '#ffd700');
  eyeGrad1.addColorStop(1, '#ff8c00');
  ctx.fillStyle = eyeGrad1;
  ctx.beginPath();
  ctx.arc(-28, -30, 24, 0, Math.PI * 2);
  ctx.fill();

  const eyeGrad2 = ctx.createRadialGradient(28, -35, 0, 28, -30, 24);
  eyeGrad2.addColorStop(0, '#ffed4a');
  eyeGrad2.addColorStop(0.5, '#ffd700');
  eyeGrad2.addColorStop(1, '#ff8c00');
  ctx.fillStyle = eyeGrad2;
  ctx.beginPath();
  ctx.arc(28, -30, 24, 0, Math.PI * 2);
  ctx.fill();

  // 동공 (깊이감)
  const pupilGrad1 = ctx.createRadialGradient(-28, -30, 0, -28, -30, 12);
  pupilGrad1.addColorStop(0, '#2a2a2a');
  pupilGrad1.addColorStop(1, '#000');
  ctx.fillStyle = pupilGrad1;
  ctx.beginPath();
  ctx.arc(-28, -30, 12, 0, Math.PI * 2);
  ctx.fill();

  const pupilGrad2 = ctx.createRadialGradient(28, -30, 0, 28, -30, 12);
  pupilGrad2.addColorStop(0, '#2a2a2a');
  pupilGrad2.addColorStop(1, '#000');
  ctx.fillStyle = pupilGrad2;
  ctx.beginPath();
  ctx.arc(28, -30, 12, 0, Math.PI * 2);
  ctx.fill();

  // 눈 하이라이트 (반짝임)
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(-35, -38, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(21, -38, 7, 0, Math.PI * 2);
  ctx.fill();

  // 작은 하이라이트
  ctx.globalAlpha = 0.6;
  ctx.beginPath();
  ctx.arc(-22, -25, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(34, -25, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // 부리 (그라데이션)
  const beakGrad = ctx.createLinearGradient(0, 5, 0, 25);
  beakGrad.addColorStop(0, '#ffb347');
  beakGrad.addColorStop(1, '#ff8c00');
  ctx.fillStyle = beakGrad;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-12, 15, -8, 25);
  ctx.lineTo(0, 22);
  ctx.lineTo(8, 25);
  ctx.quadraticCurveTo(12, 15, 0, 0);
  ctx.closePath();
  ctx.fill();

  // 부리 하이라이트
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.beginPath();
  ctx.ellipse(-3, 8, 3, 6, -0.3, 0, Math.PI * 2);
  ctx.fill();

  // 가슴 무늬 (세련된 패턴)
  const chestGrad = ctx.createRadialGradient(0, 60, 0, 0, 60, 50);
  chestGrad.addColorStop(0, '#e8d5b5');
  chestGrad.addColorStop(0.5, '#d4b584');
  chestGrad.addColorStop(1, '#c4a574');
  ctx.fillStyle = chestGrad;
  ctx.beginPath();
  ctx.ellipse(0, 60, 50, 40, 0, 0, Math.PI * 2);
  ctx.fill();

  // 가슴 깃털 패턴
  ctx.fillStyle = '#c4a574';
  for (let row = 0; row < 3; row++) {
    for (let col = -2; col <= 2; col++) {
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.ellipse(col * 15, 45 + row * 18, 12, 8, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;

  // 발 (선택적)
  ctx.fillStyle = '#ff8c00';
  ctx.beginPath();
  ctx.ellipse(-20, 125, 15, 8, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(20, 125, 15, 8, 0.2, 0, Math.PI * 2);
  ctx.fill();

  // 발톱
  ctx.fillStyle = '#4a3a2d';
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.ellipse(-28 + i * 8, 130, 3, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(12 + i * 8, 130, 3, 8, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

// 왕관 그리기
function drawCrown(x, y, size, color, alpha = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;

  const s = size / 50; // 기준 크기 50px

  // 왕관 베이스
  ctx.beginPath();
  ctx.moveTo(-25 * s, 20 * s);
  ctx.lineTo(-20 * s, -5 * s);
  ctx.lineTo(-10 * s, 5 * s);
  ctx.lineTo(0, -20 * s);
  ctx.lineTo(10 * s, 5 * s);
  ctx.lineTo(20 * s, -5 * s);
  ctx.lineTo(25 * s, 20 * s);
  ctx.closePath();
  ctx.fill();

  // 왕관 밴드
  ctx.fillStyle = color;
  ctx.globalAlpha = alpha * 0.8;
  ctx.beginPath();
  ctx.roundRect(-25 * s, 15 * s, 50 * s, 8 * s, 2 * s);
  ctx.fill();

  // 보석들
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#ff4444';
  ctx.beginPath();
  ctx.arc(0, -12 * s, 4 * s, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#44ff44';
  ctx.beginPath();
  ctx.arc(-15 * s, 0, 3 * s, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#4444ff';
  ctx.beginPath();
  ctx.arc(15 * s, 0, 3 * s, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// 검 아이콘 그리기
function drawSword(x, y, size, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;

  const s = size / 24;

  // 칼날
  ctx.beginPath();
  ctx.moveTo(0, -10 * s);
  ctx.lineTo(3 * s, 2 * s);
  ctx.lineTo(0, 5 * s);
  ctx.lineTo(-3 * s, 2 * s);
  ctx.closePath();
  ctx.fill();

  // 손잡이 가드
  ctx.beginPath();
  ctx.roundRect(-6 * s, 5 * s, 12 * s, 3 * s, 1 * s);
  ctx.fill();

  // 손잡이
  ctx.beginPath();
  ctx.roundRect(-2 * s, 8 * s, 4 * s, 6 * s, 1 * s);
  ctx.fill();

  ctx.restore();
}

// 사람들 아이콘 그리기
function drawPeople(x, y, size, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;

  const s = size / 24;

  // 왼쪽 사람
  ctx.beginPath();
  ctx.arc(-5 * s, -4 * s, 4 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(-5 * s, 6 * s, 5 * s, 7 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  // 오른쪽 사람
  ctx.beginPath();
  ctx.arc(5 * s, -4 * s, 4 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(5 * s, 6 * s, 5 * s, 7 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// 드래곤 아이콘 그리기
function drawDragon(x, y, size, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;

  const s = size / 24;

  // 머리
  ctx.beginPath();
  ctx.ellipse(0, -3 * s, 6 * s, 5 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  // 뿔
  ctx.beginPath();
  ctx.moveTo(-4 * s, -7 * s);
  ctx.lineTo(-6 * s, -12 * s);
  ctx.lineTo(-2 * s, -8 * s);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(4 * s, -7 * s);
  ctx.lineTo(6 * s, -12 * s);
  ctx.lineTo(2 * s, -8 * s);
  ctx.closePath();
  ctx.fill();

  // 몸통
  ctx.beginPath();
  ctx.ellipse(0, 6 * s, 5 * s, 7 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  // 눈
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(-2 * s, -4 * s, 1.5 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(2 * s, -4 * s, 1.5 * s, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// 부엉이 그리기
drawOwl(200, 315, 1);

// 메인 타이틀 - 글로우 효과
ctx.shadowColor = '#ffd700';
ctx.shadowBlur = 20;
ctx.font = 'bold 100px "Noto Sans KR"';
ctx.fillStyle = '#ffd700';
ctx.fillText('부엉이공화국', 420, 260);
ctx.shadowBlur = 0;

// 왕관 장식 (타이틀 옆)
drawCrown(1050, 220, 60, '#ffd700', 0.3);

// 부제목
ctx.font = '44px "Noto Sans KR"';
ctx.globalAlpha = 0.9;
ctx.fillStyle = '#e8e8e8';
ctx.fillText('랭킹, 파티매칭 시스템', 420, 340);
ctx.globalAlpha = 1;

// 기능 태그들 (아이콘 + 텍스트)
function drawTagWithIcon(x, y, text, bgColor, textColor, drawIconFn) {
  ctx.font = '22px "Noto Sans KR"';
  const textWidth = ctx.measureText(text).width;
  const iconSpace = 30;
  const padding = 20;
  const tagHeight = 50;
  const tagWidth = iconSpace + textWidth + padding * 2;

  // 배경
  ctx.globalAlpha = 0.15;
  ctx.fillStyle = bgColor;
  ctx.beginPath();
  ctx.roundRect(x, y, tagWidth, tagHeight, 25);
  ctx.fill();

  // 아이콘
  ctx.globalAlpha = 1;
  drawIconFn(x + padding + 10, y + 25, 20, textColor);

  // 텍스트
  ctx.fillStyle = textColor;
  ctx.fillText(text, x + padding + iconSpace, y + 33);

  return tagWidth;
}

let tagX = 420;
const tagY = 420;
const gap = 20;

tagX += drawTagWithIcon(tagX, tagY, '전투력', '#ffd700', '#ffd700', drawSword) + gap;
tagX += drawTagWithIcon(tagX, tagY, '파티매칭', '#4ecdc4', '#4ecdc4', drawPeople) + gap;
drawTagWithIcon(tagX, tagY, '레이드', '#ff6b6b', '#ff6b6b', drawDragon);

// 하단 구분선
ctx.globalAlpha = 0.3;
ctx.strokeStyle = '#ffd700';
ctx.lineWidth = 2;
ctx.beginPath();
ctx.moveTo(420, 520);
ctx.lineTo(1100, 520);
ctx.stroke();

// 하단 태그라인
ctx.globalAlpha = 1;
ctx.font = '24px "Noto Sans KR"';
ctx.fillStyle = '#888';
ctx.fillText('마비노기 모바일 길드 관리 시스템', 420, 560);

// PNG로 저장
const buffer = canvas.toBuffer('image/png');
const outputPath = path.join(__dirname, '..', 'og-image.png');
fs.writeFileSync(outputPath, buffer);
console.log(`OG image generated: ${outputPath}`);
console.log(`Size: ${buffer.length} bytes`);
