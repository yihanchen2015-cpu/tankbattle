// ==================== 故事模式：五章元素封印 ====================
const STORY_SAVE_KEY='tankBattleStoryProgressV2';
const STORY_BACKGROUND='左研学院位于地底深处。四大元素封印崩解后，8级左研29与不会战斗的向导员“阿识”驾驶元素坦克深入地下，追寻冰、火、雷与虚空背后的最终封印。';

const STORY_LEVELS=Object.freeze([
 {id:'frostTrial',code:'1-1',chapter:1,chapterName:'冰霜领域',name:'霜痕的考验',icon:'❄',kind:'城门歼灭战',map:'snow',scene:'冰封广场 · 霜门要塞',mechanic:'frostTrial',enemyTypes:['xingchen27a','xingchen27a'],time:105,hint:'由后方向正前方推进，击败城门两侧近卫并摧毁门楼自动弩。若不开火直接穿过中央门洞，还会触发隐藏对话。',reward:'无',intro:[['阿识','left','正前方就是霜门要塞。两名近卫守在门洞左右，城墙上架着一把自动俯射的冰弩。'],['霜痕','right','想进入冰霜领域，就从后方广场正面推进，在我的城门前证明你的判断与火力。'],['左研29','left','城门中央是空的，但自动弩会从门楼向下压制。先看清射击节奏，再决定强攻还是冲门。']],outro:[['霜痕','right','两名近卫与自动弩全部沉默。你不是靠蛮冲，而是找到了要塞防线的破口。'],['阿识','left','霜门已经打开，冰晶回廊的低温信号正在门后快速聚集。']]},
 {id:'crystalCorridor',code:'1-2',chapter:1,chapterName:'冰霜领域',name:'冰晶回廊',icon:'◇',kind:'杂兵战',map:'snow',scene:'封闭冰洞 · 冰柱密布',mechanic:'crystalCorridor',enemyTypes:Array(12).fill('zuoyan30'),time:110,hint:'冰面会降低转向与速度；洞顶冰锥会周期坠落，绕到冰晶爬行兽背后可造成双倍伤害。',reward:'无',intro:[['阿识','left','冰洞的顶部已经完全封死，洞顶悬着成排冰锥，下面还有十二只爬行兽！'],['左研29','left','冰面上不能急转。观察冰锥的蓝色落点，再利用冰柱绕到敌人背后。']],outro:[['左研29','left','窄路不等于只能正面交火，洞顶的冰锥也可以变成逼迫敌人走位的节拍器。']]},
 {id:'frostResolve',code:'1-3',chapter:1,chapterName:'冰霜领域',name:'霜痕的决心',icon:'♜',kind:'Boss战',map:'snow',scene:'冰霜王座 · 冰晶穹顶',mechanic:'frostBoss',enemyTypes:['xingchen27b'],boss:true,bossName:'冰将军·霜痕',bossHp:7200,time:140,hint:'射击反馈冰晶破解护甲；踩入发光冰面会将你的攻击反噬回来。',reward:'解锁第二章',intro:[['霜痕','right','封印已经开始吞噬守护者。打碎我的冰晶！'],['阿识','left','别在发光冰面上开火，能量会反射！']],outro:[['霜痕','right','这份决心足以越过冰霜。火焰回廊已经打开。']]},
 {id:'frostGift',code:'★',chapter:1,chapterName:'冰霜领域',name:'霜痕的馈赠',icon:'★',kind:'奖励关',map:'snow',scene:'冰晶训练场 · 圆形竞技场',mechanic:'frostGift',enemyTypes:[],rewardLevel:true,time:60,hint:'60秒内用15发主炮命中12枚移动冰晶靶。',reward:'冰抗+10% · 涂装“霜痕之印”',intro:[['霜痕','right','十五发炮弹，十二枚冰晶。耐心比射速更重要。']],outro:[['系统','left','永久奖励：冰霜伤害降低10%，解锁涂装“霜痕之印”。']]},

 {id:'fireInvitation',code:'2-1',chapter:2,chapterName:'火焰回廊',name:'爆炎的邀请',icon:'⑂',kind:'纯剧情',map:'volcano',scene:'熔岩入口桥 · 三岔路口',mechanic:'routeChoice',enemyTypes:[],time:75,hint:'从冰晶桥、灰烬坡或熔岩管道中选择一条路线。',reward:'无',intro:[['爆炎','right','我留下三条路。选择会暴露你如何面对火焰。'],['阿识','left','路线只影响这段故事，选你最想走的。']],outro:[['阿识','left','路线已记录。前方的浮石大厅正在下沉。']]},
 {id:'moltenHeart',code:'2-2',chapter:2,chapterName:'火焰回廊',name:'熔火之心',icon:'♨',kind:'生存挑战',map:'volcano',scene:'浮石大厅 · 流动熔岩',mechanic:'moltenSurvival',enemyTypes:Array(4).fill('duoduo_ifv'),survival:90,time:95,hint:'熔岩傀儡会无限补充；浮石周期下沉，在可用石台之间转移并存活90秒。',reward:'无',intro:[['阿识','left','浮石每隔几秒就会下沉，而傀儡没有尽头！'],['左研29','left','不求全灭，只保证下一块落脚点。']],outro:[['左研29','left','九十秒。熔火之心没能留下我们。']]},
 {id:'blazeEnd',code:'2-3',chapter:2,chapterName:'火焰回廊',name:'爆炎的终结',icon:'🔥',kind:'Boss战',map:'volcano',scene:'火焰王座 · 结晶覆盖',mechanic:'blazeBoss',enemyTypes:['duoduo'],boss:true,bossName:'火将军·爆炎',bossHp:9000,time:155,hint:'Boss会吸收熔岩恢复。破坏三枚结晶可打开6秒过载窗口。',reward:'解锁第三章 · 熔火核心',intro:[['爆炎','right','腐化让我与熔岩连成了一体。'],['阿识','left','先打结晶！过载窗口很短！']],outro:[['爆炎','right','拿走熔火核心。别让工业核心复制这份腐化。']]},
 {id:'moltenGift',code:'★',chapter:2,chapterName:'火焰回廊',name:'熔火之心（奖励）',icon:'★',kind:'奖励关',map:'volcano',scene:'熔岩试炼场 · 圆形石台',mechanic:'moltenGift',enemyTypes:[],rewardLevel:true,survival:90,time:95,hint:'在9个熔岩口的间歇喷发中存活90秒。',reward:'火抗+10% · 涂装“熔火行者”',intro:[['爆炎','right','喷发有节奏。别看火柱，看喷发前的暗红光。']],outro:[['系统','left','永久奖励：火焰伤害降低10%，解锁涂装“熔火行者”。']]},

 {id:'automationLine',code:'3-1',chapter:3,chapterName:'工业核心',name:'自动化警戒线',icon:'⌖',kind:'潜行/战斗',map:'factory',scene:'工厂外围 · 传送带废墟',mechanic:'automationLine',enemyTypes:[...Array(6).fill('duoduo_eng'),...Array(4).fill('xingchen27a')],time:150,hint:'绕开敌人前方视野锥，从背后击中弱点。全清后获得钥匙卡。',reward:'钥匙卡（全清）',intro:[['阿识','left','六座炮塔和四台巡逻机器人共享视野。'],['左研29','left','视野锥之外接近，背刺弱点会省下很多弹药。']],outro:[['系统','left','钥匙卡已获取。中央车间访问权限开启。']]},
 {id:'conveyorLine',code:'3-2',chapter:3,chapterName:'工业核心',name:'传送带生死线',icon:'⇄',kind:'平台战斗',map:'factory',scene:'传送带车间 · 机械臂两侧',mechanic:'conveyorLine',enemyTypes:Array(8).fill('duoduo_ifv'),time:140,hint:'传送带持续推动车体；地面黄色预警区会在1秒后遭到机械臂砸击。',reward:'无',intro:[['阿识','left','机械臂的落点被流水线提前标出了！'],['左研29','left','把传送带的位移也算进躲避路线。']],outro:[['阿识','left','装配车间就在前面。有东西正在自我组装。']]},
 {id:'assembler',code:'3-3',chapter:3,chapterName:'工业核心',name:'工业核心·组装者',icon:'⚙',kind:'Boss战',map:'factory',scene:'中央装配车间 · 流水线',mechanic:'assemblerBoss',enemyTypes:['duoduo_eng'],boss:true,bossName:'组装者',bossHp:10500,time:170,hint:'零件会沿流水线飞向Boss。用主炮拦截3枚零件，打断组装后输出。',reward:'解锁第四章 · 雷将核心',intro:[['组装者','right','缺损是可修复的。只要流水线仍在，我就不会停止。'],['阿识','left','在零件进入它身体前开炮拦截！']],outro:[['组装者','right','组装…被中断。雷将核心已释放。']]},
 {id:'archiveGift',code:'★',chapter:3,chapterName:'工业核心',name:'废弃档案室',icon:'★',kind:'奖励关',map:'factory',scene:'档案室 · 记忆读取台',mechanic:'archiveGift',enemyTypes:[],rewardLevel:true,time:45,hint:'45秒内切换并击中20个全息标记；金色标记会追加时间。',reward:'装填+15% · 涂装“多多号工业”',intro:[['阿识','left','金色档案的优先级最高，命中它们能延长读取时间。']],outro:[['系统','left','永久奖励：装填速度+15%，解锁涂装“多多号工业”。']]},

 {id:'thunderEcho',code:'4-1',chapter:4,chapterName:'虚空回廊',name:'霆光的残响',icon:'⚡',kind:'纯剧情',map:'city',scene:'雷电回廊 · 能量网格',mechanic:'counterCode',enemyTypes:[],time:55,hint:'穿过三道能量网格，与雷将核心同步并获得反制代码。',reward:'反制模式',intro:[['霆光','right','虚空会复制你的武器。带上这段反制代码。'],['阿识','left','每穿过一道网格，代码同步度就会上升。']],outro:[['系统','left','反制模式已安装：追踪碎片可被主炮提前引爆。']]},
 {id:'mirrorCorridor',code:'4-2',chapter:4,chapterName:'虚空回廊',name:'镜像回廊',icon:'◈',kind:'特殊战斗',map:'city',scene:'镜面大厅 · 无限反射',mechanic:'mirrorWaves',enemyTypes:Array(3).fill('kimi_tank'),time:155,hint:'能量复制体分3轮出现，每轮3台；它们会同步你当前的武器属性。',reward:'无',intro:[['Kimi','right','镜像不只复制外形。你切换武器，它们也会切换。'],['左研29','left','那就用节奏差拆散三轮同步。']],outro:[['Kimi','right','镜像已经崩塌。看守者就在裂隙中。']]},
 {id:'voidWarden',code:'4-3',chapter:4,chapterName:'虚空回廊',name:'虚空看守者',icon:'◆',kind:'Boss战',map:'island',scene:'虚空裂隙 · 漂浮平台',mechanic:'voidBoss',enemyTypes:['kimi_tank'],boss:true,bossName:'虚空看守者',bossHp:11500,time:175,hint:'本体会把伤害转移给环绕碎片。先破坏碎片，并用反制代码拦截追踪弹。',reward:'解锁第五章',intro:[['虚空看守者','right','你造成的每份伤害，都会被分配到无数个我。'],['阿识','left','反制代码能打飞它的追踪碎片！']],outro:[['虚空看守者','right','最终封印之后，是学院封存的三相核心。']]},
 {id:'thunderGift',code:'★',chapter:4,chapterName:'虚空回廊',name:'霆光的残响（深度）',icon:'★',kind:'奖励关',map:'city',scene:'虚拟训练空间 · 网格无限',mechanic:'thunderGift',enemyTypes:[],rewardLevel:true,time:60,hint:'60秒内命中15枚折线运动的训练球；连击会加快后续目标。',reward:'装填+15% · 徽章“霆光的认可”',intro:[['霆光','right','预判折点，不要追着训练球的影子开炮。']],outro:[['系统','left','永久奖励：装填速度再+15%，获得徽章“霆光的认可”。']]},

 {id:'sealSequence',code:'5-1',chapter:5,chapterName:'最终封印',name:'封印序列',icon:'三',kind:'波次防守',map:'factory',scene:'三道封印门 · 元素符文',mechanic:'sealWaves',enemyTypes:Array(4).fill('xingchen27a'),time:185,hint:'3波共12名元素守卫。主炮=冰、机枪=火、高射炮=雷；使用克制属性。',reward:'无',intro:[['阿识','left','三道封印门各有一波守卫。每波之间会短暂修整。'],['左研29','left','主炮冰、机枪火、高射雷。看标记切换。']],outro:[['阿识','left','三道封印门全部开启。三相核心正在苏醒。']]},
 {id:'triCore',code:'5-2',chapter:5,chapterName:'最终封印',name:'三相核心·觉醒',icon:'✦',kind:'最终Boss战',map:'factory',scene:'核心控制室 · 三色能量环',mechanic:'triCoreBoss',enemyTypes:['mecha_pea'],boss:true,bossName:'机甲神豌',bossHp:16000,time:210,final:true,hint:'Boss分冰、火、雷三阶段。用克制武器打碎核心，属性连锁可延长输出窗口。',reward:'机甲神豌（隐藏坦克）',intro:[['机甲神豌','right','冰、火、雷三相同时觉醒。封印序列，拒绝新驾驶者。'],['阿识','left','观察能量环颜色，用克制武器打出连锁！']],outro:[['机甲神豌','right','战术车长认证完成。三相核心接受新的驾驶者。'],['系统','left','隐藏坦克“机甲神豌”已解锁。']]},
 {id:'sealEcho',code:'★',chapter:5,chapterName:'最终封印',name:'封印回响',icon:'★',kind:'终极奖励关',map:'factory',scene:'封印核心 · 三色能量幕墙',mechanic:'sealGift',enemyTypes:[],rewardLevel:true,time:120,hint:'120秒内切换三种武器，按冰/火/雷三阶段击破24个属性弱点。',reward:'三相共鸣（永久被动）',intro:[['机甲神豌','right','最后的训练不是破坏，而是让三种武器形成共鸣。']],outro:[['系统','left','终极奖励：永久被动“三相共鸣”已激活。']]}
]);

