import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { EnhancePersonaRequest } from "@/types";

const ENHANCE_SYSTEM = `당신은 AI 토론 시스템의 전문가 캐릭터 설계자입니다.
사용자가 제공한 이름, 역할, 간단한 설명을 바탕으로 토론에 참여할 전문가 페르소나를 고도화합니다.

반드시 아래 JSON 형식으로만 응답하세요 (다른 텍스트 없이):
{
  "systemPrompt": "해당 캐릭터의 시스템 프롬프트 (성격, 전문분야, 토론 스타일, 반박 방식 포함. 한국어로 답변하라는 지시 포함. 2-4문장으로 간결하게 답변하라는 지시 포함)",
  "enhancedDescription": "캐릭터에 대한 풍부한 한 줄 설명",
  "suggestedEmoji": "캐릭터를 대표하는 이모지 1개"
}`;

function buildUserPrompt(req: EnhancePersonaRequest): string {
  return `다음 정보로 전문가 페르소나를 고도화해주세요:
- 이름: ${req.name}
- 역할/직함: ${req.title}
- 설명: ${req.description || "없음"}`;
}

async function enhanceWithClaude(prompt: string): Promise<string> {
  const anthropic = new Anthropic();
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 800,
    system: ENHANCE_SYSTEM,
    messages: [{ role: "user", content: prompt }],
  });
  const textBlock = response.content.find((b) => b.type === "text");
  return textBlock?.text || "";
}

async function enhanceWithChatGPT(prompt: string): Promise<string> {
  const openai = new OpenAI();
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 800,
    messages: [
      { role: "system", content: ENHANCE_SYSTEM },
      { role: "user", content: prompt },
    ],
  });
  return response.choices[0]?.message?.content || "";
}

export async function POST(request: NextRequest) {
  try {
    const body: EnhancePersonaRequest = await request.json();
    const { engine } = body;

    if (engine === "chatgpt" && !process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY가 설정되지 않았습니다." },
        { status: 500 }
      );
    }
    if (engine === "claude" && !process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY가 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    const prompt = buildUserPrompt(body);
    const raw =
      engine === "chatgpt"
        ? await enhanceWithChatGPT(prompt)
        : await enhanceWithClaude(prompt);

    // Parse JSON from response
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "AI 응답을 파싱할 수 없습니다." },
        { status: 500 }
      );
    }

    const result = JSON.parse(jsonMatch[0]);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Enhance persona error:", error);
    return NextResponse.json(
      { error: "페르소나 고도화 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
