// ==================== 故事模式：四元素封印 ====================
// 独立维护章节、对话、关卡规则和通关存档，主战斗循环只保留少量钩子。
const STORY_SAVE_KEY = 'tankBattleStoryProgressV1';
const STORY_BACKGROUND = '左研学院位于地底深处。近几天，地底能量异常，四大元素的封印被打破。地底机械兽冲出地表。你（8级左研29）作为学院最后的“战术车长”，带上了一个见多识广但不会战斗的帮手，必须驾驶特制的“元素坦克”，深入地下，重新封印它们。';

const STORY_LEVELS = Object.freeze([
    {id:'iceTrap',chapter:1,chapterName:'左研地底废墟',name:'冰霜陷阱',icon:'❄',map:'snow',kind:'普通对战',mechanic:'iceSpikes',enemyTypes:['zuoyan30','zuoyan1','xingchen27a'],time:75,
        hint:'击败守卫，同时观察地面蓝色预警圈；冰锥落下前必须离开。',
        intro:[['左研29','left','嗯，这里像一个冰洞，上面还有很多冰锥……'],['阿识','left','小心！冰锥要掉下来了！'],['左研29','left','被正面砸中会直接重创。看地面预警，再开火。']],
        outro:[['阿识','left','封印碎片有反应了！'],['左研29','left','这只是入口。继续向火焰回廊推进。']]},
    {id:'fireWalker',chapter:1,chapterName:'左研地底废墟',name:'火焰行者',icon:'🔥',map:'volcano',kind:'Boss战',mechanic:'fireWalker',enemyTypes:['zuoyan1'],boss:true,bossHp:4200,time:100,
        hint:'先击碎三个发光部位；用冰霜主炮击中火海可把它冻结为安全冰地。',
        intro:[['左研1','right','过载已经不可逆。靠近我，一起化成灰吧！'],['阿识','left','它每次自爆都会留下火海。你的冰霜弹可以冻结地面！']],
        outro:[['左研1','right','原来……冰能让过载停下来。'],['左研29','left','火之封印，归位。']]},
    {id:'minecart',chapter:1,chapterName:'左研地底废墟',name:'矿车追逐',icon:'⛏',map:'classic',kind:'追击战',mechanic:'minecart',enemyTypes:['zuoyan29'],boss:true,bossHp:2600,time:80,
        hint:'矿车不会停车；沿弯轨追击敌车，持续修正炮塔方向和主炮仰角。',
        intro:[['阿识','left','前面的矿车带走了封印核心！'],['左研29','left','那就别刹车。弯道里也要保持炮口领先。']],
        outro:[['阿识','left','冰与火的核心都找齐了。上方有一座空中堡垒。']]},
    {id:'cloudSniper',chapter:2,chapterName:'星辰空中堡垒',name:'云中狙击',icon:'☁',map:'island',kind:'Boss战',mechanic:'teleportEcho',enemyTypes:['xingchen27s'],boss:true,bossHp:4600,time:105,
        hint:'地面残影会提前标出跃迁落点；先向残影开炮，而不是追着Boss转炮塔。',
        intro:[['星辰27S','right','你看到的永远是我上一秒的位置。'],['阿识','left','别看它，看地面的蓝色残影！那才是下一次落点。']],
        outro:[['左研29','left','预测比追踪更快。风之封印已稳定。']]},
    {id:'thunderRun',chapter:2,chapterName:'星辰空中堡垒',name:'雷暴天气',icon:'⚡',map:'island',kind:'生存战',mechanic:'thunderRun',enemyTypes:['xingchen27a','xingchen27s'],survival:42,time:50,
        hint:'持续移动42秒；停车超过3秒会被锁定并遭受雷击。',
        intro:[['阿识','left','雷云在追踪静止的金属目标！'],['左研29','left','那就让履带一直转。']],
        outro:[['阿识','left','雷云散开了。堡垒顶层就在前面。']]},
    {id:'towerDefense',chapter:2,chapterName:'星辰空中堡垒',name:'高塔防守',icon:'🏗',map:'factory',kind:'Boss战',mechanic:'cranePuzzle',enemyTypes:['xingchen27b'],boss:true,bossHp:7200,time:130,
        hint:'把Boss引进黄色吊装区，再驶入蓝色控制台；起重机会把油桶砸向其头顶弱点。',
        intro:[['星辰27B','right','绝对领域展开。这里没有炮弹能穿透我。'],['阿识','left','别硬打！B1起重机还能工作。把它引进吊装区！']],
        outro:[['星辰27B','right','领域……挡不住重力。'],['左研29','left','风雷封印，完成。']]},
    {id:'steelFurnace',chapter:3,chapterName:'多多熔岩核心',name:'钢铁熔炉',icon:'♨',map:'volcano',kind:'Boss战',mechanic:'shrinkingArena',enemyTypes:['duoduo'],boss:true,bossHp:8200,time:120,
        hint:'齐射会震塌外圈；留在不断缩小的安全圆内，快速打碎发光装甲。',
        intro:[['多多号主战坦克','right','毁灭齐射不需要命中你。它只需要摧毁你脚下的路。'],['左研29','left','那就在场地消失前结束战斗。']],
        outro:[['阿识','left','熔炉停止收缩了。钢铁封印出现裂纹。']]},
    {id:'excavator',chapter:3,chapterName:'多多熔岩核心',name:'挖掘机',icon:'🛠',map:'city',kind:'Boss战',mechanic:'artilleryPuzzle',enemyTypes:['duoduo_eng'],boss:true,bossHp:6400,time:120,
        hint:'自动炮塔封锁平射路线；切换高射炮、提高仰角，以抛物线越过炮塔命中工程车。',
        intro:[['多多号工程车','right','阵地已经完成。直线冲锋只会变成废铁。'],['阿识','left','用高射炮的抛物线！炮塔挡得住直射，挡不住高弧弹道。']],
        outro:[['左研29','left','战术不是绕开工事，是改变弹道。']]},
    {id:'nailRoom',chapter:3,chapterName:'多多熔岩核心',name:'天罚密室',icon:'☄',map:'city',kind:'Boss战',mechanic:'nailCover',enemyTypes:['duoduo_spat'],boss:true,bossHp:5400,time:110,
        hint:'红色激光蓄力3秒；立刻退到地图边缘掩体后，视线被完全遮断才安全。',
        intro:[['多多号自移车','right','天罚之钉已经锁定。三秒之后，直线上的一切都会消失。'],['阿识','left','边缘有厚重掩体！看到红线就立刻断开视线。']],
        outro:[['阿识','left','钢铁封印复原了。但所有异常都指向同一个名字——Kimi。']]},
    {id:'lostIllusion',chapter:4,chapterName:'Kimi·虚空回廊',name:'迷失幻境',icon:'◈',map:'snow',kind:'Boss战',mechanic:'kimiClones',enemyTypes:['kimi_tank','kimi_tank','kimi_tank','kimi_tank'],boss:true,bossHp:6800,time:130,
        hint:'真身被虚空护罩保护；用冰霜弹命中克隆体，让寒气溅射并传染到真身。',
        intro:[['Kimi','right','四个我都是真的。或者，四个都不是。'],['阿识','left','冰霜会在相同代码之间传染。先打克隆体！']],
        outro:[['Kimi','right','我不是灾难的源头。我只是看守最后一道门。'],['左研29','left','那扇门后是什么？'],['Kimi','right','学院最早制造、又最害怕承认的兵器。']]},
    {id:'codeAbyss',chapter:4,chapterName:'Kimi·虚空回廊',name:'代码深渊',icon:'✦',map:'factory',kind:'最终Boss战',mechanic:'finalFusion',enemyTypes:['mecha_pea'],boss:true,bossHp:14000,time:180,final:true,
        hint:'Boss在冰霜/火焰形态间切换。利用B1传送带，把它引进克制当前形态的属性房间。',
        intro:[['机甲神豌','right','三相核心重新启动。封印并不是囚禁我——而是在保护地表。'],['阿识','left','它在冰与火之间切换！传送带能把它送进两侧属性室。'],['左研29','left','打碎全部核心，然后把力量带回学院。']],
        outro:[['机甲神豌','right','战术车长认证完成。三相核心，接受新的驾驶者。'],['阿识','left','学院安全了，而且我们带回了一台传说中的坦克！'],['左研29','left','任务结束。机甲神豌，从今天起重返地表。']]}
]);