// 每个节点拥有独立战场尺寸、出生点和障碍拓扑，不再复用基础地图的随机布局。
function storyWall(x,y,w,h,type='rock',worldHeight=80,label=''){return{x,y,w,h,type,worldHeight,indestructible:true,storyLabel:label};}
function storyBorder(width,height,type='rock',thickness=55,worldHeight=75){return[
 storyWall(0,0,width,thickness,type,worldHeight),storyWall(0,height-thickness,width,thickness,type,worldHeight),
 storyWall(0,thickness,thickness,height-thickness*2,type,worldHeight),storyWall(width-thickness,thickness,thickness,height-thickness*2,type,worldHeight)
];}
function storyPillars(points,size=90,type='rock',height=100){return points.map(([x,y])=>storyWall(x-size/2,y-size/2,size,size,type,height));}
function storyEnemyLine(count,x,y,dx=0,dy=150,role='guard'){return Array.from({length:count},(_,index)=>({x:x+dx*index,y:y+dy*index,angle:Math.PI,role:`${role}${index+1}`}));}
function storyEnemyGrid(count,x,y,columns,dx,dy,role='guard'){return Array.from({length:count},(_,index)=>({x:x+(index%columns)*dx,y:y+Math.floor(index/columns)*dy,angle:Math.PI,role:`${role}${index+1}`}));}
function rotateStoryRect(item,legacyWidth){return{...item,x:item.y,y:legacyWidth-item.x-item.w,w:item.h,h:item.w};}
function rotateStoryPoint(item,legacyWidth){return{...item,x:item.y,y:legacyWidth-item.x,angle:Number.isFinite(item.angle)?item.angle-Math.PI/2:item.angle};}
function rotateStoryLayout(raw){const player=rotateStoryPoint(raw.player,raw.width);if(!Number.isFinite(player.angle))player.angle=-Math.PI/2;return{...raw,width:raw.height,height:raw.width,player,enemySpawns:raw.enemySpawns.map(item=>rotateStoryPoint(item,raw.width)),obstacles:raw.obstacles.map(item=>rotateStoryRect(item,raw.width)),zones:raw.zones.map(item=>item.w&&item.h?rotateStoryRect(item,raw.width):rotateStoryPoint(item,raw.width)),direction:'rear-to-front'};}
function storyLayout(id,width,height,groundColor,landmark,briefing,player,enemySpawns,obstacles,extra={}){
 const raw={id,width,height,groundColor,landmark,briefing,player,enemySpawns,obstacles:[...storyBorder(width,height,extra.borderType||'rock',extra.borderThickness||55,extra.borderHeight||75),...obstacles],zones:extra.zones||[],cameraZoom:extra.cameraZoom||1,gate:extra.gate||null,crossbow:extra.crossbow||null,ceiling:extra.ceiling||null,icicles:extra.icicles||[],architecture:extra.architecture||[],direction:'rear-to-front'};
 const layout=extra.frontward?raw:rotateStoryLayout(raw);
 layout.obstacles.filter(wall=>wall.y+wall.h>=layout.height-1).forEach(wall=>{wall.storyCameraCutaway=true;wall.storyVisualHeight=18;});
 return layout;
}

