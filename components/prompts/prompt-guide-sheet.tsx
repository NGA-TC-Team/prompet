"use client";
import { motion } from "motion/react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { useClipboard } from "@/hooks/use-clipboard";

interface Technique {
  name: string;
  category: "구조화" | "추론" | "제약" | "예시" | "안티패턴" | "운영";
  why: string;
  example: string;
}

const TECHNIQUES: Technique[] = [
  {
    name: "Role / Persona",
    category: "구조화",
    why: "출력의 어휘·관점·신뢰 한계를 한 번에 고정합니다. 페르소나에 권위·범위·거절 조건까지 명시할 때 가장 강력합니다.",
    example: `## ROLE
You are a senior product copywriter with 12 years' experience writing for
B2B SaaS brands. You write in Korean, optimize for scannability, and refuse
any claim you cannot verify from the brief.

## AUDIENCE
{{audience=중소기업 IT 의사결정자}} — 시간이 부족하고 회의 중 빠르게 훑어봅니다.

## VOICE
- 어조: {{tone=신뢰감 있고 절제된}}, 마케팅 과장 표현 금지
- 금지어: "혁신적인", "최고의", "단연코", "압도적", 이모지 전부
- 한 문장 최대 38자, 단어 단위 줄바꿈 금지

## TASK
입력으로 들어오는 제품 설명을 다음 3개 자산으로 변환합니다.
1. 슬로건 — 22자 이내, 동사로 시작
2. 한 줄 가치 제안 — 38자 이내, "{대상}이(가) {성과}할 수 있도록 {수단}" 패턴
3. CTA 버튼 텍스트 — 6자 이내 명령형

## REFUSAL
브리프에 근거가 없는 수치·인증·고객사명은 생성하지 말고
"브리프에 근거 없음"으로 표시합니다.

## INPUT
\`\`\`
{{brief|제품 브리프}}
\`\`\`

## OUTPUT FORMAT
- 위 3개 자산을 각각 3개 변형(A/B/C)으로 출력
- Markdown 표 한 개, 헤더: 자산 / A / B / C
- 표 외 텍스트(서론/맺음말) 금지`,
  },
  {
    name: "출력 스키마 (Output Schema)",
    category: "구조화",
    why: "후처리 파서를 깨뜨리지 않으려면 출력 형식을 코드로 강제해야 합니다. 스키마 + 예시 + 위반 시 처리 규칙을 함께 묶는 것이 핵심.",
    example: `## TASK
주어진 한국어 회의록을 아래 JSON 스키마로 정확히 응답하세요.
\`\`\`json
{
  "meeting_id": "string (UUID v4)",
  "summary_ko": "string ≤ 280자",
  "decisions": [
    {
      "id": "D-### (3자리, 회의 내 unique)",
      "statement": "string ≤ 120자",
      "owner": "string | null",
      "confidence": "high | medium | low"
    }
  ],
  "action_items": [
    {
      "id": "A-###",
      "owner": "string (실명, 미지정 시 'unassigned')",
      "task": "string, 동사로 시작",
      "due": "YYYY-MM-DD | null",
      "blocking": ["A-### or D-### 참조"]
    }
  ],
  "open_questions": ["string"]
}
\`\`\`

## RULES
1. 응답은 위 JSON **하나만**. 코드펜스/주석/서론 금지.
2. 회의록에 없는 사실은 추론하지 않습니다. 모르면 null 또는 "unassigned".
3. 날짜는 회의 일자({{meeting_date|회의 일자 YYYY-MM-DD}}) 기준 ISO 8601.
4. confidence는 다음 휴리스틱:
   - high: 결정문이 명시적("...으로 합의")
   - medium: 합의는 있으나 책임자/마감 불명확
   - low: 토론 중 잠정 의견

## SELF-CHECK (출력 직전)
- JSON.parse 가능 여부
- decisions[].id, action_items[].id 중복 없음
- 각 action_items[].blocking 항목이 실제로 존재하는 id인지

## INPUT
\`\`\`
{{transcript|회의록 원문}}
\`\`\``,
  },
  {
    name: "단계 분해 (Decomposition)",
    category: "구조화",
    why: "복합 과제는 한 번에 풀게 하면 단계 누락이 발생합니다. 명시적 단계 + 단계별 출력 컨테이너로 강제하면 검증·캐싱·부분 재실행이 모두 가능해집니다.",
    example: `## OBJECTIVE
다음 코드 변경을 4단계로 리뷰합니다. 각 단계는 정해진 헤더와 형식을 지킵니다.

## STAGE 1 — INTENT
- 한 줄(≤ 80자)로 이 변경이 해결하려는 사용자 문제를 진술
- 변경되지 않은 가정(불변식) 3개를 bullet로 나열

## STAGE 2 — STATIC ANALYSIS
표 한 개, 헤더: severity / location / issue / suggested_fix
- severity: blocker | major | minor | nit
- location: 파일:라인
- 항목이 없으면 "없음"으로 1행만

## STAGE 3 — RUNTIME RISKS
- 동시성 / 입력 경계 / 실패 모드 / 관측성 4가지 카테고리
- 각 카테고리에 시나리오 1~2개 (없으면 "해당 없음")

## STAGE 4 — RECOMMENDATION
- 머지 권고: APPROVE | REQUEST_CHANGES | NEEDS_DISCUSSION
- 그 사유를 결정 근거 ≤ 3개로
- 머지 전 반드시 처리할 항목만 STAGE 2에서 인용 (id가 없다면 위치)

## CONSTRAINTS
- 어떤 단계도 건너뛰지 마십시오. 정보가 부족하면 "정보 부족"으로 명시.
- STAGE 2의 issue 본문은 비난 어조 금지("...해야 함" 대신 "...하면 X 위험 감소").

## INPUT
언어: {{lang=TypeScript}}
변경 의도(작성자 메모): {{intent}}
\`\`\`diff
{{diff|통합 diff(unified)}}
\`\`\``,
  },
  {
    name: "Chain-of-Thought (구조화 추론)",
    category: "추론",
    why: "단순한 \"step by step\"보다 추론을 명시적 컨테이너에 가두는 편이 안전합니다. 최종 답과 추론을 분리하면 사용자에게는 답만, 로그에는 추론을 남길 수 있습니다.",
    example: `## TASK
다음 정량 문제를 풀고, 추론과 결과를 분리해 출력합니다.

## PROCEDURE
1. <plan>: 어떤 양을 구해야 하는지, 사용 가능한 사실, 단위계를 한 단락으로 정리
2. <work>: 단계별 계산. 각 단계는
   - 단계 번호
   - 사용한 수식 또는 추론 규칙
   - 중간 결과(단위 포함)
3. <check>: 단위 일관성·오더 오브 매그니튜드(자릿수)·역산 1회
4. <answer>: 최종 결과만. 단위와 유효숫자 명시.

## OUTPUT TEMPLATE (정확히 이 헤더, 다른 텍스트 금지)
<plan>
...
</plan>
<work>
1. ...
2. ...
</work>
<check>
- 단위: ...
- 자릿수: ...
- 역산: ...
</check>
<answer>
값: ...
유효숫자: ...
</answer>

## RULES
- 추측이 필요한 입력값이 있으면 <plan>에 가정으로 명시하고 진행
- 자릿수 검증에서 ±10× 어긋나면 <work>로 돌아가 한 번만 재계산
- <answer> 외부에는 결론을 쓰지 않음

## QUESTION
{{problem|정량 문제 본문}}`,
  },
  {
    name: "Self-Consistency (다중 추론 + 중재)",
    category: "추론",
    why: "한 번의 그럴듯한 오답을 막는 가장 견고한 방어. 서로 다른 분해 전략으로 N번 풀고 명시적 중재 규칙으로 합의를 만듭니다.",
    example: `## TASK
다음 분류 문제를 서로 다른 3가지 추론 경로로 독립적으로 푼 뒤,
명시된 중재 규칙으로 단일 라벨을 산출합니다.

## PATHS (서로 참조 금지)
- Path A — 정의 우선: 라벨 정의서를 먼저 읽고 입력의 정의 충족 여부를 점검
- Path B — 반례 우선: 가장 가까운 두 라벨의 반례 케이스로 배제법
- Path C — 유사도 우선: 입력과 의미적으로 가장 유사한 학습 예시 찾고 그 라벨 채택

## PER-PATH OUTPUT
각 Path는 다음 4줄로만 응답:
LABEL: <라벨>
EVIDENCE: <50자 이내 핵심 근거>
ALTERNATIVES_RULED_OUT: <라벨1, 라벨2>
CONFIDENCE: <0.0 ~ 1.0>

## ARBITRATION RULES (이 순서대로 적용)
1. 3개 라벨이 동일 → 그 라벨 채택, FINAL_CONFIDENCE = 평균
2. 다수결로 2:1 → 다수 라벨 채택, 단 다수 confidence 평균이 0.6 미만이면 "ABSTAIN"
3. 3개 라벨이 모두 다름 → "ABSTAIN", 사유: 추론 경로 간 합의 실패

## OUTPUT
\`\`\`
PATHS:
A: ...
B: ...
C: ...

ARBITRATION_RULE_APPLIED: <1 | 2 | 3>
FINAL_LABEL: <라벨 | ABSTAIN>
FINAL_CONFIDENCE: <숫자 | n/a>
RATIONALE: <≤ 80자>
\`\`\`

## LABELS
{{labels|허용 라벨 목록(쉼표 구분)}}

## INPUT
{{input|분류 대상 텍스트}}`,
  },
  {
    name: "Few-shot Examples (대조형)",
    category: "예시",
    why: "예시는 \"이렇게 만들어\"보다 \"이건 좋고 이건 나쁘다\"가 훨씬 강합니다. positive + negative + edge 한 세트로 묶으면 모델이 경계를 잡습니다.",
    example: `## TASK
한국어 채용 공고의 지원자 친화도 점수(0~100)와 개선 제안을 산출합니다.

## RUBRIC (점수)
- 책임 명확성 30
- 보상·복지 투명성 25
- 입사 후 90일 기대치 20
- 차별·과장 표현 부재 25

## EXAMPLES

### EX1 — 우수 (예상 점수 88)
입력:
"백엔드 엔지니어 / Go·Postgres / 연봉 7,200~9,000만 원, 분기 보너스 별도 / 입사 90일 내 결제 시스템 사이드카 1개 이관 담당 / 재택 주 3일."
출력:
{
  "score": 88,
  "strengths": ["보상 범위 명시", "90일 목표 구체"],
  "weaknesses": ["성장 경로 부재"],
  "rewrite_suggestions": ["섹션 '6개월 후의 당신' 1줄 추가"]
}

### EX2 — 평균 (예상 점수 52)
입력:
"열정적인 풀스택 개발자 모집. 연봉은 면접 후 협의. 빠르게 성장하는 스타트업입니다."
출력:
{
  "score": 52,
  "strengths": [],
  "weaknesses": ["보상 비공개", "기술 스택 미기재", "성장 단계 모호"],
  "rewrite_suggestions": [
    "기술 스택 5개 이내로 명시",
    "최소 연봉 하한 공개",
    "현재 팀 규모와 채용 사유 1줄"
  ]
}

### EX3 — 위반 (예상 점수 ≤ 30, 차별 표현)
입력:
"30대 초반 남성 개발자 우대. 군필 필수. 야근에 익숙하신 분."
출력:
{
  "score": 18,
  "strengths": [],
  "weaknesses": ["연령·성별·병역 차별 표현"],
  "rewrite_suggestions": ["차별 조항 전부 삭제", "근무 시간을 시간 단위로 명시"],
  "policy_flags": ["age_discrimination", "gender_discrimination"]
}

## RULES
- 출력은 JSON 한 객체만, 코드펜스 금지
- 차별·법적 위험 표현이 감지되면 \`policy_flags\` 키를 추가
- 점수가 30 이하인데 \`policy_flags\`가 비어 있으면 응답 거절

## INPUT
\`\`\`
{{job_post|채용 공고 본문}}
\`\`\``,
  },
  {
    name: "제약·금지 명시 (Constraints)",
    category: "제약",
    why: "긍정 지시(\"하라\")만 주면 모델은 빈틈을 자기 취향으로 채웁니다. 부정 지시(\"하지 마라\")와 측정 가능한 수용 기준을 함께 줘야 결과 분포가 좁아집니다.",
    example: `## TASK
주어진 기술 블로그 원문을 임원 요약(executive brief)으로 변환합니다.

## OUTPUT REQUIREMENTS (positive)
- 길이: 한국어 350자 ± 25자
- 구조: 단락 3개
  1) 1문장: 결론(이 글이 임원에게 의미하는 바)
  2) 2~3문장: 근거 — 원문에 명시된 수치 또는 사례 인용 ≥ 1개
  3) 1문장: 권장 의사결정 (행동 1개)
- 모든 수치는 단위와 함께, 인용은 큰따옴표

## NON-REQUIREMENTS (negative — 어기면 거절)
- 의문문 사용 금지
- 1인칭("저", "우리") 금지
- 형용사 "혁신적", "획기적", "단연" 사용 금지
- 원문에 없는 사실·수치 추가 금지(외삽 금지)
- 마크다운 헤더·불릿·이모지 금지 — 평문 단락만

## ACCEPTANCE TEST (출력 직전 self-check)
- [ ] 글자 수가 325~375자인가?
- [ ] 단락이 정확히 3개인가?
- [ ] 결론·근거·행동 권고가 각각 1·2·3 단락에 매핑되는가?
- [ ] 금지어 사전 검색에서 0건인가?
실패하면 자체 수정 후 재출력.

## INPUT
\`\`\`
{{article|원문 본문}}
\`\`\``,
  },
  {
    name: "변수 슬롯 (Template Variables)",
    category: "운영",
    why: "재사용 프롬프트는 변수와 본문을 분리하고, 변수에 타입·기본값·검증 규칙을 명시해야 합니다. Prompet의 {{name=default|label}} 문법을 그대로 활용하세요.",
    example: `## VARIABLES
- {{audience|학습자(역할/연차)}}              required
- {{topic|주제 한 줄}}                          required
- {{minutes=15|학습 시간(분)}}                  number, 5~60
- {{depth=working|이해 깊이: working|deep|expert}}
- {{format=mixed|출력 형식: prose|outline|mixed}}
- {{language=ko|언어: ko|en}}

## VARIABLE VALIDATION (모델이 먼저 점검)
- minutes 가 범위 밖이면 가장 가까운 경계로 보정하고 그 사실을 출력 끝 NOTES에 기록
- depth 와 minutes 의 적합성:
  - deep & minutes < 20 → minutes 를 20으로 올리고 NOTES에 기록
  - expert 는 minutes ≥ 30 권장, 미달 시 표면 핵심만 다루고 NOTES에 명시

## TASK
{{audience}} 가 {{minutes}}분 안에 {{topic}} 을(를) 학습할 수 있는
"마이크로 레슨" 한 편을 {{language}} 로 작성합니다.

## OUTPUT (format = {{format}})
1. 핵심 정의 1문단(60자 이내)
2. 직관적 비유 1문단
3. 실전 예 (코드/표/계산) 1개 — 주제에 적합한 매체 자동 선택
4. 흔한 오해 2~3개와 그에 대한 정정
5. 자가 점검 질문 3개 (정답 토글 가능하도록 \`<details>\` 사용)

## NOTES (필수, 출력 끝)
- 적용된 변수 보정이 있으면 한 줄씩 기록
- 사용한 가정 1~2개 (있을 때만)`,
  },
  {
    name: "Self-Critique 루프 (Plan → Draft → Critique → Revise)",
    category: "추론",
    why: "1패스로 끝내면 사실 오류·논리 비약을 잡지 못합니다. 명시적 비판 단계 + 재작성 단계를 두면 같은 모델로도 품질이 한 단계 올라갑니다.",
    example: `## TASK
요청을 다음 4단계로 처리합니다. 단계는 건너뛰지 않으며 각 단계는 정해진 헤더로 구분됩니다.

## STAGE 1 — PLAN
- 사용자의 진짜 목표(literal vs intent) 한 줄
- 성공 기준 3개 (측정 가능)
- 작성 시 위험 영역 2개 (사실성 / 톤 / 길이 / 편향 중 선택)

## STAGE 2 — DRAFT
- PLAN의 성공 기준을 충족하는 초안 작성
- 외부 사실 인용 시 [F#] 형식의 참조 마커 사용 (실제 출처는 모름 → 가정으로 표시)

## STAGE 3 — CRITIQUE (가장 중요한 단계)
다음 6개 항목 각각에 대해 PASS/FAIL 과 90자 이내 근거.
- accuracy: PLAN 성공 기준 충족
- attribution: [F#] 마커 위치가 적절하고 가정이 분리되어 있음
- coverage: 사용자가 묻지는 않았지만 알아야 할 부수 정보 1건 이상 다뤘는가
- bias: 단정·과장·일반화 표현 0건
- structure: 문단/리스트가 가독성에 기여
- safety: 의료·법률·금융 조언 시 면책 문장 포함 (해당 없을 시 N/A)

## STAGE 4 — REVISE
- CRITIQUE에서 FAIL 받은 항목만 수정
- "변경 로그" 섹션에서 수정 사유를 한 줄씩
- 변경 이후 모든 항목이 PASS인지 다시 한 번 자가 확인

## OUTPUT TEMPLATE
### PLAN
...
### DRAFT
...
### CRITIQUE
- accuracy: PASS — ...
- attribution: FAIL — ...
- ...
### REVISE
...
### CHANGE_LOG
- attribution: ...

## REQUEST
{{request|사용자의 원 요청}}`,
  },
  {
    name: "안티패턴 — 모호한 형용사",
    category: "안티패턴",
    why: "형용사는 모델·세션·온도에 따라 해석 분포가 큽니다. 모든 형용사를 측정 가능한 명세로 치환하는 것이 \"프롬프트 엔지니어링\"의 본질에 가깝습니다.",
    example: `## BAD (모호)
"이 글을 자세하게, 전문적으로 요약해줘."

## WHY BAD
- "자세히" → 길이? 디테일 수준? 모름
- "전문적" → 어휘? 인용? 출처? 모름
- 결과: 호출마다 길이 200~1500자 사이 random walk

## GOOD (명세화)
\`\`\`
## TASK
다음 글을 임원용 요약으로 변환합니다.

## SPEC
- 길이: 280~320자
- 인용: 원문 수치 ≥ 2개 포함, 각 수치 옆 "(원문)" 표기
- 어휘 수준: CEFR B2 (전문 용어는 첫 등장 시 14자 이내 풀이)
- 구조: 결론 1문장 → 근거 2문장 → 권고 1문장
- 형용사 사용 한도: 절대평가 형용사("최고", "혁신적", "압도적") 0회
- 마지막 줄에 "출처: 원문, 외부 사실 추가 없음" 명시

## SELF-CHECK
- 길이가 280~320자인지 확인 후 출력
- 절대평가 형용사 카운트 = 0인지 확인
\`\`\`

## RULE OF THUMB
형용사를 쓰고 싶을 때마다 자문:
"이 형용사를 측정 가능한 수치/구조/금지 항목으로 바꿀 수 있는가?" — 항상 가능합니다.`,
  },
  {
    name: "안티패턴 — 단일 거대 프롬프트",
    category: "안티패턴",
    why: "분류·생성·검증을 한 호출에 묶으면 디버깅이 불가능하고, 한 영역의 변경이 다른 영역의 회귀를 만듭니다. 파이프라인으로 분리하면 토큰·지연·재시도 비용이 모두 작아집니다.",
    example: `## ANTI-PATTERN (단일 거대 프롬프트)
"고객 리뷰를 읽고 1) 감성 분류 2) 핵심 불만 추출 3) 사과 답장 4) 답장 톤 검증
까지 모두 한 번에 해줘."

## 결과
- 한 단계가 실패해도 어디서 실패했는지 모름
- 분류만 바꾸고 싶어도 답장 톤이 같이 흔들림
- 토큰 낭비(매번 4단계 시스템 프롬프트 동시 적재)

## REFACTORED PIPELINE
\`\`\`
[Step 1] classify_sentiment.prompt
  in:  review_text
  out: { sentiment, intensity, lang }
  temperature: 0

[Step 2] extract_complaints.prompt   (Step 1 출력이 negative일 때만)
  in:  review_text, sentiment
  out: { complaints: [{topic, severity, quote}] }
  temperature: 0

[Step 3] draft_reply.prompt
  in:  complaints, brand_voice
  out: reply_text (≤ 4 문장)
  temperature: 0.4

[Step 4] verify_tone.prompt
  in:  reply_text, brand_voice, banned_phrases
  out: { pass: bool, violations: [] }
  temperature: 0
\`\`\`

## PROMPET 운영 가이드
- 각 Step 을 별도 프롬프트로 저장하고 \`pipeline:reply\` 같은 태그로 묶기
- 변수 슬롯 \`{{step_n_output}}\` 으로 다음 단계가 이전 출력을 받도록 명세
- 한 단계가 회귀하면 그 단계만 교체 — 나머지는 그대로`,
  },
  {
    name: "운영 — 결정성 vs 창의성 분리",
    category: "운영",
    why: "한 프롬프트로 \"분류도 잘 하고 카피도 잘 써\" 하려는 순간 두 영역 모두 평균을 깎습니다. 결정적 작업과 창의적 작업은 별도 프롬프트, 별도 샘플링 설정으로 분리합니다.",
    example: `## DECISION TABLE
| 작업 유형        | temperature | top_p | n  | 출력 강제                         |
|------------------|-------------|-------|----|------------------------------------|
| 분류·라벨링      | 0           | 0.1   | 1  | enum 강제                          |
| 정보 추출(NER)   | 0           | 0.1   | 1  | JSON Schema                        |
| 요약(사실 보존)  | 0.2         | 0.5   | 1  | 길이·인용 제약                     |
| 코드 작성        | 0.2         | 0.7   | 1  | 컴파일·테스트 자가 점검            |
| 카피·슬로건      | 0.8         | 0.95  | 5  | 인간 큐레이션                      |
| 브레인스토밍     | 1.0         | 1.0   | 8  | 중복 제거 후 인간 큐레이션         |

## RULE
- 결정성 작업의 시스템 프롬프트는 "creative" 같은 단어 0회
- 창의성 작업의 시스템 프롬프트는 정답이 있다는 가정의 어휘 금지
  ("정확히", "유일한", "정답은")

## EXAMPLE — 분류용 시스템 프롬프트 (결정성)
"You are a deterministic classifier. Reply with **only** one of the
allowed labels. If uncertain, reply 'ABSTAIN'. Do not explain."

## EXAMPLE — 카피용 시스템 프롬프트 (창의성)
"You are a copy ideation partner. Generate {{n=8}} distinct directions
for the brief below. Aim for diversity across angle, tone, and length.
Mark each option with A/B/C... and add a 6-word rationale tag."

## PROMPET 운영
- 두 프롬프트를 같은 카드에 합치지 않습니다.
- 색상 태그(\`#deterministic\` 회색, \`#creative\` 보라)로 시각 분리.`,
  },
];

