import "server-only";
import { unstable_rethrow } from "next/navigation";
import { z } from "zod";
import type { ApiErrorBody, CurrentUser } from "@/lib/types";
import { fieldErrors } from "@/lib/validation";
import { AppError, notFound, unauthorized } from "./errors";
import { getRequestUser } from "./session";

type RouteContext<Params> = { params: Promise<Params> };

type AuthedHandler<Params> = (args: {
  request: Request;
  user: CurrentUser;
  params: Params;
}) => Promise<Response> | Response;

/**
 * Wraps a Route Handler so it only runs for a signed-in user, and so every
 * failure leaves the API in the same `{ error: { code, message } }` shape.
 */
export function withUser<Params extends object = object>(
  handler: AuthedHandler<Params>,
) {
  return async (
    request: Request,
    context: RouteContext<Params>,
  ): Promise<Response> => {
    try {
      const user = await getRequestUser(request);
      if (!user) throw unauthorized();
      return await handler({ request, user, params: await context.params });
    } catch (error) {
      return errorResponse(error);
    }
  };
}

export function errorResponse(error: unknown): Response {
  // Next.js signals redirects and "this route is dynamic" by throwing. Those
  // are not failures, so hand them back to the framework.
  unstable_rethrow(error);

  if (error instanceof AppError) {
    const body: ApiErrorBody = {
      error: { code: error.code, message: error.message, fields: error.fields },
    };
    return Response.json(body, { status: error.status });
  }

  // Unexpected: log the details on the server, tell the client nothing useful
  // to an attacker.
  console.error(error);
  const body: ApiErrorBody = {
    error: {
      code: "internal_error",
      message: "Something went wrong on our side. Try again.",
    },
  };
  return Response.json(body, { status: 500 });
}

/** Reads and validates a JSON request body. */
export async function parseBody<Schema extends z.ZodType>(
  request: Request,
  schema: Schema,
): Promise<z.output<Schema>> {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    throw new AppError(400, "invalid_json", "The request body is not valid JSON.");
  }

  const result = schema.safeParse(json);
  if (!result.success) {
    throw new AppError(
      400,
      "validation_error",
      "Some fields need attention.",
      fieldErrors(result.error),
    );
  }
  return result.data;
}

const uuid = z.uuid();

/** Rejects malformed ids before they reach the database. */
export function parseId(value: string, what: string): string {
  if (!uuid.safeParse(value).success) throw notFound(what);
  return value;
}