function createStoryMapLayouts(){
 const ice='ice',lava='volcanicRock',metal='factoryWall',voidWall='building';
 const layouts={
  frostTrial:storyLayout('frostTrial',1500,1500,'#d8edf4','霜门要塞','玩家从地图后方出生，向正前方的冰城门推进。城门中央保留500宽的空门洞，两侧城墙高1000；自动弩从门楼向下俯射。',{x:750,y:1320,angle:-Math.PI/2},[
   {x:420,y:570,angle:Math.PI/2,role:'gateLeft'},{x:1080,y:570,angle:Math.PI/2,role:'gateRight'}
  ],[
   storyWall(55,300,445,120,ice,1000,'冰城墙左翼'),storyWall(1000,300,445,120,ice,1000,'冰城墙右翼'),
   storyWall(430,250,70,220,ice,1000,'左门柱'),storyWall(1000,250,70,220,ice,1000,'右门柱'),
   ...storyPillars([[260,760],[1240,760],[420,1060],[1080,1060]],105,ice,130)
  ],{frontward:true,borderType:ice,borderHeight:180,cameraZoom:.68,
   gate:{x:500,y:260,w:500,h:210,triggerY:245},
   crossbow:{type:'gateCrossbow',x:750,y:350,z:820,radius:65,hp:900,maxHp:900,fireInterval:2.4},
   architecture:[{type:'gateBeam',x:500,y:300,w:500,h:120,z:780,worldHeight:220,label:'500宽冰门楼横梁'}]
  }),

  crystalCorridor:storyLayout('crystalCorridor',1800,1100,'#d5eaf1','折晶冰洞','两条狭窄通道在中央交错，冰柱遮挡正面火力，可绕侧洞攻击爬行兽背部。',{x:150,y:550},storyEnemyGrid(12,900,155,4,210,360,'crawler'),[
   storyWall(390,55,90,350,ice,120),storyWall(390,690,90,355,ice,120),
   storyWall(730,230,90,560,ice,130),storyWall(1070,55,90,360,ice,120),storyWall(1070,700,90,345,ice,120),
   storyWall(1410,240,90,560,ice,135),...storyPillars([[585,540],[925,180],[925,910],[1265,550],[1600,260],[1600,840]],82,ice,145)
  ],{borderType:ice,cameraZoom:.95}),

  frostResolve:storyLayout('frostResolve',1800,1600,'#cfe7ef','冰霜王座穹顶','王座位于三层冰晶环中央，四处反馈冰面迫使玩家不断改变输出位置。',{x:210,y:800},[{x:1370,y:800,angle:Math.PI,role:'frostGeneral'}],[
   storyWall(1060,560,95,480,ice,120),storyWall(1510,560,95,480,ice,120),storyWall(1155,520,355,70,ice,145),
   ...storyPillars([[700,360],[700,1240],[1040,250],[1040,1350],[1380,300],[1380,1300]],110,ice,155)
  ],{borderType:ice,cameraZoom:.88}),

  frostGift:storyLayout('frostGift',1400,1400,'#e0f1f5','十二晶靶环','圆形训练场由内外两圈冰柱划分射击窗口，移动靶会在柱间穿梭。',{x:700,y:700},[],[
   ...storyPillars([[700,165],[1078,322],[1235,700],[1078,1078],[700,1235],[322,1078],[165,700],[322,322]],76,ice,100),
   ...storyPillars([[700,400],[1000,700],[700,1000],[400,700]],68,ice,80)
  ],{borderType:ice,cameraZoom:1.04}),

  fireInvitation:storyLayout('fireInvitation',1700,1400,'#342423','熔岩三岔桥','入口桥在中央分成冰晶桥、灰烬坡和熔岩管道三条路线，每条都有不同宽度与转弯半径。',{x:160,y:700},[],[
   storyWall(420,55,100,420,lava,110),storyWall(420,925,100,420,lava,110),
   storyWall(720,330,520,70,lava,90),storyWall(720,670,520,70,lava,90),storyWall(720,1000,520,70,lava,90),
   storyWall(1240,330,90,740,lava,115),...storyPillars([[610,250],[610,700],[610,1150],[1500,220],[1500,700],[1500,1180]],95,lava,130)
  ],{borderType:lava,cameraZoom:.95}),

  moltenHeart:storyLayout('moltenHeart',1900,1600,'#251b1a','七岛浮石大厅','七座石台以跳岛路径排列，外圈岩柱限制转向；下沉时必须提前转移到相邻平台。',{x:230,y:800},storyEnemyLine(4,1000,340,210,300,'golem'),[
   ...storyPillars([[430,800],[700,430],[700,1170],[1010,800],[1320,430],[1320,1170],[1600,800]],170,lava,55),
   ...storyPillars([[560,180],[560,1370],[1170,180],[1170,1370],[1720,300],[1720,1250]],90,lava,145)
  ],{borderType:lava,cameraZoom:.86}),

  blazeEnd:storyLayout('blazeEnd',1800,1600,'#301b19','结晶火焰王座','三条熔岩引流槽汇入王座，结晶柱形成三角火力窗口，Boss会在中心吸收熔岩。',{x:200,y:800},[{x:1390,y:800,angle:Math.PI,role:'blazeGeneral'}],[
   storyWall(720,250,75,420,lava,95),storyWall(720,930,75,420,lava,95),storyWall(1040,55,70,430,lava,100),storyWall(1040,1115,70,430,lava,100),
   ...storyPillars([[1110,800],[1400,420],[1400,1180]],125,lava,175),storyWall(1510,600,120,400,lava,135,'火焰王座')
  ],{borderType:lava,cameraZoom:.88}),

  moltenGift:storyLayout('moltenGift',1500,1500,'#2d201e','九口熔岩环','九个喷口按三层环形错位分布，短墙提供临时掩护但会切断直线逃生路线。',{x:750,y:750},[],[
   storyWall(350,350,250,55,lava,70),storyWall(900,350,250,55,lava,70),storyWall(350,1095,250,55,lava,70),storyWall(900,1095,250,55,lava,70),
   storyWall(350,600,55,300,lava,70),storyWall(1095,600,55,300,lava,70),...storyPillars([[750,220],[1280,750],[750,1280],[220,750]],85,lava,110)
  ],{borderType:lava,cameraZoom:1}),

  automationLine:storyLayout('automationLine',2200,1500,'#3e4448','自动化警戒外环','废弃传送带组成三条潜行巷，炮塔视野互相重叠，但维修通道能通往它们背后。',{x:150,y:750},[
   ...storyEnemyLine(6,720,180,250,220,'turret'),...storyEnemyLine(4,1180,315,240,285,'patrol')
  ],[
   storyWall(410,55,85,500,metal,115),storyWall(410,900,85,545,metal,115),storyWall(760,260,85,980,metal,110),
   storyWall(1110,55,85,490,metal,115),storyWall(1110,900,85,545,metal,115),storyWall(1510,260,85,980,metal,110),
   storyWall(1880,55,85,510,metal,125),storyWall(1880,900,85,545,metal,125)
  ],{borderType:metal,cameraZoom:.82}),

  conveyorLine:storyLayout('conveyorLine',2100,1300,'#464a4c','双向传送车间','四条长传送带交替推动车体，安全岛与机械臂砸击区呈棋盘交错。',{x:150,y:650},storyEnemyGrid(8,650,180,4,380,850,'lineGuard'),[
   storyWall(430,55,70,370,metal,90),storyWall(430,875,70,370,metal,90),storyWall(810,300,70,700,metal,95),
   storyWall(1190,55,70,370,metal,90),storyWall(1190,875,70,370,metal,90),storyWall(1570,300,70,700,metal,95),
   ...storyPillars([[620,650],[1000,190],[1000,1110],[1380,650],[1900,260],[1900,1040]],85,metal,130)
  ],{borderType:metal,cameraZoom:.84}),

  assembler:storyLayout('assembler',1900,1600,'#40464a','中央装配井','四条零件流水线从角落汇向中央装配井，立柱会遮挡炮线，也能阻止Boss直接冲撞。',{x:180,y:800},[{x:1320,y:800,angle:Math.PI,role:'assembler'}],[
   storyWall(420,220,520,65,metal,70),storyWall(420,1315,520,65,metal,70),storyWall(820,285,65,340,metal,70),storyWall(820,975,65,340,metal,70),
   storyWall(1150,400,420,70,metal,80),storyWall(1150,1130,420,70,metal,80),...storyPillars([[1080,610],[1080,990],[1530,610],[1530,990]],105,metal,155)
  ],{borderType:metal,cameraZoom:.86}),

  archiveGift:storyLayout('archiveGift',1500,1200,'#30383e','废弃档案迷宫','六排档案柜形成短视距迷宫，中央记忆台可以同时观察三条目标通道。',{x:750,y:600},[],[
   storyWall(180,180,380,60,metal,105),storyWall(180,450,380,60,metal,105),storyWall(180,720,380,60,metal,105),storyWall(180,990,380,60,metal,105),
   storyWall(940,180,380,60,metal,105),storyWall(940,450,380,60,metal,105),storyWall(940,720,380,60,metal,105),storyWall(940,990,380,60,metal,105),
   storyWall(675,505,150,190,metal,45,'记忆读取台')
  ],{borderType:metal,cameraZoom:1.02}),

  thunderEcho:storyLayout('thunderEcho',1800,1200,'#303746','雷电代码回廊','三座能量门之间各有一次急转弯，网格只能按顺序同步。',{x:150,y:600},[],[
   storyWall(360,55,70,390,voidWall,105),storyWall(360,760,70,385,voidWall,105),
   storyWall(760,270,70,875,voidWall,105),storyWall(1160,55,70,875,voidWall,105),storyWall(1530,330,70,815,voidWall,105),
   ...storyPillars([[590,610],[980,210],[1390,610]],75,voidWall,130)
  ],{borderType:voidWall,cameraZoom:.94}),

  mirrorCorridor:storyLayout('mirrorCorridor',1800,1800,'#242936','无限镜面大厅','障碍沿两条对角线完全镜像，复制体会利用反射结构从四个象限夹击。',{x:900,y:900},[
   {x:330,y:330,angle:.75,role:'mirror1'},{x:1470,y:330,angle:2.35,role:'mirror2'},{x:1470,y:1470,angle:-2.35,role:'mirror3'}
  ],[
   storyWall(420,390,420,65,voidWall,125),storyWall(960,390,420,65,voidWall,125),storyWall(420,1345,420,65,voidWall,125),storyWall(960,1345,420,65,voidWall,125),
   storyWall(390,520,65,760,voidWall,125),storyWall(1345,520,65,760,voidWall,125),
   ...storyPillars([[650,650],[1150,650],[650,1150],[1150,1150]],90,voidWall,150)
  ],{borderType:voidWall,cameraZoom:.86}),

  voidWarden:storyLayout('voidWarden',2000,1600,'#182d3d','破碎虚空平台','主平台被十字裂隙分割成四块，仅四座窄桥相连；追踪弹可被引到桥头集中引爆。',{x:200,y:800},[{x:1500,y:800,angle:Math.PI,role:'voidWarden'}],[
   storyWall(690,55,85,520,voidWall,120),storyWall(690,1025,85,520,voidWall,120),storyWall(1225,55,85,520,voidWall,120),storyWall(1225,1025,85,520,voidWall,120),
   storyWall(775,650,450,70,voidWall,80),storyWall(775,880,450,70,voidWall,80),
   ...storyPillars([[420,350],[420,1250],[1580,350],[1580,1250]],120,voidWall,170)
  ],{borderType:voidWall,cameraZoom:.84}),

  thunderGift:storyLayout('thunderGift',1700,1300,'#272f40','折线网格训练场','交错矮墙迫使训练球不断折返，中央十字观察区适合连续预判射击。',{x:850,y:650},[],[
   storyWall(260,260,420,55,voidWall,60),storyWall(1020,260,420,55,voidWall,60),storyWall(260,985,420,55,voidWall,60),storyWall(1020,985,420,55,voidWall,60),
   storyWall(260,480,55,340,voidWall,60),storyWall(1385,480,55,340,voidWall,60),...storyPillars([[600,650],[1100,650]],70,voidWall,90)
  ],{borderType:voidWall,cameraZoom:.97}),

  sealSequence:storyLayout('sealSequence',2300,1500,'#3f4546','三重封印门阵','战场由三道错位封印墙分成四个战斗室，每波结束后下一道门才开放。',{x:150,y:750},storyEnemyLine(4,590,435,0,210,'sealGuard'),[
   storyWall(520,55,80,510,metal,120),storyWall(520,935,80,510,metal,120),
   storyWall(1080,55,80,760,metal,120),storyWall(1080,1120,80,325,metal,120),
   storyWall(1640,55,80,325,metal,120),storyWall(1640,685,80,760,metal,120),
   ...storyPillars([[800,350],[800,1150],[1360,350],[1360,1150],[1950,350],[1950,1150]],90,metal,145)
  ],{borderType:metal,cameraZoom:.78}),

  triCore:storyLayout('triCore',2000,1800,'#343b40','三相核心控制室','冰、火、雷三个侧室围绕中央核心环；形态切换时必须换位，利用对应颜色的掩体输出。',{x:200,y:900},[{x:1450,y:900,angle:Math.PI,role:'triCore'}],[
   storyWall(610,280,80,430,ice,105),storyWall(610,1090,80,430,ice,105),storyWall(960,55,80,470,lava,105),storyWall(960,1275,80,470,lava,105),
   storyWall(1310,280,80,430,metal,105),storyWall(1310,1090,80,430,metal,105),
   ...storyPillars([[1000,650],[1250,900],[1000,1150],[750,900]],110,metal,145),storyWall(1570,650,170,500,metal,95,'三相核心座')
  ],{borderType:metal,cameraZoom:.84}),

  sealEcho:storyLayout('sealEcho',1800,1600,'#303a3d','三色共鸣幕墙','三条并行射击廊分别对应冰、火、雷，末端回环通道允许快速切换武器和射线角度。',{x:180,y:800},[],[
   storyWall(420,55,75,390,ice,100),storyWall(420,605,75,390,lava,100),storyWall(420,1155,75,390,metal,100),
   storyWall(850,280,75,420,ice,100),storyWall(850,900,75,420,lava,100),
   storyWall(1280,55,75,390,metal,100),storyWall(1280,605,75,390,ice,100),storyWall(1280,1155,75,390,lava,100),
   ...storyPillars([[650,250],[650,800],[650,1350],[1080,520],[1080,1080],[1540,800]],80,metal,115)
  ],{borderType:metal,cameraZoom:.9})
 };
 const enclosed={
  crystalCorridor:['iceCave',250,'#a8e9ff'],frostResolve:['iceDome',300,'#b7efff'],
  fireInvitation:['lavaCave',260,'#5b2d25'],moltenHeart:['lavaCave',285,'#512821'],blazeEnd:['lavaVault',320,'#63261e'],
  automationLine:['factoryRoof',260,'#59636b'],conveyorLine:['factoryRoof',245,'#59636b'],assembler:['factoryRoof',300,'#667078'],archiveGift:['factoryRoof',220,'#4d5860'],
  thunderEcho:['energyVault',250,'#42506d'],mirrorCorridor:['mirrorRoof',285,'#5d5c78'],thunderGift:['energyVault',240,'#45536e'],
  sealSequence:['factoryRoof',290,'#515d62'],triCore:['factoryRoof',340,'#5d686d'],sealEcho:['factoryRoof',280,'#526066']
 };
 Object.entries(enclosed).forEach(([id,[kind,height,color]])=>{const layout=layouts[id];layout.ceiling={kind,height,color,opacity:kind==='iceCave'?.28:.18,sealed:true};layout.obstacles.slice(0,4).forEach(wall=>wall.worldHeight=height);});
 layouts.crystalCorridor.icicles=[
  [175,1580,125,34],[540,1510,165,42],[910,1420,105,30],[330,1240,150,38],
  [760,1120,190,48],[190,930,120,34],[560,820,175,45],[930,720,140,36],
  [340,520,185,46],[760,420,135,34],[180,260,120,30],[910,210,165,42]
 ].map(([x,y,length,radius],index)=>({id:`cave-icicle-${index+1}`,type:'ceilingIcicle',x,y,z:layouts.crystalCorridor.ceiling.height,length,radius}));
 return layouts;
}