const CATEGORY_COLOR: Record<Technique["category"], string> = {
  구조화: "bg-foreground text-background border-foreground",
  추론: "bg-blue-500/15 text-blue-700 border-blue-500/40 dark:text-blue-300",
  제약: "bg-orange-500/15 text-orange-700 border-orange-500/40 dark:text-orange-300",
  예시: "bg-emerald-500/15 text-emerald-700 border-emerald-500/40 dark:text-emerald-300",
  안티패턴: "bg-red-500/15 text-red-700 border-red-500/40 dark:text-red-300",
  운영: "bg-violet-500/15 text-violet-700 border-violet-500/40 dark:text-violet-300",
};

export function PromptGuideSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className="overflow-y-auto sm:max-w-2xl"
        onInteractOutside={(e) => {
          const t = e.target as HTMLElement | null;
          if (t?.closest("[data-sonner-toaster]")) e.preventDefault();
        }}
      >
        <SheetHeader className="border-b border-border pb-4">
          <SheetTitle>프롬프트 작성 가이드</SheetTitle>
          <SheetDescription>
            업계에 자리 잡은 프롬프트 작성 기법 모음. 각 카드의 예시를 그대로 복사해 새 프롬프트로
            저장하고 변형해 보세요.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-3 py-2">
          {TECHNIQUES.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.04 * i, type: "spring", stiffness: 320, damping: 26 }}
            >
              <TechniqueCard tech={t} />
            </motion.div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function TechniqueCard({ tech }: { tech: Technique }) {
  const copy = useClipboard();
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">{tech.name}</CardTitle>
          <Badge className={CATEGORY_COLOR[tech.category]} variant="outline">
            {tech.category}
          </Badge>
        </div>
        <CardDescription className="leading-relaxed">{tech.why}</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="group relative">
          <pre className="max-h-56 overflow-auto rounded-md border bg-muted/40 p-3 pr-12 font-mono text-[11px] leading-relaxed whitespace-pre-wrap">
            {tech.example}
          </pre>
          <Button
            size="sm"
            variant="secondary"
            className="absolute right-2 top-2 h-7"
            onClick={() => void copy(tech.example, `${tech.name} 예시를 복사했습니다`)}
          >
            <Copy /> 복사
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