let storyModeState = createStoryModeState();
let storyDialogueRenderers = {left:null,right:null};

function createStoryModeState() {
    return {active:false,currentLevelId:null,currentLevel:null,runtime:null,dialogue:[],dialogueIndex:0,dialogueDone:null,mapNodes:[],animationFrame:0};
}

function loadStoryProgress() {
    const fallback={completed:[],introSeen:false,finished:false};
    try {
        const raw=localStorage.getItem(STORY_SAVE_KEY);
        if(!raw)return fallback;
        const parsed=JSON.parse(raw);
        return {completed:Array.isArray(parsed.completed)?parsed.completed:[],introSeen:!!parsed.introSeen,finished:!!parsed.finished};
    } catch(error) { return fallback; }
}

function saveStoryProgress(progress) {
    try { localStorage.setItem(STORY_SAVE_KEY,JSON.stringify(progress)); } catch(error) {}
}

function isStoryLevelUnlocked(index,progress=loadStoryProgress()) {
    return index===0||progress.completed.includes(STORY_LEVELS[index-1].id);
}

function openStoryMode() {
    if(typeof closeTutorial==='function')closeTutorial();
    if(typeof closeInfoPanels==='function')closeInfoPanels();
    const start=document.getElementById('startScreen'),menu=document.getElementById('menu'),screen=document.getElementById('storyModeScreen');
    if(start)start.style.display='none';if(menu){menu.style.display='none';menu.classList.remove('active');}
    if(screen)screen.classList.add('active');
    gameState='storyMap';
    drawStoryNodeMap();
}

function closeStoryMode() {
    const screen=document.getElementById('storyModeScreen');if(screen)screen.classList.remove('active');
    if(typeof resetGame==='function')resetGame();
}

function drawStoryNodeMap() {
    const canvas=document.getElementById('storyMapCanvas');if(!canvas)return;
    const rect=canvas.getBoundingClientRect();
    canvas.width=Math.max(900,Math.round(rect.width||1100));canvas.height=Math.max(500,Math.round(rect.height||620));
    const c=canvas.getContext('2d'),progress=loadStoryProgress();
    const chapterColors=['#5bd9ff','#c6e8ff','#ff9a45','#b66cff'];
    const columns=[.12,.30,.48,.66,.84], rows=[.20,.50,.80];
    const coords=[
        [columns[0],rows[0]],[columns[1],rows[0]],[columns[2],rows[0]],
        [columns[2],rows[1]],[columns[1],rows[1]],[columns[0],rows[1]],
        [columns[0],rows[2]],[columns[1],rows[2]],[columns[2],rows[2]],
        [columns[3],rows[1]],[columns[4],rows[1]]
    ];
    c.clearRect(0,0,canvas.width,canvas.height);
    const bg=c.createLinearGradient(0,0,canvas.width,canvas.height);bg.addColorStop(0,'#07121d');bg.addColorStop(.5,'#101629');bg.addColorStop(1,'#220e30');c.fillStyle=bg;c.fillRect(0,0,canvas.width,canvas.height);
    for(let i=0;i<180;i++){const x=(i*83)%canvas.width,y=(i*149)%canvas.height;c.fillStyle=`rgba(135,206,255,${.08+(i%5)*.025})`;c.fillRect(x,y,1+(i%2),1+(i%2));}
    storyModeState.mapNodes=[];
    coords.forEach((coord,index)=>{
        if(index>0){const prev=coords[index-1];c.strokeStyle=isStoryLevelUnlocked(index,progress)?'#67d8ff':'#334052';c.lineWidth=4;c.beginPath();c.moveTo(prev[0]*canvas.width,prev[1]*canvas.height);c.lineTo(coord[0]*canvas.width,coord[1]*canvas.height);c.stroke();}
        const level=STORY_LEVELS[index],x=coord[0]*canvas.width,y=coord[1]*canvas.height,unlocked=isStoryLevelUnlocked(index,progress),done=progress.completed.includes(level.id);
        c.shadowBlur=unlocked?20:0;c.shadowColor=chapterColors[level.chapter-1];c.fillStyle=done?'#5df0a8':unlocked?chapterColors[level.chapter-1]:'#202938';c.beginPath();c.arc(x,y,done?25:22,0,Math.PI*2);c.fill();c.shadowBlur=0;
        c.strokeStyle=done?'#d8ffe9':unlocked?'#fff':'#526070';c.lineWidth=3;c.stroke();
        c.fillStyle=unlocked?'#07111a':'#8a94a1';c.font='bold 19px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(done?'✓':level.icon,x,y+1);
        c.fillStyle=unlocked?'#f4fbff':'#778391';c.font='bold 15px sans-serif';c.fillText(level.name,x,y+43);
        c.font='12px sans-serif';c.fillStyle=chapterColors[level.chapter-1];c.fillText(level.kind,x,y+62);
        storyModeState.mapNodes.push({x,y,r:35,index,unlocked});
    });
    ['第一章 · 冰与火','第二章 · 风与雷','第三章 · 钢铁','第四章 · 真相'].forEach((label,i)=>{c.fillStyle=chapterColors[i];c.font='bold 13px sans-serif';c.textAlign='left';c.fillText(label,18,28+i*22);});
    updateStoryProgressText(progress);
}

