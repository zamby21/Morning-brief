import type { SectorHeadlineItem } from '../types/news';

export interface KoreanSidoRegion {
  code: string;
  name: string;
  shortName: string;
  aliases: string[];
  sigungu: string[];
}

export const KOREAN_REGIONS: KoreanSidoRegion[] = [
  {
    code: 'seoul',
    name: '서울특별시',
    shortName: '서울',
    aliases: ['서울특별시', '서울시', '서울'],
    sigungu: [
      '강남구',
      '강동구',
      '강북구',
      '강서구',
      '관악구',
      '광진구',
      '구로구',
      '금천구',
      '노원구',
      '도봉구',
      '동대문구',
      '동작구',
      '마포구',
      '서대문구',
      '서초구',
      '성동구',
      '성북구',
      '송파구',
      '양천구',
      '영등포구',
      '용산구',
      '은평구',
      '종로구',
      '중구',
      '중랑구',
    ],
  },
  {
    code: 'gyeonggi',
    name: '경기도',
    shortName: '경기',
    aliases: ['경기도', '경기권', '경기 남부', '경기 북부', '경기남부', '경기북부', '경기지역', '경기 지역'],
    sigungu: [
      '가평군',
      '고양시',
      '과천시',
      '광명시',
      '광주시',
      '구리시',
      '군포시',
      '김포시',
      '남양주시',
      '동두천시',
      '부천시',
      '성남시',
      '수원시',
      '시흥시',
      '안산시',
      '안성시',
      '안양시',
      '양주시',
      '양평군',
      '여주시',
      '연천군',
      '오산시',
      '용인시',
      '의왕시',
      '의정부시',
      '이천시',
      '파주시',
      '평택시',
      '포천시',
      '하남시',
      '화성시',
    ],
  },
  {
    code: 'incheon',
    name: '인천광역시',
    shortName: '인천',
    aliases: ['인천광역시', '인천시', '인천'],
    sigungu: [
      '강화군',
      '계양구',
      '남동구',
      '동구',
      '미추홀구',
      '부평구',
      '서구',
      '연수구',
      '옹진군',
      '중구',
    ],
  },
  {
    code: 'busan',
    name: '부산광역시',
    shortName: '부산',
    aliases: ['부산광역시', '부산시', '부산'],
    sigungu: [
      '강서구',
      '금정구',
      '기장군',
      '남구',
      '동구',
      '동래구',
      '부산진구',
      '북구',
      '사상구',
      '사하구',
      '서구',
      '수영구',
      '연제구',
      '영도구',
      '중구',
      '해운대구',
    ],
  },
  {
    code: 'daegu',
    name: '대구광역시',
    shortName: '대구',
    aliases: ['대구광역시', '대구시', '대구'],
    sigungu: [
      '군위군',
      '남구',
      '달서구',
      '달성군',
      '동구',
      '북구',
      '서구',
      '수성구',
      '중구',
    ],
  },
  {
    code: 'daejeon',
    name: '대전광역시',
    shortName: '대전',
    aliases: ['대전광역시', '대전시', '대전'],
    sigungu: ['대덕구', '동구', '서구', '유성구', '중구'],
  },
  {
    code: 'gwangju',
    name: '광주광역시',
    shortName: '광주',
    aliases: ['광주광역시', '광주시'],
    sigungu: ['광산구', '남구', '동구', '북구', '서구'],
  },
  {
    code: 'ulsan',
    name: '울산광역시',
    shortName: '울산',
    aliases: ['울산광역시', '울산시', '울산'],
    sigungu: ['남구', '동구', '북구', '울주군', '중구'],
  },
  {
    code: 'sejong',
    name: '세종특별자치시',
    shortName: '세종',
    aliases: ['세종특별자치시', '세종시', '세종', '행정중심복합도시'],
    sigungu: ['조치원읍', '새롬동', '도담동', '어진동', '나성동', '한솔동', '보람동'],
  },
  {
    code: 'gangwon',
    name: '강원특별자치도',
    shortName: '강원',
    aliases: ['강원특별자치도', '강원도', '강원'],
    sigungu: [
      '강릉시',
      '고성군',
      '동해시',
      '삼척시',
      '속초시',
      '양구군',
      '양양군',
      '영월군',
      '원주시',
      '인제군',
      '정선군',
      '철원군',
      '춘천시',
      '태백시',
      '평창군',
      '홍천군',
      '화천군',
      '횡성군',
    ],
  },
  {
    code: 'chungbuk',
    name: '충청북도',
    shortName: '충북',
    aliases: ['충청북도', '충북'],
    sigungu: [
      '괴산군',
      '단양군',
      '보은군',
      '영동군',
      '옥천군',
      '음성군',
      '제천시',
      '증평군',
      '진천군',
      '청주시',
      '충주시',
    ],
  },
  {
    code: 'chungnam',
    name: '충청남도',
    shortName: '충남',
    aliases: ['충청남도', '충남'],
    sigungu: [
      '계룡시',
      '공주시',
      '금산군',
      '논산시',
      '당진시',
      '보령시',
      '부여군',
      '서산시',
      '서천군',
      '아산시',
      '예산군',
      '천안시',
      '청양군',
      '태안군',
      '홍성군',
    ],
  },
  {
    code: 'jeonbuk',
    name: '전북특별자치도',
    shortName: '전북',
    aliases: ['전북특별자치도', '전라북도', '전북'],
    sigungu: [
      '고창군',
      '군산시',
      '김제시',
      '남원시',
      '무주군',
      '부안군',
      '순창군',
      '완주군',
      '익산시',
      '임실군',
      '장수군',
      '전주시',
      '정읍시',
      '진안군',
    ],
  },
  {
    code: 'jeonnam',
    name: '전라남도',
    shortName: '전남',
    aliases: ['전라남도', '전남'],
    sigungu: [
      '강진군',
      '고흥군',
      '곡성군',
      '광양시',
      '구례군',
      '나주시',
      '담양군',
      '목포시',
      '무안군',
      '보성군',
      '순천시',
      '신안군',
      '여수시',
      '영광군',
      '영암군',
      '완도군',
      '장성군',
      '장흥군',
      '진도군',
      '함평군',
      '해남군',
      '화순군',
    ],
  },
  {
    code: 'gyeongbuk',
    name: '경상북도',
    shortName: '경북',
    aliases: ['경상북도', '경북'],
    sigungu: [
      '경산시',
      '경주시',
      '고령군',
      '구미시',
      '김천시',
      '문경시',
      '봉화군',
      '상주시',
      '성주군',
      '안동시',
      '영덕군',
      '영양군',
      '영주시',
      '영천시',
      '예천군',
      '울릉군',
      '울진군',
      '의성군',
      '청도군',
      '청송군',
      '칠곡군',
      '포항시',
    ],
  },
  {
    code: 'gyeongnam',
    name: '경상남도',
    shortName: '경남',
    aliases: ['경상남도', '경남'],
    sigungu: [
      '거제시',
      '거창군',
      '고성군',
      '김해시',
      '남해군',
      '밀양시',
      '사천시',
      '산청군',
      '양산시',
      '의령군',
      '진주시',
      '창녕군',
      '창원시',
      '통영시',
      '하동군',
      '함안군',
      '함양군',
      '합천군',
    ],
  },
  {
    code: 'jeju',
    name: '제주특별자치도',
    shortName: '제주',
    aliases: ['제주특별자치도', '제주도', '제주'],
    sigungu: ['서귀포시', '제주시'],
  },
];

