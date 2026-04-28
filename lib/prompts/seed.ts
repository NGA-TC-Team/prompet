import type { PromptInput } from "./schema";

export const SEED_PROMPTS: ReadonlyArray<PromptInput & { color?: string }> = [
  {
    title: "코드 리뷰 요청",
    body: `당신은 시니어 {{role=백엔드}} 엔지니어입니다.
다음 코드를 {{focus=성능과 가독성|중점 영역}} 관점에서 리뷰하고
개선점 3가지와 그 근거를 제시하세요.

대상 언어: {{lang}}

\`\`\`
<여기에 코드를 붙여넣으세요>
\`\`\``,
    tags: ["dev", "review"],
  },
  {
    title: "회의록 → 액션 아이템",
    body: `다음 회의 내용을 정리하세요.

요청 형식:
1. 핵심 결정 사항 (3개 이내)
2. 액션 아이템 (담당자/마감일 포함)
3. 후속 논의가 필요한 항목

회의 주제: {{topic}}
참석자: {{attendees=다수}}

회의 원문:
<여기에 붙여넣기>`,
    tags: ["work", "summary"],
  },
  {
    title: "블로그 톤 다듬기",
    body: `당신은 숙련된 한국어 에디터입니다.
다음 글을 {{tone=친근하지만 전문성 있는|톤}} 톤으로 다듬으세요.
- 의미는 유지
- 중복 제거
- 문장 길이 조절(평균 20자 내외 단문 위주)
- 마지막에 한 줄 요약 추가

원문:
<여기에 붙여넣기>`,
    tags: ["writing"],
  },
];
