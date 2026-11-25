# 모닝브리프 웹앱 3차 심층 검토

## 검토 범위와 한계

- 검토 대상: D:/★ DATA/DeskTop/모닝브리프---매일-아침-뉴스-요약.zip (2026-11-25 제공본)
- 배포 사이트: https://morning-brief-zamby.vercel.app/
- 소스는 정적으로 검토했고 배포 화면은 2026-11-25 13:56 전후(KST)에 확인했습니다.
- Vercel 환경 변수, 함수 로그, API 상태 응답은 직접 확인하지 못했습니다. Gemini 미작동 원인이나 특정 언론사의 수집 실패 원인은 단정하지 않습니다.
- 빌드·린트·자동 테스트는 실행하지 않았습니다. ZIP의 walkthrough에 적힌 PoC 결과는 작성자의 기록으로만 보았으며 이번 검토에서 재현하지 않았습니다.

## 핵심 판단

샘플 데이터와 이메일 미리보기 안내, HTML 출력과 이미지 프록시 보호는 보강되어 있습니다. 하지만 원문이 부족한 기사에 코드가 근거 없는 문장을 채워 3줄 요약으로 보여주는 문제가 가장 먼저 고쳐져야 합니다. 실제 사이트에서도 여러 기사에 AI 분석 불가 안내가 반복됐습니다. 이런 상태에서는 원문이 충분히 확보되지 않은 카드의 템플릿 문장이 AI 검증 없이 노출될 수 있습니다.

| 우선순위 | 확인 내용 | 영향 |
|---|---|---|
| P0 | 본문이 짧으면 근거 없는 문장을 자동 생성 | 기사에 없는 발언·계획·전망이 사실처럼 보일 수 있음 |
| P1 | AI fallback이 일부 오류에서 중단, 실제 화면은 AI 분석 불가 | AI 미작동 원인 파악과 자동 복구가 어려움 |
| P1 | 이메일 미리보기·로그·예약 API가 인증 없이 공용 상태를 공유 | 수신 이메일 노출 및 설정 변경 위험 |
| P1 | 캐시·요청 제한·주간 기록이 프로세스 메모리에만 저장 | Vercel 인스턴스가 바뀌면 데이터와 제한이 이어지지 않음 |
| P1 | 네이버·언론사 웹페이지 자동 수집 및 기사 발췌 | 출처별 허용 범위와 저작권 확인 필요 |
| P2 | 키워드 부분 문자열 매칭 및 순서 의존 기본 키워드 | 주제와 무관한 키워드, 부정확한 매체 수 집계 |
| P2 | ‘단독’·‘공통 보도’의 확인 범위가 제한적 | UI 문구가 실제 판정 범위보다 강하게 들릴 수 있음 |
| P2 | 홈페이지 중앙 기사를 ‘신문 1면 톱’으로 표시 | 인쇄판 1면 확인으로 오해 가능 |

## 프로젝트 구조와 주요 기능