const STORY_MAP_LAYOUTS=Object.freeze(createStoryMapLayouts());
function getCurrentStoryMapLayout(){const level=getCurrentStoryLevel();return level?STORY_MAP_LAYOUTS[level.id]||null:null;}
function applyStoryMapLayout(){
 if(gameMode!=='story')return false;const layout=getCurrentStoryMapLayout();if(!layout)return false;
 CONFIG.mapWidth=layout.width;CONFIG.mapHeight=layout.height;
 obstacles=layout.obstacles.map((item,index)=>({...item,terrainId:`story-${layout.id}-${index}`}));
 terrainZones=(layout.zones||[]).map(zone=>({...zone}));outposts=[];neutralNPCs=[];mapElements=[];
 Object.values(bases).forEach(base=>{if(!base)return;base.hidden=true;base.invulnerable=true;base.x=-2000;base.y=-2000;});
 if(typeof disposeFactoryPhysics==='function')disposeFactoryPhysics();
 if(typeof createEmptyMapMechanicsState==='function')mapMechanicsState=createEmptyMapMechanicsState();
 if(mapMechanicsState){mapMechanicsState.weather={id:`story-${layout.id}`,icon:'◈',name:layout.landmark,description:layout.briefing};if(typeof updateWeatherHud==='function')updateWeatherHud();}
 if(gameConfig){gameConfig.storyLayoutId=layout.id;gameConfig.storyGroundColor=layout.groundColor;}
 if(typeof initializeDestructibleTerrain==='function')initializeDestructibleTerrain();
 if(typeof markTerrainStructureChanged==='function')markTerrainStructureChanged();
 return true;
}

const STORY_MAINLINE=STORY_LEVELS.filter(level=>!level.rewardLevel).map(level=>level.id);
const STORY_REWARD_REQUIRE={frostGift:'frostResolve',moltenGift:'blazeEnd',archiveGift:'assembler',thunderGift:'voidWarden',sealEcho:'triCore'};
let storyModeState=createStoryModeState();
let storyDialogueRenderers={left:null,right:null};

function createStoryModeState(){return{active:false,currentLevelId:null,currentLevel:null,runtime:null,dialogue:[],dialogueIndex:0,dialogueDone:null,mapNodes:[]};}
function loadStoryProgress(){const fallback={completed:[],choices:{},finished:false};try{const value=JSON.parse(localStorage.getItem(STORY_SAVE_KEY)||'null');return value&&Array.isArray(value.completed)?{completed:value.completed,choices:value.choices||{},finished:!!value.finished}:fallback;}catch(error){return fallback;}}
function saveStoryProgress(progress){try{localStorage.setItem(STORY_SAVE_KEY,JSON.stringify(progress));}catch(error){}}
function isStoryLevelUnlocked(levelOrIndex,progress=loadStoryProgress()){
 const level=typeof levelOrIndex==='number'?STORY_LEVELS[levelOrIndex]:typeof levelOrIndex==='string'?STORY_LEVELS.find(item=>item.id===levelOrIndex):levelOrIndex;if(!level)return false;
 if(level.rewardLevel)return progress.completed.includes(STORY_REWARD_REQUIRE[level.id]);
 const index=STORY_MAINLINE.indexOf(level.id);return index===0||progress.completed.includes(STORY_MAINLINE[index-1]);
}
function getStoryPermanentRewards(progress=loadStoryProgress()){const has=id=>progress.completed.includes(id);return{iceResist:has('frostGift')?.1:0,fireResist:has('moltenGift')?.1:0,reloadMult:1+(has('archiveGift')?.15:0)+(has('thunderGift')?.15:0),counterMode:has('thunderEcho'),triResonance:has('sealEcho'),skins:{frostmark:has('frostGift'),moltenWalker:has('moltenGift'),industrial:has('archiveGift'),voidEcho:has('thunderGift')},badge:has('thunderGift')};}
function isStoryCosmeticUnlocked(id){return!!getStoryPermanentRewards().skins[id];}
function applyStoryPermanentRewards(tank){if(!tank||tank.storyRewardsApplied)return tank;const reward=getStoryPermanentRewards();tank.storyRewardsApplied=true;tank.storyIceResist=reward.iceResist;tank.storyFireResist=reward.fireResist;tank.storyCounterMode=reward.counterMode;tank.storyTriResonance=reward.triResonance;tank.fireRate*=reward.reloadMult;tank.storyReloadMult=reward.reloadMult;return tank;}
function modifyStoryPermanentDamage(tank,damage,cause=''){if(!tank||damage<=0)return damage;const text=String(cause||'');if(tank.storyIceResist&&/\u51b0|\u971c|\u51bb/.test(text))damage*=1-tank.storyIceResist;if(tank.storyFireResist&&/\u706b|\u7194|\u70e7|\u708e/.test(text))damage*=1-tank.storyFireResist;return damage;}

