// Verified official Naver Press Desk (media.naver.com/press/{naverCode}) directory for all Naver CP outlets
export const OUTLET_PRESS_DESK_MAP: Record<
  string,
  { name: string; naverCode: string; homepageUrl: string }
> = {
  // 10대 대표 종합·경제지 (기본값)
  mk: { name: '매일경제', naverCode: '009', homepageUrl: 'https://www.mk.co.kr' },
  hankyung: { name: '한국경제', naverCode: '015', homepageUrl: 'https://www.hankyung.com' },
  chosun: { name: '조선일보', naverCode: '023', homepageUrl: 'https://www.chosun.com' },
  joongang: { name: '중앙일보', naverCode: '025', homepageUrl: 'https://www.joongang.co.kr' },
  donga: { name: '동아일보', naverCode: '020', homepageUrl: 'https://www.donga.com' },
  hani: { name: '한겨레', naverCode: '028', homepageUrl: 'https://www.hani.co.kr' },
  khan: { name: '경향신문', naverCode: '032', homepageUrl: 'https://www.khan.co.kr' },
  sedaily: { name: '서울경제', naverCode: '011', homepageUrl: 'https://www.sedaily.com' },
  herald: { name: '헤럴드경제', naverCode: '016', homepageUrl: 'https://biz.heraldcorp.com' },
  asiae: { name: '아시아경제', naverCode: '277', homepageUrl: 'https://www.asiae.co.kr' },

  // 종합·경제·전문지 (Naver CP 공식 코드 검증 완료)
  kmib: { name: '국민일보', naverCode: '005', homepageUrl: 'https://www.kmib.co.kr' },
  hankookilbo: { name: '한국일보', naverCode: '469', homepageUrl: 'https://www.hankookilbo.com' },
  munhwa: { name: '문화일보', naverCode: '021', homepageUrl: 'https://www.munhwa.com' },
  seoul: { name: '서울신문', naverCode: '081', homepageUrl: 'https://www.seoul.co.kr' },
  segye: { name: '세계일보', naverCode: '022', homepageUrl: 'https://www.segye.com' },
  mt: { name: '머니투데이', naverCode: '008', homepageUrl: 'https://www.mt.co.kr' },
  edaily: { name: '이데일리', naverCode: '018', homepageUrl: 'https://www.edaily.co.kr' },
  fnnews: { name: '파이낸셜뉴스', naverCode: '014', homepageUrl: 'https://www.fnnews.com' },
  chosunbiz: { name: '조선비즈', naverCode: '366', homepageUrl: 'https://biz.chosun.com' },
  nocut: { name: '노컷뉴스', naverCode: '079', homepageUrl: 'https://www.nocutnews.co.kr' },
  newstapa: { name: '뉴스타파', naverCode: '607', homepageUrl: 'https://newstapa.org' },
  thefact: { name: '더팩트', naverCode: '629', homepageUrl: 'https://www.tf.co.kr' },
  dailian: { name: '데일리안', naverCode: '119', homepageUrl: 'https://www.dailian.co.kr' },
  sidae: { name: '동행미디어 시대', naverCode: '417', homepageUrl: 'https://www.sidaenews.co.kr' },
  mediatoday: { name: '미디어오늘', naverCode: '006', homepageUrl: 'https://www.mediatoday.co.kr' },
  bizwatch: { name: '비즈워치', naverCode: '648', homepageUrl: 'https://news.bizwatch.co.kr' },
  inews24: { name: '아이뉴스24', naverCode: '031', homepageUrl: 'https://www.inews24.com' },
  ohmynews: { name: '오마이뉴스', naverCode: '047', homepageUrl: 'https://www.ohmynews.com' },
  economist: { name: '이코노미스트', naverCode: '243', homepageUrl: 'https://economist.co.kr' },
  joseilbo: { name: '조세일보', naverCode: '123', homepageUrl: 'https://www.joseilbo.com' },
  joongangsunday: { name: '중앙SUNDAY', naverCode: '353', homepageUrl: 'https://www.joongang.co.kr/sunday' },
  pressian: { name: '프레시안', naverCode: '002', homepageUrl: 'https://www.pressian.com' },

  // 방송·통신사
  yonhap: { name: '연합뉴스', naverCode: '001', homepageUrl: 'https://www.yna.co.kr' },
  news1: { name: '뉴스1', naverCode: '421', homepageUrl: 'https://www.news1.kr' },
  newsis: { name: '뉴시스', naverCode: '003', homepageUrl: 'https://www.newsis.com' },
  kbs: { name: 'KBS', naverCode: '056', homepageUrl: 'https://news.kbs.co.kr' },
  mbc: { name: 'MBC', naverCode: '214', homepageUrl: 'https://imnews.imbc.com' },
  sbs: { name: 'SBS', naverCode: '055', homepageUrl: 'https://news.sbs.co.kr' },
  ytn: { name: 'YTN', naverCode: '052', homepageUrl: 'https://www.ytn.co.kr' },
  jtbc: { name: 'JTBC', naverCode: '437', homepageUrl: 'https://news.jtbc.co.kr' },
  tvchosun: { name: 'TV조선', naverCode: '448', homepageUrl: 'http://news.tvchosun.com' },
  mbn: { name: 'MBN', naverCode: '057', homepageUrl: 'https://www.mbn.co.kr' },
  channela: { name: '채널A', naverCode: '449', homepageUrl: 'https://www.ichannela.com' },
  yonhaptv: { name: '연합뉴스TV', naverCode: '422', homepageUrl: 'https://www.yonhapnewstv.co.kr' },
  wowtv: { name: '한국경제TV', naverCode: '215', homepageUrl: 'https://www.wowtv.co.kr' },
  sbsbiz: { name: 'SBS 비즈', naverCode: '374', homepageUrl: 'https://biz.sbs.co.kr' },
  kbc: { name: 'kbc광주방송', naverCode: '660', homepageUrl: 'https://www.ikbc.co.kr' },

  // IT 전문지
  etnews: { name: '전자신문', naverCode: '030', homepageUrl: 'https://www.etnews.com' },
  zdnet: { name: '지디넷코리아', naverCode: '092', homepageUrl: 'https://zdnet.co.kr' },
  bloter: { name: '블로터', naverCode: '293', homepageUrl: 'https://www.bloter.net' },
  ddaily: { name: '디지털데일리', naverCode: '138', homepageUrl: 'https://www.ddaily.co.kr' },
  dt: { name: '디지털타임스', naverCode: '029', homepageUrl: 'https://www.dt.co.kr' },

  // 지역 주요 언론사
  gangwon_domin: { name: '강원도민일보', naverCode: '654', homepageUrl: 'https://www.kado.net' },
  gangwon_ilbo: { name: '강원일보', naverCode: '087', homepageUrl: 'https://www.kwnews.co.kr' },
  gyeonggi_ilbo: { name: '경기일보', naverCode: '666', homepageUrl: 'https://www.kyeonggi.com' },
  kookje_shinmun: { name: '국제신문', naverCode: '658', homepageUrl: 'http://www.kookje.co.kr' },
  daejeon_ilbo: { name: '대전일보', naverCode: '656', homepageUrl: 'https://www.daejonilbo.com' },
  imaeil: { name: '매일신문', naverCode: '088', homepageUrl: 'https://www.imaeil.com' },
  busan_ilbo: { name: '부산일보', naverCode: '082', homepageUrl: 'https://www.busan.com' },
};