- React 앱 [App.tsx](<C:/Users/상록/Documents/Codex/2026-11-22/referenced-chatgpt-conversation-this-is-an/work/morningbrief-live-review/src/App.tsx:1>)가 1면 핵심, 공통 이슈, 단독 기사, 부동산·건설·도시개발·금융 섹터, 키워드·주간 리포트, 설정·이메일 미리보기를 구성합니다.
- 섹션은 [FrontPageSection.tsx](<C:/Users/상록/Documents/Codex/2026-11-22/referenced-chatgpt-conversation-this-is-an/work/morningbrief-live-review/src/components/FrontPageSection.tsx:1>), [OverlappingStoriesSection.tsx](<C:/Users/상록/Documents/Codex/2026-11-22/referenced-chatgpt-conversation-this-is-an/work/morningbrief-live-review/src/components/OverlappingStoriesSection.tsx:1>), [ExclusiveStoriesSection.tsx](<C:/Users/상록/Documents/Codex/2026-11-22/referenced-chatgpt-conversation-this-is-an/work/morningbrief-live-review/src/components/ExclusiveStoriesSection.tsx:1>), [RealEstateFinanceSection.tsx](<C:/Users/상록/Documents/Codex/2026-11-22/referenced-chatgpt-conversation-this-is-an/work/morningbrief-live-review/src/components/RealEstateFinanceSection.tsx:1>) 등으로 나뉩니다.
- [api/index.ts](<C:/Users/상록/Documents/Codex/2026-11-22/referenced-chatgpt-conversation-this-is-an/work/morningbrief-live-review/api/index.ts:1>)가 Express 앱인 [server.ts](<C:/Users/상록/Documents/Codex/2026-11-22/referenced-chatgpt-conversation-this-is-an/work/morningbrief-live-review/server.ts:1>)를 Vercel 함수로 내보냅니다. 화면은 Vite 정적 빌드, API는 같은 도메인의 서버 함수 구조입니다.
- 수집은 [realNewsCollector.ts](<C:/Users/상록/Documents/Codex/2026-11-22/referenced-chatgpt-conversation-this-is-an/work/morningbrief-live-review/src/services/realNewsCollector.ts:1>), 키워드 추이는 [keywordTrend.ts](<C:/Users/상록/Documents/Codex/2026-11-22/referenced-chatgpt-conversation-this-is-an/work/morningbrief-live-review/src/utils/keywordTrend.ts:1>), 문체와 미연결 AI 표시는 [toneTransformer.ts](<C:/Users/상록/Documents/Codex/2026-11-22/referenced-chatgpt-conversation-this-is-an/work/morningbrief-live-review/src/utils/toneTransformer.ts:1>)가 담당합니다.

## 우선 수정할 문제

### P0 — 원문이 짧을 때 근거 없는 내용을 3줄 요약에 삽입

[realNewsCollector.ts의 요약 함수](<C:/Users/상록/Documents/Codex/2026-11-22/referenced-chatgpt-conversation-this-is-an/work/morningbrief-live-review/src/services/realNewsCollector.ts:1980>)는 실제 본문에서 문장 3개를 확보하지 못하면 제목 분야에 맞춘 문장으로 빈 줄을 채웁니다. 예를 들어 “전문가들은 … 권고하고 있습니다”, “관계 당국의 … 후속 조치”, “이해관계자들의 분석” 같은 문장이 원문에 있는지 확인하지 않고 추가됩니다. 관련 생성부는 [분야별 문장](<C:/Users/상록/Documents/Codex/2026-11-22/referenced-chatgpt-conversation-this-is-an/work/morningbrief-live-review/src/services/realNewsCollector.ts:2019>) 및 [3줄 채움 반복문](<C:/Users/상록/Documents/Codex/2026-11-22/referenced-chatgpt-conversation-this-is-an/work/morningbrief-live-review/src/services/realNewsCollector.ts:2059>)입니다.

사이트는 AI 분석 불가 시 “원문 핵심 3줄 요약”을 제공한다고 표시하지만, 본문 문장이 부족하면 그 설명과 달리 일부 줄이 원문에 없는 템플릿일 수 있습니다. 이 문제는 뉴스 요약의 신뢰도를 직접 낮춥니다.

**수정안:** 추출한 원문 문장만 반환하고, 3문장 미만이면 빈 줄을 만들지 않습니다. 대신 “본문 발췌 부족 — 제목과 원문 링크만 제공”을 표시합니다. “전문가 발언”, “당국 계획”, “시장 전망”은 원문 근거가 있을 때만 요약합니다.

### P1 — Gemini fallback이 모든 오류에서 동작하지 않음

