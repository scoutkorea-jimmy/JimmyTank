import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { AIEngine } from "@/types";

interface ExtractRequest {
  memberId: string;
  memberName: string;
  memberTitle: string;
  recentMessages: string;
  engine: AIEngine;
}

const SYSTEM = `당신은 AI 토론 시스템의 학습 엔진입니다.
토론에서 특정 멤버가 얻은 인사이트를 추출합니다.

아래 형식의 JSON으로만 응답하세요 (다른 텍스트 없이):
{"insights": ["인사이트1", "인사이트2"]}

규칙:
- 해당 멤버의 전문 분야와 관련된 인사이트만 추출합니다
- 이미 알고 있을 법한 일반적 사실은 제외합니다
- 이 토론에서 새롭게 발견된 구체적 정보만 포함합니다
- 최대 3개까지만 추출합니다
- 추출할 인사이트가 없으면 빈 배열을 반환합니다
- 한국어로 작성합니다`;

export async function POST(request: NextRequest) {
  try {
    const body: ExtractRequest = await request.json();
    const { memberName, memberTitle, recentMessages, engine } = body;

    if (!recentMessages.trim()) {
      return NextResponse.json({ insights: [] });
    }

    const userPrompt = `멤버: ${memberName} (${memberTitle})
최근 토론 내용:
${recentMessages}

이 토론에서 ${memberName}이(가) 자신의 전문 분야(${memberTitle}) 관점에서 기억해야 할 새로운 인사이트를 추출해주세요.`;

    let raw = "";
    if (engine === "chatgpt") {
      if (!process.env.OPENAI_API_KEY) return NextResponse.json({ insights: [] });
      const openai = new OpenAI();
      const res = await openai.chat.completions.create({
        model: "gpt-4o",
        max_tokens: 300,
        messages: [{ role: "system", content: SYSTEM }, { role: "user", content: userPrompt }],
      });
      raw = res.choices[0]?.message?.content || "";
    } else {
      if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ insights: [] });
      const anthropic = new Anthropic();
      const res = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 300,
        system: SYSTEM,
        messages: [{ role: "user", content: userPrompt }],
      });
      const block = res.content.find((b) => b.type === "text");
      raw = block?.text || "";
    }

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return NextResponse.json({ insights: [] });

    try {
      const parsed = JSON.parse(jsonMatch[0]);
      return NextResponse.json({ insights: parsed.insights || [] });
    } catch {
      return NextResponse.json({ insights: [] });
    }
  } catch (error) {
    console.error("Extract insights error:", error);
    return NextResponse.json({ insights: [] });
  }
}
