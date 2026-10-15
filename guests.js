// 宾客图鉴:60 位历史人物(5 类 × 12),按通关数解锁——五类轮流,每通关 5 关来访一位。
// window.GUEST_CATS = [{ name, venue }];window.GUESTS = [{ name, cat, title, desc, img, need }]。
(function () {
  window.GUEST_CATS = [{"name": "美人", "venue": "绣楼"}, {"name": "名将", "venue": "演武场"}, {"name": "文人", "venue": "文心阁"}, {"name": "巨贾", "venue": "聚宝轩"}, {"name": "帝王", "venue": "御书房"}];
  window.GUESTS = [
 {
  "name": "西施",
  "cat": "美人",
  "title": "春秋·越国",
  "desc": "浣纱溪畔,倾城之貌,\"沉鱼\"之典由她而来。",
  "img": "guests/g01.jpg",
  "need": 5
 },
 {
  "name": "白起",
  "cat": "名将",
  "title": "战国·秦",
  "desc": "号\"人屠\",长平之战大破赵军,一生七十余战不败。",
  "img": "guests/g13.jpg",
  "need": 10
 },
 {
  "name": "屈原",
  "cat": "文人",
  "title": "战国·楚",
  "desc": "忧国忧民,作《离骚》,端午的由来与他有关。",
  "img": "guests/g25.jpg",
  "need": 15
 },
 {
  "name": "范蠡",
  "cat": "巨贾",
  "title": "春秋",
  "desc": "助勾践灭吴后弃官经商,三致千金,后世尊为商圣。",
  "img": "guests/g37.jpg",
  "need": 20
 },
 {
  "name": "秦始皇",
  "cat": "帝王",
  "title": "秦",
  "desc": "统一六国,书同文、车同轨,立郡县之制。",
  "img": "guests/g49.jpg",
  "need": 25
 },
 {
  "name": "王昭君",
  "cat": "美人",
  "title": "西汉",
  "desc": "出塞和亲,远嫁匈奴,换来边境数十年安宁。",
  "img": "guests/g02.jpg",
  "need": 30
 },
 {
  "name": "韩信",
  "cat": "名将",
  "title": "西汉",
  "desc": "国士无双,\"多多益善\",背水一战名垂兵史。",
  "img": "guests/g14.jpg",
  "need": 35
 },
 {
  "name": "司马迁",
  "cat": "文人",
  "title": "西汉",
  "desc": "忍辱著《史记》,\"究天人之际,通古今之变\"。",
  "img": "guests/g26.jpg",
  "need": 40
 },
 {
  "name": "子贡",
  "cat": "巨贾",
  "title": "春秋",
  "desc": "孔子弟子,善言辞会经商,\"货殖\"成家。",
  "img": "guests/g38.jpg",
  "need": 45
 },
 {
  "name": "汉武帝",
  "cat": "帝王",
  "title": "西汉",
  "desc": "北击匈奴,通西域,\"罢黜百家,独尊儒术\"。",
  "img": "guests/g50.jpg",
  "need": 50
 },
 {
  "name": "貂蝉",
  "cat": "美人",
  "title": "东汉末",
  "desc": "传说中智设连环计,离间董卓与吕布。",
  "img": "guests/g03.jpg",
  "need": 55
 },
 {
  "name": "卫青",
  "cat": "名将",
  "title": "西汉",
  "desc": "七击匈奴,收复河套,汉武帝的柱石之将。",
  "img": "guests/g15.jpg",
  "need": 60
 },
 {
  "name": "陶渊明",
  "cat": "文人",
  "title": "东晋",
  "desc": "不为五斗米折腰,归隐田园,\"采菊东篱下\"。",
  "img": "guests/g27.jpg",
  "need": 65
 },
 {
  "name": "吕不韦",
  "cat": "巨贾",
  "title": "战国·秦",
  "desc": "以\"奇货可居\"投资公子异人,官至秦相,主编《吕氏春秋》。",
  "img": "guests/g39.jpg",
  "need": 70
 },
 {
  "name": "唐太宗",
  "cat": "帝王",
  "title": "唐",
  "desc": "开创贞观之治,\"以铜为镜,可以正衣冠\"。",
  "img": "guests/g51.jpg",
  "need": 75
 },
 {
  "name": "杨贵妃",
  "cat": "美人",
  "title": "唐·玄宗朝",
  "desc": "丰腴明艳,\"羞花\"之誉,长生殿故事流传千古。",
  "img": "guests/g04.jpg",
  "need": 80
 },
 {
  "name": "霍去病",
  "cat": "名将",
  "title": "西汉",
  "desc": "少年封侯,\"匈奴未灭,何以家为\"。",
  "img": "guests/g16.jpg",
  "need": 85
 },
 {
  "name": "王维",
  "cat": "文人",
  "title": "唐",
  "desc": "诗中有画,画中有诗,人称\"诗佛\"。",
  "img": "guests/g28.jpg",
  "need": 90
 },
 {
  "name": "沈万三",
  "cat": "巨贾",
  "title": "元末明初",
  "desc": "江南首富,传说得聚宝盆,富可敌国。",
  "img": "guests/g40.jpg",
  "need": 95
 },
 {
  "name": "武则天",
  "cat": "帝王",
  "title": "唐·周",
  "desc": "中国史上唯一正统女皇帝,改国号为周。",
  "img": "guests/g52.jpg",
  "need": 100
 },
 {
  "name": "赵飞燕",
  "cat": "美人",
  "title": "西汉",
  "desc": "舞姿轻盈,相传能作掌上之舞。",
  "img": "guests/g05.jpg",
  "need": 105
 },
 {
  "name": "李广",
  "cat": "名将",
  "title": "西汉",
  "desc": "飞将军,善射,\"桃李不言,下自成蹊\"赞的便是他。",
  "img": "guests/g17.jpg",
  "need": 110
 },
 {
  "name": "李白",
  "cat": "文人",
  "title": "唐",
  "desc": "诗仙,\"举杯邀明月\",斗酒诗百篇。",
  "img": "guests/g29.jpg",
  "need": 115
 },
 {
  "name": "胡雪岩",
  "cat": "巨贾",
  "title": "清",
  "desc": "红顶商人,创胡庆余堂,\"戒欺\"二字悬于堂上。",
  "img": "guests/g41.jpg",
  "need": 120
 },
 {
  "name": "唐玄宗",
  "cat": "帝王",
  "title": "唐",
  "desc": "前期开创开元盛世,后期有安史之乱。",
  "img": "guests/g53.jpg",
  "need": 125
 },
 {
  "name": "甄宓",
  "cat": "美人",
  "title": "三国·魏",
  "desc": "才貌双绝,后世传说《洛神赋》与她相关。",
  "img": "guests/g06.jpg",
  "need": 130
 },
 {
  "name": "关羽",
  "cat": "名将",
  "title": "三国·蜀",
  "desc": "义薄云天,过五关斩六将,后世尊为\"武圣\"。",
  "img": "guests/g18.jpg",
  "need": 135
 },
 {
  "name": "杜甫",
  "cat": "文人",
  "title": "唐",
  "desc": "诗圣,忧民忧世,\"安得广厦千万间\"。",
  "img": "guests/g30.jpg",
  "need": 140
 },
 {
  "name": "乔致庸",
  "cat": "巨贾",
  "title": "清",
  "desc": "晋商代表,\"货通天下,汇通天下\",票号兴盛。",
  "img": "guests/g42.jpg",
  "need": 145
 },
 {
  "name": "宋太祖",
  "cat": "帝王",
  "title": "北宋",
  "desc": "陈桥兵变建宋,\"杯酒释兵权\",重文抑武。",
  "img": "guests/g54.jpg",
  "need": 150
 },
 {
  "name": "大乔",
  "cat": "美人",
  "title": "三国·东吴",
  "desc": "江东二乔之姐,孙策之妻。",
  "img": "guests/g07.jpg",
  "need": 155
 },
 {
  "name": "赵云",
  "cat": "名将",
  "title": "三国·蜀",
  "desc": "长坂坡七进七出,一身是胆。",
  "img": "guests/g19.jpg",
  "need": 160
 },
 {
  "name": "白居易",
  "cat": "文人",
  "title": "唐",
  "desc": "诗求平易,老妪能解,《长恨歌》《琵琶行》名篇。",
  "img": "guests/g31.jpg",
  "need": 165
 },
 {
  "name": "伍秉鉴",
  "cat": "巨贾",
  "title": "清",
  "desc": "广州十三行之首,当年世界级首富之一。",
  "img": "guests/g43.jpg",
  "need": 170
 },
 {
  "name": "成吉思汗",
  "cat": "帝王",
  "title": "蒙古",
  "desc": "统一蒙古诸部,建大蒙古国,开创草原帝国。",
  "img": "guests/g55.jpg",
  "need": 175
 },
 {
  "name": "小乔",
  "cat": "美人",
  "title": "三国·东吴",
  "desc": "江东二乔之妹,周瑜之妻,\"铜雀春深\"典故中的名字。",
  "img": "guests/g08.jpg",
  "need": 180
 },
 {
  "name": "岳飞",
  "cat": "名将",
  "title": "南宋",
  "desc": "精忠报国,岳家军\"撼山易,撼岳家军难\"。",
  "img": "guests/g20.jpg",
  "need": 185
 },
 {
  "name": "苏轼",
  "cat": "文人",
  "title": "北宋",
  "desc": "\"大江东去\",诗词文书画皆通,一生乐观旷达。",
  "img": "guests/g32.jpg",
  "need": 190
 },
 {
  "name": "王炽",
  "cat": "巨贾",
  "title": "清",
  "desc": "云南商人,号\"天下第一商\",票号遍及全国。",
  "img": "guests/g44.jpg",
  "need": 195
 },
 {
  "name": "忽必烈",
  "cat": "帝王",
  "title": "元",
  "desc": "建立元朝,定都大都,统一中国。",
  "img": "guests/g56.jpg",
  "need": 200
 },
 {
  "name": "虞姬",
  "cat": "美人",
  "title": "秦末",
  "desc": "随项羽征战,垓下之围,慷慨以剑自刎。",
  "img": "guests/g09.jpg",
  "need": 205
 },
 {
  "name": "薛仁贵",
  "cat": "名将",
  "title": "唐",
  "desc": "\"三箭定天山\",白袍骁将,军中传唱。",
  "img": "guests/g21.jpg",
  "need": 210
 },
 {
  "name": "李清照",
  "cat": "文人",
  "title": "南宋",
  "desc": "婉约词宗,\"人比黄花瘦\"传诵千古。",
  "img": "guests/g33.jpg",
  "need": 215
 },
 {
  "name": "张謇",
  "cat": "巨贾",
  "title": "清末民初",
  "desc": "状元办实业,创办大生纱厂,开办学校。",
  "img": "guests/g45.jpg",
  "need": 220
 },
 {
  "name": "朱元璋",
  "cat": "帝王",
  "title": "明",
  "desc": "出身贫苦的开国皇帝,\"高筑墙,广积粮,缓称王\"。",
  "img": "guests/g57.jpg",
  "need": 225
 },
 {
  "name": "李师师",
  "cat": "美人",
  "title": "北宋",
  "desc": "汴京名伎,色艺双绝,与词人周邦彦等多有往来。",
  "img": "guests/g10.jpg",
  "need": 230
 },
 {
  "name": "戚继光",
  "cat": "名将",
  "title": "明",
  "desc": "抗倭名将,创\"戚家军\"与鸳鸯阵,保东南海疆。",
  "img": "guests/g22.jpg",
  "need": 235
 },
 {
  "name": "欧阳修",
  "cat": "文人",
  "title": "北宋",
  "desc": "文坛领袖,作《醉翁亭记》,\"醉翁之意不在酒\"。",
  "img": "guests/g34.jpg",
  "need": 240
 },
 {
  "name": "盛宣怀",
  "cat": "巨贾",
  "title": "清末",
  "desc": "兴办轮船、电报、铁路与银行,\"中国实业之父\"之一。",
  "img": "guests/g46.jpg",
  "need": 245
 },
 {
  "name": "朱棣",
  "cat": "帝王",
  "title": "明",
  "desc": "迁都北京,修《永乐大典》,郑和下西洋于其时。",
  "img": "guests/g58.jpg",
  "need": 250
 },
 {
  "name": "陈圆圆",
  "cat": "美人",
  "title": "明末清初",
  "desc": "江南名伎,\"冲冠一怒为红颜\"的传说由她而起。",
  "img": "guests/g11.jpg",
  "need": 255
 },
 {
  "name": "郭子仪",
  "cat": "名将",
  "title": "唐",
  "desc": "平定安史之乱的功臣,位极人臣而福寿双全。",
  "img": "guests/g23.jpg",
  "need": 260
 },
 {
  "name": "辛弃疾",
  "cat": "文人",
  "title": "南宋",
  "desc": "词中之龙,\"醉里挑灯看剑\",以词抒壮志。",
  "img": "guests/g35.jpg",
  "need": 265
 },
 {
  "name": "荣宗敬",
  "cat": "巨贾",
  "title": "民国",
  "desc": "与弟荣德生创办面粉、纺织企业,人称\"面粉大王\"。",
  "img": "guests/g47.jpg",
  "need": 270
 },
 {
  "name": "康熙",
  "cat": "帝王",
  "title": "清",
  "desc": "在位六十一年,平三藩、收台湾,亲政勤学。",
  "img": "guests/g59.jpg",
  "need": 275
 },
 {
  "name": "花木兰",
  "cat": "美人",
  "title": "南北朝",
  "desc": "替父从军十二年,\"雌兔眼迷离\"传唱至今。",
  "img": "guests/g12.jpg",
  "need": 280
 },
 {
  "name": "徐达",
  "cat": "名将",
  "title": "明",
  "desc": "朱元璋的开国第一功臣,北伐灭元,治军严明。",
  "img": "guests/g24.jpg",
  "need": 285
 },
 {
  "name": "曹雪芹",
  "cat": "文人",
  "title": "清",
  "desc": "穷困中十年著书,留下《红楼梦》。",
  "img": "guests/g36.jpg",
  "need": 290
 },
 {
  "name": "虞洽卿",
  "cat": "巨贾",
  "title": "民国",
  "desc": "宁波商帮领袖,创办轮船公司,执上海商界牛耳。",
  "img": "guests/g48.jpg",
  "need": 295
 },
 {
  "name": "乾隆",
  "cat": "帝王",
  "title": "清",
  "desc": "在位六十年,盛世之巅,爱诗好书画,编《四库全书》。",
  "img": "guests/g60.jpg",
  "need": 300
 }
];
})();
