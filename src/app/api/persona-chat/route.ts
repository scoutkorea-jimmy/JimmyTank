import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { AIEngine } from "@/types";

interface PersonaChatRequest {
  personaName: string;
  personaTitle: string;
  currentPrompt: string;
  currentRules: string;
  chatHistory: { role: "user" | "assistant"; content: string }[];
  userMessage: string;
  engine: AIEngine;
}

const SYSTEM = `당신은 AI 토론 시스템의 캐릭터 설계 도우미입니다.
사용자가 특정 AI 전문가 페르소나의 성격, 행동 방식, 전문성을 대화를 통해 조율하고 있습니다.

현재 캐릭터 정보가 주어지면, 사용자의 요청에 따라:
1. 성격이나 말투를 어떻게 바꾸면 좋을지 제안합니다
2. 사용자가 "이렇게 바꿔줘"라고 하면, 변경된 시스템 프롬프트를 제안합니다
3. 변경이 확정되면 JSON으로 응답합니다

사용자가 "적용해줘", "이걸로 확정", "저장해" 등의 확정 표현을 사용하면,
반드시 아래 JSON을 응답 마지막에 포함하세요 (코드블록 없이 순수 JSON만):
{"__update__": {"systemPrompt": "새 시스템 프롬프트", "rules": "새 규칙 (변경 없으면 빈 문자열)"}}

확정 표현이 없으면 일반 대화로 응답합니다.
한국어로 답변합니다.`;

function buildContext(req: PersonaChatRequest): string {
  return `[현재 캐릭터]
이름: ${req.personaName}
역할: ${req.personaTitle}
시스템 프롬프트: ${req.currentPrompt}
개별 규칙: ${req.currentRules || "(없음)"}`;
}

export async function POST(request: NextRequest) {
  try {
    const body: PersonaChatRequest = await request.json();
    const { engine, chatHistory, userMessage } = body;

    if (engine === "chatgpt" && !process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OPENAI_API_KEY 미설정" }, { status: 500 });
    }
    if (engine === "claude" && !process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY 미설정" }, { status: 500 });
    }

    const context = buildContext(body);
    const fullSystem = `${SYSTEM}\n\n${context}`;

    const messages = [
      ...chatHistory.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user" as const, content: userMessage },
    ];

    let reply = "";

    if (engine === "chatgpt") {
      const openai = new OpenAI();
      const res = await openai.chat.completions.create({
        model: "gpt-4o",
        max_tokens: 1000,
        messages: [
          { role: "system", content: fullSystem },
          ...messages,
        ],
      });
      reply = res.choices[0]?.message?.content || "";
    } else {
      const anthropic = new Anthropic();
      const res = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: fullSystem,
        messages,
      });
      const block = res.content.find((b) => b.type === "text");
      reply = block?.text || "";
    }

    // Check if there's an update JSON in the reply
    let update = null;
    const jsonMatch = reply.match(/\{"__update__":\s*\{[\s\S]*?\}\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        update = parsed.__update__;
        // Remove JSON from display text
        reply = reply.replace(jsonMatch[0], "").trim();
      } catch {}
    }

    return NextResponse.json({ reply, update });
  } catch (error) {
    console.error("Persona chat error:", error);
    return NextResponse.json({ error: "대화 중 오류 발생" }, { status: 500 });
  }
}