const AMBIGUOUS_GENERIC_DISTRICTS = new Set([
  '중구',
  '동구',
  '서구',
  '남구',
  '북구',
  '강서구',
  '고성군',
  '광주시',
]);

/**
 * Curated, homonym-safe district, new-town, and landmark aliases keyed by `${sidoCode}:${sigungu}`.
 * Avoids common Korean non-geographic homonyms (e.g. "중동" Middle East, "사상" historic, "달성" achieve, "강화" strengthen).
 */
const SIGUNGU_ALIASES: Record<string, string[]> = {
  'seoul:강남구': ['강남구', '강남3구', '강남권', '압구정', '대치동', '대치', '개포동', '개포', '청담동', '삼성동', '수서', '도산대로'],
  'seoul:서초구': ['서초구', '강남3구', '반포', '잠원동', '방배동', '방배', '서초동', '양재'],
  'seoul:송파구': ['송파구', '강남3구', '잠실', '가락동', '문정동', '장지동', '거여', '마천', '올림픽파크'],
  'seoul:용산구': ['용산구', '용산', '한남동', '한남', '이촌동', '후암동', '용산정비창'],
  'seoul:성동구': ['성동구', '성수동', '성수상권', '성수', '왕십리', '옥수동', '행당동', '금호동'],
  'seoul:영등포구': ['영등포구', '영등포', '여의도', '신길뉴타운', '당산동', '문래동'],
  'seoul:양천구': ['양천구', '목동', '신정동', '신월동'],
  'seoul:마포구': ['마포구', '마포', '상암', '공덕', '아현', '성산동', '합정'],
  'seoul:노원구': ['노원구', '노원', '상계', '중계', '하계', '월계', '노도강', '광운대역'],
  'seoul:도봉구': ['도봉구', '도봉', '창동', '방학동', '쌍문동', '노도강'],
  'seoul:강북구': ['강북구', '미아뉴타운', '수유동', '번동', '노도강'],
  'seoul:강동구': ['강동구', '둔촌주공', '둔촌동', '고덕강일', '명일동', '천호동', '암사동'],
  'seoul:동작구': ['동작구', '노량진', '흑석뉴타운', '사당동', '상도동', '대방동'],
  'seoul:성북구': ['성북구', '장위뉴타운', '길음뉴타운', '돈암동', '정릉동'],
  'seoul:은평구': ['은평구', '은평뉴타운', '연신내', '불광동', '녹번동', '수색증산'],
  'seoul:동대문구': ['동대문구', '청량리', '이문휘경', '전농동', '답십리', '장안동'],
  'seoul:서대문구': ['서대문구', '북아현', '홍제동', '가재울', '연희동'],
  'seoul:강서구': ['서울 강서', '서울시 강서구', '마곡지구', '마곡', '화곡동', '가양동', '방화뉴타운', '김포공항'],
  'seoul:중구': ['서울 중구', '서울시 중구', '명동', '을지로', '세운지구', '세운상가', '충무로', '신당동'],
  'seoul:종로구': ['종로구', '광화문', '서촌', '북촌', '창신동', '숭인동'],
  'seoul:광진구': ['광진구', '구의동', '자양동', '광장동'],
  'seoul:중랑구': ['중랑구', '상봉동', '면목동', '신내동', '묵동'],
  'seoul:구로구': ['구로구', '신도림', '고척동', '개봉동', '온수동'],
  'seoul:금천구': ['금천구', '가산디지털', '독산동', '시흥동'],
  'seoul:관악구': ['관악구', '봉천동', '신림뉴타운', '신림동'],

  'gyeonggi:성남시': ['성남시', '성남', '분당', '판교', '위례', '야탑', '서현', '정자'],
  'gyeonggi:고양시': ['고양시', '고양창릉', '고양', '일산', '창릉', '덕양구', '대화지구'],
  'gyeonggi:안양시': ['안양시', '안양', '평촌', '동안구', '만안구', '인덕원'],
  'gyeonggi:남양주시': ['남양주시', '남양주', '남양주왕숙', '왕숙', '다산신도시', '별내신도시'],
  'gyeonggi:부천시': ['부천시', '부천', '부천 중동', '중동신도시', '부천대장', '대장지구'],
  'gyeonggi:군포시': ['군포시', '군포', '산본'],
  'gyeonggi:화성시': ['화성시', '동탄신도시', '동탄', '병점', '봉담'],
  'gyeonggi:용인시': ['용인시', '용인', '수지구', '기흥구', '처인구', '용인 반도체', '플랫폼시티'],
  'gyeonggi:수원시': ['수원시', '수원', '광교신도시', '광교', '영통구', '팔달구', '권선구'],
  'gyeonggi:하남시': ['하남시', '하남', '하남교산', '교산신도시', '미사강변', '감일지구', '위례'],
  'gyeonggi:과천시': ['과천시', '과천', '과천지식정보타운', '별양동', '주암지구'],
  'gyeonggi:평택시': ['평택시', '평택', '고덕신도시', '고덕국제', '지제역', '브레인시티'],
  'gyeonggi:광명시': ['광명시', '광명', '철산동', '하안동', '광명시흥'],
  'gyeonggi:김포시': ['김포시', '김포', '한강신도시', '김포한강', '풍무역', '걸포동'],
  'gyeonggi:파주시': ['파주시', '파주', '운정신도시', '운정', '교하지구'],
  'gyeonggi:시흥시': ['시흥시', '시흥', '배곧신도시', '은계지구', '장현지구', '거모지구', '광명시흥'],
  'gyeonggi:안산시': ['안산시', '안산', '초지동', '고잔동', '신안산선'],
  'gyeonggi:의정부시': ['의정부시', '의정부', '고산지구', '민락지구'],
  'gyeonggi:양주시': ['양주시', '양주 옥정', '옥정신도시', '회천신도시'],
  'gyeonggi:광주시': ['경기 광주', '경기도 광주', '경기도 광주시', '초월읍', '곤지암', '태전지구'],
  'gyeonggi:구리시': ['구리시', '구리', '갈매지구', '토평동', '인창동'],
  'gyeonggi:의왕시': ['의왕시', '의왕', '백운밸리', '초평지구'],
  'gyeonggi:이천시': ['이천시', '이천', '부발읍', '중리지구'],
  'gyeonggi:오산시': ['오산시', '오산', '세교신도시'],

  'incheon:연수구': ['연수구', '송도', '송도국제도시', '옥련동', '동춘동'],
  'incheon:서구': ['인천 서구', '인천시 서구', '인천서구', '검단', '검단신도시', '청라', '청라국제도시', '루원시티'],
  'incheon:중구': ['인천 중구', '인천시 중구', '영종', '영종도', '영종국제도시', '인천공항'],
  'incheon:남동구': ['남동구', '구월동', '인천 논현', '서창지구', '간석동'],
  'incheon:부평구': ['부평구', '부평', '산곡동', '청천동', '십정동'],
  'incheon:미추홀구': ['미추홀구', '미추홀', '용현학익', '주안동', '도화지구'],
  'incheon:계양구': ['계양구', '계양테크노밸리', '계양신도시', '작전동'],
  'incheon:동구': ['인천 동구', '인천시 동구', '송림동', '화수동'],

  'busan:해운대구': ['해운대구', '해운대', '센텀2지구', '센텀시티', '센텀', '마린시티', '재송동', '반여동'],
  'busan:수영구': ['수영구', '남천동', '광안리', '민락동', '망미동'],
  'busan:남구': ['부산 남구', '부산시 남구', '문현금융단지', '용호동', '대연동', '감만동', '우암동'],
  'busan:동래구': ['동래구', '동래', '온천장', '사직동', '명륜동'],
  'busan:부산진구': ['부산진구', '서면', '전포동', '부산시민공원'],
  'busan:강서구': ['부산 강서', '부산시 강서구', '에코델타시티', '명지국제신도시', '가덕도신공항'],
  'busan:동구': ['부산 동구', '부산시 동구', '북항재개발', '북항', '초량동', '범일동'],
  'busan:기장군': ['기장군', '일광신도시', '정관신도시', '오시리아'],
  'busan:연제구': ['연제구', '연산동', '부산 거제동'],

  'daegu:수성구': ['수성구', '수성알파시티', '범어동', '만촌동', '황금동', '시지지구'],
  'daegu:군위군': ['군위군', '군위', '대구경북신공항', '통합신공항'],
  'daegu:달서구': ['달서구', '성서산단', '월배지구', '죽전동', '상인동', '두류동'],
  'daegu:달성군': ['달성군', '대구테크노폴리스', '다사읍', '화원읍', '대구국가산단'],
  'daegu:동구': ['대구 동구', '대구시 동구', '동대구역', '신암뉴타운', '율하지구', '대구혁신도시'],
  'daegu:중구': ['대구 중구', '대구시 중구', '동성로', '반월당'],
  'daegu:북구': ['대구 북구', '대구시 북구', '대구 칠곡', '침산동', '복현동'],
  'daegu:서구': ['대구 서구', '대구시 서구', '서대구역', '평리뉴타운'],

  'daejeon:유성구': ['유성구', '유성', '도안신도시', '도안 3단계', '도안지구', '대덕특구', '죽동', '노은지구'],
  'daejeon:서구': ['대전 서구', '대전시 서구', '둔산동', '둔산지구', '탄방동', '도마변동'],
  'daejeon:중구': ['대전 중구', '대전시 중구', '선화동', '유천동'],
  'daejeon:동구': ['대전 동구', '대전시 동구', '대전역세권', '가오동'],
  'daejeon:대덕구': ['대덕구', '오정동', '신탄진', '송촌동'],

  'gwangju:서구': ['광주 서구', '광주시 서구', '상무지구', '화정동', '풍암지구'],
  'gwangju:북구': ['광주 북구', '광주시 북구', '광주 첨단', '운암동', '용봉동'],
  'gwangju:광산구': ['광산구', '수완지구', '첨단2지구', '광주송정역', '선운지구'],
  'gwangju:남구': ['광주 남구', '광주시 남구', '봉선동', '효천지구'],
  'gwangju:동구': ['광주 동구', '광주시 동구', '충장로', '금남로', '계림동'],

  'ulsan:남구': ['울산 남구', '울산시 남구', '울산 삼산동', '옥동', '울산 신정동'],
  'ulsan:울주군': ['울주군', '울주', '언양읍', 'KTX울산역', '온산공단'],
  'ulsan:중구': ['울산 중구', '울산시 중구', '우정혁신도시', '태화동'],

  'chungbuk:청주시': ['청주시', '청주', '오송', '오창', '가경동', '복대동', '청주테크노폴리스'],
  'chungbuk:충주시': ['충주시', '충주', '서충주신도시'],
  'chungnam:천안시': ['천안시', '천안', '불당동', '성성지구', '아산탕정'],
  'chungnam:아산시': ['아산시', '아산', '탕정', '배방'],
  'jeonbuk:전주시': ['전주시', '전주 에코시티', '전주 만성', '완산구', '덕진구'],
  'jeonbuk:군산시': ['군산시', '군산', '새만금'],
  'gyeongbuk:포항시': ['포항시', '포항', '영일만', '초곡지구'],
  'gyeongbuk:구미시': ['구미시', '구미', '구미국가산단'],
  'gyeongnam:창원시': ['창원시', '창원', '마산합포', '마산회원', '진해구', '창원 성산구', '의창구'],
  'gyeongnam:김해시': ['김해시', '김해', '장유'],
  'gangwon:춘천시': ['춘천시', '춘천', '레고랜드'],
  'gangwon:원주시': ['원주시', '원주', '원주혁신도시', '기업도시'],
  'jeju:제주시': ['제주시', '노형동', '연동', '아라동'],
  'jeju:서귀포시': ['서귀포시', '서귀포', '제주영어교육도시'],
};

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function hasBoundaryTokenMatch(text: string, token: string): boolean {
  if (!token) return false;
  const escaped = escapeRegExp(token);
  const regex = new RegExp(
    `(?:^|[^가-힣a-zA-Z0-9])${escaped}(?:시|군|구|읍|면|동|역|권|일대|지구|신도시|산단|공항|대로|특구|의|에서|로|에|와|과|은|는|이|가|을|를|도|\\s|$|[^가-힣a-zA-Z0-9])`
  );
  return regex.test(text);
}