function updateStoryProgressText(progress=loadStoryProgress()) {
    const el=document.getElementById('storyProgressText');if(!el)return;
    el.textContent=progress.finished?'全部封印完成 · 机甲神豌已解锁':`封印进度 ${progress.completed.length} / ${STORY_LEVELS.length}`;
}

function handleStoryMapClick(event) {
    const canvas=event.currentTarget,rect=canvas.getBoundingClientRect(),x=(event.clientX-rect.left)*canvas.width/rect.width,y=(event.clientY-rect.top)*canvas.height/rect.height;
    const node=storyModeState.mapNodes.find(item=>Math.hypot(item.x-x,item.y-y)<=item.r);
    if(!node)return;
    if(!node.unlocked){showStoryToast('前一关尚未完成，封印通路仍然关闭');return;}
    selectStoryLevel(STORY_LEVELS[node.index].id);
}

function selectStoryLevel(levelId) {
    const level=STORY_LEVELS.find(item=>item.id===levelId);if(!level)return;
    storyModeState.currentLevelId=level.id;storyModeState.currentLevel=level;
    const panel=document.getElementById('storyLevelCard');if(!panel)return;
    panel.classList.add('active');
    panel.innerHTML=`<button class="story-card-close" onclick="closeStoryLevelCard()">×</button><small>CHAPTER ${level.chapter} · ${level.chapterName}</small><h2>${level.icon} ${level.name}</h2><div class="story-level-kind">${level.kind}</div><p>${level.hint}</p><button class="story-primary" onclick="beginStoryLevelDialogue()">进入关卡</button>`;
}

function closeStoryLevelCard(){const panel=document.getElementById('storyLevelCard');if(panel)panel.classList.remove('active');}

function beginStoryLevelDialogue(){
    closeStoryLevelCard();
    const level=storyModeState.currentLevel;if(!level)return;
    const lines=level.intro.map(([speaker,side,text])=>({speaker,side,tank:getStorySpeakerTank(speaker),text}));
    showStoryDialogue(lines,launchStoryBattle,'开始关卡');
}

function getStorySpeakerTank(speaker){
    if(speaker==='左研29')return'zuoyan29';if(speaker==='左研1')return'zuoyan1';if(speaker==='星辰27S')return'xingchen27s';if(speaker==='星辰27B')return'xingchen27b';
    if(speaker==='多多号主战坦克')return'duoduo';if(speaker==='多多号工程车')return'duoduo_eng';if(speaker==='多多号自移车')return'duoduo_spat';
    if(speaker==='Kimi')return'kimi_tank';if(speaker==='机甲神豌')return'mecha_pea';return'helper';
}

function showStoryDialogue(lines,onDone,finalLabel='继续') {
    storyModeState.dialogue=lines;storyModeState.dialogueIndex=0;storyModeState.dialogueDone=onDone;storyModeState.dialogueFinalLabel=finalLabel;
    const overlay=document.getElementById('storyDialogueOverlay');if(overlay)overlay.classList.add('active');
    renderStoryDialogueLine();
}

function renderStoryDialogueLine(){
    const line=storyModeState.dialogue[storyModeState.dialogueIndex],overlay=document.getElementById('storyDialogueOverlay');if(!line||!overlay)return;
    const left=overlay.querySelector('.story-dialogue-left'),right=overlay.querySelector('.story-dialogue-right'),button=document.getElementById('storyDialogueNext');
    left.classList.toggle('speaking',line.side!=='right');right.classList.toggle('speaking',line.side==='right');
    const active=line.side==='right'?right:left,inactive=line.side==='right'?left:right;
    active.querySelector('.story-speaker-name').textContent=line.speaker;active.querySelector('.story-speech').textContent=line.text;
    inactive.querySelector('.story-speaker-name').textContent='';inactive.querySelector('.story-speech').textContent='';
    renderStoryDialogueTank(line.side==='right'?'right':'left',line.tank);
    if(button)button.textContent=storyModeState.dialogueIndex===storyModeState.dialogue.length-1?storyModeState.dialogueFinalLabel:'继续';
}

function nextStoryDialogue(){
    if(storyModeState.dialogueIndex<storyModeState.dialogue.length-1){storyModeState.dialogueIndex++;renderStoryDialogueLine();return;}
    const overlay=document.getElementById('storyDialogueOverlay');if(overlay)overlay.classList.remove('active');
    const done=storyModeState.dialogueDone;storyModeState.dialogueDone=null;if(done)done();
}

function renderStoryDialogueTank(side,tankType){
    const canvas=document.getElementById(side==='right'?'storyDialogueRightCanvas':'storyDialogueLeftCanvas');if(!canvas||typeof THREE==='undefined')return;
    let slot=storyDialogueRenderers[side];
    if(!slot){
        try{
            const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true});renderer.setPixelRatio(Math.min(1.5,window.devicePixelRatio||1));renderer.setSize(280,190,false);
            const scene=new THREE.Scene(),camera3d=new THREE.PerspectiveCamera(38,280/190,.1,100);camera3d.position.set(10,8,13);camera3d.lookAt(0,1,0);
            scene.add(new THREE.HemisphereLight(0xdff5ff,0x182235,2.4));const light=new THREE.DirectionalLight(0xffffff,2.8);light.position.set(5,10,7);scene.add(light);
            slot={renderer,scene,camera:camera3d,model:null,tankType:null};storyDialogueRenderers[side]=slot;
        }catch(error){return;}
    }
    if(slot.model){slot.scene.remove(slot.model);disposeStoryPortrait(slot.model);}
    slot.model=createStoryPortraitModel(tankType);slot.tankType=tankType;slot.scene.add(slot.model);slot.model.rotation.y=side==='right'?.45:-.45;
    slot.renderer.render(slot.scene,slot.camera);
}