function openStoryMode(){if(typeof closeTutorial==='function')closeTutorial();if(typeof closeInfoPanels==='function')closeInfoPanels();const start=document.getElementById('startScreen'),menu=document.getElementById('menu'),screen=document.getElementById('storyModeScreen');if(start)start.style.display='none';if(menu){menu.style.display='none';menu.classList.remove('active');}if(screen)screen.classList.add('active');gameState='storyMap';drawStoryNodeMap();}
function closeStoryMode(){const screen=document.getElementById('storyModeScreen');if(screen)screen.classList.remove('active');if(typeof resetGame==='function')resetGame();}
function drawStoryNodeMap(){
 const canvas=document.getElementById('storyMapCanvas');if(!canvas)return;const rect=canvas.getBoundingClientRect();canvas.width=Math.max(950,Math.round(rect.width||1180));canvas.height=Math.max(620,Math.round(rect.height||680));const c=canvas.getContext('2d'),progress=loadStoryProgress(),colors=['#76dfff','#ff8150','#ffc04d','#ae7cff','#70f0b2'];c.clearRect(0,0,canvas.width,canvas.height);
 const bg=c.createLinearGradient(0,0,canvas.width,canvas.height);bg.addColorStop(0,'#061521');bg.addColorStop(.55,'#181329');bg.addColorStop(1,'#10251f');c.fillStyle=bg;c.fillRect(0,0,canvas.width,canvas.height);for(let i=0;i<180;i++){c.fillStyle=`rgba(140,210,255,${.05+(i%4)*.02})`;c.fillRect((i*83)%canvas.width,(i*149)%canvas.height,2,2);}
 storyModeState.mapNodes=[];for(let chapter=1;chapter<=5;chapter++){const row=(chapter-.5)/5*canvas.height,levels=STORY_LEVELS.filter(level=>level.chapter===chapter&&!level.rewardLevel),reward=STORY_LEVELS.find(level=>level.chapter===chapter&&level.rewardLevel),xs=levels.length===2?[.28,.59]:[.16,.40,.64];c.fillStyle=colors[chapter-1];c.font='bold 14px sans-serif';c.textAlign='left';c.fillText(`第${['一','二','三','四','五'][chapter-1]}章 · ${levels[0].chapterName}`,18,row-43);
  levels.forEach((level,index)=>{const x=xs[index]*canvas.width;if(index){const prev=xs[index-1]*canvas.width;c.strokeStyle=isStoryLevelUnlocked(level,progress)?colors[chapter-1]:'#344052';c.lineWidth=4;c.beginPath();c.moveTo(prev+28,row);c.lineTo(x-28,row);c.stroke();}drawStoryNode(c,level,x,row,colors[chapter-1],progress);});
  if(reward){const bossX=xs[xs.length-1]*canvas.width,rewardX=.87*canvas.width;c.strokeStyle=isStoryLevelUnlocked(reward,progress)?'#ffe16b':'#3d4050';c.setLineDash([7,6]);c.beginPath();c.moveTo(bossX+28,row);c.lineTo(rewardX-28,row);c.stroke();c.setLineDash([]);drawStoryNode(c,reward,rewardX,row,'#ffe16b',progress);}
 }
 updateStoryProgressText(progress);
}
function drawStoryNode(c,level,x,y,color,progress){const unlocked=isStoryLevelUnlocked(level,progress),done=progress.completed.includes(level.id);c.shadowBlur=unlocked?18:0;c.shadowColor=color;c.fillStyle=done?'#5df0a8':unlocked?color:'#252d3b';c.beginPath();c.arc(x,y,level.rewardLevel?22:25,0,Math.PI*2);c.fill();c.shadowBlur=0;c.strokeStyle=done?'#dbffec':unlocked?'#fff':'#566273';c.lineWidth=3;c.stroke();c.fillStyle=unlocked?'#07131c':'#8b95a1';c.font='bold 16px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(done?'✓':level.icon,x,y);c.fillStyle=unlocked?'#f3f9ff':'#77818e';c.font='bold 13px sans-serif';c.fillText(`${level.code} ${level.name}`,x,y+39);c.font='11px sans-serif';c.fillStyle=color;c.fillText(level.kind,x,y+55);storyModeState.mapNodes.push({x,y,r:34,levelId:level.id,unlocked});}
function updateStoryProgressText(progress=loadStoryProgress()){const el=document.getElementById('storyProgressText');if(!el)return;const main=STORY_MAINLINE.filter(id=>progress.completed.includes(id)).length,rewards=STORY_LEVELS.filter(level=>level.rewardLevel&&progress.completed.includes(level.id)).length;el.textContent=progress.finished&&rewards===5?'全部封印与奖励完成':`主线 ${main}/14 · 奖励 ${rewards}/5`;}
function handleStoryMapClick(event){const canvas=event.currentTarget,rect=canvas.getBoundingClientRect(),x=(event.clientX-rect.left)*canvas.width/rect.width,y=(event.clientY-rect.top)*canvas.height/rect.height,node=storyModeState.mapNodes.find(item=>Math.hypot(item.x-x,item.y-y)<=item.r);if(!node)return;if(!node.unlocked){showStoryToast('前置主线尚未完成');return;}selectStoryLevel(node.levelId);}
function selectStoryLevel(levelId){const level=STORY_LEVELS.find(item=>item.id===levelId);if(!level)return;storyModeState.currentLevelId=level.id;storyModeState.currentLevel=level;const panel=document.getElementById('storyLevelCard');if(!panel)return;panel.classList.add('active');panel.innerHTML=`<button class="story-card-close" onclick="closeStoryLevelCard()">×</button><small>${level.code} · CHAPTER ${level.chapter} · ${level.chapterName}</small><h2>${level.icon} ${level.name}</h2><div class="story-level-kind">${level.kind}</div><p><b>${level.scene}</b><br>${level.hint}</p><div class="story-card-reward">奖励：${level.reward}</div><button class="story-primary" onclick="beginStoryLevelDialogue()">进入关卡</button>`;}
function closeStoryLevelCard(){const panel=document.getElementById('storyLevelCard');if(panel)panel.classList.remove('active');}
function storyDialogueLine([speaker,side,text]){return{speaker,side,tank:getStorySpeakerTank(speaker),text};}
function getExpandedStoryIntro(level){const layout=STORY_MAP_LAYOUTS[level.id];return[
 {speaker:'系统',side:'left',tank:'helper',text:`战区载入：${level.code}「${level.name}」。地图尺寸 ${layout.width}×${layout.height}，定位点：${layout.landmark}。`},
 ...level.intro.map(storyDialogueLine),
 {speaker:'阿识',side:'left',tank:'helper',text:`地形分析完成。${layout.briefing}`},
 {speaker:'左研29',side:'left',tank:'zuoyan29',text:`任务确认：${level.hint} 我会先看清机关与敌人站位，再决定第一炮和撤离路线。`}
 ];}
function getExpandedStoryOutro(level){const layout=STORY_MAP_LAYOUTS[level.id];return[
 ...level.outro.map(storyDialogueLine),
 {speaker:'左研29',side:'left',tank:'zuoyan29',text:`${layout.landmark}的威胁已经解除。刚才的路线和射击节奏我记下了，下一次再遇到类似地形会更快。`},
 {speaker:'阿识',side:'left',tank:'helper',text:level.reward==='无'?'学院通道已更新，前方节点可以继续探索。先检查车体和弹药，我们再出发。':`学院终端已确认本关成果：${level.reward}。数据会立即写入元素坦克。`}
 ];}
function beginStoryLevelDialogue(){closeStoryLevelCard();const level=getCurrentStoryLevel();if(!level)return;showStoryDialogue(getExpandedStoryIntro(level),launchStoryBattle,'开始关卡');}
function getStorySpeakerTank(speaker){if(speaker==='左研29')return'zuoyan29';if(speaker==='机甲神豌')return'mecha_pea';if(speaker==='Kimi'||speaker==='虚空看守者')return'kimi_tank';if(speaker==='霜痕')return'xingchen27b';if(speaker==='爆炎')return'duoduo';if(speaker==='组装者')return'duoduo_eng';if(speaker==='霆光')return'xingchen27s';if(speaker==='霜门近卫')return'xingchen27a';return'helper';}
function showStoryDialogue(lines,onDone,finalLabel='继续'){storyModeState.dialogue=lines;storyModeState.dialogueIndex=0;storyModeState.dialogueDone=onDone;storyModeState.dialogueFinalLabel=finalLabel;const overlay=document.getElementById('storyDialogueOverlay');if(overlay)overlay.classList.add('active');renderStoryDialogueLine();}
function renderStoryDialogueLine(){const line=storyModeState.dialogue[storyModeState.dialogueIndex],overlay=document.getElementById('storyDialogueOverlay');if(!line||!overlay)return;const left=overlay.querySelector('.story-dialogue-left'),right=overlay.querySelector('.story-dialogue-right'),button=document.getElementById('storyDialogueNext');left.classList.toggle('speaking',line.side!=='right');right.classList.toggle('speaking',line.side==='right');const active=line.side==='right'?right:left,inactive=line.side==='right'?left:right;active.querySelector('.story-speaker-name').textContent=line.speaker;active.querySelector('.story-speech').textContent=line.text;inactive.querySelector('.story-speaker-name').textContent='';inactive.querySelector('.story-speech').textContent='';renderStoryDialogueTank(line.side==='right'?'right':'left',line.tank);if(button)button.textContent=storyModeState.dialogueIndex===storyModeState.dialogue.length-1?storyModeState.dialogueFinalLabel:'继续';}
function nextStoryDialogue(){if(storyModeState.dialogueIndex<storyModeState.dialogue.length-1){storyModeState.dialogueIndex++;renderStoryDialogueLine();return;}const overlay=document.getElementById('storyDialogueOverlay');if(overlay)overlay.classList.remove('active');const done=storyModeState.dialogueDone;storyModeState.dialogueDone=null;if(done)done();}
function triggerStoryMidDialogue(lines){if(gameState!=='playing')return false;gameState='storyDialogue';showStoryDialogue(lines.map(storyDialogueLine),()=>{gameState='playing';lastTime=performance.now();},'继续战斗');return true;}
function renderStoryDialogueTank(side,tankType){const canvas=document.getElementById(side==='right'?'storyDialogueRightCanvas':'storyDialogueLeftCanvas');if(!canvas||typeof THREE==='undefined')return;let slot=storyDialogueRenderers[side];if(!slot){try{const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true});renderer.setPixelRatio(Math.min(1.5,window.devicePixelRatio||1));renderer.setSize(280,190,false);const scene=new THREE.Scene(),camera3d=new THREE.PerspectiveCamera(38,280/190,.1,100);camera3d.position.set(10,8,13);camera3d.lookAt(0,1,0);scene.add(new THREE.HemisphereLight(0xdff5ff,0x182235,2.4));const light=new THREE.DirectionalLight(0xffffff,2.8);light.position.set(5,10,7);scene.add(light);slot={renderer,scene,camera:camera3d,model:null};storyDialogueRenderers[side]=slot;}catch(error){return;}}if(slot.model){slot.scene.remove(slot.model);disposeStoryPortrait(slot.model);}slot.model=createStoryPortraitModel(tankType);slot.scene.add(slot.model);slot.model.rotation.y=side==='right'?.45:-.45;slot.renderer.render(slot.scene,slot.camera);}
function createStoryPortraitModel(tankType){const group=new THREE.Group();if(tankType==='helper'){const body=new THREE.Mesh(new THREE.SphereGeometry(2.2,18,12),new THREE.MeshStandardMaterial({color:0x59d9c7,metalness:.25,roughness:.42}));body.scale.set(1.25,.72,1);body.position.y=1.8;const eye=new THREE.Mesh(new THREE.BoxGeometry(1.5,.45,.35),new THREE.MeshBasicMaterial({color:0xffef91}));eye.position.set(1.8,2.1,0);group.add(body,eye);return group;}const data=TANKS[tankType]||TANKS.zuoyan29,mat=new THREE.MeshStandardMaterial({color:data.color||'#4488ff',metalness:.42,roughness:.36}),dark=new THREE.MeshStandardMaterial({color:0x171b20,metalness:.38,roughness:.55});const hull=new THREE.Mesh(new THREE.BoxGeometry(6.6,1.5,4.2),mat);hull.position.y=1.5;[-1,1].forEach(side=>{const track=new THREE.Mesh(new THREE.BoxGeometry(7.2,1.1,.8),dark);track.position.set(0,.75,side*2.15);group.add(track);});const turret=new THREE.Mesh(new THREE.CylinderGeometry(1.5,1.85,1.2,10),new THREE.MeshStandardMaterial({color:data.accent||'#fff',metalness:.5,roughness:.3}));turret.position.y=2.9;const barrel=new THREE.Mesh(new THREE.BoxGeometry(5.6,.45,.52),dark);barrel.position.set(3.2,3,0);group.add(hull,turret,barrel);if(tankType==='mecha_pea')[-1,0,1].forEach((v,i)=>{const ring=new THREE.Mesh(new THREE.TorusGeometry(1.05+i*.32,.16,8,28),new THREE.MeshBasicMaterial({color:[0x52d8ff,0xff5a2f,0x78ef62][i]}));ring.rotation.x=Math.PI/2;ring.position.y=3.6+i*.12;group.add(ring);});return group;}
function disposeStoryPortrait(object){object.traverse(child=>{if(child.geometry)child.geometry.dispose();if(child.material)child.material.dispose();});}

function launchStoryBattle(){const level=getCurrentStoryLevel();if(!level)return;const screen=document.getElementById('storyModeScreen');if(screen)screen.classList.remove('active');storyModeState.active=true;storyModeState.runtime=null;gameMode='story';selectedTank='zuoyan29';currentMap=level.map;const ammo=document.getElementById('ammoSlider'),mg=document.getElementById('mgSlider'),aa=document.getElementById('aaSlider'),difficulty=document.getElementById('difficulty'),dayNight=document.getElementById('dayNight');if(ammo)ammo.value=120;if(mg)mg.value=240;if(aa)aa.value=40;if(difficulty)difficulty.value='normal';if(dayNight)dayNight.value=level.chapter===4?'night':'day';startGame();}
function getCurrentStoryLevel(){return storyModeState.currentLevel||STORY_LEVELS.find(level=>level.id===storyModeState.currentLevelId)||null;}
function getStorySpawnCount(){const level=getCurrentStoryLevel();return level?level.enemyTypes.length:0;}
function getStoryEnemyTypes(){const level=getCurrentStoryLevel();return level?level.enemyTypes:['zuoyan1'];}
function initializeStoryBattle(){const level=getCurrentStoryLevel(),layout=getCurrentStoryMapLayout();if(gameMode!=='story'||!level||!layout||!player)return false;storyModeState.active=true;outposts=[];allies=[];neutralNPCs=[];aiTanks=enemies.slice();Object.values(bases).forEach(base=>{if(base){base.hidden=true;base.invulnerable=true;}});player.storyElementTank=true;player.masteryLevel=8;player.hp=player.maxHp=Math.max(1800,player.maxHp);player.shells=player.maxShells=level.mechanic==='frostGift'?15:120;player.mg=player.maxMG=240;player.aa=player.maxAA=40;player.invincible=level.mechanic==='frostTrial'?6:2;applyStoryPermanentRewards(player);player.x=layout.player.x;player.y=layout.player.y;player.z=layout.player.z||0;player.angle=layout.player.angle||0;player.factoryFloor=level.map==='factory'?0:null;player.prevPos={x:player.x,y:player.y};
 const runtime={elapsed:0,success:false,failed:false,hazards:[],targets:[],boss:null,nextAttack:3,nextMechanic:1.5,lastPlayer:{x:player.x,y:player.y},arenaRadius:null,wave:1,waveDelay:0,combo:0,overloadTimer:0,assemblyInterrupted:0,assemblyStops:0,assemblyParts:[],routeChoice:null,phaseIndex:0,layoutId:layout.id,playerAttacked:false,hiddenGateDialogue:false};storyModeState.runtime=runtime;
 enemies.forEach((tank,index)=>configureStoryEnemy(tank,level,index));if(level.boss&&enemies.length){runtime.boss=enemies[0];configureStoryBoss(runtime.boss,level);}configureStoryEnvironment(level,runtime);gameTime=level.time;lastTime=performance.now();const info=document.getElementById('specialModeInfo');if(info){info.textContent=`📖 ${level.code} ${level.name} · ${level.hint}`;info.style.display='block';}if(typeof addBattleAnnouncement==='function')addBattleAnnouncement('blue',`📖 ${level.name}：${level.hint}`);return true;}
