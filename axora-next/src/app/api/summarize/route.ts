import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text || text.trim().length < 10) {
      return NextResponse.json({ error: "Not enough content to summarize." }, { status: 400 });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Summarize this document in 3-5 concise bullet points. Be specific and extract the key insights:\n\n${text.slice(0, 4000)}`
            }]
          }]
        }),
      }
    );

    const data = await response.json();
    const summary = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "Could not generate summary.";
    return NextResponse.json({ summary });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}