function createStoryPortraitModel(tankType){
    const group=new THREE.Group();
    if(tankType==='helper'){
        const body=new THREE.Mesh(new THREE.SphereGeometry(2.2,18,12),new THREE.MeshStandardMaterial({color:0x59d9c7,metalness:.25,roughness:.42}));body.scale.set(1.25,.72,1);body.position.y=1.8;
        const eye=new THREE.Mesh(new THREE.BoxGeometry(1.5,.45,.35),new THREE.MeshBasicMaterial({color:0xffef91}));eye.position.set(1.8,2.1,0);group.add(body,eye);return group;
    }
    const data=TANKS[tankType]||TANKS.zuoyan29,color=data.color||'#4488ff',accent=data.accent||'#ffffff';
    const mat=new THREE.MeshStandardMaterial({color,metalness:.42,roughness:.36}),dark=new THREE.MeshStandardMaterial({color:0x171b20,metalness:.38,roughness:.55});
    const hull=new THREE.Mesh(new THREE.BoxGeometry(6.6,1.5,4.2),mat);hull.position.y=1.5;
    [-1,1].forEach(side=>{const track=new THREE.Mesh(new THREE.BoxGeometry(7.2,1.1,.8),dark);track.position.set(0,.75,side*2.15);group.add(track);});
    const turret=new THREE.Mesh(new THREE.CylinderGeometry(1.5,1.85,1.2,10),new THREE.MeshStandardMaterial({color:accent,metalness:.5,roughness:.3}));turret.position.y=2.9;
    const barrel=new THREE.Mesh(new THREE.BoxGeometry(5.6,.45,.52),dark);barrel.position.set(3.2,3,0);group.add(hull,turret,barrel);
    if(tankType==='mecha_pea')[-1,0,1].forEach((v,i)=>{const ring=new THREE.Mesh(new THREE.TorusGeometry(1.05+i*.32,.16,8,28),new THREE.MeshBasicMaterial({color:[0x52d8ff,0xff5a2f,0x78ef62][i]}));ring.rotation.x=Math.PI/2;ring.position.y=3.6+i*.12;group.add(ring);});
    return group;
}

function disposeStoryPortrait(object){object.traverse(child=>{if(child.geometry)child.geometry.dispose();if(child.material)child.material.dispose();});}

function launchStoryBattle(){
    const level=storyModeState.currentLevel;if(!level)return;
    const screen=document.getElementById('storyModeScreen');if(screen)screen.classList.remove('active');
    storyModeState.active=true;storyModeState.currentLevelId=level.id;storyModeState.runtime=null;
    gameMode='story';selectedTank='zuoyan29';currentMap=level.map;
    const ammo=document.getElementById('ammoSlider'),mg=document.getElementById('mgSlider'),aa=document.getElementById('aaSlider'),difficulty=document.getElementById('difficulty'),dayNight=document.getElementById('dayNight');
    if(ammo)ammo.value=120;if(mg)mg.value=220;if(aa)aa.value=30;if(difficulty)difficulty.value='normal';if(dayNight)dayNight.value=level.id==='lostIllusion'?'night':'day';
    startGame();
}

function getCurrentStoryLevel(){return storyModeState.currentLevel||STORY_LEVELS.find(level=>level.id===storyModeState.currentLevelId)||null;}
function getStorySpawnCount(){const level=getCurrentStoryLevel();return level?level.enemyTypes.length:1;}
function getStoryEnemyTypes(){const level=getCurrentStoryLevel();return level?level.enemyTypes:['zuoyan1'];}

function initializeStoryBattle(){
    const level=getCurrentStoryLevel();if(gameMode!=='story'||!level||!player)return false;
    storyModeState.active=true;
    outposts=[];allies=[];neutralNPCs=[];aiTanks=enemies.slice();
    Object.values(bases).forEach(base=>{if(base){base.hidden=true;base.invulnerable=true;}});
    player.storyElementTank=true;player.masteryLevel=8;player.hp=player.maxHp=Math.max(1600,player.maxHp);player.shells=player.maxShells=120;player.mg=player.maxMG=220;player.aa=player.maxAA=30;player.invincible=2;
    const runtime={elapsed:0,success:false,failed:false,hazards:[],boss:null,nextAttack:2.4,nextMechanic:1.8,idle:0,lastPlayer:{x:player.x,y:player.y},survival:level.survival||0,arenaRadius:Math.min(CONFIG.mapWidth,CONFIG.mapHeight)*.43,phase:'ice',phaseTimer:10,craneCharge:0,nailCharge:-1,cloneShield:true};
    storyModeState.runtime=runtime;
    if(mapMechanicsState&&mapMechanicsState.weather){mapMechanicsState.weather={id:'storyDepth',icon:'◈',name:'地底异常',description:level.hint,vision:1,turn:1,traction:1,fog:1};if(typeof updateWeatherHud==='function')updateWeatherHud();}
    player.x=CONFIG.mapWidth*.18;player.y=CONFIG.mapHeight*.5;player.z=level.map==='factory'?0:0;player.factoryFloor=level.map==='factory'?0:null;player.prevPos={x:player.x,y:player.y};
    enemies.forEach((tank,index)=>{
        tank.x=CONFIG.mapWidth*(level.mechanic==='minecart'?.68:.72)+(index%2)*120;tank.y=CONFIG.mapHeight*.5+(index-Math.floor(enemies.length/2))*150;tank.z=level.map==='factory'?0:0;tank.factoryFloor=level.map==='factory'?0:null;tank.prevPos={x:tank.x,y:tank.y};tank.invincible=1;
    });
    if(level.boss&&enemies.length){runtime.boss=enemies[0];configureStoryBoss(runtime.boss,level);}
    configureStoryLevelEnvironment(level,runtime);
    gameTime=level.time;lastTime=performance.now();
    const info=document.getElementById('specialModeInfo');if(info){info.textContent=`📖 ${level.name} · ${level.hint}`;info.style.display='block';}
    if(typeof addBattleAnnouncement==='function')addBattleAnnouncement('blue',`📖 ${level.name}：${level.hint}`);
    return true;
}

