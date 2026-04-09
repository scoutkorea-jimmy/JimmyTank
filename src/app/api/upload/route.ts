import { NextRequest, NextResponse } from "next/server";

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "파일 크기는 100MB 이하여야 합니다." },
        { status: 400 }
      );
    }

    const text = await file.text();

    // Truncate for AI context (keep it manageable)
    const maxChars = 50000;
    const truncated = text.length > maxChars;
    const content = truncated ? text.slice(0, maxChars) : text;

    return NextResponse.json({
      fileName: file.name,
      fileSize: file.size,
      content,
      truncated,
      originalLength: text.length,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "파일 업로드 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
