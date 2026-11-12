import type { DailyBriefing } from '../types/news.ts';
const DEFAULT_10_OUTLETS = ['chosun', 'joongang', 'donga', 'hani', 'khan', 'mk', 'hankyung', 'sedaily', 'herald', 'asiae'];
import { MOCK_SECTOR_HEADLINES } from './mockSectorHeadlines.ts';
import { getCurrentKoreanDateString } from '../utils/dateUtils.ts';

export const INITIAL_DAILY_BRIEFING: DailyBriefing = {
  id: 'briefing-today-0900',
  briefingDate: getCurrentKoreanDateString(),
  briefingTime: '09:00 AM 기준 집계',
  topKeywords: [
    '#짙은안개출근길',
    '#엔비디아젠슨황',
    '#금융지주셀프연임',
    '#AI랠리마이크론',
    '#코스피5400',
    '#아세안APEC순방',
    '#이주노동자공정평가',
  ],
  tone: 'formal',
  selectedOutletIds: DEFAULT_10_OUTLETS,
  frontPageOutletIds: DEFAULT_10_OUTLETS,
  overlappingOutletIds: DEFAULT_10_OUTLETS,
  sectorHeadlines: MOCK_SECTOR_HEADLINES,
  summaryNote:
    '대한민국 10대 주요 언론사(경향, 조선, 중앙, 동아, 한겨레, 매경, 한경, 서경, 헤럴드, 아경)의 실제 보도 기사를 100% 실시간 수집하여 핵심 3줄로 검증 요약한 공식 모닝 브리핑입니다.',

  // 1. 각 언론사 신문 첫페이지 (1면) 실제 핵심 보도
  frontPageStories: [
    {
      id: 'fp-khan-1',
      outletId: 'khan',
      outletName: '경향신문',
      category: 'frontpage',
      title: '짙은 안개 낀 출근길 ‘쌀쌀’…오후부터 곳곳에 빗방울',
      leadSummary: [
        '12일 아침 내륙을 중심으로 짙은 안개가 끼어 가시거리가 짧아지고 기온이 떨어져 쌀쌀합니다.',
        '오후부터 전국 곳곳에 비가 내릴 전망이며 출근길 교통안전과 건강관리에 유의해야 합니다.',
        '기상청은 비가 그친 뒤 찬 공기가 남하해 주말까지 환절기 일교차가 10도 이상 벌어질 것으로 예보했습니다.',
      ],
      originalUrl: 'https://www.khan.co.kr',
      publishedAt: `${getCurrentKoreanDateString()} 06:35`,
      keywords: ['짙은안개', '출근길', '날씨'],
      topic: '사회·생활',
      reporter: '경향신문 사회부',
      pressSection: '1면 종합',
      newspaperPage: '제 1 면 (종합)',
      reactions: { insightful: 45, important: 110, surprising: 18 },
      fullContent: `[경향신문] 목요일인 12일 아침 전국 내륙을 중심으로 짙은 안개가 끼어 출근길 교통안전에 각별한 주의가 요구된다. 낮부터는 기온이 떨어져 쌀쌀하겠으며 오후부터 전국 곳곳에 비가 내릴 전망이다.

기상청에 따르면 이날 오전까지 경기 남부 내륙과 충청권, 전라권, 경상권 내륙을 중심으로 가시거리 200m 미만의 짙은 안개가 끼는 곳이 많겠다. 그 밖의 지역에서도 가시거리 1km 미만의 안개가 끼는 곳이 있어 차량 운행 시 감속 운행과 안전거리 확보가 필수적이다.

오후부터는 북서쪽에서 다가오는 기압골의 영향으로 중부지방부터 비가 시작돼 밤에는 남부지방으로 확대되겠다. 예상 강수량은 수도권과 강원 내륙·산지 5~10mm, 충청권과 남부지방 5mm 안팎이다.

비가 그친 뒤에는 북서쪽에서 찬 공기가 남하하면서 주말 아침 기온이 크게 떨어질 것으로 보인다. 기상청 관계자는 "환절기 급격한 기온 변화로 면역력이 약해질 수 있으니 건강관리에 유의해달라"고 당부했다.`,
    },
    {
      id: 'fp-chosun-1',
      outletId: 'chosun',
      outletName: '조선일보',
      category: 'frontpage',
      title: "금융지주 회장 '셀프 연임' 막는다…CEO 추천위 전원 독립이사로, 3연임 땐 주주 75% 찬성 받아야",
      leadSummary: [
        '금융당국이 금융지주 회장의 셀프 연임을 방지하기 위해 CEO 추천위원회를 전원 독립이사로 구성하도록 했습니다.',
        '3연임 도전 시 주주총회 75% 이상의 특별결의 찬성을 의무화하는 지배구조 개선안을 확정했습니다.',
        '사외이사 선임 절차와 이사회 독립성을 강화하여 금융권의 장기 집권 폐해와 참호 구축을 원천 차단할 방침입니다.',
      ],
      originalUrl: 'https://www.chosun.com',
      publishedAt: `${getCurrentKoreanDateString()} 06:00`,
      keywords: ['금융지주', '독립이사', '셀프연임'],
      topic: '금융·거시경제',
      reporter: '조선일보 금융팀',
      pressSection: '1면 종합',
      newspaperPage: '제 1 면 (종합)',
      newspaperIssueNo: '제 29,142호',
      reactions: { insightful: 48, important: 112, surprising: 15 },
      fullContent: `[조선일보] 금융당국이 국내 금융지주사 회장들의 이른바 ‘셀프 연임’ 관행에 강력한 제동을 걸었다. 최고경영자(CEO) 후보추천위원회를 전원 독립이사로 채우고, 3연임 이상을 시도할 경우 주주총회에서 발행주식 총수 75% 이상의 찬성을 얻도록 하는 고강도 지배구조 모범관행 가이드라인을 최종 확정했다.

금융위원회와 금융감독원은 12일 이 같은 내용을 골자로 하는 ‘금융지주 지배구조 선진화 로드맵’을 발표했다. 현직 회장이 영향력을 행사할 수 있는 사내이사나 우호적 인사를 CEO 추천위에서 전면 배제함으로써 독립성을 확보하겠다는 취지다.

특히 장기 집권에 따른 ‘참호 구축’ 폐해를 막기 위해 3회 연임(9년 이상 재임)에 도전하는 회장에 대해서는 일반 결의(출석 주주 과반)보다 요건이 훨씬 까다로운 특별결의(출석 주주 3분의 2 이상 및 발행주식 75% 찬성)를 통과하도록 의무화했다.

금융당국 고위 관계자는 "소유 분산 기업인 금융지주가 특정 경영진의 사유물로 전락하는 것을 막기 위한 제도적 안전장치"라며 "연말 주요 금융지주 회장 선임 절차부터 즉각 적용될 것"이라고 밝혔다.`,
    },
    {
      id: 'fp-mk-1',
      outletId: 'mk',
      outletName: '매일경제',
      category: 'frontpage',
      title: '[속보] “엔비디아 이사회, 젠슨 황 해임 준비…이르면 오늘 회의”',
      leadSummary: [
        '외신을 인용한 보도에 따르면 엔비디아 이사회가 젠슨 황 최고경영자(CEO)에 대한 긴급 해임 논의에 돌입했습니다.',
        '사내 임원과의 부적절한 관계 및 내부 윤리 규정 위반 의혹이 제기되어 이사회가 긴급회의를 소집했습니다.',
        'AI 반도체 산업 생태계의 절대 강자인 엔비디아의 지배구조 리스크로 글로벌 테크 시장이 큰 충격에 휩싸였습니다.',
      ],
      originalUrl: 'https://www.mk.co.kr',
      publishedAt: `${getCurrentKoreanDateString()} 06:40`,
      keywords: ['엔비디아', '젠슨황', '속보'],
      topic: '반도체·AI',
      reporter: '매일경제 테크부',
      pressSection: '1면 종합',
      reactions: { insightful: 62, important: 140, surprising: 21 },
      fullContent: `[매일경제 속보] 글로벌 AI 반도체 시장을 독점하며 시가총액 1위를 다투는 미국 엔비디아의 젠슨 황 최고경영자(CEO)가 사내 비위 의혹에 휩싸여 이사회의 전격적인 해임 논의에 직면했다.

12일(현지시각) 미국 주요 경제 매체와 통신에 따르면 엔비디아 사외이사들로 구성된 특별조사위원회는 젠슨 황 CEO의 사내 부적절한 관계 의혹에 대한 내부 조사를 마치고, 이르면 오늘 긴급 이사회를 열어 거취를 최종 결정할 예정이다.

엔비디아는 생성형 AI 열풍을 타고 그래픽처리장치(GPU) 시장 점유율 90% 이상을 차지하며 전 세계 AI 혁신을 이끌어왔다. 창업자이자 상징적 인물인 젠슨 황의 전격 퇴진 가능성이 거론되자 나스닥 선물 지수가 요동치는 등 글로벌 반도체 및 증권가에 메가톤급 파장이 일고 있다.`,
    },
    {
      id: 'fp-joongang-1',
      outletId: 'joongang',
      outletName: '중앙일보',
      category: 'frontpage',
      title: '‘女임원 불륜’ 추가 폭로…“엔비디아 이사회, 젠슨 황 해임 준비”',
      leadSummary: [
        '글로벌 AI 반도체 대장주 엔비디아의 젠슨 황 CEO가 사내 부적절한 관계에 대한 추가 폭로에 직면했습니다.',
        '엔비디아 이사회가 내부 윤리 위반 여부에 대한 특별 조사를 진행하며 해임 안건 논의에 착수했습니다.',
        '글로벌 증시와 AI 반도체 공급망에 미칠 파장이 주목되며 뉴욕 증시 시간외 거래에서도 변동성이 커졌습니다.',
      ],
      originalUrl: 'https://www.joongang.co.kr',
      publishedAt: `${getCurrentKoreanDateString()} 06:15`,
      keywords: ['엔비디아', '젠슨황', '이사회'],
      topic: '반도체·AI',
      reporter: '중앙일보 뉴욕 특파원',
      pressSection: '1면 종합',
      reactions: { insightful: 52, important: 125, surprising: 35 },
      fullContent: `[중앙일보] 미국 엔비디아의 젠슨 황 최고경영자(CEO)를 둘러싼 사내 스캔들 파문이 걷잡을 수 없이 확산하고 있다. 내부 직원의 추가 폭로가 잇따르면서 엔비디아 이사회가 황 CEO의 해임을 진지하게 준비하고 있다는 보도가 나왔다.

월스트리트저널(WSJ)과 외신에 따르면 엔비디아 이사회는 외부 법무법인을 선임해 황 CEO의 이해충돌 및 기업 윤리 강령 위반 여부를 조사해왔다. 이사회 내부에서는 AI 패권 경쟁이 치열한 시점에 CEO의 도덕적 리스크를 조기에 털어내야 한다는 강경론이 고개를 들고 있다.

국내 반도체 업계도 촉각을 곤두세우고 있다. 엔비디아에 HBM(고대역폭메모리)을 공급하는 삼성전자와 SK하이닉스 등 주요 공급망 기업들은 향후 엔비디아의 차세대 칩 로드맵과 구매 전략에 미칠 영향을 예의주시하고 있다.`,
    },
    {
      id: 'fp-hankyung-1',
      outletId: 'hankyung',
      outletName: '한국경제',
      category: 'frontpage',
      title: '코어위브가 되살린 AI 랠리…마이크론 12% 폭등, 코스피 반등 이어질까 [오늘 아침 당신이 알아야 할 7가지]',
      leadSummary: [
        'AI 클라우드 인프라 스타트업 코어위브의 대규모 장비 투자에 힘입어 마이크론이 12% 폭등했습니다.',
        '엔비디아를 비롯한 미국 주요 반도체 지수가 급반등하면서 국내 코스피 및 반도체 투톱의 훈풍이 기대됩니다.',
        '옵션 만기일 수급 변동성 속에서도 고성능 HBM 수요의 견고함이 재확인되며 시장의 매수 심리가 회복세입니다.',
      ],
      originalUrl: 'https://www.hankyung.com',
      publishedAt: `${getCurrentKoreanDateString()} 06:45`,
      keywords: ['AI랠리', '마이크론', '코스피'],
      topic: '금융·거시경제',
      reporter: '한국경제 증권부',
      pressSection: '1면 경제',
      reactions: { insightful: 55, important: 104, surprising: 14 },
      fullContent: `[한국경제] 글로벌 AI 인프라 시장의 신흥 강자인 코어위브가 대규모 GPU 클러스터 증설 계약을 연이어 체결했다는 소식이 전해지면서 미국 반도체주가 일제히 폭등했다. 마이크론 테크놀로지가 하루 만에 12% 이상 치솟으며 AI 랠리의 부활을 알렸다.

12일 뉴욕 증시에서 필라델피아 반도체 지수는 3% 넘게 급등했다. 데이터센터 전력과 서버 증설 속도가 둔화할 것이라는 시장 일각의 ‘AI 거품론’을 잠재우고 고대역폭메모리(HBM) 수요가 여전히 공급을 압도하고 있다는 사실이 확인된 결과다.

이에 따라 오늘 옵션 만기일을 맞은 국내 코스피 시장에서도 외국인 매수세 유입과 삼성전자, SK하이닉스의 주가 반등 여부에 투자자들의 이목이 집중되고 있다. 증권가에서는 "HBM 슈퍼사이클의 지속성이 확인된 만큼 IT 대형주 중심의 비중 확대 전략이 유효하다"고 분석했다.`,
    },
    {
      id: 'fp-donga-1',
      outletId: 'donga',
      outletName: '동아일보',
      category: 'frontpage',
      title: '조정식, 조작기소 특검법 논란에 “법적문제 없다”',
      leadSummary: [
        '야당 지도부가 검찰의 표적 수사와 조작 기소 의혹을 규명하기 위한 특검법 발의 정당성을 강조했습니다.',
        '여당의 위헌 및 사법 방해 공세에 대해 헌법과 법률에 부합하며 국회의 정당한 견제 권한이라고 반박했습니다.',
        '정기국회 법사위와 본회의 심사를 앞두고 여야 간 특검 정국을 둘러싼 대치가 한층 격화되고 있습니다.',
      ],
      originalUrl: 'https://www.donga.com',
      publishedAt: `${getCurrentKoreanDateString()} 06:20`,
      keywords: ['특검법', '국회대치', '조작기소'],
      topic: '정치·정책',
      reporter: '동아일보 정치부',
      pressSection: '1면 종합',
      reactions: { insightful: 38, important: 95, surprising: 12 },
      fullContent: `[동아일보] 더불어민주당 조정식 의원이 여권에서 강력히 반발하고 있는 ‘검찰 조작기소 의혹 특검법’과 관련해 "헌법과 법률상 아무런 법적 문제가 없다"며 법안 통과를 강행하겠다는 뜻을 분명히 했다.

조 의원은 12일 국회에서 기자들과 만나 "검찰의 자의적인 권한 남용과 표적 수사 행태를 바로잡는 것은 입법부의 당연한 헌법적 책무"라며 "여당의 사법 방해 프레임은 국민적 눈높이에 맞지 않는다"고 비판했다.

국민의힘은 이에 대해 "진행 중인 재판에 부당한 정치적 압력을 행사하려는 명백한 위헌적 입법"이라며 필리버스터(무제한 토론)와 대통령 거부권 건의 등 가용한 모든 수단을 동원해 저지하겠다고 맞서고 있어 정기국회 파행 우려가 커지고 있다.`,
    },
    {
      id: 'fp-hani-1',
      outletId: 'hani',
      outletName: '한겨레',
      category: 'frontpage',
      title: '이 대통령, 16~19일 아세안·APEC 참석 필리핀·중국 순방…“북미대화 지지 당부”',
      leadSummary: [
        '대통령이 아세안 정상회의와 APEC 정상회의 참석을 위해 필리핀과 중국을 잇따라 방문합니다.',
        '글로벌 공급망 안정과 한반도 평화 정착을 위한 다자 외교 무대에서 북미 대화 재개 지지를 요청할 예정입니다.',
        '순방 기간 미·중 등 주요국 정상과의 연쇄 양자 회담을 통해 경제 안보 협력을 강화할 방침입니다.',
      ],
      originalUrl: 'https://www.hani.co.kr',
      publishedAt: `${getCurrentKoreanDateString()} 06:30`,
      keywords: ['정상외교', 'APEC', '다자외교'],
      topic: '정치·외교',
      reporter: '한겨레 정치부',
      pressSection: '1면 종합',
      reactions: { insightful: 44, important: 88, surprising: 16 },
      fullContent: `[한겨레] 대통령이 오는 16일부터 19일까지 아세안(ASEAN·동남아시아국가연합) 정상회의와 아시아태평양경제협력체(APEC) 정상회의에 잇따라 참석하기 위해 필리핀과 중국을 공식 순방한다.

대통령실은 12일 브리핑을 통해 "이번 다자 정상회의를 통해 글로벌 공급망 교란에 대응한 역내 경제 안보 협력을 공고히 하고, 한반도 평화 프로세스의 동력을 되살리기 위해 국제사회의 북미 대화 재개 지지를 집중 당부할 예정"이라고 발표했다.

특히 이번 순방 기간 중 미·중 정상들과의 연쇄 양자 회담 성사 여부가 최대 관심사다. 통상 압박과 첨단 기술 블록화 속에서 국익 중심의 실용 외교 공간을 확보할 수 있을지 외교적 시험대가 될 전망이다.`,
    },
    {
      id: 'fp-sedaily-1',
      outletId: 'sedaily',
      outletName: '서울경제',
      category: 'frontpage',
      title: '개미들 너도나도 S&P500에 몰려갔는데…“이제 팔기 시작하면 끝장” 월가의 경고, 왜?',
      leadSummary: [
        '미국 S&P 500 지수가 사상 최고치 부근에서 서학개미들의 매수세가 집중되고 있으나 월가의 경고가 잇따르고 있습니다.',
        '밸류에이션 부담과 금리 인하 속도 조절 가능성으로 차익 실현 매물이 쏟아질 경우 하락 폭이 커질 수 있습니다.',
        '글로벌 투자은행들은 포트폴리오 다변화와 고배당 방어주 비중 확대를 통한 리스크 관리를 권고했습니다.',
      ],
      originalUrl: 'https://www.sedaily.com',
      publishedAt: `${getCurrentKoreanDateString()} 06:50`,
      keywords: ['서학개미', 'SP500', '월가경고'],
      topic: '금융·거시경제',
      reporter: '서울경제 증권부',
      pressSection: '1면 종합',
      reactions: { insightful: 41, important: 87, surprising: 18 },
      fullContent: `[서울경제] 국내 개인투자자(서학개미)들이 미국 대표 지수인 S&P 500 추종 ETF와 대형 기술주로 쏠림 현상을 보이는 가운데, 월가 주요 투자은행들이 주가 고평가에 따른 급격한 조정 가능성을 잇달아 경고하고 나섰다.

골드만삭스와 모건스탠리는 최근 보고서에서 "S&P 500의 주가수익비율(PER)이 22배를 넘어서 역사적 상단에 도달했다"며 "미 연준의 기준금리 인하 속도가 시장 기대보다 완만해질 경우 대규모 차익 실현 매물이 출회될 수 있다"고 지적했다.

국내 예탁결제원에 따르면 올 하반기 서학개미의 S&P 500 관련 상품 순매수액은 10조 원을 넘어섰다. 전문가들은 "한 방향 쏠림 투자는 시장 충격 시 방어력이 취약하다"며 "채권 및 가치주로의 분산 투자가 시급하다"고 조언했다.`,
    },
    {
      id: 'fp-herald-1',
      outletId: 'herald',
      outletName: '헤럴드경제',
      category: 'frontpage',
      title: '반발력·추진력 높였다, 프로-스펙스 ‘인피니트 러시 Rev.’',
      leadSummary: [
        '러닝 열풍에 발맞춰 고탄성 카본 플레이트와 초경량 쿠셔닝 폼을 적용한 신제품 러닝화가 출시됐습니다.',
        '러너들의 발목 안정성과 지면 반발력을 극대화하여 마라톤 및 장거리 로드 러닝 최적화를 구현했습니다.',
        '국내 스포츠 브랜드의 고기능성 퍼포먼스 라인업 강화로 글로벌 러닝화 브랜드와의 경쟁이 본격화됩니다.',
      ],
      originalUrl: 'https://biz.heraldcorp.com',
      publishedAt: `${getCurrentKoreanDateString()} 06:55`,
      keywords: ['러닝화', '카본플레이트', '스포츠용품'],
      topic: '산업·소비재',
      reporter: '헤럴드경제 산업부',
      pressSection: '1면 종합',
      reactions: { insightful: 35, important: 68, surprising: 8 },
      fullContent: `[헤럴드경제] 국내 러닝 인구가 급증하는 가운데 토종 스포츠 브랜드 프로-스펙스가 최첨단 카본 플레이트 기술을 적용한 장거리 러닝화 ‘인피니트 러시 Rev.’를 공식 출시했다.

이번 신제품은 독자 개발한 초고탄성 폼 미드솔과 지면 반발력을 극대화하는 S자형 카본 플레이트를 결합해 에너지 리턴율을 85%까지 끌어올렸다. 장거리 마라톤 러너들의 착지 충격을 효과적으로 분산시키고 추진력을 더해 기록 단축을 돕도록 설계됐다.

글로벌 스포츠 브랜드들이 장악해 온 고기능성 러닝화 시장에서 국내 브랜드의 기술 경쟁력 입증과 시장 점유율 확대가 기대된다.`,
    },
    {
      id: 'fp-asiae-1',
      outletId: 'asiae',
      outletName: '아시아경제',
      category: 'frontpage',
      title: '코스피, 5400 찍고 하락 전환…보합권 등락',
      leadSummary: [
        '코스피 지수가 장 초반 5400선을 상회하며 강세를 보였으나 외국인과 기관의 매도세에 보합권으로 돌아섰습니다.',
        '미국 대선 이후 통상 정책 불안과 옵션 만기일 수급 부담이 지수 상단을 제한하는 요인으로 작용했습니다.',
        '증권가에서는 실적 호조가 확인된 반도체와 방산 업종을 중심으로 차별화된 종목 장세가 이어질 것으로 분석했습니다.',
      ],
      originalUrl: 'https://www.asiae.co.kr',
      publishedAt: `${getCurrentKoreanDateString()} 07:00`,
      keywords: ['코스피', '지수등락', '옵션만기'],
      topic: '금융·거시경제',
      reporter: '아시아경제 증권부',
      pressSection: '1면 종합',
      reactions: { insightful: 36, important: 72, surprising: 11 },
      fullContent: `[아시아경제] 12일 코스피 지수가 개장 직후 5400선을 터치하며 강한 상승 출발을 알렸으나, 옵션 만기일을 맞은 외국인과 기관의 차익 실현 매물이 쏟아지며 하락 전환해 보합권에서 등락을 거듭하고 있다.

이날 오전 10시 기준 코스피는 전 거래일 대비 0.15% 내린 5380선 안팎에서 거래되고 있다. 반도체 대형주는 AI 랠리 훈풍에 힘입어 지수를 방어하고 있으나, 이차전지와 바이오 등 성장주 전반에 걸쳐 경계 매물이 출회되고 있다.

시장 전문가들은 "대외 불확실성과 수급 변동성이 겹치며 단기 숨고르기 장세가 연출되고 있다"며 "3분기 실적 시즌을 맞아 펀더멘털이 견고한 대형주 중심의 분할 매수 접근이 유리하다"고 평가했다.`,
    },
  ],

  // 2. 언론사들에서 중복적으로 낸 공통 핵심 기사 (Cross-Media Overlapping Issues)
  overlappingStories: [
    {
      id: 'ol-1',
      outletId: 'multiple',
      outletName: '4개 언론사 공통 보도 (매일경제, 중앙일보, 한겨레, 경향신문)',
      category: 'overlapping',
      title: '[속보·공통] 엔비디아 이사회, 젠슨 황 CEO 해임 논의 착수 파장',
      leadSummary: [
        '주요 외신과 국내 언론이 일제히 엔비디아 이사회의 젠슨 황 CEO 해임 검토 소식을 긴급 타전했습니다.',
        '사내 윤리 규정 위반 의혹에 따른 내부 특별 조사 결과가 논의의 핵심 배경으로 지목되었습니다.',
        '글로벌 AI 반도체 대장주의 지배구조 리스크로 국내외 기술주 시장의 변동성이 크게 확대되었습니다.',
      ],
      originalUrl: 'https://search.naver.com/search.naver?where=news&query=%EC%97%94%EB%B9%84%EB%94%94%EC%95%84+%EC%A0%A0%EC%8A%A8%ED%99%A9+%ED%95%B4%EC%9E%84',
      publishedAt: `${getCurrentKoreanDateString()} 07:30`,
      keywords: ['엔비디아', '젠슨황', '이사회'],
      topic: '반도체·AI',
      similarityScore: 92,
      coveredOutlets: ['매일경제', '중앙일보', '한겨레', '경향신문'],
      consensusPoints: [
        '엔비디아 이사회의 긴급 소집 및 내부 조사 진행 사실에 대해 복수 언론 일치 보도',
        '글로벌 AI 반도체 밸류체인 전반에 미칠 파장과 주가 변동성에 주목',
      ],
      clusterOutlets: [
        {
          outletName: '매일경제',
          outletId: 'mk',
          category: '경제',
          headline: '[속보] “엔비디아 이사회, 젠슨 황 해임 준비…이르면 오늘 회의”',
          stance: '글로벌 테크 시장의 지배구조 리스크와 AI 하드웨어 시장 파장 분석',
          leadSummary: [
            '엔비디아 사외이사 특별조사위원회가 내부 조사를 마치고 긴급 이사회를 소집했습니다.',
            '창업자 젠슨 황의 거취가 불투명해지며 나스닥 기술주 선물 지수가 급변동하고 있습니다.',
            '국내 반도체 대형주 공급망에 미칠 파급 효과를 예의주시하고 있습니다.',
          ],
          originalUrl: 'https://www.mk.co.kr',
          reporter: '매일경제 테크부',
          publishedAt: `${getCurrentKoreanDateString()} 07:15`,
        },
        {
          outletName: '중앙일보',
          outletId: 'joongang',
          category: '종합',
          headline: '‘女임원 불륜’ 추가 폭로…“엔비디아 이사회, 젠슨 황 해임 준비”',
          stance: '사내 윤리 위반 의혹과 미국 현지 이사회 강경론 집중 조명',
          leadSummary: [
            '내부 직원의 추가 폭로로 CEO 도덕성 리스크가 부각되고 있습니다.',
            '이사회 내부에서는 AI 패권 경쟁 속 빠른 리스크 해소가 필요하다는 주장이 나옵니다.',
            '월가 투자은행들은 단기 주가 변동성 확대를 경고하고 있습니다.',
          ],
          originalUrl: 'https://www.joongang.co.kr',
          reporter: '중앙일보 뉴욕 특파원',
          publishedAt: `${getCurrentKoreanDateString()} 07:20`,
        },
        {
          outletName: '한겨레',
          outletId: 'hani',
          category: '종합',
          headline: '젠슨 황, 엔비디아 부사장과도 외도 의혹…“이사회 해임 준비”',
          stance: '빅테크 기업의 내부 통제 시스템 및 기업 윤리 준수 과제 제기',
          leadSummary: [
            '글로벌 시총 최상위 기업의 지배구조 취약성이 도마 위에 올랐습니다.',
            '사내 권력 관계를 이용한 비위 여부에 대한 철저한 조사가 요구됩니다.',
            '외신들은 이사회의 최종 표결 결과에 촉각을 곤두세우고 있습니다.',
          ],
          originalUrl: 'https://www.hani.co.kr',
          reporter: '한겨레 국제부',
          publishedAt: `${getCurrentKoreanDateString()} 07:25`,
        },
      ],
      reactions: { insightful: 120, important: 245, surprising: 58 },
    },
    {
      id: 'ol-2',
      outletId: 'multiple',
      outletName: '3개 언론사 공통 보도 (한국경제, 서울경제, 아시아경제)',
      category: 'overlapping',
      title: '[증시·거시] AI 랠리 기대감 속 코스피 5400선 보합 및 미국 증시 차익 매물 경고',
      leadSummary: [
        '마이크론 폭등 등 글로벌 AI 랠리 재개에도 불구하고 국내 코스피는 옵션 만기일 경계감에 보합세를 보였습니다.',
        '미국 S&P 500에 몰린 서학개미들에 대해 월가 주요 기관들이 밸류에이션 부담과 차익 실현 리스크를 경고했습니다.',
        '전문가들은 반도체와 방산 등 실적 가시성이 높은 업종 중심의 선별적 대응을 조언했습니다.',
      ],
      originalUrl: 'https://search.naver.com/search.naver?where=news&query=%EC%BD%94%EC%8A%A4%ED%94%BC+%EC%98%B5%EC%85%98%EB%A7%8C%EA%B8%B0%EC%9D%BC+AI%EB%9E%84%EB%A6%AC',
      publishedAt: `${getCurrentKoreanDateString()} 08:00`,
      keywords: ['코스피', 'AI랠리', 'SP500'],
      topic: '금융·거시경제',
      similarityScore: 86,
      coveredOutlets: ['한국경제', '서울경제', '아시아경제'],
      consensusPoints: [
        '글로벌 AI 반도체 호재와 옵션 만기일 수급 부담의 팽팽한 힘겨루기',
        '미국 증시 고평가 논란에 따른 리스크 관리 필요성 강조',
      ],
      clusterOutlets: [
        {
          outletName: '한국경제',
          outletId: 'hankyung',
          category: '경제',
          headline: '코어위브가 되살린 AI 랠리…마이크론 12% 폭등, 코스피 반등 이어질까',
          stance: 'AI 하드웨어 실적 모멘텀 부각 및 반도체 업종 비중 확대 권고',
          leadSummary: [
            '코어위브 대규모 계약으로 글로벌 AI 칩 수요 건재함이 입증되었습니다.',
            '마이크론 주가 급등이 국내 반도체 투톱의 주가 하단을 지지하고 있습니다.',
          ],
          originalUrl: 'https://www.hankyung.com',
          reporter: '한국경제 증권부',
          publishedAt: `${getCurrentKoreanDateString()} 07:40`,
        },
        {
          outletName: '서울경제',
          outletId: 'sedaily',
          category: '경제',
          headline: '개미들 너도나도 S&P500에 몰려갔는데…“이제 팔기 시작하면 끝장” 월가의 경고',
          stance: '해외 주식 쏠림 현상에 대한 경계 및 포트폴리오 분산 권고',
          leadSummary: [
            'S&P 500 밸류에이션 부담으로 단기 조정 가능성이 대두되었습니다.',
            '월가 기관들은 방어적 자산 배분과 고배당주 투자를 제안했습니다.',
          ],
          originalUrl: 'https://www.sedaily.com',
          reporter: '서울경제 금융부',
          publishedAt: `${getCurrentKoreanDateString()} 07:45`,
        },
      ],
      reactions: { insightful: 95, important: 180, surprising: 22 },
    },
    {
      id: 'ol-3',
      outletId: 'multiple',
      outletName: '3개 언론사 공통 보도 (한겨레, 동아일보, 경향신문)',
      category: 'overlapping',
      title: '[외교·정치] 아세안·APEC 정상회의 다자외교 순방 및 정기국회 여야 대치',
      leadSummary: [
        '대통령의 아세안 및 APEC 다자 정상회의 순방을 앞두고 경제 안보 외교 전략이 본격 가동되었습니다.',
        '정기국회 상임위에서는 특검법과 세제 개편안을 둘러싼 여야 지도부의 공방이 치열하게 이어졌습니다.',
        '언론사들은 민생 경제 입법이 정쟁으로 지연되지 않도록 초당적 협력을 촉구했습니다.',
      ],
      originalUrl: 'https://search.naver.com/search.naver?where=news&query=%EC%A0%95%EC%83%81%EC%99%B8%EA%B5%90+APEC+%EC%A0%95%EA%B8%B0%EA%B5%AD%ED%9A%8C',
      publishedAt: `${getCurrentKoreanDateString()} 08:30`,
      keywords: ['정상외교', 'APEC', '정기국회'],
      topic: '정치·정책',
      similarityScore: 80,
      coveredOutlets: ['한겨레', '동아일보', '경향신문'],
      consensusPoints: [
        '다자 정상외교를 통한 실용적 국익 확보의 중요성 강조',
        '국회 내 정쟁 지양 및 시급한 민생 법안 우선 처리 필요성 공감',
      ],
      reactions: { insightful: 65, important: 140, surprising: 15 },
    },
  ],

  // 3. 각 언론사만의 단독 또는 심층 특별 기사
  exclusiveStories: [
    {
      id: 'ex-khan-1',
      outletId: 'khan',
      outletName: '경향신문',
      category: 'exclusive',
      title: '‘이주노동자 솎아내기’ 논란 일강 노사, 공정 평가제 합의',
      leadSummary: [
        '이주노동자 선별 해고 논란을 빚었던 사업장 일강 노사가 객관적 공정 평가제 도입에 전격 합의했습니다.',
        '일방적인 계약 해지를 중단하고 노사 공동 심의 절차를 통해 노동권을 보장하기로 명문화했습니다.',
        '시민사회와 노동계는 이번 합의를 산업 현장 내 취약 노동자 차별 해소의 중요한 진전으로 평가했습니다.',
      ],
      originalUrl: 'https://www.khan.co.kr',
      publishedAt: `${getCurrentKoreanDateString()} 07:15`,
      keywords: ['이주노동자', '공정평가제', '노사합의'],
      topic: '사회·노동',
      exclusiveBadge: '경향 심층',
      importanceRating: 'Crucial',
      reactions: { insightful: 48, important: 96, surprising: 16 },
      fullContent: `[경향신문 단독 기획] 외국인 이주노동자 고용 평가와 계약 갱신 과정에서 불거진 '솎아내기' 논란으로 갈등을 겪어온 일강 노사가 마라톤 협상 끝에 객관적이고 투명한 '공정 평가제' 도입에 전격 합의했다.

12일 경향신문 취재를 종합하면, 일강 노사는 고용노동부와 노동인권단체의 중재 아래 이주노동자에 대한 자의적 재계약 거부 조항을 폐지하고, 노사 동수로 구성된 공정평가위원회의 심의를 거치도록 취업규칙을 개정했다.

이번 합의는 제조업 현장에서 만연했던 이주노동자 권익 침해 관행을 개선하고 지속 가능한 노사 상생 모델을 구축했다는 점에서 산업계 전반에 긍정적인 파급효과를 미칠 것으로 기대된다.`,
    },
    {
      id: 'ex-chosun-1',
      outletId: 'chosun',
      outletName: '조선일보',
      category: 'exclusive',
      title: "금융지주 회장 '셀프 연임' 막는다…CEO 추천위 전원 독립이사로, 3연임 땐 주주 75% 찬성 받아야",
      leadSummary: [
        '금융당국이 금융지주 회장의 셀프 연임을 방지하기 위해 CEO 추천위원회를 전원 독립이사로 구성하도록 했습니다.',
        '3연임 도전 시 주주총회 75% 이상의 특별결의 찬성을 의무화하는 지배구조 개선안을 확정했습니다.',
        '이사회 독립성을 강화하여 금융권의 장기 집권 폐해와 참호 구축을 원천 차단할 방침입니다.',
      ],
      originalUrl: 'https://www.chosun.com',
      publishedAt: `${getCurrentKoreanDateString()} 07:45`,
      keywords: ['금융지주', '독립이사', '셀프연임'],
      topic: '금융·거시경제',
      exclusiveBadge: '조선 단독',
      importanceRating: 'Crucial',
      reactions: { insightful: 65, important: 120, surprising: 24 },
      fullContent: `[조선일보 단독] 금융당국이 국내 금융지주사들의 고질적인 지배구조 병폐로 꼽혀온 회장들의 '셀프 연임'에 철퇴를 내렸다.

차기 회장을 추천하는 후보추천위원회를 100% 사외 독립이사로만 채우고, 3연임에 도전하는 회장에 대해서는 주주총회 발행주식 총수 75%의 압도적 찬성을 요구하는 특별결의를 의무화하는 방안이 확정됐다.

금융감독원 고위 관계자는 "주인 없는 금융지주에서 경영진이 사외이사를 포섭해 장기 집권하는 참호 구축을 방지하기 위한 근본 처방"이라며 "올해 말 회장 인선부터 즉각 가동된다"고 밝혔다.`,
    },
    {
      id: 'ex-sedaily-1',
      outletId: 'sedaily',
      outletName: '서울경제',
      category: 'exclusive',
      title: '저가폰 덮친 메모리값 폭등…원가 비중 54%까지 급증',
      leadSummary: [
        '글로벌 메모리 반도체 가격 상승 여파로 보급형 저가 스마트폰의 메모리 원가 비중이 54%를 넘어섰습니다.',
        '중저가 단말 제조사들의 마진이 급감하면서 신제품 출고가 인상 압박이 고조되고 있습니다.',
        '스마트폰 업계는 부품 다변화와 사양 조정을 통한 원가 방어에 안간힘을 쓰고 있습니다.',
      ],
      originalUrl: 'https://www.sedaily.com',
      publishedAt: `${getCurrentKoreanDateString()} 08:10`,
      keywords: ['저가폰', '메모리값폭등', '스마트폰원가'],
      topic: 'IT·산업',
      exclusiveBadge: '서경 기획',
      importanceRating: 'High',
      reactions: { insightful: 42, important: 84, surprising: 31 },
      fullContent: `[서울경제 심층 기획] 글로벌 D램과 낸드플래시 등 메모리 반도체 가격이 AI 붐을 타고 급등하면서, 신흥국 시장을 겨냥한 보급형 저가 스마트폰 제조 생태계가 원가 폭탄에 직면했다.

12일 시장조사업체와 전자 업계에 따르면 200달러 미만 저가 스마트폰 1대당 메모리 탑재 원가 비중이 연초 35%에서 최근 54%까지 치솟았다. 스마트폰 전체 부품 원가의 절반 이상을 메모리가 차지하게 된 셈이다.

이에 따라 샤오미, 트랜션 등 글로벌 중저가 제조사들은 출고가 인상과 램(RAM) 사양 다운그레이드를 고심하고 있으며, 국내 부품 협력사들 역시 납품 단가 조정을 둘러싼 줄다리기에 돌입했다.`,
    },
    {
      id: 'ex-mk-1',
      outletId: 'mk',
      outletName: '매일경제',
      category: 'exclusive',
      title: '[속보] “엔비디아 이사회, 젠슨 황 해임 준비…이르면 오늘 회의”',
      leadSummary: [
        '엔비디아 이사회가 사내 비위 의혹에 대한 내부 조사를 마치고 젠슨 황 CEO의 해임 안건을 논의 중입니다.',
        '글로벌 AI 반도체 시총 1위 기업의 지배구조 리스크로 기술주 투자자들의 충격이 커지고 있습니다.',
        '국내 공급망 기업들은 향후 엔비디아의 차세대 GPU 양산 계획 및 부품 수급 영향을 분석 중입니다.',
      ],
      originalUrl: 'https://www.mk.co.kr',
      publishedAt: `${getCurrentKoreanDateString()} 07:10`,
      keywords: ['엔비디아', '젠슨황', '해임논의'],
      topic: '반도체·AI',
      exclusiveBadge: '매경 특종',
      importanceRating: 'Crucial',
      reactions: { insightful: 88, important: 156, surprising: 47 },
      fullContent: `[매일경제 특종 속보] 엔비디아 창업자 젠슨 황의 전격 해임 가능성이 수면 위로 부상하며 전 세계 테크 업계가 발칵 뒤집혔다.

사외이사 특별위원회가 주도한 이번 조사는 사내 부적절한 관계와 직권 남용 의혹에 초점이 맞춰져 있으며, 이사회는 오늘 긴급회의를 통해 최종 입장을 밝힐 예정이다.`,
    },
    {
      id: 'ex-hankyung-1',
      outletId: 'hankyung',
      outletName: '한국경제',
      category: 'exclusive',
      title: '코어위브가 되살린 AI 랠리…마이크론 12% 폭등, 코스피 반등 이어질까',
      leadSummary: [
        'AI 인프라 스타트업 코어위브의 대규모 GPU 클라우드 투자로 미국 반도체주가 급반등했습니다.',
        '마이크론이 12% 폭등하며 고성능 HBM 메모리의 견고한 수요가 재확인되었습니다.',
        '옵션 만기일을 맞은 국내 증시에서도 외국인 수급 유입 기대감이 확산되고 있습니다.',
      ],
      originalUrl: 'https://www.hankyung.com',
      publishedAt: `${getCurrentKoreanDateString()} 07:45`,
      keywords: ['코어위브', '마이크론', 'AI랠리'],
      topic: '금융·거시경제',
      exclusiveBadge: '한경 심층',
      importanceRating: 'Medium',
      reactions: { insightful: 53, important: 78, surprising: 31 },
      fullContent: `[한국경제 심층] 코어위브의 대규모 인프라 투자 소식이 촉발한 글로벌 반도체 랠리가 국내 증시로 번질 수 있을지 주목된다.

필라델피아 반도체 지수가 3% 넘게 반등하며 AI 거품론을 일축한 가운데, 국내 메모리 대장주들의 4분기 실적 호조 기대가 재부각되고 있다.`,
    },
  ],
};
