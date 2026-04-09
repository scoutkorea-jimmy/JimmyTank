export const APP_VERSION = "01.006.000";

export interface VersionEntry {
  version: string;
  date: string;
  type: "feature" | "hotfix" | "initial";
  changes: string[];
}

export const VERSION_HISTORY: VersionEntry[] = [
  {
    version: "01.006.000",
    date: "2026-04-09",
    type: "feature",
    changes: [
      "페르소나 전문성 전면 강화: 각 분야 15년차 전문가 수준으로 시스템 프롬프트 재작성",
      "멤버 관리 모달에서 클릭 시 세부설정 진입 (Tank 헤더가 아닌 멤버관리 버튼에서)",
      "자동 토론: Tank 생성 시 즉시 시작, 일시정지 버튼 누를 때까지 연속 토론",
      "셀프 컨텍스트 고도화: 매 2라운드마다 각 멤버의 인사이트 자동 추출 및 메모리 저장",
      "사용자 개입: 토론 중 언제든 의견 입력 가능, AI가 즉시 반응 후 토론 재개",
    ],
  },
  {
    version: "01.005.001",
    date: "2026-04-09",
    type: "hotfix",
    changes: [
      "SSR 환경 localStorage 접근 오류 수정 (AuthContext, TankContext, PersonaContext)",
      "API null/undefined 체크 강화 (Discussion, EnhancePersona, PersonaChat)",
      "멤버별 토론 응답 오류 시 전체 실패 대신 개별 에러 메시지 표시",
      "입력값 검증 추가 (토론 API 필수 필드 체크)",
      "JSON 파싱 에러 메시지 개선",
      "파일 업로드 응답 검증 강화",
      "ChatMessage senderName null 안전 처리",
    ],
  },
  {
    version: "01.005.000",
    date: "2026-04-09",
    type: "feature",
    changes: [
      "멤버 세부설정 모달 6탭 개편 (프로필/배경지식/업무맥락/규칙/대화튜닝/메모리)",
      "대화 기반 성격 튜닝: AI와 대화하며 말투·스타일 조율, '적용해줘'로 확정 시 자동 반영",
      "배경지식 탭: 업계·회사·전문분야 자료 무제한 추가",
      "업무맥락 탭: 토론 시 따라야 할 관점·우선순위·맥락 지시",
    ],
  },
  {
    version: "01.004.000",
    date: "2026-04-09",
    type: "feature",
    changes: [
      "기본 페르소나를 철학자 기반으로 재설계 (소크라테스, 아리스토텔레스, 마키아벨리, 칸트, 손자, 히파티아)",
      "페르소나 클릭 시 상세 모달 (정보 수정, 규칙 설정, 메모리 CRUD)",
      "영구 메모리 시스템: 채팅 삭제 후에도 페르소나별 기억 유지",
      "공통규칙 + 캐릭터별 개별규칙 시스템",
      "상단 헤더에 현재 시간 및 누적 컨텍스트 크기 실시간 표시",
    ],
  },
  {
    version: "01.003.000",
    date: "2026-04-09",
    type: "feature",
    changes: [
      "비밀번호 인증 시스템 추가 (기본 계정: admin)",
      "원페이지 레이아웃 리디자인",
      "커스텀 멤버 무제한 컨텍스트 추가",
      "문서 업로드 기능 (100MB 제한)",
      "버전 히스토리 모달 추가",
      "전체 코드 모듈화 리팩토링",
    ],
  },
  {
    version: "01.002.000",
    date: "2026-04-09",
    type: "feature",
    changes: [
      "Escoredream 폰트 적용 (기본 weight 300)",
      "커스텀 페르소나 생성/편집/삭제",
      "AI 기반 페르소나 고도화 (Claude/ChatGPT 선택)",
      "멤버 관리 페이지 추가",
    ],
  },
  {
    version: "01.001.000",
    date: "2026-04-09",
    type: "feature",
    changes: [
      "ChatGPT API 엔진 선택 기능 추가",
      "Tank 생성 시 Claude/ChatGPT 선택",
      "API 키 미설정 시 에러 메시지 개선",
    ],
  },
  {
    version: "01.000.000",
    date: "2026-04-09",
    type: "initial",
    changes: [
      "JimmyTank 최초 출시",
      "AI 전문가 6명 (마케팅, 재무, 기술, 법률, 전략, 크리에이티브)",
      "Tank(토론 세션) 생성 및 관리",
      "AI 멀티 페르소나 토론 엔진",
      "사용자 개입 및 AI 반박 기능",
      "토론 자동 요약",
    ],
  },
];
