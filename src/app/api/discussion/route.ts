import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { DiscussionRequest, Message, Member, AIEngine } from "@/types";
import { nanoid } from "nanoid";

function buildConversationHistory(messages: Message[]): string {
  return messages
    .map((m) => {
      const prefix = m.sender === "user" ? "[사용자]" : `[${m.senderName}]`;
      return `${prefix}: ${m.content}`;
    })
    .join("\n\n");
}

function buildUserPrompt(
  topic: string,
  description: string,
  conversationHistory: string,
  isRebuttal: boolean
): string {
  if (!conversationHistory) {
    return `토론 주제: "${topic}"\n주제 설명: ${description}\n\n이 주제에 대해 당신의 전문 분야 관점에서 첫 번째 의견을 제시해주세요.`;
  } else if (isRebuttal) {
    return `토론 주제: "${topic}"\n주제 설명: ${description}\n\n지금까지의 토론:\n${conversationHistory}\n\n방금 사용자가 의견을 제시했습니다. 사용자의 의견에 대해 당신의 전문 분야 관점에서 동의하거나 근거를 들어 반박해주세요.`;
  } else {
    return `토론 주제: "${topic}"\n주제 설명: ${description}\n\n지금까지의 토론:\n${conversationHistory}\n\n이전 의견들을 참고하여 당신의 전문 분야 관점에서 추가 의견이나 피드백을 제시해주세요. 이전 발언자의 의견에 동의하거나 반박할 수 있습니다.`;
  }
}

async function generateWithClaude(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const anthropic = new Anthropic();
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 500,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });
  const textBlock = response.content.find((b) => b.type === "text");
  return textBlock ? textBlock.text : "";
}

async function generateWithChatGPT(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const openai = new OpenAI();
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 500,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });
  return response.choices[0]?.message?.content || "";
}

async function generateResponse(
  engine: AIEngine,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  if (engine === "chatgpt") {
    return generateWithChatGPT(systemPrompt, userPrompt);
  }
  return generateWithClaude(systemPrompt, userPrompt);
}

function validateApiKey(engine: AIEngine): string | null {
  if (engine === "chatgpt" && !process.env.OPENAI_API_KEY) {
    return "OPENAI_API_KEY가 설정되지 않았습니다. Vercel 대시보드 → Settings → Environment Variables에서 키를 추가해주세요.";
  }
  if (engine === "claude" && !process.env.ANTHROPIC_API_KEY) {
    return "ANTHROPIC_API_KEY가 설정되지 않았습니다. Vercel 대시보드 → Settings → Environment Variables에서 키를 추가해주세요.";
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body: DiscussionRequest = await request.json();
    const {
      tankId,
      topic,
      description,
      memberData,
      messages,
      engine = "claude",
      userMessage,
    } = body;

    const keyError = validateApiKey(engine);
    if (keyError) {
      return NextResponse.json({ error: keyError }, { status: 500 });
    }

    const newMessages: Message[] = [];
    const conversationHistory = buildConversationHistory(messages);
    const isRebuttal = !!userMessage;

    for (const member of memberData) {
      const fullHistory =
        conversationHistory +
        (newMessages.length > 0
          ? "\n\n" + buildConversationHistory(newMessages)
          : "");

      const userPrompt = buildUserPrompt(
        topic,
        description,
        fullHistory,
        isRebuttal
      );
      const content = await generateResponse(
        engine,
        member.systemPrompt,
        userPrompt
      );

      newMessages.push({
        id: nanoid(),
        tankId,
        sender: member.id,
        senderName: `${member.emoji} ${member.name} (${member.title})`,
        content,
        timestamp: Date.now(),
        isRebuttal,
      });
    }

    // Generate summary if discussion has been going on for a while
    let summary: string | undefined;
    const totalMessages = messages.length + newMessages.length;
    if (totalMessages >= memberData.length * 3) {
      const allHistory =
        conversationHistory +
        "\n\n" +
        buildConversationHistory(newMessages);

      const summarySystem =
        "당신은 토론 내용을 정리하는 사회자입니다. 핵심 합의사항, 주요 쟁점, 그리고 남은 과제를 간결하게 정리해주세요. 한국어로 답변합니다.";
      const summaryUser = `토론 주제: "${topic}"\n\n지금까지의 토론:\n${allHistory}\n\n현재까지의 토론을 정리해주세요.`;

      summary = await generateResponse(engine, summarySystem, summaryUser);
    }

    return NextResponse.json({ messages: newMessages, summary });
  } catch (error) {
    console.error("Discussion API error:", error);
    return NextResponse.json(
      { error: "토론 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
