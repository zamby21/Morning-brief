import { NewsStory, PressOutlet } from '../types/news';
import { PRESS_OUTLETS } from '../data/mockNewsData';
import { getDirectOutletUrl } from './linkUtils';
import { getCurrentKoreanDateString } from './dateUtils';

/**
 * Generates a realistic frontpage 3-line news story for any Korean media outlet
 * if a handcrafted story does not already exist in the briefing.
 */
export function generateFrontPageStoryForOutlet(outlet: PressOutlet): NewsStory {
  let title = '';
  let leadSummary: string[] = [];
  let topic = '정치·정책';
  let keywords: string[] = ['1면톱', outlet.name];

  let fullContent = '';

  switch (outlet.groupCategory) {
    case 'IT':
      title = `${outlet.name} 1면: 차세대 AI 가속기 및 초거대 모델 인프라 주도권 경쟁 가속화`;
      leadSummary = [
        `1. 글로벌 빅테크와 국내 테크 기업들이 차세대 AI 반도체 및 고성능 컴퓨팅 센터 확충에 조 단위 투자를 단행하고 있습니다.`,
        `2. 온디바이스 AI 시장 개화에 발맞춰 국내 소프트웨어·보안 솔루션 업계의 신규 수주 및 기술 협력이 급증하는 추세입니다.`,
        `3. 정부와 업계는 국가 AI 컴퓨팅 센터의 조기 구축과 원천 인재 양성을 위한 민관 합동 전략 회의를 개최했습니다.`,
      ];
      topic = '반도체·AI';
      keywords = ['AI가속기', '온디바이스AI', '컴퓨팅인프라'];
      fullContent = `[${outlet.name} 1면 종합] 생성형 인공지능(AI)과 피지컬 AI의 확산으로 글로벌 테크 생태계가 근본적인 체질 전환을 맞이한 가운데, 차세대 고성능 AI 가속기와 초거대 컴퓨팅 인프라를 선점하기 위한 국내외 빅테크 기업들의 조 단위 투자 경쟁이 불을 뿜고 있다.

${outlet.name} 취재를 종합하면, 국내 주요 클라우드 및 인터넷 서비스 기업들은 기존 외산 GPU 의존도를 낮추고 전력 효율을 극대화하기 위해 NPU(신경망처리장치) 기반의 자체 특화 칩 클러스터 구축에 착수했다. 특히 데이터센터 내 전력 소비와 발열을 40% 이상 저감하는 수냉식 냉각 시스템과 차세대 CXL 메모리 풀링 기술이 핵심 인프라로 급부상하고 있다.

스마트폰, 가전, 모빌리티 등 일상 디바이스에 AI를 직접 탑재하는 온디바이스 AI 시장의 개화도 국내 IT 솔루션 업계에 거대한 기회의 장을 열어주고 있다. 네트워크 연결 없이 기기 내부에서 실시간 번역, 문서 요약, 보안 검증을 수행하는 경량화 LLM(sLLM)과 온디바이스 보안 프레임워크 수요가 폭증하면서 관련 스타트업들의 수주 잔고가 연초 대비 3배 이상 늘어났다.

정부 역시 국가 AI 전략위원회를 중심으로 민관 합동 ‘국가 AI 컴퓨팅 센터 조기 가동 로드맵’을 공식 가동했다. 2027년까지 2조 원 규모의 정책 펀드를 조성해 산학연 공동 슈퍼컴퓨팅 리소스를 지원하고, 해외 빅테크에 필적할 소버린 파운데이션 모델 개발을 전폭 뒷받침할 계획이다.

테크 업계 전문가는 “AI 하드웨어 인프라와 소프트웨어 알고리즘의 유기적 결합 없이는 글로벌 빅테크와의 격차를 좁히기 어렵다”며 “전력망 인허가 규제 완화와 원천 AI 핵심 연구 인력에 대한 파격적인 보상 체계 마련이 시급하다”고 강조했다.`;
      break;

    case '방송/통신':
      title = `${outlet.name} 1면: 정기국회 예산안 심사 앞두고 민생 경제 회복 및 미래 먹거리 지원 총력`;
      leadSummary = [
        `1. 정부와 여야가 정기국회 본회의를 앞두고 첨단 산업 인프라 지원 법안과 취약계층 민생 안정 예산 조율에 착수했습니다.`,
        `2. 주요 현장 취재 결과 물가 및 주거 안정에 직결되는 금융·세제 지원 대책의 조속한 처리가 최우선 과제로 꼽혔습니다.`,
        `3. 여야 지도부는 정쟁을 최소화하고 미래 전략 기술 경쟁력 강화에 초당적으로 협력하기로 뜻을 모았습니다.`,
      ];
      topic = '정치·정책';
      keywords = ['정기국회', '민생예산', '산업지원'];
      fullContent = `[${outlet.name} 1면 종합 보도] 여야 정치권이 국정감사 종반부를 지나 본격적인 내년도 예산안 심사와 주요 법안 처리를 앞두고, 고물가·고금리에 지친 민생 경제를 살리고 국가 미래 첨단 먹거리 산업을 지원하기 위한 정책 조율에 돌입했다.

${outlet.name} 취재팀의 국회 현장 취재에 따르면, 예산결산특별위원회와 기획재정위원회는 영세 소상공인과 자영업자의 금융 이자 부담 완화를 위한 대환대출 지원 예산과 지역사랑상품권 국고 보조금 반영 여부를 두고 치열한 막판 절충을 이어가고 있다. 서민층 주거 안정을 위한 공공임대주택 공급과 청년 디딤돌 대출 금리 동결 역시 핵심 민생 쟁점으로 다뤄지고 있다.

미래 국가 경쟁력의 명운이 걸린 첨단 산업 육성법 처리에도 청신호가 켜졌다. 여야 정책위의장은 인공지능(AI) 기본법, 국가기간전력망 확충 특별법, 반도체 특별법 등 국가 핵심 인프라 관련 3대 법안을 정기국회 본회의에서 우선 합의 처리하기로 원칙적인 공감대를 형성했다.

산업계는 이번 예산 정국이 한국 경제의 중장기 도약을 가를 중대 분기점이 될 것으로 기대하고 있다. 경제단체 고위 관계자는 “정쟁으로 인해 경제 활성화 법안이 골든타임을 놓치면 대외 신인도 하락과 기업 투자 위축으로 이어질 수 있다”며 여야의 초당적 협치와 조속한 입법 결단을 호소했다.`;
      break;

    case '지역':
      title = `${outlet.name} 1면: [지역 도약] 미래 모빌리티·분산에너지 특구 유치로 지역 신성장 동력 확보`;
      leadSummary = [
        `1. 지역 균형 발전을 위한 기회발전특구 지정에 맞춰 대규모 첨단 제조 설비와 연구개발 클러스터 투자가 잇따르고 있습니다.`,
        `2. 지역 거점 대학과 연계한 맞춤형 청년 일자리 창출 프로젝트가 본격 가동되며 청년 인구 유입의 청신호가 켜졌습니다.`,
        `3. 지자체와 상공회의소는 지역 중소·벤처기업의 물류망 혁신과 금융 지원을 대폭 강화하기로 협약을 맺었습니다.`,
      ];
      topic = '금융·거시경제';
      keywords = ['지역균형발전', '기회발전특구', '신성장동력'];
      fullContent = `[${outlet.name} 1면 지역 심층 기획] 지역 소멸 위기 속에서도 첨단 미래 모빌리티와 청정 분산에너지를 양대 축으로 삼아 지역 경제의 새로운 도약을 이뤄내려는 지자체와 지역 산업계의 혁신 투자가 가시적인 결실을 맺고 있다.

${outlet.name} 현장 취재 결과, 정부가 지정한 기회발전특구를 중심으로 국내 주요 대기업과 유망 벤처기업들의 대규모 설비 투자가 잇따르고 있다. 특히 이차전지 재활용, 전기차 구동 모터, 친환경 수소 인프라 등 미래 신성장 제조 클러스터가 들어서면서 지역 내 양질의 일자리 창출과 산업 고도화가 빠르게 진전되고 있다.

지역 거점 국립대 및 전문대학들과 연계한 ‘지역 정주형 첨단 인재 양성 프로젝트’도 활기를 띠고 있다. 기업이 요구하는 실무 커리큘럼을 이수한 지역 청년들이 졸업 즉시 지역 선도 기업에 정규직으로 채용되는 선순환 모델이 정착되면서, 수도권으로의 청년 인구 유출세를 억제하는 버팀목 역할을 톡톡히 하고 있다.

지자체와 지역 상공회의소는 입주 기업들에 대한 취득세·재산세 감면 등 과감한 세제 혜택과 더불어, 지자체 주도 지역 상생 펀드를 조성해 연구개발(R&D)과 해외 판로 개척을 입체적으로 지원할 방침이다. 지역 경제계는 “지역의 미래는 수도권 모방이 아닌 독자적인 특화 산업 생태계 구축에 달려 있다”며 국가 차원의 지속적인 인프라 지원을 당부했다.`;
      break;

    case '종합/경제':
    default:
      if (outlet.category === 'economy') {
        title = `${outlet.name} 1면: 하반기 주요 제조업 수출 호조세 견인… 글로벌 공급망 재편 속 초격차 전략`;
        leadSummary = [
          `1. 반도체, 자동차, 바이오 등 주력 산업의 수출 실적이 역대 최고치를 경신하며 무역수지 흑자 기조를 안정적으로 이어가고 있습니다.`,
          `2. 환율 및 국제 원자재 가격 변동성 확대에 대응해 기업들은 공급망 다변화와 핵심 원천 소재 국산화에 박차를 가하고 있습니다.`,
          `3. 경제계는 기업 활력 제고를 위한 규제 혁신과 탄소중립 전환 투자를 위한 정책 금융 확대를 건의했습니다.`,
        ];
        topic = '금융·거시경제';
        keywords = ['수출호조', '무역흑자', '공급망초격차'];
        fullContent = `[${outlet.name} 1면 경제 톱기사] 반도체 슈퍼사이클과 하이브리드 차량 호조, K-바이오 시밀러의 글로벌 시장 약진에 힘입어 대한민국 제조업의 수출 전선이 역대 최대 실적을 연이어 갈아치우고 있다.

${outlet.name} 산업부 집계에 따르면, 자동차·반도체·선박·이차전지 등 15대 주력 수출 품목의 3분기 누적 수출액이 전년 동기 대비 두 자릿수 증가율을 기록하며 연간 무역수지 흑자 500억 달러 달성 목표에 청신호가 켜졌다. 특히 고부가가치 AI 메모리와 북미 시장 내 친환경차 판매 비중이 급증한 점이 수익성 개선을 든든하게 견인했다.

그러나 글로벌 통상 파고는 만만치 않다. 미·중 전략 경쟁 심화와 글로벌 보호무역주의 확산, 중동발 해상 물류 운임 급등이 수출 기업들의 최대 리스크로 꼽힌다. 이에 대응해 국내 주요 수출 기업들은 공급망 다변화와 핵심 원자재 비축 물량을 6개월분 이상으로 확충하는 등 공급망 위기 관리 시스템을 전면 재점검하고 있다.

경제계는 기업 활력 제고를 위한 구조 개혁을 주문하고 있다. 대한상의와 한국경영자총협회는 “글로벌 경쟁국들이 자국 첨단 기업에 천문학적인 보조금과 세제 혜택을 쏟아붓고 있는 만큼, 우리 국회와 정부도 국가전략기술 투자세액공제 일몰 연장과 신산업 규제 샌드박스 확대로 기업들의 초격차 기술 개발을 적극 뒷받침해야 한다”고 제언했다.`;
      } else {
        title = `${outlet.name} 1면: 대전환기 맞은 대한민국 경제… 미래 첨단 산업 육성과 사회 안전망 확충 병행`;
        leadSummary = [
          `1. 저출생·고령화와 글로벌 통상 환경 재편이라는 복합 위기 속에서 미래 성장 잠재력을 확충하기 위한 국가 전략이 발표되었습니다.`,
          `2. 인공지능과 친환경 에너지를 양대 축으로 하는 국가 미래 먹거리 프로젝트에 민관 역량이 총결집됩니다.`,
          `3. 지속 가능한 성장을 뒷받침하기 위해 교육 혁신과 취약 계층을 위한 두터운 사회적 안전망 강화가 병행 추진됩니다.`,
        ];
        topic = '정치·정책';
        keywords = ['국가미래전략', '첨단산업육성', '사회안전망'];
        fullContent = `[${outlet.name} 1면 종합 기획] 대한민국이 저출생·초고령사회 진입이라는 유례없는 인구학적 충격과 글로벌 기술 패권 경쟁이라는 복합적 문명사적 대전환기 속에서, 미래 성장 동력 확보와 사회적 지속가능성을 동시에 달성하기 위한 국가적 총력 체제를 가동하고 있다.

${outlet.name} 취재에 따르면, 정부와 민간 전문가들로 구성된 국가미래전략위원회는 ‘2035 대한민국 도약 그랜드 비전’을 확정하고 AI 자율제조, 양자·바이오, 차세대 에너지 융합을 아우르는 5대 미래 전략 산업에 향후 5년간 100조 원 규모의 민관 합동 펀드를 집중 투입하기로 했다.

성장의 과실이 모든 사회 구성원에게 고루 분배될 수 있도록 돕는 사회안전망 혁신도 동시 추진된다. 플랫폼 노동자와 프리랜서를 포함한 전 국민 고용·산재 안전망의 완성, 일-가정 양립을 위한 자동 육아휴직제 확대, 고령층 일자리와 의료·간병 통합 돌봄 시스템 구축이 핵심 축으로 포함됐다.

학계 석학들은 “성장 없는 복지는 지속 불가능하며, 포용 없는 성장은 사회적 갈등을 증폭시킨다”며 “미래 첨단 기술에 대한 과감한 도전과 사회적 약자를 두텁게 보호하는 공동체적 연대가 결합될 때 비로소 대한민국의 지속 가능한 미래가 열릴 것”이라고 입을 모았다.`;
      }
      break;
  }

  const originalUrl = getDirectOutletUrl(outlet.id, outlet.name, title, keywords, outlet.homepageUrl);

  return {
    id: `fp-${outlet.id}-generated`,
    outletId: outlet.id,
    outletName: outlet.name,
    category: 'frontpage',
    title,
    leadSummary,
    originalUrl,
    publishedAt: `${getCurrentKoreanDateString()} 06:30`,
    keywords,
    topic,
    reporter: `${outlet.name} 특별취재팀`,
    pressSection: '1면 종합',
    newspaperPage: '제 1 면 (종합)',
    newspaperIssueNo: '제 28,491호',
    editionType: '조간 1판',
    leadImageCaption: `${outlet.name} 지면 1면에 보도된 현장 취재 사진 및 데이터 인포그래픽.`,
    reactions: { insightful: 34, important: 88, surprising: 16 },
    fullContent,
  };
}

/**
 * Ensures that all selected outlets have frontpage representation.
 */
export function ensureFrontPageStories(
  existingStories: NewsStory[],
  selectedOutletIds: string[]
): NewsStory[] {
  if (!selectedOutletIds || selectedOutletIds.length === 0) {
    return existingStories;
  }

  const existingOutletIds = new Set(existingStories.map((s) => s.outletId));
  const newStories = [...existingStories];

  for (const outletId of selectedOutletIds) {
    if (!existingOutletIds.has(outletId)) {
      const outletMeta = PRESS_OUTLETS.find((p) => p.id === outletId);
      if (outletMeta) {
        newStories.push(generateFrontPageStoryForOutlet(outletMeta));
        existingOutletIds.add(outletId);
      }
    }
  }

  return newStories;
}
