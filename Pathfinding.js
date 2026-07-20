// ==================== A* 寻路系统 ====================
function initPathGrid() {
    pathGridWidth = Math.ceil(CONFIG.mapWidth / CONFIG.pathGridSize);
    pathGridHeight = Math.ceil(CONFIG.mapHeight / CONFIG.pathGridSize);
    pathGrid = new Array(pathGridWidth * pathGridHeight).fill(false);
    
    for(let obs of obstacles) {
        const startGx = Math.floor(obs.x / CONFIG.pathGridSize);
        const startGy = Math.floor(obs.y / CONFIG.pathGridSize);
        const endGx = Math.ceil((obs.x + obs.w) / CONFIG.pathGridSize);
        const endGy = Math.ceil((obs.y + obs.h) / CONFIG.pathGridSize);
        
        for(let gx = startGx; gx < endGx && gx < pathGridWidth; gx++) {
            for(let gy = startGy; gy < endGy && gy < pathGridHeight; gy++) {
                if(gx >= 0 && gy >= 0) {
                    pathGrid[gy * pathGridWidth + gx] = true;
                }
            }
        }
    }

    // AI 把水域视为高风险区，会优先寻桥；玩家仍可以手动驶入水中。
    if(terrainZones.some(z => z.type === 'water')) {
        for(let gx = 0; gx < pathGridWidth; gx++) {
            for(let gy = 0; gy < pathGridHeight; gy++) {
                const world = gridToWorld(gx, gy);
                if(isPositionInWater(world.x, world.y, CONFIG.pathGridSize * 0.28)) {
                    pathGrid[gy * pathGridWidth + gx] = true;
                }
            }
        }
    }
    
    for(let gx = 0; gx < pathGridWidth; gx++) {
        pathGrid[0 * pathGridWidth + gx] = true;
        pathGrid[(pathGridHeight - 1) * pathGridWidth + gx] = true;
    }
    for(let gy = 0; gy < pathGridHeight; gy++) {
        pathGrid[gy * pathGridWidth + 0] = true;
        pathGrid[gy * pathGridWidth + (pathGridWidth - 1)] = true;
    }
}

function worldToGrid(wx, wy) {
    return { x: Math.floor(wx / CONFIG.pathGridSize), y: Math.floor(wy / CONFIG.pathGridSize) };
}

function gridToWorld(gx, gy) {
    return { x: gx * CONFIG.pathGridSize + CONFIG.pathGridSize / 2, y: gy * CONFIG.pathGridSize + CONFIG.pathGridSize / 2 };
}

function isGridWalkable(gx, gy) {
    if(gx < 0 || gx >= pathGridWidth || gy < 0 || gy >= pathGridHeight) return false;
    return !pathGrid[gy * pathGridWidth + gx];
}

