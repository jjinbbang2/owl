const { createCanvas, registerFont, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

// 폰트 등록
const fontsDir = path.join(__dirname, '..', 'fonts');
registerFont(path.join(fontsDir, 'NotoSansKR-Bold.otf'), { family: 'Noto Sans KR', weight: 'bold' });
registerFont(path.join(fontsDir, 'NotoSansKR-Regular.otf'), { family: 'Noto Sans KR', weight: 'normal' });

// 보스 정보
const bosses = [
  {
    id: 'glas',
    name: '글라스기브넨',
    imageFile: 'glas.png',
    color: '#ff4444',      // 빨간색 (악마/어둠)
    bgGradient: ['#1a0a0a', '#2d1515', '#0f0808'],
    members: 8
  },
  {
    id: 'succubus',
    name: '화이트 서큐버스',
    imageFile: 'succubus.png',
    color: '#ff69b4',      // 핑크 (서큐버스)
    bgGradient: ['#1a0a15', '#2d1525', '#0f0810'],
    members: 4
  },
  {
    id: 'tavartas',
    name: '타바르타스',
    imageFile: 'tavartas.png',
    color: '#ffd700',      // 골드 (황금 골렘)
    bgGradient: ['#1a1508', '#2d2510', '#0f0d05'],
    members: 8
  },
  {
    id: 'erel',
    name: '에이렐',
    imageFile: 'erel.png',
    color: '#66ccff',      // 하늘색 (바람/천공)
    bgGradient: ['#0a141a', '#15252d', '#08100f'],
    members: 4
  }
];

async function generateBossOGImage(boss) {
  const width = 1200;
  const height = 630;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // 배경 그라데이션
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, boss.bgGradient[0]);
  bgGrad.addColorStop(0.5, boss.bgGradient[1]);
  bgGrad.addColorStop(1, boss.bgGradient[2]);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // 장식용 원들
  ctx.globalAlpha = 0.05;
  ctx.fillStyle = boss.color;
  ctx.beginPath();
  ctx.arc(100, 100, 200, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(1100, 530, 250, 0, Math.PI * 2);
  ctx.fill();

  // 보스 이미지 로드 및 그리기
  try {
    const imagePath = path.join(__dirname, '..', 'images', 'raids', boss.imageFile);
    const bossImage = await loadImage(imagePath);

    // 이미지를 왼쪽에 크게 배치 (원형 마스크)
    ctx.save();
    ctx.globalAlpha = 1;

    // 원형 클리핑 마스크
    const centerX = 220;
    const centerY = 315;
    const radius = 180;

    // 테두리 그리기 (글로우 효과)
    ctx.shadowColor = boss.color;
    ctx.shadowBlur = 30;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 5, 0, Math.PI * 2);
    ctx.strokeStyle = boss.color;
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // 원형 마스크 적용
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.clip();

    // 이미지 비율 유지하면서 원에 맞게 그리기
    const imgSize = Math.max(bossImage.width, bossImage.height);
    const scale = (radius * 2.2) / imgSize;
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
    // 이미지 없으면 플레이스홀더
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = boss.color;
    ctx.beginPath();
    ctx.arc(220, 315, 150, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 1;

  // 부엉공화국 로고 텍스트 (상단)
  ctx.font = 'bold 28px "Noto Sans KR"';
  ctx.fillStyle = '#ffd700';
  ctx.fillText('부엉이공화국', 480, 180);

  // 보스 이름 (메인 타이틀)
  ctx.shadowColor = boss.color;
  ctx.shadowBlur = 20;
  ctx.font = 'bold 80px "Noto Sans KR"';
  ctx.fillStyle = boss.color;
  ctx.fillText(boss.name, 480, 280);
  ctx.shadowBlur = 0;

  // 레이드 타입 표시
  ctx.font = '36px "Noto Sans KR"';
  ctx.fillStyle = '#e8e8e8';
  ctx.fillText(`레이드 파티 모집`, 480, 340);

  // 인원수 태그
  ctx.globalAlpha = 0.2;
  ctx.fillStyle = boss.color;
  ctx.beginPath();
  ctx.roundRect(480, 380, 120, 50, 25);
  ctx.fill();

  ctx.globalAlpha = 1;
  ctx.font = 'bold 24px "Noto Sans KR"';
  ctx.fillStyle = boss.color;
  ctx.fillText(`${boss.members}인 레이드`, 495, 415);

  // 하단 URL
  ctx.font = '22px "Noto Sans KR"';
  ctx.fillStyle = '#666';
  ctx.fillText('jjinbbang2.github.io/owl/raid.html', 480, 550);

  // 하단 장식 라인
  ctx.globalAlpha = 0.3;
  ctx.strokeStyle = boss.color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(480, 490);
  ctx.lineTo(1100, 490);
  ctx.stroke();

  // PNG로 저장
  const buffer = canvas.toBuffer('image/png');
  const outputPath = path.join(__dirname, '..', 'images', 'raids', `og-${boss.id}.png`);
  fs.writeFileSync(outputPath, buffer);
  console.log(`Generated: ${outputPath} (${buffer.length} bytes)`);
}

async function main() {
  console.log('레이드 보스 OG 이미지 생성 시작...\n');

  for (const boss of bosses) {
    await generateBossOGImage(boss);
  }

  console.log('\n모든 이미지 생성 완료!');
}

main().catch(console.error);
