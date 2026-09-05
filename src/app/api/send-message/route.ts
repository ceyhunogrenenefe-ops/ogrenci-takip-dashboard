import { NextRequest, NextResponse } from "next/server";
import { sendWhatsAppText } from "@/lib/whatsapp";

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,OPTIONS,PATCH,DELETE,POST,PUT",
      "Access-Control-Allow-Headers":
        "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
      "Access-Control-Allow-Credentials": "true",
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const to = body?.to;
    const message = body?.message;

    if (!to || !message) {
      return NextResponse.json(
        { error: "to and message are required", status: "error" },
        { status: 400 }
      );
    }

    const result = await sendWhatsAppText(String(to), String(message));
    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error,
          details: result.details,
          status: "error",
        },
        { status: result.httpStatus }
      );
    }

    return NextResponse.json({
      success: true,
      message_id: result.message_id,
      to: result.to,
      status: "sent",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: message, status: "error" }, { status: 500 });
  }
}