function aStar(start, goal) {
    const startG = worldToGrid(start.x, start.y);
    const goalG = worldToGrid(goal.x, goal.y);
    
    if(!isGridWalkable(startG.x, startG.y)) {
        const nearby = findNearbyWalkable(startG.x, startG.y, 3);
        if(!nearby) return null;
        startG.x = nearby.x; startG.y = nearby.y;
    }
    if(!isGridWalkable(goalG.x, goalG.y)) {
        const nearby = findNearbyWalkable(goalG.x, goalG.y, 5);
        if(!nearby) return null;
        goalG.x = nearby.x; goalG.y = nearby.y;
    }
    
    if(startG.x === goalG.x && startG.y === goalG.y) return [goal];
    
    const openSet = [];
    const closedSet = new Set();
    const cameFrom = new Map();
    const gScore = new Map();
    const fScore = new Map();
    const startKey = `${startG.x},${startG.y}`;
    
    openSet.push({x: startG.x, y: startG.y, f: 0});
    gScore.set(startKey, 0);
    fScore.set(startKey, heuristic(startG, goalG));
    
    let nodesChecked = 0;
    
    while(openSet.length > 0 && nodesChecked < CONFIG.pathMaxNodes) {
        nodesChecked++;
        openSet.sort((a, b) => a.f - b.f);
        const current = openSet.shift();
        const currentKey = `${current.x},${current.y}`;
        
        if(current.x === goalG.x && current.y === goalG.y) {
            return reconstructPath(cameFrom, current, goal);
        }
        closedSet.add(currentKey);
        
        const neighbors = [
            {x: current.x + 1, y: current.y}, {x: current.x - 1, y: current.y},
            {x: current.x, y: current.y + 1}, {x: current.x, y: current.y - 1},
            {x: current.x + 1, y: current.y + 1}, {x: current.x + 1, y: current.y - 1},
            {x: current.x - 1, y: current.y + 1}, {x: current.x - 1, y: current.y - 1},
        ];
        
        for(const neighbor of neighbors) {
            const neighborKey = `${neighbor.x},${neighbor.y}`;
            if(closedSet.has(neighborKey)) continue;
            if(!isGridWalkable(neighbor.x, neighbor.y)) continue;
            if(Math.abs(neighbor.x - current.x) === 1 && Math.abs(neighbor.y - current.y) === 1) {
                if(!isGridWalkable(current.x, neighbor.y) && !isGridWalkable(neighbor.x, current.y)) continue;
            }
            const moveCost = (Math.abs(neighbor.x - current.x) + Math.abs(neighbor.y - current.y) === 2) ? 1.414 : 1;
            const tentativeG = gScore.get(currentKey) + moveCost;
            const existingG = gScore.get(neighborKey);
            if(existingG === undefined || tentativeG < existingG) {
                cameFrom.set(neighborKey, current);
                gScore.set(neighborKey, tentativeG);
                const f = tentativeG + heuristic(neighbor, goalG);
                fScore.set(neighborKey, f);
                const existingOpen = openSet.find(n => n.x === neighbor.x && n.y === neighbor.y);
                if(!existingOpen) openSet.push({x: neighbor.x, y: neighbor.y, f: f});
                else existingOpen.f = f;
            }
        }
    }
    
    if(cameFrom.size > 0) {
        let bestNode = null;
        let bestDist = Infinity;
        for(const [key, g] of gScore) {
            const [gx, gy] = key.split(',').map(Number);
            const dist = heuristic({x: gx, y: gy}, goalG);
            if(dist < bestDist) { bestDist = dist; bestNode = {x: gx, y: gy}; }
        }
        if(bestNode) return reconstructPath(cameFrom, bestNode, goal);
    }
    return null;
}

function heuristic(a, b) {
    const dx = a.x - b.x; const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
}

function reconstructPath(cameFrom, current, goalWorld) {
    const path = [];
    let curr = current;
    while(cameFrom.has(`${curr.x},${curr.y}`)) {
        const worldPos = gridToWorld(curr.x, curr.y);
        path.unshift(worldPos);
        curr = cameFrom.get(`${curr.x},${curr.y}`);
    }
    const startWorld = gridToWorld(curr.x, curr.y);
    path.unshift(startWorld);
    if(path.length > 0) path[path.length - 1] = {x: goalWorld.x, y: goalWorld.y};
    return path;
}

function findNearbyWalkable(gx, gy, maxRadius) {
    for(let r = 1; r <= maxRadius; r++) {
        for(let dx = -r; dx <= r; dx++) {
            for(let dy = -r; dy <= r; dy++) {
                if(Math.abs(dx) + Math.abs(dy) > r * 1.5) continue;
                const nx = gx + dx, ny = gy + dy;
                if(isGridWalkable(nx, ny)) return {x: nx, y: ny};
            }
        }
    }
    return null;
}

function simplifyPath(path) {
    if(path.length <= 2) return path;
    const simplified = [path[0]];
    for(let i = 1; i < path.length - 1; i++) {
        const prev = simplified[simplified.length - 1];
        const curr = path[i];
        const next = path[i + 1];
        const dx1 = curr.x - prev.x; const dy1 = curr.y - prev.y;
        const dx2 = next.x - curr.x; const dy2 = next.y - curr.y;
        const cross = dx1 * dy2 - dy1 * dx2;
        if(Math.abs(cross) > 100) simplified.push(curr);
    }
    simplified.push(path[path.length - 1]);
    return simplified;
}