function configureStoryBoss(boss,level){
    boss.storyBoss=true;boss.name=level.final?'机甲神豌':(boss.name||(TANKS[boss.tankType]&&TANKS[boss.tankType].name)||'封印机械兽');boss.visualScale=level.final?2.05:1.55;boss.hitRadius=level.final?105:76;boss.hp=boss.maxHp=level.bossHp||5000;boss.armor=Math.max(1,boss.armor);boss.aiSkillLevel=.88;boss.aiDamageMult=.72;boss.apsCharges=0;
    boss.storyWeakParts=[
        {id:'core-left',label:'左动力核',x:34,y:-24,radius:25,hp:level.final?900:420,maxHp:level.final?900:420,color:'#55ddff'},
        {id:'core-right',label:'右动力核',x:34,y:24,radius:25,hp:level.final?900:420,maxHp:level.final?900:420,color:'#ff7044'},
        {id:'core-top',label:'炮塔封印',x:-12,y:0,radius:27,hp:level.final?1100:520,maxHp:level.final?1100:520,color:'#d86dff'}
    ];
    boss.storyVulnerable=false;
}

function configureStoryLevelEnvironment(level,runtime){
    if(level.mechanic==='cranePuzzle'){
        runtime.craneZone={x:CONFIG.mapWidth*.64,y:CONFIG.mapHeight*.58,radius:190};runtime.controlZone={x:CONFIG.mapWidth*.30,y:CONFIG.mapHeight*.35,radius:115};
    }else if(level.mechanic==='artilleryPuzzle'){
        runtime.turrets=[-.24,-.08,.08,.24].map((offset,index)=>({x:CONFIG.mapWidth*.52,y:CONFIG.mapHeight*(.5+offset),cooldown:1+index*.35,hp:600}));
    }else if(level.mechanic==='nailCover'){
        const coverRects=[[90,210,260,170],[90,CONFIG.mapHeight-380,260,170],[CONFIG.mapWidth-350,210,260,170],[CONFIG.mapWidth-350,CONFIG.mapHeight-380,260,170]];
        coverRects.forEach((rect,index)=>obstacles.push({x:rect[0],y:rect[1],w:rect[2],h:rect[3],type:'storyNailCover',indestructible:true,maxTerrainHp:Infinity,terrainHp:Infinity,terrainId:`story-cover-${index}`}));
        if(typeof markTerrainStructureChanged==='function')markTerrainStructureChanged();
    }else if(level.mechanic==='kimiClones'){
        enemies.slice(1).forEach((clone,index)=>{clone.storyClone=true;clone.name=`Kimi幻影 ${index+1}`;clone.visualScale=1.1;clone.hp=clone.maxHp=900;clone.apsCharges=0;});
        if(runtime.boss){runtime.boss.storyCloneShield=true;runtime.boss.storyVulnerable=false;}
    }else if(level.mechanic==='finalFusion'){
        runtime.iceRoom={x:CONFIG.mapWidth*.26,y:CONFIG.mapHeight*.70,radius:250};runtime.fireRoom={x:CONFIG.mapWidth*.74,y:CONFIG.mapHeight*.30,radius:250};
        if(runtime.boss){runtime.boss.storyPhase='ice';runtime.boss.color='#4cbfe8';}
    }
}

function getStoryWeakPartWorld(boss,part){
    const angle=boss.angle||0,cos=Math.cos(angle),sin=Math.sin(angle);
    return {x:boss.x+part.x*cos-part.y*sin,y:boss.y+part.x*sin+part.y*cos};
}

function modifyStoryBossDamage(target,projectile,damage){
    if(gameMode!=='story'||!target||!target.storyBoss||!projectile)return damage;
    const level=getCurrentStoryLevel(),runtime=storyModeState.runtime;
    if(level&&level.mechanic==='cranePuzzle'&&!projectile.storyTrapDamage)return 0;
    if(level&&level.mechanic==='artilleryPuzzle'&&projectile.type!=='aa'){
        if(projectile.owner===player&&typeof showMessage==='function')showMessage('平射被炮塔阵地挡住 · 使用高射炮抛物线','#ffbd66');return 0;
    }
    if(level&&level.mechanic==='kimiClones'&&target.storyCloneShield){
        if(projectile.owner===player&&typeof showMessage==='function')showMessage('虚空真身无效 · 先让冰霜感染克隆体','#c49cff');return 0;
    }
    const living=(target.storyWeakParts||[]).filter(part=>part.hp>0);
    if(living.length){
        let hit=null,best=Infinity;
        living.forEach(part=>{const point=getStoryWeakPartWorld(target,part),distance=Math.hypot(projectile.x-point.x,projectile.y-point.y);if(distance<best){best=distance;hit=part;}});
        if(hit&&best<=hit.radius+22){
            const partDamage=Math.max(90,damage);hit.hp=Math.max(0,hit.hp-partDamage);
            createParticles(projectile.x,projectile.y,18,hit.color,1.6);
            if(typeof showDamageNumber==='function')showDamageNumber(projectile.x,projectile.y-25,hit.hp<=0?'部位破坏！':Math.round(partDamage));
            if(hit.hp<=0&&typeof showNotification==='function')showNotification(`✦ ${target.name||'Boss'}：${hit.label}已被破坏`,hit.color);
            if(target.storyWeakParts.every(part=>part.hp<=0)){target.storyVulnerable=true;target.storyCloneShield=false;if(typeof showNotification==='function')showNotification('⚠ 全部发光部位破坏 · Boss本体暴露！','#fff06a');}
        }else if(projectile.owner===player&&typeof showMessage==='function')showMessage('装甲无效！瞄准发光部位','#ffcf5a');
        return 0;
    }
    return target.storyVulnerable?damage:0;
}

function handleStoryCloneProjectileHit(target,projectile){
    const level=getCurrentStoryLevel(),runtime=storyModeState.runtime;if(gameMode!=='story'||!level||level.mechanic!=='kimiClones'||!target.storyClone||!runtime||!runtime.boss)return;
    if(projectile.owner!==player||projectile.type!=='shell')return;
    runtime.boss.storyCloneShield=false;runtime.boss.storyVulnerable=true;
    runtime.nextMechanic=8;
    applyTankElementalStatus(runtime.boss,'ice',2.5,{source:player});
    runtime.boss.hp=Math.max(1,runtime.boss.hp-320);
    createParticles(runtime.boss.x,runtime.boss.y,32,'#8defff',2.2);
    if(typeof showNotification==='function')showNotification('❄ 冰霜从克隆体传染至真身 · 虚空护罩解除！','#7eeaff');
}

