import { errorResponse } from "@/server/http";
import { createDemoWorkspace } from "@/server/services/demo";

// Public on purpose: this is the "Try the live demo" button.
export async function POST(): Promise<Response> {
  try {
    const { cookies } = await createDemoWorkspace();

    const response = Response.json({ ok: true }, { status: 201 });
    for (const cookie of cookies) {
      response.headers.append("Set-Cookie", cookie);
    }
    return response;
  } catch (error) {
    return errorResponse(error);
  }
}
