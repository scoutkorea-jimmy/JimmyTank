import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { DiscussionRequest, Message, MemberRole } from "@/types";
import { PERSONAS } from "@/lib/personas";
import { nanoid } from "nanoid";

const anthropic = new Anthropic();

function buildConversationHistory(messages: Message[]): string {
  return messages
    .map((m) => {
      const prefix = m.sender === "user" ? "[사용자]" : `[${m.senderName}]`;
      return `${prefix}: ${m.content}`;
    })
    .join("\n\n");
}

async function generateMemberResponse(
  role: MemberRole,
  topic: string,
  description: string,
  conversationHistory: string,
  isRebuttal: boolean = false
): Promise<string> {
  const persona = PERSONAS[role];

  let userPrompt: string;
  if (!conversationHistory) {
    userPrompt = `토론 주제: "${topic}"\n주제 설명: ${description}\n\n이 주제에 대해 당신의 전문 분야 관점에서 첫 번째 의견을 제시해주세요.`;
  } else if (isRebuttal) {
    userPrompt = `토론 주제: "${topic}"\n주제 설명: ${description}\n\n지금까지의 토론:\n${conversationHistory}\n\n방금 사용자가 의견을 제시했습니다. 사용자의 의견에 대해 당신의 전문 분야 관점에서 동의하거나 근거를 들어 반박해주세요.`;
  } else {
    userPrompt = `토론 주제: "${topic}"\n주제 설명: ${description}\n\n지금까지의 토론:\n${conversationHistory}\n\n이전 의견들을 참고하여 당신의 전문 분야 관점에서 추가 의견이나 피드백을 제시해주세요. 이전 발언자의 의견에 동의하거나 반박할 수 있습니다.`;
  }

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 500,
    system: persona.systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  return textBlock ? textBlock.text : "";
}

export async function POST(request: NextRequest) {
  try {
    const body: DiscussionRequest = await request.json();
    const { tankId, topic, description, members, messages, userMessage } = body;

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY가 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    const newMessages: Message[] = [];
    const conversationHistory = buildConversationHistory(messages);
    const isRebuttal = !!userMessage;

    // Each member responds in sequence
    for (const role of members) {
      const persona = PERSONAS[role];
      const fullHistory =
        conversationHistory +
        (newMessages.length > 0
          ? "\n\n" + buildConversationHistory(newMessages)
          : "");

      const content = await generateMemberResponse(
        role,
        topic,
        description,
        fullHistory,
        isRebuttal
      );

      newMessages.push({
        id: nanoid(),
        tankId,
        sender: role,
        senderName: `${persona.emoji} ${persona.name} (${persona.title})`,
        content,
        timestamp: Date.now(),
        isRebuttal,
      });
    }

    // Generate summary if discussion has been going on for a while
    let summary: string | undefined;
    const totalMessages = messages.length + newMessages.length;
    if (totalMessages >= members.length * 3) {
      const allHistory =
        conversationHistory +
        "\n\n" +
        buildConversationHistory(newMessages);

      const summaryResponse = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 500,
        system:
          "당신은 토론 내용을 정리하는 사회자입니다. 핵심 합의사항, 주요 쟁점, 그리고 남은 과제를 간결하게 정리해주세요. 한국어로 답변합니다.",
        messages: [
          {
            role: "user",
            content: `토론 주제: "${topic}"\n\n지금까지의 토론:\n${allHistory}\n\n현재까지의 토론을 정리해주세요.`,
          },
        ],
      });

      const textBlock = summaryResponse.content.find(
        (b) => b.type === "text"
      );
      summary = textBlock?.text;
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
