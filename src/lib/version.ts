export const APP_VERSION = "01.004.000";

export interface VersionEntry {
  version: string;
  date: string;
  type: "feature" | "hotfix" | "initial";
  changes: string[];
}

export const VERSION_HISTORY: VersionEntry[] = [
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