function configureStoryEnemy(tank,level,index){const layout=getCurrentStoryMapLayout(),spawn=layout&&layout.enemySpawns[index];tank.x=spawn?spawn.x:CONFIG.mapWidth*(.62+(index%3)*.08);tank.y=spawn?spawn.y:CONFIG.mapHeight*(.2+(index%5)*.15);tank.z=spawn&&spawn.z||0;tank.angle=spawn&&Number.isFinite(spawn.angle)?spawn.angle:Math.PI;tank.storyRole=spawn&&spawn.role||`enemy${index+1}`;tank.factoryFloor=level.map==='factory'?0:null;tank.prevPos={x:tank.x,y:tank.y};tank.invincible=.6;tank.aiDamageMult=.65;tank.apsCharges=0;if(level.mechanic==='frostTrial'){tank.storyGateGuard=true;tank.storyPassive=false;tank.canMove=false;tank.shells=Math.max(30,tank.shells||0);tank.mg=0;tank.aa=0;tank.fireRate=Math.min(tank.fireRate||1,.7);tank.aiDamageMult=.34;tank.aiReactionDelay=Math.max(tank.aiReactionDelay||0,.65);}if(['crystalCorridor','automationLine'].includes(level.mechanic))tank.storyBackWeakness=true;if(level.mechanic==='automationLine'&&index<6){tank.canMove=false;tank.storyTurret=true;}if(level.mechanic==='sealWaves')tank.storyElement=['ice','fire','thunder'][index%3];}
function configureStoryBoss(boss,level){boss.storyBoss=true;boss.name=level.bossName;boss.visualScale=level.final?2.1:1.65;boss.hitRadius=level.final?110:82;boss.hp=boss.maxHp=level.bossHp;boss.armor=Math.max(1,boss.armor);boss.aiDamageMult=.72;boss.apsCharges=0;boss.storyWeakParts=[{id:'left',label:'左侧核心',x:35,y:-26,radius:27,hp:level.final?1050:560,maxHp:level.final?1050:560,color:'#5ce7ff'},{id:'right',label:'右侧核心',x:35,y:26,radius:27,hp:level.final?1050:560,maxHp:level.final?1050:560,color:'#ff6843'},{id:'top',label:'中央封印',x:-12,y:0,radius:29,hp:level.final?1250:680,maxHp:level.final?1250:680,color:'#cb78ff'}];boss.storyVulnerable=false;}
function configureStoryEnvironment(level,runtime){
 const randomTarget=(index,total,type='target')=>({type,x:CONFIG.mapWidth*(.25+.55*((index*7)%total)/Math.max(1,total-1)),y:CONFIG.mapHeight*(.2+.6*((index*11)%total)/Math.max(1,total-1)),radius:34,vx:(index%2?1:-1)*(75+index%4*18),vy:(index%3-1)*55,hp:1,index});
 if(level.mechanic==='frostTrial'){const layout=getCurrentStoryMapLayout();runtime.gate=layout.gate;runtime.crossbow={...layout.crossbow,dead:false,cooldown:1.4};runtime.crossbowBolts=[];}
 if(level.mechanic==='crystalCorridor'){runtime.ceilingIcicles=getCurrentStoryMapLayout().icicles.map(item=>({...item}));runtime.fallingIcicles=[];runtime.icicleCooldown=1.8;}
 if(level.mechanic==='frostBoss')runtime.icePatches=[0,1,2,3].map(i=>({type:'icePatch',x:CONFIG.mapWidth*(.36+(i%2)*.3),y:CONFIG.mapHeight*(.32+Math.floor(i/2)*.36),radius:125}));
 if(level.mechanic==='frostGift')runtime.targets=Array.from({length:12},(_,i)=>randomTarget(i,12,'iceTarget'));
 if(level.mechanic==='routeChoice')runtime.routeZones=['冰晶桥','灰烬坡','熔岩管道'].map((name,i)=>({type:'route',name,x:CONFIG.mapWidth*(.28+i*.22),y:CONFIG.mapHeight*.62,radius:115}));
 if(level.mechanic==='moltenSurvival')runtime.floatstones=Array.from({length:7},(_,i)=>({type:'floatstone',x:CONFIG.mapWidth*(.2+(i%4)*.2),y:CONFIG.mapHeight*(.3+Math.floor(i/4)*.4),radius:145,phase:i*1.7,active:true}));
 if(level.mechanic==='moltenGift')runtime.vents=Array.from({length:9},(_,i)=>({type:'lavaVent',x:CONFIG.mapWidth*(.24+(i%3)*.26),y:CONFIG.mapHeight*(.24+Math.floor(i/3)*.26),radius:82,phase:i*.7,active:false}));
 if(level.mechanic==='counterCode')runtime.codeGates=[.72,.5,.28].map(y=>({type:'codeGate',x:CONFIG.mapWidth*.5,y:CONFIG.mapHeight*y,radius:90,crossed:false}));
 if(level.mechanic==='archiveGift')runtime.targets=Array.from({length:20},(_,i)=>({...randomTarget(i,20,'hologram'),gold:i%4===0}));
 if(level.mechanic==='thunderGift')runtime.targets=Array.from({length:15},(_,i)=>({...randomTarget(i,15,'trainingBall'),zigzag:true}));
 if(level.mechanic==='sealGift')runtime.targets=Array.from({length:24},(_,i)=>({...randomTarget(i,24,'elementTarget'),element:['ice','fire','thunder'][Math.floor(i/8)]}));
}

function getStoryWeakPartWorld(boss,part){const angle=boss.angle||0,cos=Math.cos(angle),sin=Math.sin(angle);return{x:boss.x+part.x*cos-part.y*sin,y:boss.y+part.x*sin+part.y*cos};}
function getStoryWeaponElement(type){return type==='shell'?'ice':type==='mg'||type==='airmg'?'fire':'thunder';}
function applyStoryProjectileProperties(tank,projectile){if(gameMode!=='story'||tank!==player)return projectile;if(storyModeState.runtime)storyModeState.runtime.playerAttacked=true;projectile.storyElement=getStoryWeaponElement(projectile.type);if(projectile.storyElement==='ice'){projectile.evolutionTrail='#6eeaff';projectile.storyForcedIce=true;}else if(projectile.storyElement==='fire'){projectile.evolutionTrail='#ff653c';}else projectile.evolutionTrail='#f2ed68';return projectile;}
function isStoryRearHit(target,projectile){const impact=Math.atan2(projectile.y-target.y,projectile.x-target.x),rear=normalizeAngle((target.angle||0)+Math.PI-impact);return Math.abs(rear)<Math.PI*.38;}
function modifyStoryBossDamage(target,projectile,damage){
 if(gameMode!=='story'||!target||!projectile)return damage;const level=getCurrentStoryLevel(),runtime=storyModeState.runtime;if(projectile.owner!==player)return damage;
 if(target.storyBackWeakness&&isStoryRearHit(target,projectile)){if(typeof showMessage==='function')showMessage('◇ 背部弱点 · 伤害×2','#7ef3ff');return damage*2;}
 if(target.storyElement){const correct=projectile.storyElement===target.storyElement;if(typeof showMessage==='function')showMessage(correct?'✦ 属性克制':'属性被封印抵消',correct?'#fff072':'#84909b');return damage*(correct?2:.25);}
 if(!target.storyBoss)return damage;
 if(level.mechanic==='blazeBoss'&&runtime.overloadTimer<=0&&target.storyWeakParts.every(part=>part.hp<=0))resetStoryWeakParts(target);
 if(level.mechanic==='assemblerBoss'&&runtime.assemblyInterrupted<=0)return 0;
 const living=(target.storyWeakParts||[]).filter(part=>part.hp>0);
 if(living.length){let hit=null,best=Infinity;living.forEach(part=>{const point=getStoryWeakPartWorld(target,part),dist=Math.hypot(projectile.x-point.x,projectile.y-point.y);if(dist<best){best=dist;hit=part;}});if(hit&&best<=hit.radius+24){const amount=Math.max(100,damage);hit.hp=Math.max(0,hit.hp-amount);createParticles(projectile.x,projectile.y,18,hit.color,1.6);if(hit.hp<=0&&typeof showNotification==='function')showNotification(`✦ ${hit.label}已破坏`,hit.color);if(target.storyWeakParts.every(part=>part.hp<=0))openStoryBossWindow(level,runtime,target);}else if(typeof showMessage==='function')showMessage('装甲无效，瞄准发光核心','#ffcf5a');return 0;}
 if(level.mechanic==='triCoreBoss'){const needed=['fire','thunder','ice'][runtime.phaseIndex]||'fire';if(projectile.storyElement!==needed)return damage*.2;runtime.elementChain=(runtime.elementChain||0)+1;return damage*(1.35+Math.min(.65,runtime.elementChain*.05));}
 return target.storyVulnerable?damage:0;
}
function openStoryBossWindow(level,runtime,boss){boss.storyVulnerable=true;if(level.mechanic==='blazeBoss')runtime.overloadTimer=6;if(level.mechanic==='assemblerBoss'){runtime.assemblyInterrupted=7;runtime.assemblyStops++;}if(typeof showNotification==='function')showNotification('⚠ 护甲解除 · 输出窗口开启','#fff06a');}
function resetStoryWeakParts(boss){(boss.storyWeakParts||[]).forEach(part=>part.hp=part.maxHp);boss.storyVulnerable=false;}
function handleStoryCloneProjectileHit(){}

