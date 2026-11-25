import type { WeeklyReport, EmailDispatchLog } from '../types/news.ts';
export { PRESS_OUTLETS, DEFAULT_10_OUTLETS, AVAILABLE_TOPICS, RECOMMENDED_CUSTOM_TOPICS, INITIAL_USER_PREFERENCES, SAMPLE_DATA_SNAPSHOT_DATE } from './pressMetadata.ts';
export { MOCK_SECTOR_HEADLINES } from './mockSectorHeadlines.ts';
export { INITIAL_DAILY_BRIEFING } from './initialDailyBriefing.ts';


// 7-day summarized database for weekly issue analysis report
export const MOCK_WEEKLY_REPORT: WeeklyReport = {
  weekRange: '2026년 10월 13일 (화) ~ 10월 19일 (월)',
  overallDiagnosis:
    '이번 주는 한국은행의 추가 금리 인하 기대와 가계대출 억제 정책 간의 정책 조율, 빅테크 AI 반도체 투자 호황에 따른 수출 회복, 그리고 국정감사 2주차 세수 결손 공방이 3대 핵심 축을 형성했습니다. 종합지와 경제지 간의 시각차가 부동산과 재정 건전성 분야에서 두드러진 한 주였습니다.',
  topTrendKeywords: [
    { keyword: 'AI반도체/HBM', count: 48 },
    { keyword: '기준금리/DSR', count: 42 },
    { keyword: '부동산PF/미분양', count: 36 },
    { keyword: '세수결손/국감', count: 31 },
    { keyword: '원전수출/웨스팅하우스', count: 24 },
    { keyword: '기후물가/배추', count: 19 },
  ],
  timeline: [
    {
      day: '10/13 (화)',
      date: '2026-10-13',
      mainHeadline: '한은 금통위 기준금리 논의 착수… "내수 부양 vs 가계빚 딜레마"',
      summary: '수도권 집값 상승세 둔화 확인 속에 금리 인하 카드가 테이블에 올랐으나 한은 총재의 신중론 대두.',
      keySectors: ['금융', '부동산'],
      toneComparison: {
        conservative: '가계부채와 부동산 가격 안정이 우선되어야 한다는 신중한 접근 지지',
        progressive: '고금리로 신음하는 영세 자영업자와 서민 취약차주 지원의 시급성 역설',
        economic: '내수 진작과 기업 투자 활성화를 위한 선제적 0.25%p 인하 결단 촉구',
      },
    },
    {
      day: '10/14 (수)',
      date: '2026-10-14',
      mainHeadline: '삼성·SK 글로벌 AI 반도체 공급망 정상회의 참석… 대규모 수주 물밑 작업',
      summary: '실리콘밸리 글로벌 테크 서밋에서 차세대 HBM3E 및 16단 적층 메모리 기술 로드맵 공개.',
      keySectors: ['IT·반도체'],
      toneComparison: {
        conservative: '국가 대항전으로 번진 반도체 패권에서 K-반도체 글로벌 리더십 재확인',
        progressive: '첨단 제조 시설에 대한 전력·용수 인프라의 환경 영향 및 지역 상생 대책 점검 요구',
        economic: '대만 TSMC와의 패키징 협력 및 대미 투자 보조금 조기 집행을 통한 실적 퀀텀점프 기대',
      },
    },
    {
      day: '10/15 (목)',
      date: '2026-10-15',
      mainHeadline: '국감 1주차 파행 속 세수 결손 30조 원 공방 격화',
      summary: '기재위에서 2년 연속 법인세·양도세 결손 원인을 두고 여야 경제 정책 총체적 난타전 전개.',
      keySectors: ['정치', '재정'],
      toneComparison: {
        conservative: '글로벌 경기 둔화 불가피론과 함께 불필요한 선심성 예산 과감한 삭감 강조',
        progressive: '대기업·부자 감세 기조의 전면 실패 규정 및 서민 복지 축소 중단 요구',
        economic: '재정 준칙 법제화와 예측 가능한 조세 정책 수립을 통한 기업 투자 심리 회복 제언',
      },
    },
    {
      day: '10/16 (금)',
      date: '2026-10-16',
      mainHeadline: '금융당국 부동산 PF 부실 사업장 20조 원 정리 로드맵 공식 발표',
      summary: '유예 기한 만료 사업장 1,200여 곳에 대한 경공매 착수 및 정상 사업장 5조 원 유동성 공급 발표.',
      keySectors: ['금융', '건설'],
      toneComparison: {
        conservative: '부실 고리를 끊는 시장 친화적 옥석 가리기로 금융 시스템 리스크 해소 평가',
        progressive: '건설사 도산에 따른 하도급 영세업체 및 현장 일용직 노동자 피해 방지책 집중 보도',
        economic: '2금융권 충당금 부담과 건전성 지표 단기 악화 방지를 위한 브릿지론 유연화 제안',
      },
    },
    {
      day: '10/17 (토)',
      date: '2026-10-17',
      mainHeadline: '체코 두코바니 원전 최종 계약 문안 확정 단계… 美 분쟁 절충안 급물살',
      summary: '체코 전력공사와의 기술 사양 검토 완료 및 미 에너지부(DOE) 수출 승인 절차 속도.',
      keySectors: ['에너지', '외교'],
      toneComparison: {
        conservative: '탈원전 폐기 이후 최대 규모의 K-원전 수출 쾌거라며 한미 동맹의 결실로 조명',
        progressive: '웨스팅하우스 로열티 지급 조건 및 장기 핵폐기물 처리 비용에 대한 투명한 정보 공개 요구',
        economic: '두산에너빌리티 등 원전 밸류체인 200여 협력업체의 일감 폭증과 중동·유럽 추가 수주 기대',
      },
    },
    {
      day: '10/18 (일)',
      date: '2026-10-18',
      mainHeadline: '기후위기 여파 김장철 배추·채소값 폭등… 정부 비축물량 2만 톤 긴급 방출',
      summary: '추석 이후 이어진 고온 현상으로 작황 부진, 대형마트 신선식품 코너 장바구니 부담 가중.',
      keySectors: ['사회', '물가'],
      toneComparison: {
        conservative: '유통 단계 할인 쿠폰 지원과 수입선 다변화를 통한 단기 수급 안정화 처방 조명',
        progressive: '기후위기가 서민 밥상에 미치는 직접적 타격을 경고하며 농가 손실보상 현실화 역설',
        economic: '스마트팜 확대 및 농산물 도매시장 경매 독점 구조 개혁 등 유통 혁신 근본책 주문',
      },
    },
    {
      day: '10/19 (월)',
      date: '2026-10-19',
      mainHeadline: '10월 수출 잠정치 호조 속 한미 AI 반도체 공급망 협약 타결',
      summary: '반도체 월간 수출 130억 달러 돌파와 함께 양국 차세대 칩 전략 공급망 포괄적 합의.',
      keySectors: ['산업', '통상'],
      toneComparison: {
        conservative: '첨단 기술 동맹 확고화로 미래 30년 먹거리 확보 성공적 평가',
        progressive: '대중국 수출 의존도 높은 국내 중소 팹리스의 판로 위축 우려 완화책 필요',
        economic: '삼성·SK의 대규모 설비 투자 회수 사이클 조기 도래로 코스피 지수 밸류업 호재 기대',
      },
    },
  ],
  sectorAnalysis: [
    {
      sector: '반도체·AI 첨단산업',
      summary: 'HBM3E와 CXL 공급 확대가 실적을 견인하며 반도체 업종이 한국 수출과 코스피를 주도했습니다.',
      keyPoints: [
        'SK하이닉스와 삼성전자의 16단 HBM 및 차세대 서버용 DRAM 독점적 지위 지속',
        '용인 메가 클러스터 송전망 구축에 대한 범정부 특별법 제정 요구 일제 제기',
        '미국의 대중국 첨단 반도체 추가 수출 규제에 대한 한국 기업 예외 인정 범위가 핵심 변수',
      ],
    },
    {
      sector: '금융·거시경제 및 부동산',
      summary: '스트레스 DSR 규제 강화로 서울 아파트 거래가 급감한 가운데, 한은의 금리 인하 타이밍이 초미의 관심사입니다.',
      keyPoints: [
        '기준금리 연내 0.25%p 추가 인하 가능성 고조로 국고채 금리 2.8%대 진입',
        '부동산 PF 부실 사업장 20조 원 규모 경·공매 매각 본격화로 단기 구조조정 충격 예상',
        '외환시장 야간 개장 3개월 차 성공적 안착으로 환율 변동성 흡수력 강화',
      ],
    },
    {
      sector: '정치·사회 및 기후물가',
      summary: '국감 2주차 파행으로 민생 법안 심의가 지연되고 있으며, 이상기후로 인한 식탁 물가 급등이 서민 경제를 위협하고 있습니다.',
      keyPoints: [
        '30조 원 규모 세수 결손에 대한 여야 책임 공방과 추경 편성 여부 팽팽',
        '가을 배추·무 등 신선식품 가격 40% 폭등으로 김장철 물가 비상사태 돌입',
        '특수고용·플랫폼 노동자 산재보험 사각지대 해소를 위한 입법 청원 봇물',
      ],
    },
  ],
  outlookNextWeek: [
    '한국은행 금융통화위원회 정례회의 (기준금리 방향성 및 거시건전성 가이던스 발표)',
    '국정감사 종합감사 돌입 (기획재정부, 산업통상자원부, 국토교통부 증인 채택 최종 공방)',
    '체코 정부의 두코바니 원전 최종 승인 각료회의 개최 예정',
    '글로벌 빅테크(MS, 알파벳, 메타) 3분기 실적 발표에 따른 국내 소부장 연쇄 영향',
  ],
};

// Initial email delivery logs
export const INITIAL_EMAIL_LOGS: EmailDispatchLog[] = [];