모델 ID는 [server.ts의 고정 상수](<C:/Users/상록/Documents/Codex/2026-11-22/referenced-chatgpt-conversation-this-is-an/work/morningbrief-live-review/server.ts:553>), 재시도는 [generateWithResilientModel](<C:/Users/상록/Documents/Codex/2026-11-22/referenced-chatgpt-conversation-this-is-an/work/morningbrief-live-review/server.ts:579>)에 있습니다. 다음 모델로 넘어가는 경우는 현재 quota 오류와 timeout/abort로 제한됩니다. 모델이 없거나 권한·요청 설정이 틀린 오류는 throw되어 대체 모델을 시도하지 않습니다. 뒤의 요약 흐름은 원문 기반 결과를 유지하고 AI 시사점은 사용할 수 없다고 표시합니다.

실제 사이트에서 AI 분석 불가가 반복됐지만, 이를 API 키 누락·쿼터·모델 권한·모델명 오류 중 하나로 단정할 증거는 없습니다. .env.example은 예시 자리표시자일 뿐 실제 Vercel 환경을 보여주지 않습니다.

**수정안:** 배포 /api/health에서 geminiConfigured와 수집 상태를 확인하고, Vercel 함수 로그에서 키를 제외한 오류 코드·모델명·시각을 확인합니다. 모델명과 접근 권한은 실제 Google 계정에서 사용할 수 있는 모델 목록으로 확인합니다. 코드에서는 404/지원하지 않는 모델과 quota 오류를 구분해 해당 모델을 cooldown한 뒤 대체 후보를 시도합니다. 잘못된 키처럼 대체 모델로 해결되지 않는 오류는 별도 상태로 반환하고 반복 요청을 막습니다.

### P1 — 실패가 HTTP 200과 성공으로 보임

POST /api/summarize의 최상위 예외 처리는 샘플 브리핑을 반환하면서 success: true를 보냅니다([server.ts](<C:/Users/상록/Documents/Codex/2026-11-22/referenced-chatgpt-conversation-this-is-an/work/morningbrief-live-review/server.ts:1194>)). 화면에서 fallback을 표시하는 데에는 유용하지만 모니터링이나 외부 호출자는 수집 실패를 성공으로 오인할 수 있습니다. /api/health도 기본적으로 status: ok를 반환합니다([server.ts](<C:/Users/상록/Documents/Codex/2026-11-22/referenced-chatgpt-conversation-this-is-an/work/morningbrief-live-review/server.ts:177>)).

**수정안:** fallback 화면 데이터는 반환하되 degraded: true, source: fallback, 안정된 errorCode를 포함해 정상·부분성공·실패를 구분합니다. Health는 기사 수집과 Gemini 상태를 각각 ok / degraded / unavailable로 나타내고 마지막 성공 시각을 기록합니다. 민감한 키나 원문 오류 문구는 공개하지 않습니다.

## 개인정보·보안

### P1 — 이메일 API가 인증 없이 전역 정보를 공유

[send-email 미리보기](<C:/Users/상록/Documents/Codex/2026-11-22/referenced-chatgpt-conversation-this-is-an/work/morningbrief-live-review/server.ts:1423>)는 수신 주소를 로그에 저장합니다([로그 추가](<C:/Users/상록/Documents/Codex/2026-11-22/referenced-chatgpt-conversation-this-is-an/work/morningbrief-live-review/server.ts:1480>)). 공개 [email-logs](<C:/Users/상록/Documents/Codex/2026-11-22/referenced-chatgpt-conversation-this-is-an/work/morningbrief-live-review/server.ts:1580>)는 로그를 반환하고 [email-schedule GET/POST](<C:/Users/상록/Documents/Codex/2026-11-22/referenced-chatgpt-conversation-this-is-an/work/morningbrief-live-review/server.ts:1595>)는 전역 수신 주소와 설정을 누구나 읽고 바꿀 수 있습니다. 실제 발송이 꺼져 있어도 이메일은 개인정보입니다.

**수정안:** 로그인·사용자별 저장이 없다면 로그와 예약 API를 제거하거나 공개 응답을 비활성화합니다. 유지한다면 인증 후 사용자별로 저장하고 이메일은 마스킹 및 보존 기간 제한을 적용합니다.

