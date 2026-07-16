// ==================== 绘制函数 ====================
function drawTerrainZones() {
    terrainZones.filter(z => z.type === 'water').forEach(z => {
        const water = ctx.createLinearGradient(z.x, z.y, z.x + z.w, z.y + z.h);
        water.addColorStop(0, '#126b91');
        water.addColorStop(0.5, '#1b88ac');
        water.addColorStop(1, '#0c587d');
        ctx.fillStyle = water;
        ctx.fillRect(z.x, z.y, z.w, z.h);
        ctx.strokeStyle = 'rgba(150,225,255,0.25)';
        ctx.lineWidth = 3;
        for(let y = z.y + 35; y < z.y + z.h; y += 70) {
            ctx.beginPath();
            ctx.moveTo(z.x + 15, y);
            ctx.lineTo(z.x + z.w - 15, y);
            ctx.stroke();
        }
    });
    terrainZones.filter(z => z.type === 'land').forEach(z => {
        ctx.save();
        ctx.fillStyle = '#6f9b55';
        ctx.strokeStyle = '#c8b477';
        ctx.lineWidth = 24;
        ctx.beginPath();
        ctx.ellipse(z.x, z.y, z.rx, z.ry, 0, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();
        ctx.restore();
    });
    terrainZones.filter(z => z.type === 'bridge').forEach(z => {
        ctx.save();
        if(z.centered) { ctx.translate(z.x, z.y); ctx.rotate(z.angle || 0); }
        const x = z.centered ? -z.w / 2 : z.x;
        const y = z.centered ? -z.h / 2 : z.y;
        ctx.fillStyle = '#765231';
        ctx.fillRect(x, y, z.w, z.h);
        ctx.strokeStyle = '#b78a50';
        ctx.lineWidth = 8;
        ctx.strokeRect(x, y, z.w, z.h);
        ctx.strokeStyle = 'rgba(30,20,10,0.45)';
        ctx.lineWidth = 2;
        for(let plankX = x + 30; plankX < x + z.w; plankX += 45) {
            ctx.beginPath(); ctx.moveTo(plankX, y + 8); ctx.lineTo(plankX, y + z.h - 8); ctx.stroke();
        }
        ctx.restore();
    });
}

function drawCityRoads() {
    ctx.save();
    ctx.strokeStyle = '#1f2328';
    ctx.lineWidth = 170;
    for(let x = 300; x < CONFIG.mapWidth; x += 600) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CONFIG.mapHeight); ctx.stroke();
    }
    for(let y = 300; y < CONFIG.mapHeight; y += 600) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CONFIG.mapWidth, y); ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(245,205,65,0.65)';
    ctx.lineWidth = 4;
    ctx.setLineDash([38, 30]);
    for(let x = 300; x < CONFIG.mapWidth; x += 600) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CONFIG.mapHeight); ctx.stroke();
    }
    for(let y = 300; y < CONFIG.mapHeight; y += 600) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CONFIG.mapWidth, y); ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.restore();
}

function drawBuildingObstacle(obs) {
    const facade = ctx.createLinearGradient(obs.x, obs.y, obs.x + obs.w, obs.y + obs.h);
    facade.addColorStop(0, '#686f78'); facade.addColorStop(1, '#3d434b');
    ctx.fillStyle = facade;
    ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
    ctx.strokeStyle = '#1c2025'; ctx.lineWidth = 7; ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);
    ctx.fillStyle = 'rgba(145,210,235,0.55)';
    const cols = Math.max(2, Math.floor(obs.w / 70));
    const rows = Math.max(2, Math.floor(obs.h / 70));
    for(let col = 0; col < cols; col++) {
        for(let row = 0; row < rows; row++) {
            const wx = obs.x + 25 + col * ((obs.w - 50) / cols);
            const wy = obs.y + 25 + row * ((obs.h - 50) / rows);
            ctx.fillRect(wx, wy, 22, 16);
        }
    }
    ctx.fillStyle = '#2a2f35';
    ctx.fillRect(obs.x + obs.w * 0.38, obs.y + obs.h * 0.4, obs.w * 0.24, obs.h * 0.2);
}