function followPath(tank, dt) {
    if(!tank.path || tank.path.length === 0) return false;

    while(tank.path.length > 0) {
        const nextPoint = tank.path[0];
        const dist = Math.hypot(nextPoint.x - tank.x, nextPoint.y - tank.y);
        if(dist < CONFIG.pathGridSize * 0.6) tank.path.shift();
        else break;
    }
    if(tank.path.length === 0) return false;

    const target = tank.path[0];
    const targetAngle = Math.atan2(target.y - tank.y, target.x - tank.x);

    const checkDist = CONFIG.tankSize * 3;
    const frontX = tank.x + Math.cos(targetAngle) * checkDist;
    const frontY = tank.y + Math.sin(targetAngle) * checkDist;

    let blocked = false;
    let blockedBy = null;
    for (let other of aiTanks) {
        if (other === tank || other.dead) continue;
        const d = Math.hypot(other.x - frontX, other.y - frontY);
        if (d < CONFIG.tankSize * 2.5) { 
            blocked = true; 
            blockedBy = other;
            break;
        }
    }

    if (blocked && blockedBy) {
        const blockAngle = Math.atan2(blockedBy.y - tank.y, blockedBy.x - tank.x);

        let bestDodgeAngle = null;
        let bestDodgeScore = -Infinity;

        for (let offset of [-Math.PI/2, Math.PI/2, -Math.PI/3, Math.PI/3, -Math.PI*0.7, Math.PI*0.7]) {
            const dodgeAngle = blockAngle + offset;
            const dodgeSpeed = getActualSpeed(tank) * 0.8;
            const testX = tank.x + Math.cos(dodgeAngle) * dodgeSpeed * 60 * dt;
            const testY = tank.y + Math.sin(dodgeAngle) * dodgeSpeed * 60 * dt;

            if ((tank.canPassObstacles && !tank.isFlying) || !checkObstacleCollision(testX, testY, CONFIG.tankSize, tank)) {
                const towardTarget = Math.cos(dodgeAngle - targetAngle);
                let score = towardTarget * 100;
                const awayFromBlock = Math.cos(dodgeAngle - blockAngle);
                score += awayFromBlock * 50;
                if (Math.abs(normalizeAngle(dodgeAngle - tank.angle)) < 0.2) score -= 30;

                if (score > bestDodgeScore) {
                    bestDodgeScore = score;
                    bestDodgeAngle = dodgeAngle;
                }
            }
        }

        if (bestDodgeAngle !== null) {
            const dodgeSpeed = getActualSpeed(tank) * 0.8;
            tank.x = Math.max(CONFIG.tankSize, Math.min(CONFIG.mapWidth - CONFIG.tankSize, 
                tank.x + Math.cos(bestDodgeAngle) * dodgeSpeed * 60 * dt));
            tank.y = Math.max(CONFIG.tankSize, Math.min(CONFIG.mapHeight - CONFIG.tankSize, 
                tank.y + Math.sin(bestDodgeAngle) * dodgeSpeed * 60 * dt));
            tank.angle = bestDodgeAngle;
            if(Math.random() < 0.3) addExhaustTrail(tank);
            return true;
        }

        tank.angle += (Math.random() > 0.5 ? 0.5 : -0.5);
        tank.stuckTimer += 0.5;
        return true;
    }

    if ((tank.stuckTimer || 0) > 0.8) {
        tank.path = null;
        tank.stuckTimer = 0;
        const escapeAngle = targetAngle + (Math.random() - 0.5) * Math.PI;
        const escapeSpeed = getActualSpeed(tank) * 0.6;
        const escapeX = tank.x + Math.cos(escapeAngle) * escapeSpeed * 60 * dt;
        const escapeY = tank.y + Math.sin(escapeAngle) * escapeSpeed * 60 * dt;
        if ((tank.canPassObstacles && !tank.isFlying) || !checkObstacleCollision(escapeX, escapeY, CONFIG.tankSize, tank)) {
            tank.x = Math.max(CONFIG.tankSize, Math.min(CONFIG.mapWidth - CONFIG.tankSize, escapeX));
            tank.y = Math.max(CONFIG.tankSize, Math.min(CONFIG.mapHeight - CONFIG.tankSize, escapeY));
            tank.angle = escapeAngle;
        }
        return true;
    }

    let diff = targetAngle - tank.angle;
    while(diff > Math.PI) diff -= Math.PI * 2;
    while(diff < -Math.PI) diff += Math.PI * 2;
    tank.angle += diff * tank.turnSpeed * 60 * dt;
    const actualSpeed = getActualSpeed(tank);
    const newX = tank.x + Math.cos(tank.angle) * actualSpeed * 60 * dt;
    const newY = tank.y + Math.sin(tank.angle) * actualSpeed * 60 * dt;
    if((tank.canPassObstacles && !tank.isFlying) || !checkObstacleCollision(newX, newY, CONFIG.tankSize, tank)) {
        tank.x = Math.max(CONFIG.tankSize, Math.min(CONFIG.mapWidth - CONFIG.tankSize, newX));
        tank.y = Math.max(CONFIG.tankSize, Math.min(CONFIG.mapHeight - CONFIG.tankSize, newY));
    } else {
        if(tank.isFlying && typeof registerHelicopterCollision === 'function') registerHelicopterCollision(tank);
        for (let offset of [0.3, -0.3, 0.6, -0.6]) {
            const testAngle = tank.angle + offset;
            const testX = tank.x + Math.cos(testAngle) * actualSpeed * 60 * dt;
            const testY = tank.y + Math.sin(testAngle) * actualSpeed * 60 * dt;
            if ((tank.canPassObstacles && !tank.isFlying) || !checkObstacleCollision(testX, testY, CONFIG.tankSize, tank)) {
                tank.x = Math.max(CONFIG.tankSize, Math.min(CONFIG.mapWidth - CONFIG.tankSize, testX));
                tank.y = Math.max(CONFIG.tankSize, Math.min(CONFIG.mapHeight - CONFIG.tankSize, testY));
                tank.angle = testAngle;
                break;
            }
        }
    }
    if(Math.random() < 0.25) addExhaustTrail(tank);
    return true;
}