### P1 — 토큰을 설정하지 않으면 강제 수집 확인이 통과

.env.example에서 ADMIN_REFRESH_TOKEN은 선택값이며 비어 있습니다([설정 예시](<C:/Users/상록/Documents/Codex/2026-11-22/referenced-chatgpt-conversation-this-is-an/work/morningbrief-live-review/.env.example:11>)). 코드도 토큰이 없으면 관리자 확인을 통과시킵니다([server.ts](<C:/Users/상록/Documents/Codex/2026-11-22/referenced-chatgpt-conversation-this-is-an/work/morningbrief-live-review/server.ts:146>)). 이 상태에서는 공개 summarize API에서 forceRefresh를 요청해 강제 수집 경로를 사용할 수 있습니다.

**수정안:** 운영 토큰이 없으면 강제 새로고침 요청은 거부하고 이 기능은 관리자 경로로 분리합니다.

### 잘된 보안 방어

- 뉴스레터 HTML은 escapeHtml과 HTTP/HTTPS URL 제한을 적용합니다([htmlSanitizer.ts](<C:/Users/상록/Documents/Codex/2026-11-22/referenced-chatgpt-conversation-this-is-an/work/morningbrief-live-review/src/utils/htmlSanitizer.ts:15>)).
- 이미지 프록시는 허용 도메인, DNS/IP, 리다이렉트와 반환 형식을 확인하는 코드가 있습니다([네트워크 검사](<C:/Users/상록/Documents/Codex/2026-11-22/referenced-chatgpt-conversation-this-is-an/work/morningbrief-live-review/server.ts:293>), [프록시 경로](<C:/Users/상록/Documents/Codex/2026-11-22/referenced-chatgpt-conversation-this-is-an/work/morningbrief-live-review/server.ts:516>)). 코드는 확인했지만 이번에 공격 입력 테스트를 재실행한 것은 아닙니다.
- 요청 본문 크기 제한, API별 요청 제한, 이메일·시간대·언론사 ID 검증이 들어 있습니다.

## 배포·성능·데이터 저장

### P1 — 서버 메모리 상태는 Vercel 인스턴스 사이에서 공유되지 않음

요청 제한 Map은 [server.ts:44](<C:/Users/상록/Documents/Codex/2026-11-22/referenced-chatgpt-conversation-this-is-an/work/morningbrief-live-review/server.ts:44>), 브리핑·14일 기록은 [server.ts:93](<C:/Users/상록/Documents/Codex/2026-11-22/referenced-chatgpt-conversation-this-is-an/work/morningbrief-live-review/server.ts:93>), 이메일 로그·예약은 [server.ts:1580](<C:/Users/상록/Documents/Codex/2026-11-22/referenced-chatgpt-conversation-this-is-an/work/morningbrief-live-review/server.ts:1580>) 주변의 메모리 변수입니다. Vercel 함수가 여러 인스턴스로 나뉘거나 재시작되면 각 인스턴스의 값이 달라집니다. 주간 리포트는 2일 이상 기록이 필요하므로([server.ts](<C:/Users/상록/Documents/Codex/2026-11-22/referenced-chatgpt-conversation-this-is-an/work/morningbrief-live-review/server.ts:1359>)) 인스턴스에 따라 샘플 리포트로 돌아갈 수 있습니다. 키워드 추이도 메모리에 저장합니다([keywordTrend.ts](<C:/Users/상록/Documents/Codex/2026-11-22/referenced-chatgpt-conversation-this-is-an/work/morningbrief-live-review/src/utils/keywordTrend.ts:25>)).

**수정안:** 캐시·키워드 시계열·일별 기록은 영속 저장소에 넣고 요청 제한은 공유 KV/Redis 또는 플랫폼 보호 기능을 사용합니다. 저장 서비스 선택은 ZIP만으로 확인할 수 없으므로 현재 Vercel 계정의 사용 가능 서비스를 먼저 확인해야 합니다.