function updateStoryMode(dt){if(gameMode!=='story'||!storyModeState.active||!storyModeState.runtime||gameState!=='playing')return;const level=getCurrentStoryLevel(),runtime=storyModeState.runtime;if(!level||runtime.success||runtime.failed)return;runtime.elapsed+=dt;runtime.nextAttack-=dt;runtime.nextMechanic-=dt;updateStoryProjectileCounters();updateStoryTrackingProjectiles(dt);updateStoryTargets(dt,level,runtime);const handler={frostTrial:updateFrostTrial,crystalCorridor:updateCrystalCorridor,frostBoss:updateFrostBoss,frostGift:updateTargetChallenge,routeChoice:updateRouteChoice,moltenSurvival:updateMoltenSurvival,blazeBoss:updateBlazeBoss,moltenGift:updateMoltenGift,automationLine:updateAutomationLine,conveyorLine:updateConveyorLine,assemblerBoss:updateAssemblerBoss,archiveGift:updateTargetChallenge,counterCode:updateCounterCode,mirrorWaves:updateMirrorWaves,voidBoss:updateVoidBoss,thunderGift:updateTargetChallenge,sealWaves:updateSealWaves,triCoreBoss:updateTriCoreBoss,sealGift:updateTargetChallenge}[level.mechanic];if(handler)handler(dt,level,runtime);if(player.dead||player.hp<=0){failStoryLevel('元素坦克被击毁');return;}if(level.boss&&runtime.boss&&(runtime.boss.dead||runtime.boss.hp<=0))completeStoryLevel();}
function updateFrostTrial(dt,level,runtime){
 enemies.forEach(enemy=>{if(!enemy.dead)enemy.canMove=false;});
 const crossbow=runtime.crossbow;
 if(crossbow&&!crossbow.dead){
  for(const bullet of [...bullets]){
   if(bullet.owner!==player||Math.hypot(bullet.x-crossbow.x,bullet.y-crossbow.y)>crossbow.radius+28)continue;
   const index=bullets.indexOf(bullet);if(index>=0)bullets.splice(index,1);
   crossbow.hp=Math.max(0,crossbow.hp-Math.max(55,bullet.damage||120));createParticles(crossbow.x,crossbow.y,18,'#9cecff',1.5);
   if(crossbow.hp<=0){crossbow.dead=true;showStoryToast('自动冰弩已摧毁');createParticles(crossbow.x,crossbow.y,42,'#d8f8ff',2.4);}
  }
  crossbow.cooldown-=dt;
  if(crossbow.cooldown<=0){
   const dx=player.x-crossbow.x,dy=Math.max(180,player.y-crossbow.y),length=Math.max(1,Math.hypot(dx,dy)),speed=390;
   runtime.crossbowBolts.push({type:'crossbowBolt',x:crossbow.x,y:crossbow.y+28,z:crossbow.z,vx:dx/length*speed,vy:dy/length*speed,radius:18,life:4,hit:false});
   crossbow.cooldown=crossbow.fireInterval;showStoryToast('门楼自动弩发射');
  }
 }
 runtime.crossbowBolts.forEach(bolt=>{
  bolt.x+=bolt.vx*dt;bolt.y+=bolt.vy*dt;bolt.z=Math.max(22,bolt.z-315*dt);bolt.life-=dt;
  if(!bolt.hit&&bolt.z<=95&&Math.hypot(player.x-bolt.x,player.y-bolt.y)<CONFIG.tankSize+bolt.radius){bolt.hit=true;bolt.life=0;applyDirectDamage(player,145,null,'门楼冰弩俯射');createParticles(bolt.x,bolt.y,20,'#8eeaff',1.7);}
 });
 runtime.crossbowBolts=runtime.crossbowBolts.filter(bolt=>bolt.life>0&&bolt.x>0&&bolt.x<CONFIG.mapWidth&&bolt.y>0&&bolt.y<CONFIG.mapHeight);
 runtime.hazards=[...(crossbow?[crossbow]:[]),...runtime.crossbowBolts];
 const gate=runtime.gate;
 if(gate&&!runtime.hiddenGateDialogue&&!runtime.playerAttacked&&player.y<=gate.triggerY&&player.x>=gate.x&&player.x<=gate.x+gate.w){
  runtime.hiddenGateDialogue=true;player.invincible=Math.max(player.invincible||0,2);
  triggerStoryMidDialogue([
   ['阿识','left','等一下——我们一炮都没开，竟然沿着中央空门洞直接穿过了霜门！两名近卫没有及时合拢，自动冰弩的俯射也落在了身后。'],
   ['霜门近卫','right','……入侵者未还击。守卫条例只写了“击退敌人”，却没有写该如何处理已经穿过城门的访客。'],
   ['左研29','left','这不是投降。我只是想确认：霜痕设下的究竟是死局，还是一道观察驾驶者选择的考题。'],
   ['霜痕','right','有意思。多数挑战者看见炮口就会立刻开火，你却先夺走了城门的空间。可惜，封印只承认完成战斗的人。'],
   ['阿识','left','隐藏记录已经收下！现在回身处理两名近卫和自动弩，利用500宽门洞分割它们的射线！']
  ]);
 }
 if(enemies.every(enemy=>enemy.dead||enemy.hp<=0)&&crossbow&&crossbow.dead)completeStoryLevel();
}
function updateCrystalCorridor(dt,level,runtime){
 player.mapSlow=.24;player.mapSlowTimer=.2;runtime.icicleCooldown-=dt;
 if(runtime.icicleCooldown<=0){
  const anchors=runtime.ceilingIcicles||[],anchor=anchors[Math.floor(runtime.elapsed/2.2)%Math.max(1,anchors.length)]||{x:player.x,y:player.y,radius:40};
  runtime.fallingIcicles.push({type:'iceSpike',x:anchor.x,y:anchor.y,radius:Math.max(45,anchor.radius+18),timer:.85,life:1.45,phase:'warning'});runtime.icicleCooldown=2.2;
 }
 runtime.fallingIcicles.forEach(spike=>{spike.timer-=dt;spike.life-=dt;if(spike.phase==='warning'&&spike.timer<=0){spike.phase='impact';if(Math.hypot(player.x-spike.x,player.y-spike.y)<spike.radius)applyDirectDamage(player,360,null,'洞顶冰锥坠落');createParticles(spike.x,spike.y,26,'#91edff',2);}});
 runtime.fallingIcicles=runtime.fallingIcicles.filter(spike=>spike.life>0);runtime.hazards=runtime.fallingIcicles;
 if(enemies.every(enemy=>enemy.dead||enemy.hp<=0))completeStoryLevel();
}
function updateFrostBoss(dt,level,runtime){runtime.hazards=runtime.icePatches||[];const onPatch=runtime.hazards.some(p=>Math.hypot(player.x-p.x,player.y-p.y)<p.radius);if(onPatch){player.storyIceReflect=true;if(mouse&&mouse.down)applyDirectDamage(player,55*dt,runtime.boss,'踩冰反噬');}else player.storyIceReflect=false;if(runtime.boss&&!runtime.boss.dead&&runtime.nextAttack<=0){spawnStoryTrackingProjectile(runtime.boss,1);runtime.nextAttack=4;}}
function updateRouteChoice(dt,level,runtime){runtime.hazards=runtime.routeZones||[];if(!runtime.routeChoice){const chosen=runtime.routeZones.find(zone=>Math.hypot(player.x-zone.x,player.y-zone.y)<zone.radius);if(chosen){runtime.routeChoice=chosen.name;const progress=loadStoryProgress();progress.choices.fireRoute=chosen.name;saveStoryProgress(progress);showStoryToast(`已选择：${chosen.name}`);}}if(runtime.routeChoice&&player.y<CONFIG.mapHeight*.22)completeStoryLevel();}
function updateMoltenSurvival(dt,level,runtime){runtime.floatstones.forEach(stone=>stone.active=((runtime.elapsed+stone.phase)%9)<6);runtime.hazards=runtime.floatstones;const safe=runtime.floatstones.some(stone=>stone.active&&Math.hypot(player.x-stone.x,player.y-stone.y)<stone.radius);if(!safe)applyDirectDamage(player,115*dt,null,'流动熔岩');if(runtime.nextMechanic<=0){spawnStoryUnits(['duoduo_ifv'],2,{hp:650});runtime.nextMechanic=12;}if(runtime.elapsed>=90)completeStoryLevel();}
function updateBlazeBoss(dt,level,runtime){if(runtime.overloadTimer>0){runtime.overloadTimer-=dt;if(runtime.overloadTimer<=0)resetStoryWeakParts(runtime.boss);}else if(runtime.boss&&!runtime.boss.dead)runtime.boss.hp=Math.min(runtime.boss.maxHp,runtime.boss.hp+20*dt);if(runtime.nextMechanic<=0){runtime.hazards.push({type:'storyFire',x:runtime.boss.x,y:runtime.boss.y,radius:150,life:5});runtime.nextMechanic=4;}runtime.hazards.forEach(h=>{h.life-=dt;if(Math.hypot(player.x-h.x,player.y-h.y)<h.radius)applyDirectDamage(player,48*dt,runtime.boss,'熔岩灼烧');});runtime.hazards=runtime.hazards.filter(h=>h.life>0);}
function updateMoltenGift(dt,level,runtime){runtime.vents.forEach(vent=>{vent.active=((runtime.elapsed+vent.phase)%6)>4.4;if(vent.active&&Math.hypot(player.x-vent.x,player.y-vent.y)<vent.radius)applyDirectDamage(player,160*dt,null,'熔岩口喷发');});runtime.hazards=runtime.vents;if(runtime.elapsed>=90)completeStoryLevel();}
function updateAutomationLine(dt){enemies.forEach(enemy=>{if(enemy.dead)return;const distance=Math.hypot(player.x-enemy.x,player.y-enemy.y),angle=Math.atan2(player.y-enemy.y,player.x-enemy.x),seen=distance<520&&Math.abs(normalizeAngle(angle-(enemy.angle||0)))<.55;enemy.storyDetected=seen;if(!seen){enemy.shells=0;enemy.mg=0;}else{enemy.shells=Math.max(1,enemy.shells);enemy.mg=Math.max(20,enemy.mg);}});if(enemies.every(enemy=>enemy.dead||enemy.hp<=0))completeStoryLevel();}
function updateConveyorLine(dt,level,runtime){if(runtime.nextMechanic<=0){runtime.hazards.push({type:'mechanicalArm',x:player.x+(Math.random()-.5)*500,y:player.y+(Math.random()-.5)*500,radius:105,timer:1,life:1.35,phase:'warning'});runtime.nextMechanic=1.8;}runtime.hazards.forEach(h=>{h.timer-=dt;h.life-=dt;if(h.phase==='warning'&&h.timer<=0){h.phase='impact';if(Math.hypot(player.x-h.x,player.y-h.y)<h.radius)applyDirectDamage(player,520,null,'机械臂砸击');createParticles(h.x,h.y,30,'#ffc34d',2);}});runtime.hazards=runtime.hazards.filter(h=>h.life>0);if(enemies.every(enemy=>enemy.dead||enemy.hp<=0))completeStoryLevel();}
function updateAssemblerBoss(dt,level,runtime){if(runtime.assemblyInterrupted>0){runtime.assemblyInterrupted-=dt;if(runtime.assemblyInterrupted<=0)resetStoryWeakParts(runtime.boss);}if(runtime.nextMechanic<=0&&runtime.assemblyInterrupted<=0){const angle=Math.random()*Math.PI*2;runtime.assemblyParts.push({type:'assemblyPart',x:runtime.boss.x+Math.cos(angle)*900,y:runtime.boss.y+Math.sin(angle)*900,radius:40,life:12});runtime.nextMechanic=1.6;}runtime.assemblyParts.forEach(part=>{const angle=Math.atan2(runtime.boss.y-part.y,runtime.boss.x-part.x);part.x+=Math.cos(angle)*115*dt;part.y+=Math.sin(angle)*115*dt;part.life-=dt;if(Math.hypot(part.x-runtime.boss.x,part.y-runtime.boss.y)<75){part.life=0;runtime.boss.hp=Math.min(runtime.boss.maxHp,runtime.boss.hp+420);}});interceptStoryObjects(runtime.assemblyParts,'零件拦截',()=>{runtime.assemblyStops++;if(runtime.assemblyStops%3===0){runtime.assemblyInterrupted=7;resetStoryWeakParts(runtime.boss);runtime.boss.storyWeakParts.forEach(part=>part.hp=0);runtime.boss.storyVulnerable=true;}});runtime.assemblyParts=runtime.assemblyParts.filter(part=>part.life>0);runtime.hazards=runtime.assemblyParts;}
function updateCounterCode(dt,level,runtime){runtime.hazards=runtime.codeGates;runtime.codeGates.forEach(gate=>{if(!gate.crossed&&player.y<=gate.y){gate.crossed=true;showStoryToast(`反制代码 ${runtime.codeGates.filter(item=>item.crossed).length}/3`);}});if(runtime.codeGates.every(gate=>gate.crossed))completeStoryLevel();}
function updateMirrorWaves(dt,level,runtime){enemies.forEach(enemy=>{enemy.storyMirrorWeapon=currentWeapon;enemy.color=currentWeapon==='shell'?'#6de8ff':currentWeapon==='mg'?'#ff6845':'#f3ed6b';});if(enemies.every(enemy=>enemy.dead||enemy.hp<=0)&&runtime.wave<3&&runtime.waveDelay<=0)runtime.waveDelay=2;if(runtime.waveDelay>0){runtime.waveDelay-=dt;if(runtime.waveDelay<=0){runtime.wave++;spawnStoryUnits(['kimi_tank'],3,{hp:1200,mirror:true});showStoryToast(`镜像第 ${runtime.wave}/3 轮`);}}if(runtime.wave===3&&enemies.every(enemy=>enemy.dead||enemy.hp<=0))completeStoryLevel();}
function updateVoidBoss(dt,level,runtime){if(runtime.boss&&!runtime.boss.dead&&runtime.nextAttack<=0){spawnStoryTrackingProjectile(runtime.boss,2);runtime.nextAttack=3.2;}}
function updateSealWaves(dt,level,runtime){if(enemies.every(enemy=>enemy.dead||enemy.hp<=0)&&runtime.wave<3&&runtime.waveDelay<=0){runtime.waveDelay=3;player.hp=Math.min(player.maxHp,player.hp+player.maxHp*.22);player.shells=Math.min(player.maxShells,player.shells+18);showStoryToast('波次休整 · 修复22% 并补充弹药');}if(runtime.waveDelay>0){runtime.waveDelay-=dt;if(runtime.waveDelay<=0){runtime.wave++;const spawned=spawnStoryUnits(['xingchen27a'],4,{hp:1100});spawned.forEach((tank,index)=>tank.storyElement=['ice','fire','thunder'][index%3]);}}if(runtime.wave===3&&enemies.every(enemy=>enemy.dead||enemy.hp<=0))completeStoryLevel();}
function updateTriCoreBoss(dt,level,runtime){const boss=runtime.boss;if(!boss)return;const desired=boss.hp/boss.maxHp>.66?0:boss.hp/boss.maxHp>.33?1:2;if(desired!==runtime.phaseIndex){runtime.phaseIndex=desired;runtime.elementChain=0;resetStoryWeakParts(boss);showStoryToast(`三相核心转入${['冰霜','火焰','雷霆'][desired]}阶段`);}boss.storyPhase=['ice','fire','thunder'][runtime.phaseIndex];boss.color=['#55dfff','#ff6040','#eee95f'][runtime.phaseIndex];if(runtime.nextAttack<=0){spawnStoryTrackingProjectile(boss,1+runtime.phaseIndex);runtime.nextAttack=3.5-runtime.phaseIndex*.4;}}
function updateTargetChallenge(dt,level,runtime){if(!runtime.targets.length){completeStoryLevel();return;}if(level.mechanic==='frostGift'&&player.shells<=0&&!bullets.some(b=>b.owner===player&&b.type==='shell'))failStoryLevel('15发弹药已用尽');}
function updateStoryTargets(dt,level,runtime){runtime.targets.forEach(target=>{const speedMult=level.mechanic==='thunderGift'?1+runtime.combo*.035:1;target.x+=target.vx*dt*speedMult;target.y+=target.vy*dt*speedMult;if(target.x<220||target.x>CONFIG.mapWidth-220)target.vx*=-1;if(target.y<220||target.y>CONFIG.mapHeight-220)target.vy*=-1;if(target.zigzag)target.vy+=Math.sin(runtime.elapsed*4+target.index)*45*dt;});for(const bullet of [...bullets]){if(bullet.owner!==player)continue;const target=runtime.targets.find(item=>Math.hypot(item.x-bullet.x,item.y-bullet.y)<item.radius+22);if(!target)continue;if(level.mechanic==='frostGift'&&bullet.type!=='shell')continue;if(level.mechanic==='sealGift'&&getStoryWeaponElement(bullet.type)!==target.element){if(typeof showMessage==='function')showMessage('属性不匹配 · 切换武器','#ffb56a');continue;}const bi=bullets.indexOf(bullet);if(bi>=0)bullets.splice(bi,1);runtime.targets.splice(runtime.targets.indexOf(target),1);runtime.combo++;createParticles(target.x,target.y,20,target.gold?'#ffe56b':target.element==='fire'?'#ff6842':target.element==='thunder'?'#f4ed68':'#68e8ff',1.8);if(target.gold){gameTime+=2;showStoryToast('金色标记 · 读取时间+2秒');}}runtime.hazards=[...runtime.targets,...(runtime.hazards||[]).filter(h=>!['iceTarget','hologram','trainingBall','elementTarget'].includes(h.type))];}
function interceptStoryObjects(objects,label,onHit){for(const bullet of [...bullets]){if(bullet.owner!==player||bullet.type!=='shell')continue;const target=objects.find(item=>item.life>0&&Math.hypot(item.x-bullet.x,item.y-bullet.y)<item.radius+25);if(!target)continue;target.life=0;const index=bullets.indexOf(bullet);if(index>=0)bullets.splice(index,1);createParticles(target.x,target.y,24,'#ffe074',2);showStoryToast(label);if(onHit)onHit(target);}}
function spawnStoryUnits(types,count,options={}){const created=[];for(let i=0;i<count;i++){const type=types[i%types.length],data=TANKS[type];if(!data)continue;const tank=createTank(data,CONFIG.mapWidth*(.2+Math.random()*.6),CONFIG.mapHeight*(.12+Math.random()*.24),'red',false,3);tank.hp=tank.maxHp=options.hp||Math.round(tank.maxHp*.85);tank.shells=tank.maxShells;tank.mg=tank.maxMG;tank.aa=tank.maxAA;tank.aiDamageMult=.62;tank.storyMirror=!!options.mirror;enemies.push(tank);created.push(tank);}aiTanks=[...allies,...enemies];return created;}
function spawnStoryTrackingProjectile(boss,count=1){for(let i=0;i<count;i++){const angle=Math.atan2(player.y-boss.y,player.x-boss.x)+(i-(count-1)/2)*.2;bullets.push({x:boss.x+Math.cos(angle)*70,y:boss.y+Math.sin(angle)*70,z:(boss.z||0)+24,vx:0,vy:0,vz:0,damage:260,team:'red',type:'storyOrb',owner:boss,life:8,maxLife:8,age:0,storyTracking:true,trackingSpeed:250,hitTanks:new Set(),maxTargetHits:1,ignoresObstacles:false,armorIgnorePercent:.35});}createParticles(boss.x,boss.y,14,'#d06dff',1.3);}
function updateStoryTrackingProjectiles(dt){bullets.filter(b=>b.storyTracking).forEach(orb=>{const angle=Math.atan2(player.y-orb.y,player.x-orb.x),current=Math.atan2(orb.storyVY||Math.sin(angle),orb.storyVX||Math.cos(angle)),next=current+Math.max(-1.8*dt,Math.min(1.8*dt,normalizeAngle(angle-current)));orb.storyVX=Math.cos(next);orb.storyVY=Math.sin(next);orb.x+=orb.storyVX*orb.trackingSpeed*dt;orb.y+=orb.storyVY*orb.trackingSpeed*dt;orb.z=(player.z||0)+22;});}
function updateStoryProjectileCounters(){const friendly=bullets.filter(b=>b.owner===player&&b.type==='shell'),hostile=bullets.filter(b=>b.storyTracking);for(const shell of friendly){const orb=hostile.find(item=>bullets.includes(item)&&Math.hypot(item.x-shell.x,item.y-shell.y)<62);if(!orb)continue;const x=(orb.x+shell.x)/2,y=(orb.y+shell.y)/2;bullets.splice(bullets.indexOf(orb),1);bullets.splice(bullets.indexOf(shell),1);createParticles(x,y,34,'#e7b7ff',2.4);if(storyModeState.runtime&&storyModeState.runtime.boss&&Math.hypot(storyModeState.runtime.boss.x-x,storyModeState.runtime.boss.y-y)<300)storyModeState.runtime.boss.hp-=220;showStoryToast('✦ 反制成功：追踪弹被提前引爆');}}