function getActualSpeed(tank) {
    if(tank.isPlayer) {
        const speed = tank.speed * (1 + (tank.speedBoost || 0) + (tank.mapSpeedBoost || 0) + (tank.speedBuffFromCommander || 0));
        recordSpeed(speed);
    }
    if(!tank || isNaN(tank.speed)) {
        console.log('[GET_SPEED] Invalid tank or speed:', tank ? tank.speed : 'no tank');
        return 0;
    }
    let speed = tank.speed;
    let totalSpeedBoost = (tank.speedBoost || 0) + (tank.mapSpeedBoost || 0) + (tank.speedBuffFromCommander || 0);
    if(totalSpeedBoost > 0) speed *= (1 + totalSpeedBoost);

    // 重量系统：基础重量 + 弹药重量
    const shellWeight = 0.02, mgWeight = 0.0001, aaWeight = 0.005;
    const baseWeight = tank.weight || 1.0;
    const ammoWeight = ((tank.shells || 0) * shellWeight + (tank.mg || 0) * mgWeight + (tank.aa || 0) * aaWeight) * 0.01;
    const totalWeight = baseWeight + ammoWeight;

    // 重量影响速度：越重越慢
    const weightFactor = gameMode === 'defense' ? 1 : Math.max(0.3, 1.0 - totalWeight * 0.008);

    // 直升机不受障碍物影响，但重量影响仍然适用
    const statusSlow = Math.max(0.2, 1 - (tank.toxinSlow || 0));
    const freezeSlow = Math.max(0.45, 1 - (tank.freezeLevel || 0) * 0.55);
    const inWater = isTankInWater(tank);
    const waterSlow = inWater ? (tank.tankType === 'duoduo_ifv' ? 0.3 : 0.18) : 1;
    if(tank.isFlying) {
        const sandstormSlow = currentMap === 'desert' && environmentState.sandstormActive ? 0.62 : 1;
        const mapFlightPenalty = currentMap === 'city' ? 0.78 : currentMap === 'snow' ? 0.70 : currentMap === 'island' ? 0.80 : 1;
        return speed * weightFactor * 1.3 * statusSlow * sandstormSlow * mapFlightPenalty;
    }

    return Math.max(tank.speed * 0.12, speed * weightFactor * statusSlow * freezeSlow * waterSlow);
}
