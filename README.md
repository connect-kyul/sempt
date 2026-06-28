# Sempt

Sempt는 디스코드 서버의 활동, 평판, 신뢰도, 성장 지표를 분석하고, Galaxy Tab S10 Ultra 같은 로컬 기기에서 실행되는 3B급 LLM을 우선 활용해 관리자용 리포트와 개선안을 생성하는 커뮤니티 운영 플랫폼입니다.

## 핵심 기능

- 디스코드 봇: `/sempt` 슬래시 명령어, 메시지/입장/퇴장/음성 활동 수집
- 관리자 대시보드: 서버 건강 점수, 멤버 신뢰도, 리포트, 설정 화면
- 점수 시스템: 활동 점수, 평판 점수, 신뢰도 점수를 TypeScript 함수로 계산
- 성장 분석: 신규 유저 정착률, 비활성 채널, 경고/신고, 위험 유저 지표
- 로컬 AI: OpenAI-compatible endpoint 또는 Ollama를 우선 사용
- fallback: 로컬 LLM 장애 시 규칙 기반 리포트로 계속 동작
- 보안 기본값: 외부 AI API 비활성, 원본 메시지 LLM 전달 비허용, 자동 제재 비활성

## 기술 스택

TypeScript, Node.js, discord.js, Next.js App Router, PostgreSQL, Prisma, Tailwind CSS, shadcn/ui 스타일 컴포넌트, pnpm workspace, Docker Compose를 사용합니다. Redis는 선택 서비스입니다.

## 설치 방법

```bash
pnpm install
cp .env.example .env
docker compose up -d
pnpm db:push
pnpm --filter @sempt/bot register
pnpm dev:bot
pnpm dev:web
```

## 환경변수 설정

`.env.example`을 기준으로 `.env`를 만듭니다. 기본 AI 설정은 비용이 발생하지 않는 로컬 우선입니다.

```env
AI_PROVIDER=local
LOCAL_LLM_ENABLED=true
LOCAL_LLM_PROVIDER=openai-compatible
LOCAL_LLM_BASE_URL=http://192.168.0.10:8080
LOCAL_LLM_MODEL=qwen2.5-3b-instruct
LOCAL_LLM_TIMEOUT_MS=30000
```

`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`는 선택 사항이며 기본 동작에 필요하지 않습니다.

## Discord Developer Portal 설정

1. Discord Developer Portal에서 애플리케이션과 봇을 생성합니다.
2. Bot Token을 `DISCORD_TOKEN`에 넣습니다.
3. Application ID를 `DISCORD_CLIENT_ID`에 넣습니다.
4. 필요한 Intents는 Guilds, Guild Members, Guild Messages, Message Content, Guild Voice States입니다.
5. `pnpm --filter @sempt/bot register`로 `/sempt` 명령어를 등록합니다.

## 데이터베이스 실행

```bash
docker compose up -d
pnpm db:push
pnpm db:studio
```

PostgreSQL은 필수이고 Redis는 `docker compose --profile redis up -d`로 선택 실행합니다.

## 봇 실행

```bash
pnpm dev:bot
```

주요 명령어:

- `/sempt scan`: 현재 서버 상태 분석
- `/sempt report`: 서버 건강 리포트 생성, 로컬 LLM 실패 시 fallback 사용
- `/sempt member @user`: 활동/평판/신뢰도 확인
- `/sempt recommend @user reason`: 긍정 평판 기록
- `/sempt warn @user reason`: 관리자 경고 기록
- `/sempt dashboard`: 웹 대시보드 링크
- `/sempt settings`: 서버 설정 요약
- `/sempt ai-status`: AI Provider 상태 확인

관리자 명령어는 `ManageGuild` 권한이 필요합니다. 일반 유저는 자신의 정보만 확인할 수 있습니다.

## 웹 대시보드 실행

```bash
pnpm dev:web
```

제공 경로:

- `/`: Sempt 소개 및 대시보드 이동
- `/dashboard`: 서버 목록
- `/dashboard/[guildId]`: 서버 건강 점수와 성장 요약
- `/dashboard/[guildId]/members`: 멤버 점수 목록
- `/dashboard/[guildId]/settings`: 기능 토글과 점수 가중치
- `/dashboard/[guildId]/reports`: 일간/주간/월간 리포트 구조
- `/embedded`: Discord Embedded App 확장용 기본 페이지