export const TOP10_CUSTOM_HOMEPAGE_IDS = new Set([
  'khan',
  'chosun',
  'joongang',
  'donga',
  'hani',
  'mk',
  'sedaily',
  'herald',
  'asiae',
]);

export const SECTOR_CONFIGS: {
  sector: 'construction' | 'realestate' | 'urban' | 'finance';
  sectorLabel: string;
  pressSection: string;
  queries: string[];
  relevanceRegex: RegExp;
  defaultTag: string;
}[] = [
  {
    sector: 'construction',
    sectorLabel: '건설·SOC',
    pressSection: '건설·산업 면',
    queries: ['건설 수주', '인프라 착공', '플랜트 원전 시공', 'GTX 철도 토목'],
    relevanceRegex: /건설|수주|시공|착공|토목|플랜트|원전|GTX|철도|인프라|공사비|현대건설|대우건설|삼성물산|GS건설|DL이앤씨|HDC|시공사/,
    defaultTag: '건설수주',
  },
  {
    sector: 'realestate',
    sectorLabel: '부동산·주택',
    pressSection: '부동산·정책 면',
    queries: ['부동산 아파트', '분양 청약 경쟁률', '전세 월세 집값', '주택공급 임대 매매'],
    relevanceRegex: /부동산|아파트|청약|분양|집값|주택|전세|월세|임대|매매|빌딩|오피스텔|토지|공급|실거래가|거래량/,
    defaultTag: '부동산시장',
  },
  {
    sector: 'urban',
    sectorLabel: '도시개발·정비',
    pressSection: '도시개발·정비 면',
    queries: ['재건축 재개발 정비사업', '신도시 택지개발 도시재생', '모아타운 신속통합기획', '역세권 복합개발 스마트시티'],
    relevanceRegex: /도시개발|도시재생|재건축|재개발|정비사업|정비구역|신도시|택지|지구단위|신속통합|모아타운|복합개발|역세권|용적률|선도지구|스마트시티|노후계획도시/,
    defaultTag: '도시개발',
  },
  {
    sector: 'finance',
    sectorLabel: '금융·금리',
    pressSection: '금융·증권 면',
    queries: ['기준금리 대출', '부동산PF 금융', '주담대 가계부채 은행', '환율 코스피 증권'],
    relevanceRegex: /금융|금리|은행|한국은행|기준금리|대출|주담대|PF|가계부채|금융위|금감원|증권|보험|밸류업|코스피|환율|펀드/,
    defaultTag: '금융정책',
  },
];