function getSearchableHeadlineText(item: SectorHeadlineItem): string {
  return [
    item.title,
    item.summary,
    ...(item.leadSummary || []),
    ...(item.baseSummary || []),
    ...(item.tags || []),
    item.highlightBadge || '',
    item.keyFigure || '',
    item.fullContent || '',
  ]
    .filter(Boolean)
    .join(' ');
}

export function getRegionByCode(code: string): KoreanSidoRegion | undefined {
  return KOREAN_REGIONS.find((r) => r.code === code);
}

function matchSpecificSigungu(text: string, sido: KoreanSidoRegion, sigungu: string): boolean {
  const key = `${sido.code}:${sigungu}`;
  const customAliases = SIGUNGU_ALIASES[key];

  if (customAliases && customAliases.length > 0) {
    for (const alias of customAliases) {
      if (hasBoundaryTokenMatch(text, alias)) {
        return true;
      }
    }
  }

  // Handle duplicated/ambiguous municipal names safely
  if (AMBIGUOUS_GENERIC_DISTRICTS.has(sigungu)) {
    const hasSidoMention = sido.aliases.some((a) => hasBoundaryTokenMatch(text, a));
    if (!hasSidoMention) {
      return false;
    }
    if (sigungu === '광주시' && sido.code === 'gyeonggi') {
      return /(?:경기도|경기)\s*광주시?/.test(text);
    }
    return hasBoundaryTokenMatch(text, sigungu);
  }

  // Disambiguate 광주광역시 vs 경기도 광주시
  if (
    sido.code === 'gwangju' &&
    /경기도?\s*광주/.test(text) &&
    !/광주광역시|광주시\s*(?:서구|북구|남구|동구|광산구)/.test(text)
  ) {
    return false;
  }

  // Match exact full administrative name (e.g. 해운대구, 사상구, 달성군, 강화군, 평택시)
  return hasBoundaryTokenMatch(text, sigungu);
}