function updateStoryMode(dt){
    if(gameMode!=='story'||!storyModeState.active||!storyModeState.runtime||gameState!=='playing')return;
    const level=getCurrentStoryLevel(),runtime=storyModeState.runtime;if(!level||runtime.success||runtime.failed)return;
    runtime.elapsed+=dt;runtime.nextAttack-=dt;runtime.nextMechanic-=dt;
    updateStoryProjectileCounters();
    updateStoryTrackingProjectiles(dt);
    if(level.boss&&runtime.boss&&!runtime.boss.dead&&runtime.nextAttack<=0){spawnStoryTrackingProjectile(runtime.boss,level.final?2:1);runtime.nextAttack=level.final?2.7:4.2;}
    ({iceSpikes:updateStoryIceSpikes,fireWalker:updateStoryFireWalker,minecart:updateStoryMinecart,teleportEcho:updateStoryTeleportEcho,
      thunderRun:updateStoryThunderRun,cranePuzzle:updateStoryCranePuzzle,shrinkingArena:updateStoryShrinkingArena,
      artilleryPuzzle:updateStoryArtilleryPuzzle,nailCover:updateStoryNailCover,kimiClones:updateStoryKimiClones,finalFusion:updateStoryFinalFusion}[level.mechanic]||(()=>{}))(dt,level,runtime);
    if(player.dead||player.hp<=0){failStoryLevel('元素坦克被击毁');return;}
    if(level.survival&&runtime.elapsed>=level.survival){completeStoryLevel();return;}
    if(level.boss&&runtime.boss&&(runtime.boss.dead||runtime.boss.hp<=0)){completeStoryLevel();return;}
    if(!level.boss&&!level.survival&&enemies.every(tank=>tank.dead||tank.hp<=0))completeStoryLevel();
}

function spawnStoryTrackingProjectile(boss,count=1){
    for(let i=0;i<count;i++){
        const angle=Math.atan2(player.y-boss.y,player.x-boss.x)+(i-(count-1)/2)*.18;
        bullets.push({x:boss.x+Math.cos(angle)*70,y:boss.y+Math.sin(angle)*70,z:(boss.z||0)+24,vx:0,vy:0,vz:0,damage:260,team:'red',type:'storyOrb',owner:boss,life:8,maxLife:8,age:0,storyTracking:true,trackingSpeed:250,hitTanks:new Set(),maxTargetHits:1,ignoresObstacles:false,armorIgnorePercent:.35});
    }
    createParticles(boss.x,boss.y,14,'#d06dff',1.3);
}

function updateStoryTrackingProjectiles(dt){
    bullets.filter(b=>b.storyTracking).forEach(orb=>{
        const angle=Math.atan2(player.y-orb.y,player.x-orb.x),turn=Math.min(1,dt*2.4),current=Math.atan2(orb.storyVY||Math.sin(angle),orb.storyVX||Math.cos(angle));
        const diff=normalizeAngle(angle-current),next=current+Math.max(-1.8*dt,Math.min(1.8*dt,diff));
        orb.storyVX=(orb.storyVX||Math.cos(next))+(Math.cos(next)-(orb.storyVX||Math.cos(next)))*turn;orb.storyVY=(orb.storyVY||Math.sin(next))+(Math.sin(next)-(orb.storyVY||Math.sin(next)))*turn;
        const len=Math.max(.001,Math.hypot(orb.storyVX,orb.storyVY));orb.x+=orb.storyVX/len*orb.trackingSpeed*dt;orb.y+=orb.storyVY/len*orb.trackingSpeed*dt;orb.z=(player.z||0)+22;
    });
}

function updateStoryProjectileCounters(){
    const friendly=bullets.filter(b=>b.owner===player&&b.type==='shell'),hostile=bullets.filter(b=>b.storyTracking);
    for(const shell of friendly){
        const orb=hostile.find(item=>bullets.includes(item)&&Math.hypot(item.x-shell.x,item.y-shell.y)<62);if(!orb)continue;
        const sx=(orb.x+shell.x)/2,sy=(orb.y+shell.y)/2;bullets.splice(bullets.indexOf(orb),1);bullets.splice(bullets.indexOf(shell),1);
        createParticles(sx,sy,34,'#e7b7ff',2.4);if(typeof playWorldSound==='function')playWorldSound('hit',sx,sy,1.1);
        const boss=storyModeState.runtime&&storyModeState.runtime.boss;if(boss&&!boss.dead&&Math.hypot(boss.x-sx,boss.y-sy)<300){
            const part=(boss.storyWeakParts||[]).find(item=>item.hp>0);if(part){part.hp=Math.max(0,part.hp-180);if(boss.storyWeakParts.every(item=>item.hp<=0)){boss.storyVulnerable=true;boss.storyCloneShield=false;}}
            else boss.hp-=260;
        }
        if(typeof showMessage==='function')showMessage('✦ 精准反击：追踪弹被提前引爆！','#e3a7ff');
    }
}

function updateStoryIceSpikes(dt,level,runtime){
    if(runtime.nextMechanic<=0){runtime.hazards.push({type:'iceSpike',x:350+Math.random()*(CONFIG.mapWidth-700),y:300+Math.random()*(CONFIG.mapHeight-600),radius:88,timer:1,life:1.6,phase:'warning'});runtime.nextMechanic=2.3;}
    runtime.hazards.forEach(h=>{h.timer-=dt;h.life-=dt;if(h.phase==='warning'&&h.timer<=0){h.phase='impact';if(Math.hypot(player.x-h.x,player.y-h.y)<h.radius)applyDirectDamage(player,900,null,'冰锥坠落');createParticles(h.x,h.y,28,'#9eefff',2);}});runtime.hazards=runtime.hazards.filter(h=>h.life>0);
}

function updateStoryFireWalker(dt,level,runtime){
    const boss=runtime.boss;if(!boss)return;
    if(runtime.nextMechanic<=0){runtime.hazards.push({type:'storyFire',x:boss.x,y:boss.y,radius:165,timer:5,life:5,phase:'burn'});getNearbyTanks(boss.x,boss.y,175).forEach(t=>{if(t!==boss)applyDirectDamage(t,180,boss,'过载自爆');});createParticles(boss.x,boss.y,38,'#ff531f',2.7);runtime.nextMechanic=4.3;}
    runtime.hazards.forEach(h=>{h.life-=dt;if(h.type==='storyFire'&&h.phase==='burn'&&Math.hypot(player.x-h.x,player.y-h.y)<h.radius)applyDirectDamage(player,45*dt,boss,'持续火海');});
    bullets.filter(b=>b.owner===player&&b.type==='shell').forEach(shell=>runtime.hazards.forEach(h=>{if(h.type==='storyFire'&&h.phase==='burn'&&Math.hypot(shell.x-h.x,shell.y-h.y)<h.radius){h.phase='frozen';h.life=Math.max(h.life,5);createParticles(h.x,h.y,24,'#80eaff',2);}}));
    runtime.hazards=runtime.hazards.filter(h=>h.life>0);
}

