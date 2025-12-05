const { createCanvas, registerFont } = require('canvas');
const fs = require('fs');
const path = require('path');

// Register Korean font
const fontPath = path.join(__dirname, '..', 'fonts', 'NotoSansKR-Bold.ttf');
registerFont(fontPath, { family: 'Noto Sans KR', weight: 'bold' });

const width = 1200;
const height = 630;

const canvas = createCanvas(width, height);
const ctx = canvas.getContext('2d');

// Background gradient
const gradient = ctx.createLinearGradient(0, 0, width, height);
gradient.addColorStop(0, '#4a3728');
gradient.addColorStop(1, '#2d1f15');
ctx.fillStyle = gradient;
ctx.fillRect(0, 0, width, height);

// Decorative circles
ctx.globalAlpha = 0.03;
ctx.fillStyle = '#fff';
ctx.beginPath(); ctx.arc(100, 100, 100, 0, Math.PI * 2); ctx.fill();
ctx.beginPath(); ctx.arc(1100, 530, 150, 0, Math.PI * 2); ctx.fill();
ctx.beginPath(); ctx.arc(1000, 80, 75, 0, Math.PI * 2); ctx.fill();
ctx.globalAlpha = 1;

// Draw owl
function drawOwl(x, y, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    // Body
    ctx.beginPath();
    ctx.ellipse(0, 20, 45, 40, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#8b7355';
    ctx.fill();

    // Head
    ctx.beginPath();
    ctx.arc(0, -15, 40, 0, Math.PI * 2);
    ctx.fillStyle = '#a08060';
    ctx.fill();

    // Ears
    ctx.fillStyle = '#8b7355';
    ctx.beginPath();
    ctx.moveTo(-30, -45);
    ctx.lineTo(-20, -25);
    ctx.lineTo(-38, -30);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(30, -45);
    ctx.lineTo(20, -25);
    ctx.lineTo(38, -30);
    ctx.closePath();
    ctx.fill();

    // Eye whites
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(-15, -15, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(15, -15, 16, 0, Math.PI * 2);
    ctx.fill();

    // Eye colors (gradient)
    const eyeGrad1 = ctx.createRadialGradient(-15, -15, 0, -15, -15, 12);
    eyeGrad1.addColorStop(0, '#ffd700');
    eyeGrad1.addColorStop(1, '#ff8c00');
    ctx.fillStyle = eyeGrad1;
    ctx.beginPath();
    ctx.arc(-15, -15, 12, 0, Math.PI * 2);
    ctx.fill();

    const eyeGrad2 = ctx.createRadialGradient(15, -15, 0, 15, -15, 12);
    eyeGrad2.addColorStop(0, '#ffd700');
    eyeGrad2.addColorStop(1, '#ff8c00');
    ctx.fillStyle = eyeGrad2;
    ctx.beginPath();
    ctx.arc(15, -15, 12, 0, Math.PI * 2);
    ctx.fill();

    // Pupils
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(-15, -15, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(15, -15, 5, 0, Math.PI * 2);
    ctx.fill();

    // Eye highlights
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.beginPath();
    ctx.arc(-18, -18, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(12, -18, 3, 0, Math.PI * 2);
    ctx.fill();

    // Beak
    ctx.fillStyle = '#ff8c00';
    ctx.beginPath();
    ctx.moveTo(0, -5);
    ctx.lineTo(-8, 8);
    ctx.lineTo(8, 8);
    ctx.closePath();
    ctx.fill();

    // Chest pattern
    ctx.fillStyle = '#c4a574';
    ctx.beginPath();
    ctx.ellipse(0, 30, 22, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

// Draw owl at left side
drawOwl(200, 320, 2.5);

// Title
ctx.font = 'bold 85px "Noto Sans KR"';
ctx.fillStyle = '#ffd700';
ctx.textBaseline = 'middle';
ctx.fillText('부엉공화국', 400, 240);

// Subtitle
ctx.font = 'bold 36px "Noto Sans KR"';
ctx.fillStyle = '#e8dcc8';
ctx.fillText('마비노기 모바일 길드원 랭킹', 400, 320);

// Categories
ctx.font = 'bold 28px "Noto Sans KR"';
ctx.fillStyle = '#c4a574';
ctx.fillText('전투력  ·  생활력  ·  매력', 400, 400);

// Divider line
ctx.strokeStyle = 'rgba(255, 215, 0, 0.4)';
ctx.lineWidth = 2;
ctx.beginPath();
ctx.moveTo(400, 450);
ctx.lineTo(1100, 450);
ctx.stroke();

// URL
ctx.font = 'bold 22px "Noto Sans KR"';
ctx.fillStyle = '#a08060';
ctx.fillText('jjinbbang2.github.io/owl', 400, 500);

// Save
const buffer = canvas.toBuffer('image/png');
const outputPath = path.join(__dirname, '..', 'og-image.png');
fs.writeFileSync(outputPath, buffer);
console.log('OG image generated:', outputPath);