## 점수 계산 방식

점수 계산은 LLM이 아니라 `packages/shared`의 결정적 함수가 담당합니다.

- 활동 점수: 메시지, 음성 시간, 이벤트 참여, 답변 기여, 출석, 최근 활동
- 평판 점수: 추천, 관리자 긍정 평가, 경고/신고, 기여도, 스팸 의심
- 신뢰도 점수: 활동 40%, 평판 35%, 규정 위반 15%, 계정 안정성 10%
- 서버 건강 점수: 활성 유저율, 신규 유저 첫 메시지율, 채널 분산도, 이벤트 참여율, 응답 속도, 경고/신고율, 위험 유저율

신뢰도 점수는 관리자 참고용입니다. 자동 처벌은 기본 비활성화되어 있으며, 점수 기준은 대시보드와 README에 투명하게 공개합니다.

## 개인정보/안전 설계

- 원본 메시지 내용은 저장하지 않고 활동 카운트 중심으로 기록합니다.
- LLM에는 원본 메시지, 닉네임, 민감한 신고 내용을 기본 전달하지 않습니다.
- 원본 메시지 LLM 전달은 서버 설정에서 명시적으로 허용한 경우에만 확장하도록 설계했습니다.
- 유저 삭제 요청은 `MemberProfile.deletedAt`과 guild/user 단위 관계 삭제 구조로 대응할 수 있습니다.
- 민감한 경고/신고 정보는 관리자에게만 표시해야 합니다.
- 로컬 LLM 장애는 봇 장애로 이어지지 않고 규칙 기반 리포트로 fallback합니다.

## 로컬 LLM 사용

이 프로젝트는 기본적으로 외부 AI API가 아니라 로컬 LLM 서버를 우선 사용합니다.

권장 환경:

- Galaxy Tab S10 Ultra 또는 유사한 Android 기기
- Termux 또는 Linux chroot 환경
- llama.cpp server / Ollama / OpenAI-compatible endpoint / LM Studio 호환 API
- 약 3B 규모 instruct 모델

권장 모델 예시:

- Qwen 2.5 3B Instruct
- Qwen 3 4B 계열
- Llama 3.2 3B Instruct
- Gemma 3 4B 계열
- Phi 계열 소형 모델

로컬 LLM 연결 예시:

```env
AI_PROVIDER=local
LOCAL_LLM_ENABLED=true
LOCAL_LLM_PROVIDER=openai-compatible
LOCAL_LLM_BASE_URL=http://192.168.0.10:8080
LOCAL_LLM_MODEL=qwen2.5-3b-instruct
LOCAL_LLM_TIMEOUT_MS=30000
```

OpenAI-compatible endpoint는 `POST /v1/chat/completions`, Ollama는 `POST /api/generate`를 사용합니다. 모델명은 환경변수로 바꿉니다.

## 외부 API 선택 사용

외부 AI API는 기본값이 아니며 선택 옵션입니다. 로컬 LLM을 사용할 수 없거나 더 높은 품질이 필요할 때만 활성화하세요. 현재 MVP는 외부 provider 구현을 의도적으로 비활성 기본값으로 두었고, `packages/ai`의 provider 인터페이스에 맞춰 확장할 수 있습니다.

## Embedded App 확장 계획

`apps/web/app/embedded/page.tsx`와 `apps/web/lib/discord-sdk.ts`는 Discord Embedded App SDK 연결을 위한 자리입니다. 다음 단계에서는 Discord OAuth, SDK ready flow, guild context 검증, 대시보드 iframe 최적화를 이 경로에 붙이면 됩니다.

## 향후 로드맵

- 실제 Discord OAuth 기반 서버 접근 제한
- 리포트 캐싱과 큐 기반 생성
- Redis rate limit
- 관리자 설정 저장 UI
- 멤버 데이터 삭제 요청 API
- 외부 AI provider 선택 구현
- Embedded App SDK 정식 연결
- 테스트 스위트와 CI