function updateStoryMinecart(dt,level,runtime){
    const speed=170;runtime.railProgress=(runtime.railProgress||0)+speed*dt;const x=Math.min(CONFIG.mapWidth*.82,CONFIG.mapWidth*.12+runtime.railProgress),wave=Math.sin(runtime.railProgress/430)*CONFIG.mapHeight*.18;
    player.canMove=false;player.x=x;player.y=CONFIG.mapHeight*.5+wave;player.angle=Math.atan2(Math.cos(runtime.railProgress/430)*CONFIG.mapHeight*.18/430,1);
    if(runtime.boss&&!runtime.boss.dead){runtime.boss.canMove=false;runtime.boss.x=Math.min(CONFIG.mapWidth*.91,x+650);runtime.boss.y=CONFIG.mapHeight*.5+Math.sin((runtime.railProgress+650)/430)*CONFIG.mapHeight*.18;}
}

function updateStoryTeleportEcho(dt,level,runtime){
    const boss=runtime.boss;if(!boss)return;
    if(!runtime.afterimage&&runtime.nextMechanic<=0){runtime.afterimage={type:'afterimage',x:350+Math.random()*(CONFIG.mapWidth-700),y:350+Math.random()*(CONFIG.mapHeight-700),radius:95,timer:1.6,life:1.6};runtime.hazards.push(runtime.afterimage);runtime.nextMechanic=5;}
    if(runtime.afterimage){runtime.afterimage.timer-=dt;runtime.afterimage.life-=dt;if(runtime.afterimage.timer<=0){boss.x=runtime.afterimage.x;boss.y=runtime.afterimage.y;createParticles(boss.x,boss.y,26,'#67cfff',1.8);runtime.afterimage=null;}}
    runtime.hazards=runtime.hazards.filter(h=>h.life>0);
}

function updateStoryThunderRun(dt,level,runtime){
    const moved=Math.hypot(player.x-runtime.lastPlayer.x,player.y-runtime.lastPlayer.y);runtime.idle=moved<2?runtime.idle+dt:0;runtime.lastPlayer.x=player.x;runtime.lastPlayer.y=player.y;
    if(runtime.idle>2.3&&!runtime.lightningWarning){runtime.lightningWarning={type:'lightning',x:player.x,y:player.y,radius:90,timer:.7,life:.9};runtime.hazards.push(runtime.lightningWarning);}
    if(runtime.lightningWarning){runtime.lightningWarning.timer-=dt;runtime.lightningWarning.life-=dt;if(runtime.lightningWarning.timer<=0){if(Math.hypot(player.x-runtime.lightningWarning.x,player.y-runtime.lightningWarning.y)<90)applyDirectDamage(player,340,null,'雷击');createParticles(runtime.lightningWarning.x,runtime.lightningWarning.y,30,'#e7f26d',2.3);runtime.lightningWarning=null;runtime.idle=0;}}
    runtime.hazards=runtime.hazards.filter(h=>h.life>0);
}

function updateStoryCranePuzzle(dt,level,runtime){
    const boss=runtime.boss;if(!boss)return;
    const bossReady=Math.hypot(boss.x-runtime.craneZone.x,boss.y-runtime.craneZone.y)<runtime.craneZone.radius,playerReady=Math.hypot(player.x-runtime.controlZone.x,player.y-runtime.controlZone.y)<runtime.controlZone.radius;
    runtime.craneCharge=bossReady&&playerReady?runtime.craneCharge+dt:Math.max(0,runtime.craneCharge-dt*.6);
    if(runtime.craneCharge>=1.2){runtime.craneCharge=0;const part=(boss.storyWeakParts||[]).find(p=>p.hp>0);if(part)part.hp=0;else{boss.storyVulnerable=true;boss.hp-=900;}createParticles(boss.x,boss.y,48,'#ffb83f',3);if(typeof applyFactoryFlatten==='function')applyFactoryFlatten(boss,220,'起重机油桶重砸');if(typeof showNotification==='function')showNotification('🏗 起重机命中头顶弱点！','#ffca55');}
}

function updateStoryShrinkingArena(dt,level,runtime){
    runtime.arenaRadius=Math.max(Math.min(CONFIG.mapWidth,CONFIG.mapHeight)*.19,runtime.arenaRadius-dt*13);const cx=CONFIG.mapWidth/2,cy=CONFIG.mapHeight/2;
    if(Math.hypot(player.x-cx,player.y-cy)>runtime.arenaRadius)applyDirectDamage(player,90*dt,runtime.boss,'熔炉坍塌');
    if(runtime.nextMechanic<=0){createParticles(cx,cy,30,'#ff6a25',2);runtime.nextMechanic=4;}
}

function updateStoryArtilleryPuzzle(dt,level,runtime){
    (runtime.turrets||[]).forEach(turret=>{turret.cooldown-=dt;if(turret.cooldown<=0){const angle=Math.atan2(player.y-turret.y,player.x-turret.x);bullets.push({x:turret.x,y:turret.y,z:22,vx:Math.cos(angle)*13,vy:Math.sin(angle)*13,vz:0,damage:75,team:'red',type:'mg',owner:runtime.boss,life:2,maxLife:2,age:0,hitTanks:new Set(),maxTargetHits:1});turret.cooldown=2.2;}});
}

function updateStoryNailCover(dt,level,runtime){
    const boss=runtime.boss;if(!boss)return;
    if(runtime.nailCharge<0&&runtime.nextMechanic<=0){runtime.nailCharge=3;runtime.nextMechanic=7;if(typeof showNotification==='function')showNotification('☄ 天罚之钉锁定 · 3秒内躲到边缘掩体后！','#ff3f45');}
    if(runtime.nailCharge>=0){runtime.nailCharge-=dt;if(runtime.nailCharge<=0){const safe=!lineOfSight(boss.x,boss.y,player.x,player.y,player.factoryFloor);if(!safe)applyDirectDamage(player,1200,boss,'天罚之钉');else if(typeof showMessage==='function')showMessage('掩体完全遮断天罚射线！','#71f0bd');createParticles(player.x,player.y,42,safe?'#6df0bd':'#ff2727',3);runtime.nailCharge=-1;}}
}