function checkStoryWinCondition(){if(gameMode!=='story'||!storyModeState.active)return false;if(player&&player.dead)failStoryLevel('元素坦克被击毁');return true;}
function handleStoryTimeExpired(){if(gameMode!=='story')return false;failStoryLevel('关卡时限耗尽');return true;}
function completeStoryLevel(){const runtime=storyModeState.runtime,level=getCurrentStoryLevel();if(!runtime||runtime.success||!level)return;runtime.success=true;gameState='storyDialogue';const progress=loadStoryProgress();if(!progress.completed.includes(level.id))progress.completed.push(level.id);if(level.id==='triCore'){progress.finished=true;unlockMechaPea();}saveStoryProgress(progress);showStoryDialogue(getExpandedStoryOutro(level),returnToStoryMap,level.rewardLevel?'领取奖励':'返回节点地图');}
function failStoryLevel(reason){const runtime=storyModeState.runtime;if(!runtime||runtime.failed)return;runtime.failed=true;gameState='storyDialogue';showStoryDialogue([{speaker:'阿识',side:'left',tank:'helper',text:`任务失败：${reason}。我们可以重新规划战术。`}],showStoryFailureChoices,'查看选项');}
function showStoryFailureChoices(){const panel=document.getElementById('storyFailurePanel');if(!panel)return;panel.classList.add('active');panel.innerHTML=`<h2>任务失败</h2><p>${getCurrentStoryLevel()?.hint||''}</p><button class="story-primary" onclick="retryStoryLevel()">重试本关</button><button onclick="returnToStoryMap()">返回节点地图</button>`;}
function retryStoryLevel(){const panel=document.getElementById('storyFailurePanel');if(panel)panel.classList.remove('active');const level=getCurrentStoryLevel();storyModeState.active=false;resetGame();storyModeState.currentLevel=level;storyModeState.currentLevelId=level.id;launchStoryBattle();}
function returnToStoryMap(){const panel=document.getElementById('storyFailurePanel');if(panel)panel.classList.remove('active');storyModeState.active=false;storyModeState.runtime=null;resetGame();openStoryMode();}
function unlockMechaPea(){if(typeof playerStats==='undefined')return;if(!playerStats.unlockedTanks)playerStats.unlockedTanks=[];if(!playerStats.unlockedTanks.includes('mecha_pea'))playerStats.unlockedTanks.push('mecha_pea');if(typeof saveStats==='function')saveStats();if(typeof renderTankList==='function')renderTankList();}
function applyMechaPeaTriPhase(tank,projectile){if(!tank||tank.tankType!=='mecha_pea'||projectile.type!=='shell')return projectile;const phases=['ice','fire','toxin'],phase=phases[tank.triPhaseIndex||0];tank.triPhaseIndex=((tank.triPhaseIndex||0)+1)%phases.length;projectile.triPhase=phase;const resonance=!!tank.storyTriResonance;if(resonance){projectile.damage*=1.18;projectile.explosionRadius=Math.max(projectile.explosionRadius||0,115);}if(phase==='ice'){projectile.evolutionStyle='tri-ice-prism';projectile.evolutionTrail='#69e9ff';projectile.storyForcedIce=true;}else if(phase==='fire'){projectile.evolutionStyle='tri-fire-orb';projectile.evolutionTrail='#ff6338';projectile.fireData={duration:resonance?6:4,damage:resonance?58:45,interval:1,chance:1,splashRadius:resonance?135:90,source:tank};}else{projectile.evolutionStyle='tri-toxic-orb';projectile.evolutionTrail='#8cff62';projectile.toxinData={duration:resonance?7:5,damage:resonance?50:38,interval:1,slow:.18,chance:1,splashRadius:resonance?145:100,source:tank};}return projectile;}
function showStoryToast(text){if(typeof showNotification==='function')showNotification(text,'#69d8ff');}
if(typeof window!=='undefined')window.addEventListener('resize',()=>{if(gameState==='storyMap')drawStoryNodeMap();});