function drawTreeObstacle(obs) {
    const cx = obs.x + obs.w / 2, cy = obs.y + obs.h / 2;
    ctx.fillStyle = '#49351f';
    ctx.fillRect(cx - obs.w * 0.12, cy, obs.w * 0.24, obs.h * 0.48);
    ctx.fillStyle = '#1d5d2b';
    ctx.beginPath(); ctx.arc(cx, cy, Math.max(obs.w, obs.h) * 0.48, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2f7a39';
    ctx.beginPath(); ctx.arc(cx - obs.w * 0.18, cy - obs.h * 0.14, obs.w * 0.28, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + obs.w * 0.2, cy - obs.h * 0.08, obs.w * 0.25, 0, Math.PI * 2); ctx.fill();
}

function drawSnowTracks() {
    if(currentMap !== 'snow') return;
    snowTracks.forEach(track => {
        const alpha = Math.max(0, track.life / track.maxLife) * 0.36;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = '#53636b';
        ctx.lineWidth = 4;
        const dx = Math.cos(track.angle) * 11, dy = Math.sin(track.angle) * 11;
        ctx.beginPath();
        ctx.moveTo(track.x1 - dx, track.y1 - dy); ctx.lineTo(track.x1 + dx, track.y1 + dy);
        ctx.moveTo(track.x2 - dx, track.y2 - dy); ctx.lineTo(track.x2 + dx, track.y2 + dy);
        ctx.stroke();
        ctx.restore();
    });
}

function drawTankWaterOverlay(tank) {
    ctx.save();
    ctx.globalAlpha = tank.tankType === 'duoduo_ifv' ? 0.34 : 0.48;
    ctx.fillStyle = '#249bd0';
    ctx.beginPath();
    ctx.ellipse(tank.x, tank.y + 5, CONFIG.tankSize * 1.35, CONFIG.tankSize * 0.85, tank.angle, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(185,240,255,0.8)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(tank.x, tank.y, CONFIG.tankSize * 1.12, 0.12, Math.PI - 0.12);
    ctx.stroke();
    ctx.restore();
}

function drawExhaustTrails() {
    exhaustTrails.forEach(t => {
        const alpha = Math.max(0, t.life / t.maxLife);
        ctx.save();
        ctx.globalAlpha = alpha * 0.6;
        ctx.fillStyle = t.color;
        ctx.shadowColor = t.color;
        /*shadow*/ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });
    ctx.globalAlpha = 1;
}

function drawTrailEffects() {
    trailEffects.forEach(t => {
        const alpha = Math.max(0, t.life / t.maxLife);
        ctx.save();
        ctx.globalAlpha = alpha * 0.3;
        ctx.strokeStyle = t.team === 'blue' ? '#4488ff' : '#ff4444';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
    });
    ctx.globalAlpha = 1;
}

function drawDamageNumbers() {
    damageNumbers.forEach(dn => {
        const alpha = Math.max(0, dn.life / dn.maxLife);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#ff4444';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(dn.text, dn.x, dn.y);
    });
    ctx.globalAlpha = 1;
}


function drawHelicopter(tank) {
    ctx.save();
    ctx.translate(tank.x, tank.y);

    // 悬停动画
    const hoverOffset = Math.sin(Date.now() * 0.003) * 3;
    ctx.translate(0, hoverOffset);

    // 阴影（在地面上）
    ctx.save();
    ctx.translate(0, 20);
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 20, 8, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();

    // 机身（椭圆）
    ctx.fillStyle = tank.color;
    /*shadow*/ctx.shadowColor = 'transparent';
    /*shadow*/ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.ellipse(0, 0, 22, 12, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // 驾驶舱
    ctx.fillStyle = tank.accent;
    ctx.beginPath();
    ctx.ellipse(8, -2, 10, 7, -0.2, 0, Math.PI*2);
    ctx.fill();

    // 尾翼
    ctx.fillStyle = tank.color;
    ctx.beginPath();
    ctx.moveTo(-18, 0);
    ctx.lineTo(-28, -8);
    ctx.lineTo(-28, 8);
    ctx.closePath();
    ctx.fill();

    // 主螺旋桨（旋转动画）
    const rotorAngle = Date.now() * 0.02;
    ctx.strokeStyle = 'rgba(200,200,200,0.8)';
    ctx.lineWidth = 2;
    ctx.save();
    ctx.translate(0, -12);
    ctx.rotate(rotorAngle);
    ctx.beginPath();
    ctx.moveTo(-35, 0);
    ctx.lineTo(35, 0);
    ctx.moveTo(0, -8);
    ctx.lineTo(0, 8);
    ctx.stroke();
    ctx.restore();

    // 尾螺旋桨
    ctx.save();
    ctx.translate(-28, 0);
    ctx.rotate(rotorAngle * 1.5);
    ctx.strokeStyle = 'rgba(180,180,180,0.7)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(0, 6);
    ctx.stroke();
    ctx.restore();

    // 起落架
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-8, 10);
    ctx.lineTo(-8, 16);
    ctx.moveTo(8, 10);
    ctx.lineTo(8, 16);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-12, 16);
    ctx.lineTo(12, 16);
    ctx.stroke();

    // 炮塔
    ctx.save();
    ctx.translate(0, 0);
    ctx.rotate(tank.turretAngle - tank.angle);
    ctx.fillStyle = '#444';
    ctx.fillRect(0, -3, 16, 6);
    ctx.fillStyle = tank.accent;
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();

    ctx.restore();

    // HP条
    const hpRatio = Math.max(0, tank.hp / tank.maxHp);
    const barW = 50, barH = 5, barY = tank.y - 35;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(tank.x - barW/2 - 1, barY - 1, barW + 2, barH + 2);
    ctx.fillStyle = hpRatio > 0.6 ? '#00ff88' : hpRatio > 0.3 ? '#ffaa00' : '#ff4444';
    ctx.fillRect(tank.x - barW/2, barY, barW * hpRatio, barH);

    // 玩家标识
    if(tank.isPlayer) {
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.arc(tank.x, tank.y, 30, 0, Math.PI*2);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    // 团队标识
    ctx.fillStyle = tank.team === 'blue' ? '#4488ff' : '#ff4444';
    ctx.shadowColor = ctx.fillStyle;
    /*shadow*/ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(tank.x, tank.y - 40, 4, 0, Math.PI*2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // 飞行标识
    if(tank.isFlying) {
        ctx.fillStyle = '#44ddff';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('✈', tank.x, tank.y - 45);
    }
}

function drawTank(tank) {
    if(tank.shape === 'helicopter') {
        drawHelicopter(tank);
        return;
    }
    ctx.save();
    ctx.translate(tank.x, tank.y);
    ctx.rotate(tank.angle);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(6, 6, CONFIG.tankSize * 1.1, CONFIG.tankSize * 0.65, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = '#1a1a1a';
    const trackW = CONFIG.tankSize * 1.8, trackH = CONFIG.tankSize * 0.25, trackOffset = CONFIG.tankSize * 0.8;
    ctx.fillRect(-trackW/2, -trackOffset, trackW, trackH);
    ctx.fillRect(-trackW/2, trackOffset - trackH, trackW, trackH);
    ctx.fillStyle = '#333';
    ctx.fillRect(-trackW/2 + 2, -trackOffset + 2, trackW - 4, 2);
    ctx.fillRect(-trackW/2 + 2, trackOffset - trackH + 2, trackW - 4, 2);
    ctx.fillStyle = '#0a0a0a';
    // 履带纹理批量绘制
    for(let i = -trackW/2 + 6; i < trackW/2; i += 12) {
        ctx.fillRect(i, -trackOffset, 4, trackH);
        ctx.fillRect(i, trackOffset - trackH, 4, trackH);
    }
    ctx.fillStyle = tank.color;
    /*shadow*/ctx.shadowColor = 'transparent';
    /*shadow*/ctx.shadowBlur = 0;
    if(tank.shape === 'light') {
        ctx.beginPath();
        ctx.moveTo(CONFIG.tankSize, 0);
        ctx.lineTo(-CONFIG.tankSize*0.3, -CONFIG.tankSize*0.65);
        ctx.lineTo(-CONFIG.tankSize*0.6, -CONFIG.tankSize*0.2);
        ctx.lineTo(-CONFIG.tankSize*0.7, 0);
        ctx.lineTo(-CONFIG.tankSize*0.6, CONFIG.tankSize*0.2);
        ctx.lineTo(-CONFIG.tankSize*0.3, CONFIG.tankSize*0.65);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = tank.accent;
        ctx.lineWidth = 2;
        ctx.shadowBlur = 0;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(CONFIG.tankSize*0.3, -CONFIG.tankSize*0.3);
        ctx.lineTo(-CONFIG.tankSize*0.2, 0);
        ctx.lineTo(CONFIG.tankSize*0.3, CONFIG.tankSize*0.3);
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.stroke();
    } else if(tank.shape === 'medium') {
        ctx.beginPath();
        ctx.ellipse(0, 0, CONFIG.tankSize*0.9, CONFIG.tankSize*0.6, 0, 0, Math.PI*2);
        ctx.fill();
        ctx.strokeStyle = tank.accent;
        ctx.lineWidth = 2;
        ctx.shadowBlur = 0;
        ctx.stroke();
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.fillRect(-CONFIG.tankSize*0.5, -CONFIG.tankSize*0.35, CONFIG.tankSize*0.8, CONFIG.tankSize*0.15);
        ctx.fillRect(-CONFIG.tankSize*0.5, CONFIG.tankSize*0.2, CONFIG.tankSize*0.8, CONFIG.tankSize*0.15);
        ctx.beginPath();
        ctx.moveTo(-CONFIG.tankSize*0.4, 0);
        ctx.lineTo(CONFIG.tankSize*0.6, 0);
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 1;
        ctx.stroke();
    } else {
        ctx.fillRect(-CONFIG.tankSize*0.55, -CONFIG.tankSize*0.75, CONFIG.tankSize*1.6, CONFIG.tankSize*1.5);
        ctx.strokeStyle = tank.accent;
        ctx.lineWidth = 2;
        ctx.shadowBlur = 0;
        ctx.strokeRect(-CONFIG.tankSize*0.55, -CONFIG.tankSize*0.75, CONFIG.tankSize*1.6, CONFIG.tankSize*1.5);
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(-CONFIG.tankSize*0.2, -CONFIG.tankSize*0.5, CONFIG.tankSize*0.9, CONFIG.tankSize*0.35);
        ctx.fillRect(-CONFIG.tankSize*0.2, CONFIG.tankSize*0.15, CONFIG.tankSize*0.9, CONFIG.tankSize*0.35);
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        for(let rx = -CONFIG.tankSize*0.4; rx < CONFIG.tankSize*0.8; rx += CONFIG.tankSize*0.3) {
            ctx.beginPath();
            ctx.arc(rx, -CONFIG.tankSize*0.6, 2, 0, Math.PI*2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(rx, CONFIG.tankSize*0.6, 2, 0, Math.PI*2);
            ctx.fill();
        }
    }
    ctx.restore();
    ctx.save();
    ctx.translate(tank.x, tank.y);
    ctx.rotate(tank.turretAngle);
    const barrelLen = tank.turretSize + 20;
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(0, -6, barrelLen, 12);
    ctx.fillStyle = '#444';
    ctx.fillRect(0, -4, barrelLen - 5, 3);
    ctx.fillStyle = '#1a1a1a';
    for(let i = 8; i < barrelLen - 10; i += 10) ctx.fillRect(i, -7, 3, 14);
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(barrelLen - 5, -8, 12, 16);
    ctx.fillStyle = '#333';
    ctx.fillRect(barrelLen - 3, -6, 8, 12);
    ctx.fillStyle = '#0a0a0a';
    ctx.beginPath();
    ctx.arc(barrelLen + 8, 0, 5, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = tank.accent;
    ctx.shadowColor = tank.accent;
    /*shadow*/ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(0, 0, CONFIG.tankSize*0.5, 0, Math.PI*2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = tank.color;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.arc(0, 0, CONFIG.tankSize*0.3, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = 'rgba(100,200,255,0.3)';
    ctx.beginPath();
    ctx.arc(CONFIG.tankSize*0.15, -CONFIG.tankSize*0.15, 4, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
    
    if (tank.autoAimActive && tank.autoAimTarget && !tank.autoAimTarget.dead) {
        drawAutoAimIndicator(tank);
    }

    if(tank.ultimateActive || tank.ghostActive || tank.fortressActive || tank.stormActive || tank.nailLocking) {
        drawUltimateEffect(tank);
    }
    
    const hpRatio = Math.max(0, tank.hp / tank.maxHp);
    const barW = 55, barH = 7, barY = tank.y - CONFIG.tankSize - 15;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.beginPath();
    ctx.roundRect(tank.x - barW/2 - 2, barY - 2, barW + 4, barH + 4, 4);
    ctx.fill();
    const hpColor = hpRatio > 0.6 ? '#00ff88' : hpRatio > 0.3 ? '#ffaa00' : '#ff4444';
    ctx.fillStyle = hpColor;
    ctx.shadowColor = hpColor;
    /*shadow*/ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.roundRect(tank.x - barW/2, barY, barW * hpRatio, barH, 3);
    ctx.fill();
    ctx.shadowBlur = 0;
    
    if(tank.isPlayer) {
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.shadowColor = '#00ff88';
        /*shadow*/ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(tank.x, tank.y, CONFIG.tankSize + 10, 0, Math.PI*2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#00ff88';
        ctx.beginPath();
        ctx.moveTo(tank.x, tank.y - CONFIG.tankSize - 18);
        ctx.lineTo(tank.x - 6, tank.y - CONFIG.tankSize - 26);
        ctx.lineTo(tank.x + 6, tank.y - CONFIG.tankSize - 26);
        ctx.closePath();
        ctx.fill();
    }
    
    ctx.fillStyle = tank.team === 'blue' ? '#4488ff' : '#ff4444';
    ctx.shadowColor = ctx.fillStyle;
    /*shadow*/ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(tank.x, tank.y - CONFIG.tankSize - 22, 4, 0, Math.PI*2);
    ctx.fill();
    ctx.shadowBlur = 0;
}

function drawUltimateEffect(tank) {
    ctx.save();
    if(tank.tankType === 'zuoyan29' && tank.ultimateActive) {
        ctx.strokeStyle = '#00d4ff';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.5 + Math.sin(Date.now() * 0.01) * 0.2;
        ctx.beginPath();
        ctx.arc(tank.x, tank.y, CONFIG.tankSize + 15, 0, Math.PI*2);
        ctx.stroke();
    } else if(tank.tankType === 'xingchen27a' && tank.shieldActive) {
        ctx.strokeStyle = '#44aa44';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(tank.x, tank.y, tank.ultimateData.shieldRadius, 0, Math.PI*2);
        ctx.stroke();
        ctx.fillStyle = 'rgba(68,170,68,0.08)';
        ctx.fill();
    } else if(tank.tankType === 'duoduo' && tank.ultimateCharging) {
        const chargeProgress = 1 - (tank.ultimateChargeTimer / tank.ultimateData.chargeTime);
        ctx.fillStyle = `rgba(255, ${100 + chargeProgress * 100}, 0, ${chargeProgress * 0.5})`;
        ctx.beginPath();
        ctx.arc(tank.x, tank.y, CONFIG.tankSize + chargeProgress * 20, 0, Math.PI*2);
        ctx.fill();
    } else if(tank.tankType === 'zuoyan30' && tank.ghostActive) {
        ctx.globalAlpha = 0.4 + Math.sin(Date.now() * 0.008) * 0.1;
        ctx.strokeStyle = '#00aaff';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(tank.x, tank.y, CONFIG.tankSize + 10, 0, Math.PI*2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(0,170,255,0.15)';
        ctx.beginPath();
        ctx.arc(tank.x, tank.y, CONFIG.tankSize + 5, 0, Math.PI*2);
        ctx.fill();
    } else if(tank.tankType === 'zuoyan1' && (tank.ultimateActive || tank.overheatActive)) {
        if(tank.ultimateActive) {
            ctx.strokeStyle = '#ff6600';
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            ctx.arc(tank.x, tank.y, CONFIG.tankSize + 12, 0, Math.PI*2);
            ctx.stroke();
            ctx.fillStyle = 'rgba(255,100,0,0.2)';
            ctx.beginPath();
            ctx.arc(tank.x, tank.y, CONFIG.tankSize + 8, 0, Math.PI*2);
            ctx.fill();
        }
        if(tank.overheatActive) {
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 2;
            ctx.setLineDash([3, 3]);
            ctx.globalAlpha = 0.4;
            ctx.beginPath();
            ctx.arc(tank.x, tank.y, CONFIG.tankSize + 8, 0, Math.PI*2);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = '#ff0000';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('瘫痪', tank.x, tank.y - CONFIG.tankSize - 30);
        }
    } else if(tank.tankType === 'xingchen27b' && tank.fortressActive) {
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.4 + Math.sin(Date.now() * 0.005) * 0.2;
        ctx.beginPath();
        ctx.arc(tank.x, tank.y, CONFIG.tankSize + 20, 0, Math.PI*2);
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,215,0,0.1)';
        ctx.beginPath();
        ctx.arc(tank.x, tank.y, CONFIG.tankSize + 15, 0, Math.PI*2);
        ctx.fill();
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 11px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('反弹', tank.x, tank.y - CONFIG.tankSize - 32);
    } else if(tank.tankType === 'xingchen27s' && tank.shieldActive) {
        ctx.strokeStyle = '#66cc66';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(tank.x, tank.y, tank.ultimateData.shieldRadius || 80, 0, Math.PI*2);
        ctx.stroke();
        ctx.fillStyle = 'rgba(102,204,102,0.08)';
        ctx.fill();
    } else if(tank.tankType === 'duoduo_ifv' && tank.stormActive) {
        ctx.strokeStyle = '#ff4444';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.4 + Math.sin(Date.now() * 0.02) * 0.2;
        ctx.beginPath();
        ctx.arc(tank.x, tank.y, CONFIG.tankSize + 18, 0, Math.PI*2);
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,68,68,0.1)';
        ctx.beginPath();
        ctx.arc(tank.x, tank.y, CONFIG.tankSize + 12, 0, Math.PI*2);
        ctx.fill();
        ctx.fillStyle = '#ff4444';
        ctx.font = 'bold 11px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('弹幕', tank.x, tank.y - CONFIG.tankSize - 32);
    } else if(tank.tankType === 'duoduo_spat' && tank.nailLocking) {
        const lockProgress = 1 - (tank.nailLockTimer / tank.ultimateData.lockTime);
        ctx.strokeStyle = `rgba(255, 0, 0, ${0.3 + lockProgress * 0.7})`;
        ctx.lineWidth = 2 + lockProgress * 2;
        ctx.setLineDash([5, 5]);
        const startX = tank.x + Math.cos(tank.nailLaserAngle) * (tank.turretSize + 20);
        const startY = tank.y + Math.sin(tank.nailLaserAngle) * (tank.turretSize + 20);
        const endX = tank.x + Math.cos(tank.nailLaserAngle) * 2000;
        const endY = tank.y + Math.sin(tank.nailLaserAngle) * 2000;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(tank.x, tank.y, CONFIG.tankSize + 15, -Math.PI/2, -Math.PI/2 + lockProgress * Math.PI * 2);
        ctx.stroke();
    } else if(tank.tankType === 'duoduo_emp' && tank.ultimateActive) {
        ctx.strokeStyle = '#ff4400';
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.4 + Math.sin(Date.now() * 0.01) * 0.2;
        ctx.beginPath();
        ctx.arc(tank.x, tank.y, tank.ultimateData.radius, 0, Math.PI*2);
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,68,0,0.1)';
        ctx.beginPath();
        ctx.arc(tank.x, tank.y, tank.ultimateData.radius * 0.8, 0, Math.PI*2);
        ctx.fill();
        ctx.fillStyle = '#ff8800';
        ctx.font = 'bold 11px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('EMP', tank.x, tank.y - CONFIG.tankSize - 32);
    } else if(tank.tankType === 'zuoyan31' && tank.ultimateActive) {
        ctx.strokeStyle = '#5599ff';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(tank.x, tank.y, CONFIG.tankSize + 15, 0, Math.PI*2);
        ctx.stroke();
        ctx.fillStyle = 'rgba(85,153,255,0.2)';
        ctx.beginPath();
        ctx.arc(tank.x, tank.y, CONFIG.tankSize + 10, 0, Math.PI*2);
        ctx.fill();
    } else if(tank.tankType === 'zuoyan32' && tank.ultimateActive) {
        ctx.strokeStyle = '#77bbff';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.globalAlpha = 0.4 + Math.sin(Date.now() * 0.008) * 0.2;
        ctx.beginPath();
        ctx.arc(tank.x, tank.y, CONFIG.tankSize + 12, 0, Math.PI*2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#77bbff';
        ctx.font = 'bold 11px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('幻象', tank.x, tank.y - CONFIG.tankSize - 32);
    } else if(tank.tankType === 'zuoyan33' && tank.toxinActive) {
        ctx.strokeStyle = '#44dd88';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        ctx.arc(tank.x, tank.y, CONFIG.tankSize + 10, 0, Math.PI*2);
        ctx.stroke();
        ctx.fillStyle = 'rgba(68,221,136,0.15)';
        ctx.beginPath();
        ctx.arc(tank.x, tank.y, CONFIG.tankSize + 8, 0, Math.PI*2);
        ctx.fill();
    } else if(tank.tankType === 'xingchen27c' && tank.revealActive) {
        ctx.strokeStyle = '#33aa33';
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.3 + Math.sin(Date.now() * 0.005) * 0.1;
        ctx.beginPath();
        ctx.arc(tank.x, tank.y, tank.ultimateData.revealRadius, 0, Math.PI*2);
        ctx.stroke();
        ctx.fillStyle = 'rgba(51,170,51,0.05)';
        ctx.beginPath();
        ctx.arc(tank.x, tank.y, tank.ultimateData.revealRadius, 0, Math.PI*2);
        ctx.fill();
        ctx.fillStyle = '#33aa33';
        ctx.font = 'bold 11px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('反隐', tank.x, tank.y - CONFIG.tankSize - 32);
    } else if(tank.tankType === 'xingchen27d' && tank.linkActive) {
        if(tank.linkedAlly && !tank.linkedAlly.dead) {
            ctx.strokeStyle = '#55bb55';
            ctx.lineWidth = 3;
            ctx.globalAlpha = 0.5 + Math.sin(Date.now() * 0.01) * 0.2;
            ctx.setLineDash([8, 4]);
            ctx.beginPath();
            ctx.moveTo(tank.x, tank.y);
            ctx.lineTo(tank.linkedAlly.x, tank.linkedAlly.y);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = '#55bb55';
            ctx.font = 'bold 11px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('链接', tank.x, tank.y - CONFIG.tankSize - 32);
        }
    } else if(tank.tankType === 'xingchen27e' && tank.judgeActive) {
        if(tank.judgeTarget && !tank.judgeTarget.dead) {
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.6 + Math.sin(Date.now() * 0.015) * 0.2;
            ctx.beginPath();
            ctx.moveTo(tank.x, tank.y);
            ctx.lineTo(tank.judgeTarget.x, tank.judgeTarget.y);
            ctx.stroke();
            ctx.fillStyle = '#ff0000';
            ctx.beginPath();
            ctx.arc(tank.judgeTarget.x, tank.judgeTarget.y, CONFIG.tankSize + 5, 0, Math.PI*2);
            ctx.stroke();
            ctx.fillStyle = '#ff0000';
            ctx.font = 'bold 11px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('审判', tank.x, tank.y - CONFIG.tankSize - 32);
        }
    } else if(tank.tankType === 'duoduo_eng' && tank.ultimateActive) {
        ctx.strokeStyle = '#dd8833';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        ctx.arc(tank.x, tank.y, CONFIG.tankSize + 15, 0, Math.PI*2);
        ctx.stroke();
        ctx.fillStyle = 'rgba(221,136,51,0.15)';
        ctx.beginPath();
        ctx.arc(tank.x, tank.y, CONFIG.tankSize + 10, 0, Math.PI*2);
        ctx.fill();
    } else if(tank.tankType === 'duoduo_rocket' && tank.ultimateActive) {
        ctx.strokeStyle = '#cc5522';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.5 + Math.sin(Date.now() * 0.02) * 0.2;
        ctx.beginPath();
        ctx.arc(tank.x, tank.y, CONFIG.tankSize + 18, 0, Math.PI*2);
        ctx.stroke();
        ctx.fillStyle = 'rgba(204,85,34,0.2)';
        ctx.beginPath();
        ctx.arc(tank.x, tank.y, CONFIG.tankSize + 12, 0, Math.PI*2);
        ctx.fill();
        ctx.fillStyle = '#cc5522';
        ctx.font = 'bold 11px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('弹幕', tank.x, tank.y - CONFIG.tankSize - 32);
    }
    ctx.restore();
}

function drawAutoAimIndicator(tank) {
    if (!tank.autoAimTarget || tank.autoAimTarget.dead) return;
    const target = tank.autoAimTarget;
    const dist = Math.hypot(target.x - tank.x, target.y - tank.y);
    ctx.save();
    const startX = tank.x + Math.cos(tank.turretAngle) * (tank.turretSize + 20);
    const startY = tank.y + Math.sin(tank.turretAngle) * (tank.turretSize + 20);
    const lineColor = tank.autoAimLockOn ? '#00ff88' : '#ffcc00';
    const lineAlpha = tank.autoAimLockOn ? 0.8 : 0.5;
    ctx.strokeStyle = lineColor;
    ctx.globalAlpha = lineAlpha;
    ctx.lineWidth = tank.autoAimLockOn ? 2 : 1.5;
    ctx.setLineDash(tank.autoAimLockOn ? [] : [8, 4]);
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(target.x, target.y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.6 + Math.sin(Date.now() * 0.008) * 0.2;
    const boxSize = CONFIG.tankSize + 10;
    ctx.strokeRect(target.x - boxSize, target.y - boxSize, boxSize * 2, boxSize * 2);
    const cornerSize = 8;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(target.x - boxSize, target.y - boxSize + cornerSize);
    ctx.lineTo(target.x - boxSize, target.y - boxSize);
    ctx.lineTo(target.x - boxSize + cornerSize, target.y - boxSize);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(target.x + boxSize - cornerSize, target.y - boxSize);
    ctx.lineTo(target.x + boxSize, target.y - boxSize);
    ctx.lineTo(target.x + boxSize, target.y - boxSize + cornerSize);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(target.x - boxSize, target.y + boxSize - cornerSize);
    ctx.lineTo(target.x - boxSize, target.y + boxSize);
    ctx.lineTo(target.x - boxSize + cornerSize, target.y + boxSize);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(target.x + boxSize - cornerSize, target.y + boxSize);
    ctx.lineTo(target.x + boxSize, target.y + boxSize);
    ctx.lineTo(target.x + boxSize, target.y + boxSize - cornerSize);
    ctx.stroke();
    if (tank.isPlayer) {
        ctx.fillStyle = lineColor;
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.globalAlpha = 0.8;
        ctx.fillText(Math.floor(dist) + 'm', target.x, target.y - boxSize - 8);
        if (tank.autoAimLockOn) {
            ctx.fillStyle = '#00ff88';
            ctx.fillText('● 锁定', target.x, target.y + boxSize + 18);
        } else {
            ctx.fillStyle = '#ffcc00';
            ctx.fillText('○ 瞄准中', target.x, target.y + boxSize + 18);
        }
    }
    ctx.restore();
}

function drawTankShape(pctx, tank, x, y, angle, scale) {
    pctx.save();
    pctx.scale(scale, scale);
    pctx.rotate(angle);
    pctx.fillStyle = tank.color;
    if(tank.shape === 'light') {
        pctx.beginPath();
        pctx.moveTo(12, 0);
        pctx.lineTo(-5, -8);
        pctx.lineTo(-8, -3);
        pctx.lineTo(-10, 0);
        pctx.lineTo(-8, 3);
        pctx.lineTo(-5, 8);
        pctx.closePath();
        pctx.fill();
    } else if(tank.shape === 'medium') {
        pctx.beginPath();
        pctx.ellipse(0, 0, 12, 8, 0, 0, Math.PI*2);
        pctx.fill();
    } else {
        pctx.fillRect(-10, -10, 22, 20);
    }
    pctx.fillStyle = tank.accent;
    pctx.beginPath();
    pctx.arc(0, 0, 7, 0, Math.PI*2);
    pctx.fill();
    pctx.fillStyle = '#444';
    pctx.fillRect(0, -2, 18, 4);
    pctx.restore();
}

function drawBase(base) {
    ctx.save();
    const glowColor = base.team === 'blue' ? 'rgba(0,100,255,0.2)' : 'rgba(255,50,50,0.2)';
    ctx.fillStyle = glowColor;
    ctx.beginPath();
    ctx.arc(base.x + base.w/2, base.y + base.h/2, base.w * 1.2, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = base.team === 'blue' ? '#0033aa' : '#990000';
    ctx.fillRect(base.x, base.y, base.w, base.h);
    ctx.strokeStyle = base.team === 'blue' ? '#4488ff' : '#ff4444';
    ctx.lineWidth = 4;
    ctx.strokeRect(base.x, base.y, base.w, base.h);
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(base.x + 10, base.y + 10, base.w - 20, base.h - 20);
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for(let i = base.x + 15; i < base.x + base.w - 15; i += 15) {
        ctx.beginPath();
        ctx.moveTo(i, base.y + 10);
        ctx.lineTo(i, base.y + base.h - 10);
        ctx.stroke();
    }
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(base.team === 'blue' ? '蓝' : '红', base.x + base.w/2, base.y + base.h/2);
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.roundRect(base.x, base.y - 22, base.w, 12, 6);
    ctx.fill();
    const hpRatio = Math.max(0, base.hp / base.maxHp);
    const hpColor2 = hpRatio > 0.5 ? '#00ff88' : hpRatio > 0.25 ? '#ffaa00' : '#ff4444';
    ctx.fillStyle = hpColor2;
    ctx.beginPath();
    ctx.roundRect(base.x + 2, base.y - 20, (base.w - 4) * hpRatio, 8, 4);
    ctx.fill();
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(base.x, base.y - 22, base.w, 12, 6);
    ctx.stroke();
    ctx.fillStyle = '#444';
    ctx.beginPath();
    ctx.arc(base.x + base.w/2, base.y + base.h/2, 15, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = '#666';
    ctx.beginPath();
    ctx.arc(base.x + base.w/2, base.y + base.h/2, 8, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
}

function drawMapElements() {
    const viewLeft = camera.x - 100, viewRight = camera.x + canvas.width / (camera.zoom || 1) + 100;
    const viewTop = camera.y - 100, viewBottom = camera.y + canvas.height / (camera.zoom || 1) + 100;

    mapElements.forEach(el => {
        // 安全处理：如果元素没有radius属性，跳过或使用默认值
        const radius = el.radius || 50;
        if(el.x + radius < viewLeft || el.x - radius > viewRight ||
           el.y + radius < viewTop || el.y - radius > viewBottom) return;

        if(el.type === 'mine') {
            if(el.armed) {
                const blinkAlpha = el.blinkTimer > 1 ? 0.6 : 0.2;
                ctx.save();
                ctx.globalAlpha = blinkAlpha;
                ctx.fillStyle = '#ff0000';
                ctx.beginPath();
                ctx.arc(el.x, el.y, radius, 0, Math.PI*2);
                ctx.fill();
                ctx.strokeStyle = '#ff4444';
                ctx.lineWidth = 2;
                ctx.setLineDash([4, 4]);
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.fillStyle = '#ffcc00';
                ctx.font = 'bold 16px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('!', el.x, el.y);
                ctx.restore();
            } else {
                ctx.save();
                ctx.globalAlpha = 0.2;
                ctx.fillStyle = '#444';
                ctx.beginPath();
                ctx.arc(el.x, el.y, radius * 0.6, 0, Math.PI*2);
                ctx.fill();
                ctx.restore();
            }
        } else if(el.type === 'boost') {
            ctx.save();
            ctx.translate(el.x, el.y);
            ctx.rotate(el.angle || 0);
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = el.color || '#00aaff';
            ctx.shadowColor = el.color || '#00aaff';
            /*shadow*/ctx.shadowBlur = 0;
            ctx.fillRect(-el.width/2, -el.height/2, el.width, el.height);
            ctx.fillStyle = '#fff';
            ctx.globalAlpha = 0.8;
            ctx.beginPath();
            ctx.moveTo(el.width/2 - 10, 0);
            ctx.lineTo(el.width/2 - 20, -8);
            ctx.lineTo(el.width/2 - 20, 8);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        } else if(el.type === 'bush') {
            ctx.save();
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = el.color || '#2d5a1e';
            ctx.beginPath();
            ctx.arc(el.x, el.y, radius, 0, Math.PI*2);
            ctx.fill();
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = '#3a7a2a';
            for(let i=0; i<5; i++) {
                const a = (i / 5) * Math.PI * 2;
                ctx.beginPath();
                ctx.arc(el.x + Math.cos(a) * radius * 0.4, 
                       el.y + Math.sin(a) * radius * 0.4, 
                       radius * 0.3, 0, Math.PI*2);
                ctx.fill();
            }
            ctx.restore();
        } else if(el.type === 'turret') {
            // 绘制自动炮塔
            ctx.save();
            ctx.translate(el.x, el.y);
            ctx.rotate(el.angle || 0);
            ctx.fillStyle = '#444';
            ctx.fillRect(-15, -15, 30, 30);
            ctx.fillStyle = '#888';
            ctx.fillRect(-5, -25, 10, 20);
            ctx.fillStyle = '#ff6633';
            ctx.beginPath();
            ctx.arc(0, 0, 8, 0, Math.PI*2);
            ctx.fill();
            ctx.restore();
            // 炮塔血量条
            const hpRatio = Math.max(0, el.hp / el.maxHp);
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(el.x - 20, el.y - 30, 40, 4);
            ctx.fillStyle = hpRatio > 0.5 ? '#00ff88' : '#ff4444';
            ctx.fillRect(el.x - 20, el.y - 30, 40 * hpRatio, 4);
        }
    });
}

function drawOutpost(op) {
    ctx.save();
    const outerGlow = ctx.createRadialGradient(op.x, op.y, op.radius * 0.5, op.x, op.y, op.radius * 1.3);
    if(op.owner === 'blue') { outerGlow.addColorStop(0, 'rgba(0,80,255,0.1)'); outerGlow.addColorStop(1, 'rgba(0,80,255,0)'); }
    else if(op.owner === 'red') { outerGlow.addColorStop(0, 'rgba(255,40,40,0.1)'); outerGlow.addColorStop(1, 'rgba(255,40,40,0)'); }
    else { outerGlow.addColorStop(0, 'rgba(100,100,100,0.05)'); outerGlow.addColorStop(1, 'rgba(100,100,100,0)'); }
    ctx.fillStyle = outerGlow;
    ctx.beginPath();
    ctx.arc(op.x, op.y, op.radius * 1.3, 0, Math.PI*2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(op.x, op.y, op.radius, 0, Math.PI*2);
    if(op.owner === 'blue') ctx.fillStyle = 'rgba(0,80,255,0.12)';
    else if(op.owner === 'red') ctx.fillStyle = 'rgba(255,40,40,0.12)';
    else ctx.fillStyle = 'rgba(100,100,100,0.08)';
    ctx.fill();
    ctx.setLineDash([8, 6]);
    ctx.strokeStyle = op.owner === 'blue' ? '#4488ff' : op.owner === 'red' ? '#ff4444' : '#666';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(op.x, op.y, op.radius * 0.7, 0, Math.PI*2);
    ctx.strokeStyle = op.owner === 'blue' ? 'rgba(68,136,255,0.5)' : op.owner === 'red' ? 'rgba(255,68,68,0.5)' : 'rgba(100,100,100,0.3)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    if(op.captureProgress > 0 && op.captureProgress < CONFIG.outpostCaptureTime) {
        ctx.beginPath();
        ctx.arc(op.x, op.y, op.radius - 10, -Math.PI/2, -Math.PI/2 + (op.captureProgress/CONFIG.outpostCaptureTime)*Math.PI*2);
        ctx.strokeStyle = op.capturingTeam === 'blue' ? '#4488ff' : '#ff4444';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.stroke();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        const pct = Math.floor((op.captureProgress / CONFIG.outpostCaptureTime) * 100);
        ctx.fillText(`${pct}%`, op.x, op.y - 50);
    }
    ctx.fillStyle = op.owner === 'blue' ? 'rgba(0,60,200,0.3)' : op.owner === 'red' ? 'rgba(200,30,30,0.3)' : 'rgba(60,60,60,0.3)';
    ctx.beginPath();
    ctx.arc(op.x, op.y, 30, 0, Math.PI*2);
    ctx.fill();
    ctx.strokeStyle = op.owner === 'blue' ? 'rgba(68,136,255,0.6)' : op.owner === 'red' ? 'rgba(255,68,68,0.6)' : 'rgba(100,100,100,0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 22px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    /*shadow*/ctx.shadowBlur = 0;
    ctx.fillText(op.name, op.x, op.y);
    ctx.shadowBlur = 0;
    if(op.owner) {
        ctx.fillStyle = op.owner === 'blue' ? '#4488ff' : '#ff4444';
        ctx.shadowColor = ctx.fillStyle;
        /*shadow*/ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(op.x, op.y + 38, 6, 0, Math.PI*2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }
    ctx.restore();
}

function drawBullet(b) {
    ctx.save();
    if(b.type === 'aa') {
        const altitude = b.altitude || 0;
        ctx.fillStyle = `rgba(0,0,0,${Math.max(0.08, 0.28 - altitude / 500)})`;
        ctx.beginPath(); ctx.ellipse(b.x + 8, b.y + 10, 7, 3, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(255,120,255,0.42)';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x - b.vx * 1.3, b.y - altitude - b.vy * 1.3); ctx.stroke();
        ctx.shadowColor = '#ff44ff';
        ctx.shadowBlur = 8;
        ctx.fillStyle = '#ffbbff';
        ctx.beginPath(); ctx.arc(b.x, b.y - altitude, 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,68,255,0.18)';
        ctx.beginPath(); ctx.arc(b.x, b.y - altitude, 12, 0, Math.PI * 2); ctx.fill();
    } else if(b.type === 'shell') {
        ctx.shadowColor = '#ff8800';
        /*shadow*/ctx.shadowBlur = 0;
        ctx.fillStyle = '#ff8800';
        ctx.beginPath();
        ctx.arc(b.x, b.y, 7, 0, Math.PI*2);
        ctx.fill();
        /*shadow*/ctx.shadowBlur = 0;
        ctx.fillStyle = '#ff4400';
        ctx.beginPath();
        ctx.arc(b.x, b.y, 4, 0, Math.PI*2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255,150,0,0.2)';
        ctx.beginPath();
        ctx.arc(b.x, b.y, 15, 0, Math.PI*2);
        ctx.fill();
    } else {
        ctx.shadowColor = '#ffff44';
        /*shadow*/ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffff44';
        ctx.beginPath();
        ctx.arc(b.x, b.y, 3, 0, Math.PI*2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }
    ctx.restore();
}

function drawMinimap() {
    // 检查小地图是否被干扰
    if(player && player.minimapJammed) {
        minimapCtx.fillStyle = 'rgba(5,5,10,0.95)';
        minimapCtx.fillRect(0, 0, 200, 140);
        minimapCtx.fillStyle = '#ff4400';
        minimapCtx.font = 'bold 16px Arial';
        minimapCtx.textAlign = 'center';
        minimapCtx.textBaseline = 'middle';
        minimapCtx.fillText('⚠ 小地图干扰中', 100, 70);
        minimapCtx.fillStyle = '#ff8800';
        minimapCtx.font = '12px Arial';
        minimapCtx.fillText('电磁脉冲影响', 100, 90);
        return;
    }

    const mw = minimapCanvas.width, mh = minimapCanvas.height;
    const scaleX = mw / CONFIG.mapWidth, scaleY = mh / CONFIG.mapHeight;
    const template = MAP_TEMPLATES[currentMap] || MAP_TEMPLATES.classic;
    minimapCtx.fillStyle = template.groundColor || 'rgba(5,5,10,0.9)';
    minimapCtx.fillRect(0, 0, mw, mh);
    minimapCtx.strokeStyle = '#444';
    minimapCtx.lineWidth = 1;
    minimapCtx.strokeRect(0, 0, mw, mh);
    minimapCtx.fillStyle = '#126b91';
    terrainZones.filter(z => z.type === 'water').forEach(z => minimapCtx.fillRect(z.x * scaleX, z.y * scaleY, z.w * scaleX, z.h * scaleY));
    minimapCtx.fillStyle = '#6f9b55';
    terrainZones.filter(z => z.type === 'land').forEach(z => {
        minimapCtx.beginPath();
        minimapCtx.ellipse(z.x * scaleX, z.y * scaleY, z.rx * scaleX, z.ry * scaleY, 0, 0, Math.PI * 2);
        minimapCtx.fill();
    });
    minimapCtx.fillStyle = '#9b6a37';
    terrainZones.filter(z => z.type === 'bridge').forEach(z => {
        minimapCtx.save();
        minimapCtx.translate(z.x * scaleX, z.y * scaleY);
        minimapCtx.rotate(z.angle || 0);
        minimapCtx.fillRect(-z.w * scaleX / 2, -Math.max(2, z.h * scaleY) / 2, z.w * scaleX, Math.max(2, z.h * scaleY));
        minimapCtx.restore();
    });
    minimapCtx.fillStyle = '#333';
    obstacles.forEach(obs => {
        minimapCtx.fillRect(obs.x * scaleX, obs.y * scaleY, Math.max(1, obs.w * scaleX), Math.max(1, obs.h * scaleY));
    });
    minimapCtx.fillStyle = '#0044aa';
    minimapCtx.fillRect(bases.blue.x * scaleX, bases.blue.y * scaleY, bases.blue.w * scaleX, bases.blue.h * scaleY);
    minimapCtx.fillStyle = '#aa0000';
    minimapCtx.fillRect(bases.red.x * scaleX, bases.red.y * scaleY, bases.red.w * scaleX, bases.red.h * scaleY);
    outposts.forEach(op => {
        minimapCtx.beginPath();
        minimapCtx.arc(op.x * scaleX, op.y * scaleY, 5, 0, Math.PI*2);
        if(op.owner === 'blue') minimapCtx.fillStyle = '#4488ff';
        else if(op.owner === 'red') minimapCtx.fillStyle = '#ff4444';
        else minimapCtx.fillStyle = '#666';
        minimapCtx.fill();
        minimapCtx.fillStyle = '#fff';
        minimapCtx.font = 'bold 9px Arial';
        minimapCtx.textAlign = 'center';
        minimapCtx.fillText(op.name, op.x * scaleX, op.y * scaleY - 8);
    });
    const drawDot = (t, color, size) => {
        if(t.dead) return;
        minimapCtx.fillStyle = color;
        minimapCtx.beginPath();
        minimapCtx.arc(t.x * scaleX, t.y * scaleY, size, 0, Math.PI*2);
        minimapCtx.fill();
    };
    drawDot(player, '#00ffff', 5);
    allies.forEach(t => drawDot(t, '#4488ff', 3));
    enemies.forEach(t => drawDot(t, '#ff4444', 3));
    minimapCtx.fillStyle = '#ff8800';
    bullets.forEach(b => { if(b.type === 'shell') minimapCtx.fillRect(b.x * scaleX - 1, b.y * scaleY - 1, 2, 2); });
    minimapCtx.strokeStyle = 'rgba(255,255,255,0.6)';
    minimapCtx.lineWidth = 1.5;
    minimapCtx.strokeRect(camera.x * scaleX, camera.y * scaleY, canvas.width / (camera.zoom || 1) * scaleX, canvas.height / (camera.zoom || 1) * scaleY);
}


// ==================== HUD更新 ====================
function updateHUD() {
    if(!player) return;
    document.getElementById('playerHp').style.width = (Math.max(0, player.hp) / player.maxHp * 100) + '%';
    const apsDisplay = document.getElementById('apsDisplay');
    if(apsDisplay) apsDisplay.textContent = player.apsCooldown > 0
        ? `${player.apsCharges} (冷却 ${Math.ceil(player.apsCooldown)}s)`
        : player.apsCharges;
    const environmentInfo = document.getElementById('environmentInfo');
    if(environmentInfo) {
        environmentInfo.style.display = 'block';
        if(currentMap === 'classic' && player.isFlying) {
            environmentInfo.style.color = '#ff9b9b';
            environmentInfo.textContent = '📡 经典战场防空雷达：高射炮伤害 +35%';
        } else if(currentMap === 'desert') {
            environmentInfo.style.color = environmentState.sandstormActive ? '#ffb45c' : '#ffe0a3';
            environmentInfo.textContent = environmentState.sandstormActive
                ? `🌪 沙尘暴 ${Math.ceil(environmentState.sandstormTimer)}s：视野降低，飞行不稳`
                : '☀ 开阔沙漠：大视野';
        } else if(currentMap === 'city') {
            environmentInfo.style.color = player.isFlying ? '#ffce83' : '#d6d9dc';
            environmentInfo.textContent = player.isFlying
                ? '🏙 楼群乱流：直升机速度 -22%'
                : '🏙 城市巷战：利用街口与建筑掩护';
        } else if(currentMap === 'snow') {
            const freezePct = Math.round((player.freezeLevel || 0) * 100);
            environmentInfo.style.color = freezePct > 30 ? '#7fdcff' : '#d8f5ff';
            environmentInfo.textContent = player.isFlying
                ? '🧊 旋翼结冰：速度 -30%，持续受损'
                : freezePct > 0
                ? `❄ 引擎冻结 ${freezePct}%：移动中逐渐恢复`
                : '❄ 雪地：久停 5 秒开始冻结';
        } else if(currentMap === 'island') {
            const inWater = isTankInWater(player);
            environmentInfo.style.color = inWater ? '#55ccff' : '#bdeaff';
            environmentInfo.textContent = player.tankType === 'duoduo_ifv'
                ? (inWater ? '🌊 涉水中：速度 30%' : '🌊 步战车可直接涉水')
                : (player.isFlying ? '🌬 海风乱流：直升机速度 -20%，高射炮伤害 +20%' : (inWater ? '💧 车体进水：持续掉血' : '🌉 可冒险涉水，桥梁更安全'));
        } else environmentInfo.style.display = 'none';
    }

    const autoAimEl = document.getElementById('autoAimStatus');
    if (autoAimEl) {
        if (player.autoAimActive && player.autoAimTarget && !player.autoAimTarget.dead) {
            autoAimEl.style.display = 'block';
            if (player.autoAimLockOn) {
                autoAimEl.textContent = '🎯 自动瞄准 - 已锁定';
                autoAimEl.style.color = '#00ff88';
            } else {
                autoAimEl.textContent = '🎯 自动瞄准 - 追踪中';
                autoAimEl.style.color = '#ffcc00';
            }
        } else {
            autoAimEl.style.display = 'none';
        }
    }
    if(player.stormActive && player.tankType === 'duoduo_ifv') {
        document.getElementById('shells').textContent = '∞';
        document.getElementById('mg').textContent = '∞';
        document.getElementById('aa').textContent = player.aa || 0;
    } else {
        document.getElementById('shells').textContent = player.shells;
        document.getElementById('mg').textContent = player.mg;
        document.getElementById('aa').textContent = player.aa || 0;
    }
    const blueCount = outposts.filter(o => o.owner === 'blue').length;
    const redCount = outposts.filter(o => o.owner === 'red').length;
    document.getElementById('blueOutposts').textContent = blueCount;
    document.getElementById('redOutposts').textContent = redCount;
    // 计算重量
    const shellWeight = 0.02, mgWeight = 0.0001, aaWeight = 0.005;
    const baseWeight = (player.weight || 1.0);
    const ammoWeight = ((player.shells || 0) * shellWeight + (player.mg || 0) * mgWeight + (player.aa || 0) * aaWeight) * 0.01;
    const totalWeight = baseWeight + ammoWeight;
    if(!isNaN(totalWeight)) {
        document.getElementById('weightDisplay').textContent = totalWeight.toFixed(1) + 't';
    } else {
        document.getElementById('weightDisplay').textContent = '0.0t';
    }

    const actualSpeed = getActualSpeed(player);
    const baseSpeed = player.speed;
    const penaltyEl = document.getElementById('speedPenalty');
    if(actualSpeed < baseSpeed * 0.85 && gameMode !== 'defense') {
        penaltyEl.style.display = 'block';
        const pct = Math.round((1 - actualSpeed / baseSpeed) * 100);
        if(currentMap === 'island' && isTankInWater(player)) penaltyEl.textContent = `🌊 水中阻力，速度降低 ${pct}%`;
        else if(currentMap === 'snow' && (player.freezeLevel || 0) > 0.05) penaltyEl.textContent = `❄ 引擎冻结，速度降低 ${pct}%`;
        else if(currentMap === 'desert' && player.isFlying && environmentState.sandstormActive) penaltyEl.textContent = `🌪 侧风干扰，飞行速度降低 ${pct}%`;
        else penaltyEl.textContent = `⚠ 总重 ${totalWeight.toFixed(1)}t，速度降低 ${pct}%`;
    } else penaltyEl.style.display = 'none';
}

function updateTimer() {
    const mins = Math.floor(Math.max(0, gameTime) / 60);
    const secs = Math.floor(Math.max(0, gameTime) % 60);
    document.getElementById('timer').textContent = `${mins.toString().padStart(2,'0')}:${secs.toString().padStart(2,'0')}`;
}

function updateCoordDisplay() {
    if(player) document.getElementById('coordDisplay').textContent = `X: ${Math.floor(player.x)} | Y: ${Math.floor(player.y)}`;
}

function updateUltimateUI() {
    if(!player || !player.ultimateData) return;
    const fill = document.getElementById('ultimateFill');
    const ready = document.getElementById('ultimateReady');
    if(!fill || !ready) return;

    if(player.ultimateActive || player.ultimateCharging || player.nailLocking || player.stormActive) {
        fill.style.width = '100%';
        fill.style.background = 'linear-gradient(90deg, #ff4444, #ff8800)';
        ready.textContent = '◆ ' + (player.ultimateData.name || '技能') + ' 释放中';
        ready.style.display = 'block';
        ready.style.color = '#ff4444';
    } else if(player.ultimateCooldown > 0) {
        const progress = 1 - (player.ultimateCooldown / player.ultimateData.cooldown);
        fill.style.width = (progress * 100) + '%';
        fill.style.background = 'linear-gradient(90deg, #ffd700, #ff8800)';
        ready.style.display = 'none';
    } else {
        fill.style.width = '100%';
        fill.style.background = 'linear-gradient(90deg, #00ff88, #00ff88)';
        ready.textContent = '✓ ' + (player.ultimateData.name || '终极技能') + ' 就绪 - 按 G 释放';
        ready.style.display = 'block';
        ready.style.color = '#00ff88';
    }
}

function updateOutpostInfo() {
    const container = document.getElementById('outpostInfo');
    container.innerHTML = '';
    outposts.forEach(op => {
        const dot = document.createElement('div');
        dot.className = 'outpost-dot';
        dot.textContent = op.name;
        if(op.owner === 'blue') dot.classList.add('blue');
        else if(op.owner === 'red') dot.classList.add('red');
        else dot.classList.add('neutral');
        container.appendChild(dot);
    });
}


// ==================== roundRect polyfill ====================
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, radii) {
        const r = typeof radii === 'number' ? radii : (radii || 0);
        this.moveTo(x + r, y);
        this.arcTo(x + w, y, x + w, y + h, r);
        this.arcTo(x + w, y + h, x, y + h, r);
        this.arcTo(x, y + h, x, y, r);
        this.arcTo(x, y, x + w, y, r);
        return this;
    };
}


// ==================== 新模式函数 ====================
function initCTFMode() {
    const blueBaseX = CONFIG.mapWidth * 0.15;
    const blueBaseY = CONFIG.mapHeight * 0.5;
    const redBaseX = CONFIG.mapWidth * 0.85;
    const redBaseY = CONFIG.mapHeight * 0.5;
    ctfFlags = {
        blue: { x: blueBaseX, y: blueBaseY, atBase: true, carrier: null, dropped: false, dropX: 0, dropY: 0 },
        red: { x: redBaseX, y: redBaseY, atBase: true, carrier: null, dropped: false, dropX: 0, dropY: 0 }
    };
    ctfScores = { blue: 0, red: 0 };
    ctfFlagCarriers = { blue: null, red: null };
}

function updateCTFMode(dt) {
    if(!player || player.dead) return;

    const enemyTeam = player.team === 'blue' ? 'red' : 'blue';
    const enemyFlag = ctfFlags[enemyTeam];

    if(enemyFlag.atBase && !enemyFlag.carrier) {
        const dx = player.x - enemyFlag.x;
        const dy = player.y - enemyFlag.y;
        if(Math.hypot(dx, dy) < 40) {
            enemyFlag.carrier = player;
            enemyFlag.atBase = false;
            ctfFlagCarriers[player.team] = player;
            showNotification('你夺取了敌方旗帜！带回基地！', '#ff9800');
        }
    } else if(enemyFlag.dropped) {
        const dx = player.x - enemyFlag.dropX;
        const dy = player.y - enemyFlag.dropY;
        if(Math.hypot(dx, dy) < 40) {
            enemyFlag.carrier = player;
            enemyFlag.dropped = false;
            ctfFlagCarriers[player.team] = player;
            showNotification('你拾起了旗帜！', '#ff9800');
        }
    }

    const myFlag = ctfFlags[player.team];
    if(enemyFlag.carrier === player && myFlag.atBase) {
        const dx = player.x - myFlag.x;
        const dy = player.y - myFlag.y;
        if(Math.hypot(dx, dy) < 40) {
            ctfScores[player.team]++;
            enemyFlag.carrier = null;
            enemyFlag.atBase = true;
            enemyFlag.x = enemyTeam === 'blue' ? CONFIG.mapWidth * 0.15 : CONFIG.mapWidth * 0.85;
            enemyFlag.y = CONFIG.mapHeight * 0.5;
            ctfFlagCarriers[player.team] = null;
            showNotification(player.team === 'blue' ? '蓝方得分！' + ctfScores.blue + '/3' : '红方得分！' + ctfScores.red + '/3', '#00ff88');
            createParticles(player.x, player.y, 30, '#ff9800', 2);
            if(ctfScores[player.team] >= 3) endGame(player.team === 'blue' ? 'victory' : 'playerDead');
        }
    }

    aiTanks.forEach(tank => {
        if(tank.dead || tank.isPlayer) return;
        const aiEnemyTeam = tank.team === 'blue' ? 'red' : 'blue';
        const aiEnemyFlag = ctfFlags[aiEnemyTeam];
        const aiMyFlag = ctfFlags[tank.team];

        if(aiEnemyFlag.atBase && !aiEnemyFlag.carrier) {
            const dx = tank.x - aiEnemyFlag.x;
            const dy = tank.y - aiEnemyFlag.y;
            if(Math.hypot(dx, dy) < 40) {
                aiEnemyFlag.carrier = tank;
                aiEnemyFlag.atBase = false;
            }
        }
        if(aiEnemyFlag.carrier === tank && aiMyFlag.atBase) {
            const dx = tank.x - aiMyFlag.x;
            const dy = tank.y - aiMyFlag.y;
            if(Math.hypot(dx, dy) < 40) {
                ctfScores[tank.team]++;
                aiEnemyFlag.carrier = null;
                aiEnemyFlag.atBase = true;
                aiEnemyFlag.x = aiEnemyTeam === 'blue' ? CONFIG.mapWidth * 0.15 : CONFIG.mapWidth * 0.85;
                aiEnemyFlag.y = CONFIG.mapHeight * 0.5;
                showNotification(tank.team === 'blue' ? '蓝方得分！' + ctfScores.blue + '/3' : '红方得分！' + ctfScores.red + '/3', '#ff4444');
                if(ctfScores[tank.team] >= 3) endGame(tank.team === 'blue' ? 'victory' : 'playerDead');
            }
        }
    });

    ['blue', 'red'].forEach(team => {
        const flag = ctfFlags[team];
        if(flag.carrier && !flag.carrier.dead) {
            flag.x = flag.carrier.x;
            flag.y = flag.carrier.y;
        } else if(flag.carrier && flag.carrier.dead) {
            flag.dropped = true;
            flag.dropX = flag.carrier.x;
            flag.dropY = flag.carrier.y;
            flag.carrier = null;
        }
    });
}

function renderCTFMode() {
    ['blue', 'red'].forEach(team => {
        const flag = ctfFlags[team];
        if(!flag) return;
        const zoom = camera.zoom || 1;
        const sx = (flag.x - camera.x) * zoom;
        const sy = (flag.y - camera.y) * zoom;
        if(sx < -50 || sx > canvas.width + 50 || sy < -50 || sy > canvas.height + 50) return;

        ctx.strokeStyle = '#888';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(sx, sy - 20);
        ctx.lineTo(sx, sy + 10);
        ctx.stroke();

        const flagColor = team === 'blue' ? '#0088ff' : '#ff4444';
        ctx.fillStyle = flagColor;
        ctx.beginPath();
        ctx.moveTo(sx, sy - 20);
        ctx.lineTo(sx + 20, sy - 12);
        ctx.lineTo(sx, sy - 4);
        ctx.fill();

        if(flag.carrier) {
            ctx.shadowColor = flagColor;
            /*shadow*/ctx.shadowBlur = 0;
            ctx.fillStyle = flagColor;
            ctx.beginPath();
            ctx.arc(sx, sy - 15, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        if(flag.dropped && Math.floor(Date.now() / 500) % 2 === 0) {
            ctx.fillStyle = flagColor;
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            ctx.arc(sx, sy, 15, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    });

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('蓝方 ' + ctfScores.blue + ' - ' + ctfScores.red + ' 红方', canvas.width / 2, 30);
    ctx.textAlign = 'left';
}

function initInfectionMode() {
    const redTanks = enemies.filter(t => !t.dead);
    if(redTanks.length > 0) {
        // 所有红方坦克都变成感染者
        redTanks.forEach((tank, index) => {
            tank.isInfected = true;
            tank.infectionLevel = 3;
            tank.originalTeam = 'red';
            tank.team = 'infected';
            tank.color = '#e91e63';
            tank.speed *= 1.3; // 感染者速度更快
            tank.hp = Math.floor(tank.hp * 2.0); // 感染者血量翻倍
            tank.maxHp = tank.hp;
            tank.invincible = 5; // 5秒无敌时间
            if(index === 0) {
                infectionData.patientZero = tank;
            }
        });

        infectionData.infected = redTanks;
        infectionData.survivors = [...allies.filter(t => !t.dead), player];
        infectionData.infectionStartTime = Date.now();

        showNotification('感染模式：' + redTanks.length + '名感染者出现！不要被感染！', '#e91e63');
    }
}

function updateInfectionMode(dt) {
    // 感染者感染附近的幸存者（包括玩家和盟友）
    const allSurvivors = [...allies, player].filter(t => t && !t.dead && !t.isInfected);
    allSurvivors.forEach(survivor => {
        const nearbyInfected = aiTanks.filter(t => t.isInfected && !t.dead && Math.hypot(t.x - survivor.x, t.y - survivor.y) < 50);
        if(nearbyInfected.length > 0 && Math.random() < dt * 0.8) {
            infectTank(survivor);
        }
    });

    // 检查胜利条件
    const aliveSurvivors = [...allies, player].filter(t => t && !t.dead && !t.isInfected);
    const aliveInfected = [player, ...allies, ...enemies].filter(t => t && !t.dead && t.isInfected);

    // 所有幸存者被感染或死亡 -> 感染者胜利
    if(aliveSurvivors.length === 0) {
        if(player && player.isInfected && !player.dead) {
            endGame('victory'); // 玩家被感染且存活，感染者胜利
        } else {
            endGame('playerDead'); // 玩家死亡
        }
        return;
    }

    // 所有感染者被消灭 -> 幸存者胜利
    if(aliveInfected.length === 0) {
        endGame('victory');
        return;
    }

    infectionData.survivors = aliveSurvivors;
    infectionData.infected = aliveInfected;
}

function infectTank(tank) {
    tank.isInfected = true;
    tank.infectionLevel = 1;
    tank.originalTeam = tank.team;
    tank.team = 'infected';
    tank.color = '#e91e63';
    tank.speed *= 1.1;
    if(tank === player) {
        showNotification('你被感染了！现在去感染其他人吧！', '#e91e63');
    }
    createParticles(tank.x, tank.y, 15, '#e91e63', 1.5);
}

function renderInfectionMode() {
    [player, ...aiTanks].filter(Boolean).forEach(tank => {
        if(!tank.isInfected || tank.dead) return;
        const zoom = camera.zoom || 1;
        const sx = (tank.x - camera.x) * zoom;
        const sy = (tank.y - camera.y) * zoom;
        if(sx < -50 || sx > canvas.width + 50 || sy < -50 || sy > canvas.height + 50) return;

        ctx.strokeStyle = 'rgba(233,30,99,0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(sx, sy, 35, 0, Math.PI * 2);
        ctx.stroke();
    });

    const survivorCount = infectionData.survivors ? infectionData.survivors.length : 0;
    const infectedCount = infectionData.infected ? infectionData.infected.length : 0;
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('幸存者: ' + survivorCount + ' | 感染者: ' + infectedCount, canvas.width / 2, 30);
    ctx.textAlign = 'left';
}

function initStormMode() {
    const cx = CONFIG.mapWidth / 2;
    const cy = CONFIG.mapHeight / 2;
    stormData = {
        safeZone: { x: cx, y: cy, radius: Math.min(CONFIG.mapWidth, CONFIG.mapHeight) * 0.45 },
        nextSafeZone: { x: cx, y: cy, radius: Math.min(CONFIG.mapWidth, CONFIG.mapHeight) * 0.45 },
        elapsed: 0,
        shrinkDuration: 45,
        stormDamage: 32,
        phase: 0
    };
}

function updateStormMode(dt) {
    stormData.elapsed += dt;
    const progress = Math.min(stormData.elapsed / stormData.shrinkDuration, 1);

    const startRadius = Math.min(CONFIG.mapWidth, CONFIG.mapHeight) * 0.45;
    const endRadius = 80;
    stormData.safeZone.radius = startRadius - (startRadius - endRadius) * progress;

    const allTanks = [player, ...allies, ...enemies].filter(t => t && !t.dead);
    allTanks.forEach(tank => {
        const dist = Math.hypot(tank.x - stormData.safeZone.x, tank.y - stormData.safeZone.y);
        if(dist > stormData.safeZone.radius) {
            const outsideDepth = Math.min(2, (dist - stormData.safeZone.radius) / Math.max(120, stormData.safeZone.radius));
            const damagePerSecond = stormData.stormDamage * (1 + outsideDepth * 0.75);
            const damage = damagePerSecond * dt;
            applyDirectDamage(tank, damage, null);
            tank.stormDamageTick = (tank.stormDamageTick || 0) - dt;
            if(tank.stormDamageTick <= 0) {
                showDamageNumber(tank.x, tank.y - 38, Math.round(damagePerSecond));
                createParticles(tank.x, tank.y, 3, '#00d9a7', 0.7);
                tank.stormDamageTick = 1;
            }
            if(tank.dead && tank === player) endGame('playerDead');
        } else tank.stormDamageTick = 0;
    });

    const aliveBlue = [...allies].filter(t => !t.dead);
    const aliveRed = [...enemies].filter(t => !t.dead);
    if(aliveBlue.length === 0 && player.dead) {
        endGame('playerDead');
    } else if(aliveRed.length === 0 && !player.dead) {
        endGame('victory');
    }
}

function renderStormMode() {
    const zoom = camera.zoom || 1;
    const sx = (stormData.safeZone.x - camera.x) * zoom;
    const sy = (stormData.safeZone.y - camera.y) * zoom;
    const r = stormData.safeZone.radius * zoom;

    ctx.save();
    ctx.fillStyle = 'rgba(0,80,60,0.38)';
    ctx.beginPath();
    ctx.rect(0, 0, canvas.width, canvas.height);
    ctx.arc(sx, sy, r, 0, Math.PI * 2, true);
    ctx.fill('evenodd');
    ctx.restore();

    ctx.strokeStyle = 'rgba(0,191,165,0.6)';
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    if(player && !player.dead) {
        const dist = Math.hypot(player.x - stormData.safeZone.x, player.y - stormData.safeZone.y);
        if(dist > stormData.safeZone.radius) {
            ctx.fillStyle = '#ff4444';
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('⚠ 快进入安全区！', canvas.width / 2, canvas.height / 2 - 50);
            ctx.textAlign = 'left';
        }
    }

    const aliveCount = [player, ...allies, ...enemies].filter(t => t && !t.dead).length;
    ctx.fillStyle = '#00bfa5';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('存活: ' + aliveCount + ' | 安全区正在缩小', canvas.width / 2, 30);
    ctx.textAlign = 'left';
}

function updateGameModes(dt) {
    if(gameMode === 'ctf') updateCTFMode(dt);
    else if(gameMode === 'infection') updateInfectionMode(dt);
    else if(gameMode === 'storm') updateStormMode(dt);
}

function renderGameModes() {
    if(gameMode === 'ctf') renderCTFMode();
    else if(gameMode === 'infection') renderInfectionMode();
    else if(gameMode === 'storm') renderStormMode();
}

function showNotification(text, color) {
    const notif = document.createElement('div');
    notif.style.cssText = 'position:fixed;top:80px;left:50%;transform:translateX(-50%);background:' + color + ';color:#fff;padding:10px 20px;border-radius:8px;font-size:16px;font-weight:bold;z-index:10000;animation:fadeInOut 3s forwards;';
    notif.textContent = text;
    document.body.appendChild(notif);
    setTimeout(() => notif.remove(), 3000);
}