function updateStoryKimiClones(dt,level,runtime){
    if(runtime.boss&&runtime.boss.storyVulnerable&&runtime.nextMechanic<=0){runtime.boss.storyCloneShield=true;runtime.boss.storyVulnerable=false;runtime.nextMechanic=8;if(typeof showNotification==='function')showNotification('◈ Kimi重新编织虚空护罩 · 再次攻击克隆体','#c081ff');}
}

function updateStoryFinalFusion(dt,level,runtime){
    const boss=runtime.boss;if(!boss)return;
    runtime.phaseTimer-=dt;
    if(runtime.phase==='fire'){runtime.hazards.push({type:'ember',x:boss.x+(Math.random()-.5)*260,y:boss.y+(Math.random()-.5)*260,radius:42,timer:1.2,life:1.2});if(Math.hypot(player.x-boss.x,player.y-boss.y)<210)applyDirectDamage(player,20*dt,boss,'火焰形态灼地');}
    if(runtime.phaseTimer<=0){const counterRoom=runtime.phase==='ice'?runtime.fireRoom:runtime.iceRoom,countered=Math.hypot(boss.x-counterRoom.x,boss.y-counterRoom.y)<counterRoom.radius;
        if(countered){const part=(boss.storyWeakParts||[]).find(p=>p.hp>0);if(part)part.hp=0;else{boss.storyVulnerable=true;boss.hp-=1100;}createParticles(boss.x,boss.y,55,'#fff06a',3.2);if(typeof showNotification==='function')showNotification('✦ 属性克制成功 · 三相核心过载！','#fff06a');}
        runtime.phase=runtime.phase==='ice'?'fire':'ice';runtime.phaseTimer=10;boss.storyPhase=runtime.phase;boss.color=runtime.phase==='ice'?'#4cbfe8':'#e95732';if(runtime.phase==='ice')spawnStoryTrackingProjectile(boss,3);
    }
    runtime.hazards.forEach(h=>h.life-=dt);runtime.hazards=runtime.hazards.filter(h=>h.life>0);
}

function checkStoryWinCondition(){
    if(gameMode!=='story'||!storyModeState.active)return false;
    if(player&&player.dead){failStoryLevel('元素坦克被击毁');return true;}
    return true;
}

function handleStoryTimeExpired(){if(gameMode!=='story')return false;failStoryLevel('封印时限耗尽');return true;}

function completeStoryLevel(){
    const runtime=storyModeState.runtime,level=getCurrentStoryLevel();if(!runtime||runtime.success||!level)return;runtime.success=true;gameState='storyDialogue';
    const progress=loadStoryProgress();if(!progress.completed.includes(level.id))progress.completed.push(level.id);
    if(level.final){progress.finished=true;unlockMechaPea();}progress.introSeen=true;saveStoryProgress(progress);
    const lines=level.outro.map(([speaker,side,text])=>({speaker,side,tank:getStorySpeakerTank(speaker),text}));
    if(level.final)lines.push({speaker:'系统',side:'left',tank:'mecha_pea',text:'隐藏坦克“机甲神豌”已解锁：三相炮将在冰、火、毒之间自动循环。'});
    showStoryDialogue(lines,returnToStoryMap,level.final?'领取机甲神豌':'返回节点地图');
}

function failStoryLevel(reason){
    const runtime=storyModeState.runtime,level=getCurrentStoryLevel();if(!runtime||runtime.failed)return;runtime.failed=true;gameState='storyDialogue';
    showStoryDialogue([{speaker:'阿识',side:'left',tank:'helper',text:`任务失败：${reason}。封印仍在等待，我们可以重新规划战术。`}],showStoryFailureChoices,'查看选项');
}

function showStoryFailureChoices(){
    const panel=document.getElementById('storyFailurePanel');if(!panel)return;panel.classList.add('active');panel.innerHTML=`<h2>任务失败</h2><p>${getCurrentStoryLevel()?.hint||''}</p><button class="story-primary" onclick="retryStoryLevel()">重试本关</button><button onclick="returnToStoryMap()">返回节点地图</button>`;
}

function retryStoryLevel(){const panel=document.getElementById('storyFailurePanel');if(panel)panel.classList.remove('active');const level=storyModeState.currentLevel;storyModeState.active=false;resetGame();storyModeState.currentLevel=level;storyModeState.currentLevelId=level.id;launchStoryBattle();}

function returnToStoryMap(){const panel=document.getElementById('storyFailurePanel');if(panel)panel.classList.remove('active');storyModeState.active=false;storyModeState.runtime=null;resetGame();openStoryMode();}

function unlockMechaPea(){
    if(typeof playerStats==='undefined')return;if(!playerStats.unlockedTanks)playerStats.unlockedTanks=[];
    if(!playerStats.unlockedTanks.includes('mecha_pea'))playerStats.unlockedTanks.push('mecha_pea');
    if(typeof saveStats==='function')saveStats();if(typeof renderTankList==='function')renderTankList();
}

function applyMechaPeaTriPhase(tank,projectile){
    if(!tank||tank.tankType!=='mecha_pea'||projectile.type!=='shell')return projectile;
    const phases=['ice','fire','toxin'],phase=phases[tank.triPhaseIndex||0];tank.triPhaseIndex=((tank.triPhaseIndex||0)+1)%phases.length;projectile.triPhase=phase;
    if(phase==='ice'){projectile.evolutionStyle='tri-ice-prism';projectile.evolutionTrail='#69e9ff';projectile.storyForcedIce=true;}
    else if(phase==='fire'){projectile.evolutionStyle='tri-fire-orb';projectile.evolutionTrail='#ff6338';projectile.fireData={duration:4,damage:45,interval:1,chance:1,splashRadius:90,source:tank};}
    else{projectile.evolutionStyle='tri-toxic-orb';projectile.evolutionTrail='#8cff62';projectile.toxinData={duration:5,damage:38,interval:1,slow:.18,chance:1,splashRadius:100,source:tank};}
    return projectile;
}

function showStoryToast(text){if(typeof showNotification==='function')showNotification(text,'#5b6d89');}

if(typeof window!=='undefined')window.addEventListener('resize',()=>{if(gameState==='storyMap')drawStoryNodeMap();});