### P2 — 로컬 start 스크립트의 Node 버전 의존

[package.json](<C:/Users/상록/Documents/Codex/2026-11-22/referenced-chatgpt-conversation-this-is-an/work/morningbrief-live-review/package.json:6>)은 개발 실행에는 tsx를 쓰지만 start는 node server.ts입니다. 이 방식은 Node 버전에 따라 TypeScript 파일을 직접 처리할 수 있는지가 달라질 수 있습니다. Vercel은 api/index.ts를 진입점으로 쓰므로 이것이 곧 배포 실패를 의미하지는 않습니다. 로컬 실행과 배포 환경의 Node 버전을 명시하고 같은 실행 경로를 검증하세요.

[vercel.json](<C:/Users/상록/Documents/Codex/2026-11-22/referenced-chatgpt-conversation-this-is-an/work/morningbrief-live-review/vercel.json:1>)은 Vite 빌드와 /api 경로를 API 함수로 보냅니다. Production의 GEMINI_API_KEY 설정과 API 함수 실행 제한은 Vercel 대시보드에서 확인해야 합니다. ZIP walkthrough의 로컬 성공 기록은 배포 상태를 증명하지 않습니다. 빌드·린트·/api/health·/api/summarize 확인을 배포 체크리스트 또는 CI에 추가하세요. 이번 검토에서는 실행하지 않았습니다.

## 뉴스 수집·중복·단독·분야 판별

### 출처와 저작권·약관

수집기는 언론사 홈페이지 중앙 리드, 네이버 언론사·검색 HTML, Google News RSS를 조합합니다([홈페이지·네이버 수집 흐름](<C:/Users/상록/Documents/Codex/2026-11-22/referenced-chatgpt-conversation-this-is-an/work/morningbrief-live-review/src/services/realNewsCollector.ts:1313>), [RSS 수집](<C:/Users/상록/Documents/Codex/2026-11-22/referenced-chatgpt-conversation-this-is-an/work/morningbrief-live-review/src/services/realNewsCollector.ts:1594>), [섹터 수집](<C:/Users/상록/Documents/Codex/2026-11-22/referenced-chatgpt-conversation-this-is-an/work/morningbrief-live-review/src/services/realNewsCollector.ts:1815>)). RSS 발행 매체명을 확인하고 기사 시점을 제한하며 동시 수집 수를 제한하는 점은 좋습니다.