/**
 * Matches a SectorHeadlineItem against selected Si/Do and optional Si/Gun/Gu.
 * - If selectedSido is '' or 'all': returns true (no regional filter).
 * - If selectedSido is chosen and selectedSigungu is '' or 'all': matches any article mentioning the Si/Do OR any of its Si/Gun/Gu municipalities.
 * - If both selectedSido and selectedSigungu are chosen: strictly matches articles referencing that specific Si/Gun/Gu.
 */
export function matchesRegionFilter(
  item: SectorHeadlineItem,
  selectedSido: string,
  selectedSigungu: string
): boolean {
  if (!selectedSido || selectedSido === 'all') {
    return true;
  }

  const sido = getRegionByCode(selectedSido);
  if (!sido) return true;

  const text = getSearchableHeadlineText(item);

  if (selectedSigungu && selectedSigungu !== 'all') {
    return matchSpecificSigungu(text, sido, selectedSigungu);
  }

  if (sido.code === 'gwangju') {
    if (/광주광역시|전남\s*·?\s*광주|호남/.test(text)) return true;
    if (hasBoundaryTokenMatch(text, '광주') && !/경기도?\s*광주/.test(text)) return true;
  } else {
    for (const alias of sido.aliases) {
      if (hasBoundaryTokenMatch(text, alias)) {
        return true;
      }
    }
  }

  return sido.sigungu.some((sg) => matchSpecificSigungu(text, sido, sg));
}