네이버 정책은 허용 API, 명시적 허가·동의, robots.txt 허용 범위 등을 제외한 자동화 수집을 제한한다고 밝힙니다([네이버 정책](https://policy.naver.com/policy/disclaimer.html)). 코드로는 네이버·각 언론사와의 허가나 계약 여부를 알 수 없습니다. 저작권법 제28조는 정당한 범위와 공정한 관행을 조건으로 하며, 기사 발췌가 자동으로 허용된다는 뜻은 아닙니다([저작권법 제28조](https://www.law.go.kr/LSW/lsLinkCommonInfo.do?chrClsCd=010202&lsJoLnkSeq=1032659421)). 코드의 700자 제한도 이용 허가를 뜻하지 않습니다([발췌 제한](<C:/Users/상록/Documents/Codex/2026-11-22/referenced-chatgpt-conversation-this-is-an/work/morningbrief-live-review/src/services/realNewsCollector.ts:2078>)).

**수정안:** 출처별 허용 방식과 사용 범위를 확인해 기록하고 제휴·공식 API·허용 RSS를 우선합니다. 발췌는 필요한 최소 범위로 제한하고 매체·원문 링크·발행 및 수집 시각을 표시합니다. 권한이 확인되지 않은 수집기는 운영 활성화 전에 점검합니다.

### ‘신문 1면 톱’ 표시

수집 코드는 언론사 홈페이지 중앙의 리드 기사를 추출합니다. UI는 이를 “신문 1면 톱”이라고 표시합니다([Header.tsx](<C:/Users/상록/Documents/Codex/2026-11-22/referenced-chatgpt-conversation-this-is-an/work/morningbrief-live-review/src/components/Header.tsx:91>), [수집 라벨](<C:/Users/상록/Documents/Codex/2026-11-22/referenced-chatgpt-conversation-this-is-an/work/morningbrief-live-review/src/services/realNewsCollector.ts:2286>)). 홈페이지 첫 화면과 인쇄판 1면은 다를 수 있습니다.

**수정안:** e-paper/인쇄판 데이터를 실제로 받지 않는다면 “언론사 홈페이지 주요 기사” 또는 “홈페이지 중앙 주요 기사”로 표시합니다.

### 공통 보도

제목·본문 유사도를 조합하고 같은 언론사끼리는 비교하지 않으며 군집에 같은 언론사를 중복 추가하지 않게 한 점은 타당한 출발입니다([유사도 기준](<C:/Users/상록/Documents/Codex/2026-11-22/referenced-chatgpt-conversation-this-is-an/work/morningbrief-live-review/src/services/realNewsCollector.ts:2402>), [군집 중복 방지](<C:/Users/상록/Documents/Codex/2026-11-22/referenced-chatgpt-conversation-this-is-an/work/morningbrief-live-review/src/services/realNewsCollector.ts:2484>)).

공통 보도 화면은 3개 언론사 이상일 때만 만듭니다([기준](<C:/Users/상록/Documents/Codex/2026-11-22/referenced-chatgpt-conversation-this-is-an/work/morningbrief-live-review/src/services/realNewsCollector.ts:2512>)). 확인 당시 사이트의 공통 이슈는 0건이었고 화면은 기준을 낮춰 보라고 안내했습니다. 2개 언론사 보도를 제외하는 것은 정밀도를 높이는 대신 놓치는 이슈를 늘릴 수 있는 제품 선택입니다.

유사도를 숫자로 표시하지만 확률로 보정했다는 근거는 코드에서 확인되지 않습니다. “수집 기사 간 텍스트 유사도”라고 설명하고 묶인 매체의 실제 제목을 보여주세요. 데이터가 적을 때 “공통 보도 없음”보다 “선택 매체 중 3개 이상 교차 확인된 군집 없음”으로 알리는 편이 정확합니다.

### 단독 기사

제목의 [단독] 표기를 확인한 뒤 선택한 수집 기사 안에서만 다른 매체의 유사 보도를 검사합니다([판정 규칙](<C:/Users/상록/Documents/Codex/2026-11-22/referenced-chatgpt-conversation-this-is-an/work/morningbrief-live-review/src/services/realNewsCollector.ts:2619>)). 전체 언론사의 모든 기사를 확인해 독점성을 입증하는 과정은 아닙니다.

**수정안:** “단독 표기 기사”와 “현재 선택한 매체 수집 범위에서 중복 후보 없음”을 함께 표시합니다. 수집 범위와 확인 시각을 공개하고, 전체 보도 중 유일함을 확정하는 듯한 문구는 피합니다.

### 키워드와 분야 분류

- AI 결과가 없을 때 기본 키워드는 언론사 순서대로 제목에서 단어를 뽑아 처음 8개를 선택합니다([키워드 수집](<C:/Users/상록/Documents/Codex/2026-11-22/referenced-chatgpt-conversation-this-is-an/work/morningbrief-live-review/src/services/realNewsCollector.ts:2274>), [8개 선택](<C:/Users/상록/Documents/Codex/2026-11-22/referenced-chatgpt-conversation-this-is-an/work/morningbrief-live-review/src/services/realNewsCollector.ts:2659>)). 기사 전체의 빈도를 계산한 인기 키워드가 아닐 수 있습니다. 제목 앞부분 단어 추출도 명사 분석이나 빈도 순위와 다릅니다([추출 규칙](<C:/Users/상록/Documents/Codex/2026-11-22/referenced-chatgpt-conversation-this-is-an/work/morningbrief-live-review/src/utils/linkUtils.ts:183>)).
- 추이 집계는 2글자 이상 키워드를 제목·요약·태그에서 부분 문자열로 찾습니다([부분 일치](<C:/Users/상록/Documents/Codex/2026-11-22/referenced-chatgpt-conversation-this-is-an/work/morningbrief-live-review/src/utils/keywordTrend.ts:27>)). 확인 당시 화면의 “#이어 17개사”는 실제 주제가 ‘이어’인 17개 매체라는 뜻으로 보기 어렵고, 문장 포함 매칭으로 부풀려졌을 가능성이 있습니다. 개별 매칭 기사를 확인하지 못했으므로 원인이라고 단정하지는 않습니다.
- 상승 추이는 관측이 2개 시간대 이상 쌓이기 전 숨깁니다. 허위 추세를 막는 점은 좋지만 기록이 메모리뿐이라 인스턴스가 바뀌면 누적되지 않을 수 있습니다.
- 분야는 네 분야별 검색어·정규식에 크게 의존합니다([분야 설정](<C:/Users/상록/Documents/Codex/2026-11-22/referenced-chatgpt-conversation-this-is-an/work/morningbrief-live-review/src/services/realNewsCollector.ts:1731>)). 당시 사이트에서 건설은 최신 기사 없음, 다른 섹터는 기사 표시였습니다. 이는 당시 결과일 수도 있고 검색어나 출처 범위 문제일 수도 있습니다. 분야별 질의·수집 건수·최근 성공 시각을 운영 화면에 표시하고 검증 기사 목록으로 기준을 조정하세요.

## 배포 화면 확인

2026-11-25 13:56 전후, 1면 4건·공통 0건·단독 3건·분야 12건으로 보였습니다. 건설에는 최신 기사가 없었고 AI 분석 불가 안내가 여러 기사에 반복됐습니다. “실시간 연동/LIVE”는 기사 수집 상태를 뜻하는 것으로 보이지만 AI 상태와 분리되어 있지 않아 전체 분석이 정상이라고 오해할 수 있습니다.

화면 기사 중 한 건은 같은 날짜의 중앙일보 기사와 대조됐습니다([중앙일보 기사](https://www.joongang.co.kr/article/25481713?ac=vt)). 이는 한 카드의 출처를 일부 확인한 것일 뿐 전체 기사 정확성이나 수집률을 검증한 결과는 아닙니다.

**수정안:** “기사 수집: 정상/일부 지연/실패”와 “AI 요약: 정상/미연결/일시 오류”를 나눠 표시하고, 기사마다 매체·발행 시각·수집 시각·원문 링크를 유지합니다.

## 실행 순서

1. 원문이 없는 자동 채움 문장을 제거하고 본문 부족 상태를 표시합니다.
2. Gemini 설정·모델 접근을 확인하고 실패 종류를 API·화면에 구분해 표시합니다.
3. 이메일 로그·전역 예약 API를 인증 및 사용자별 저장 없이 공개하지 않습니다. 관리자 토큰이 없으면 강제 수집을 거부합니다.
4. 주간 기록·키워드 시계열·요청 제한을 서버리스 인스턴스 외부의 공유 저장소로 옮깁니다.
5. 공통 3개사 기준, 제한된 단독 판정, 유사도 수치의 의미를 UI에 밝히고 홈페이지 리드를 종이신문 1면으로 부르지 않습니다.
6. 네이버·언론사별 자동 수집 및 발췌 허용 여부를 확인하고 출처별 정책을 기록합니다.



## 별도 수정안

근거 없는 자동 채움 문장을 제거하고, 본문 문장이 부족하면 실제 확보된 문장 수만 반환하도록 한 수정 초안은 outputs/3차-수정안/diff.patch에 있습니다. 원본 ZIP이나 배포 사이트에는 적용하지 않았습니다. 적용 전 프로젝트 작업본에서 검토하고 화면 확인이 필요합니다.
