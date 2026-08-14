import { describe, expect, test } from "bun:test";
import { ApiError, createApiClient, NetworkError, type Transport } from "./client";

interface Call {
  url: string;
  init: RequestInit;
}

/**
 * A recording transport. Injected rather than stubbing `fetch`, so these tests
 * exercise the real request building and response parsing and never touch the
 * network.
 */
function recorder(...responses: Response[]) {
  const calls: Call[] = [];
  let index = 0;
  const transport: Transport = async (url, init) => {
    calls.push({ url, init });
    // Cloned so a repeated response can be read more than once.
    return (responses[Math.min(index++, responses.length - 1)] ?? json({}, 200)).clone();
  };
  return { calls, transport };
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function problem(body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify({ status, ...body }), {
    status,
    headers: { "content-type": "application/problem+json" },
  });
}

const headerOf = (call: Call, name: string) =>
  (call.init.headers as Record<string, string> | undefined)?.[name];

describe("request building", () => {
  test("prefixes the base url and keeps the contract's paths", async () => {
    const { calls, transport } = recorder(json({ data: [] }));
    await createApiClient({ baseUrl: "/api/v1", transport }).listProfiles();
    expect(calls[0]!.url).toBe("/api/v1/profiles");
  });

  test("a base url with a trailing slash does not double it", async () => {
    const { calls, transport } = recorder(json({ data: [] }));
    await createApiClient({ baseUrl: "http://localhost:8000/api/v1/", transport }).listProfiles();
    expect(calls[0]!.url).toBe("http://localhost:8000/api/v1/profiles");
  });

  test("path segments are encoded, so an id can never forge a path", async () => {
    const { calls, transport } = recorder(new Response(null, { status: 204 }));
    await createApiClient({ transport }).deleteProfile("p-1/../../admin");
    expect(calls[0]!.url).toBe("/api/v1/profiles/p-1%2F..%2F..%2Fadmin");
  });

  test("sends the bearer token when signed in", async () => {
    const { calls, transport } = recorder(json({ data: [] }));
    await createApiClient({ transport, getToken: () => "tok-123" }).listProfiles();
    expect(headerOf(calls[0]!, "authorization")).toBe("Bearer tok-123");
  });

  test("sends no authorization header when signed out", async () => {
    const { calls, transport } = recorder(json({ contentVersion: "v" }));
    await createApiClient({ transport, getToken: () => null }).contentVersion();
    expect(headerOf(calls[0]!, "authorization")).toBeUndefined();
  });

  test("reads the token per request, so signing in mid-session is picked up", async () => {
    let token: string | null = null;
    const { calls, transport } = recorder(json({ data: [] }));
    const client = createApiClient({ transport, getToken: () => token });
    await client.listProfiles();
    token = "tok-after-sign-in";
    await client.listProfiles();
    expect(headerOf(calls[0]!, "authorization")).toBeUndefined();
    expect(headerOf(calls[1]!, "authorization")).toBe("Bearer tok-after-sign-in");
  });

  test("a body is JSON with a matching content-type", async () => {
    const { calls, transport } = recorder(json({ id: "p-1" }, 201));
    await createApiClient({ transport }).createProfile({ name: "Fox", avatar: "🦊", grade: 2 });
    expect(calls[0]!.init.method).toBe("POST");
    expect(headerOf(calls[0]!, "content-type")).toBe("application/json");
    expect(JSON.parse(String(calls[0]!.init.body))).toEqual({
      name: "Fox",
      avatar: "🦊",
      grade: 2,
    });
  });

  test("a GET carries no body and no content-type", async () => {
    const { calls, transport } = recorder(json({ data: [] }));
    await createApiClient({ transport }).listProfiles();
    expect(calls[0]!.init.body).toBeUndefined();
    expect(headerOf(calls[0]!, "content-type")).toBeUndefined();
  });

  test("undo is a DELETE on the answer", async () => {
    const { calls, transport } = recorder(new Response(null, { status: 204 }));
    await createApiClient({ transport }).undoAnswer("s-1", "a-9");
    expect(calls[0]!.init.method).toBe("DELETE");
    expect(calls[0]!.url).toBe("/api/v1/sessions/s-1/answers/a-9");
  });

  test("next-question asks for no answer key, since the server grades", async () => {
    const { calls, transport } = recorder(json({ question: {}, isReview: false, index: 1 }));
    await createApiClient({ transport }).nextQuestion("s-1");
    expect(JSON.parse(String(calls[0]!.init.body))).toEqual({
      forceReview: false,
      includeAnswerKey: false,
    });
  });

  test("a review round can be forced without asking for the key either", async () => {
    const { calls, transport } = recorder(json({ question: {}, isReview: true, index: 7 }));
    await createApiClient({ transport }).nextQuestion("s-1", { forceReview: true });
    expect(JSON.parse(String(calls[0]!.init.body))).toEqual({
      forceReview: true,
      includeAnswerKey: false,
    });
  });
});

describe("responses", () => {
  test("unwraps the paged envelope so screens see a list", async () => {
    const { transport } = recorder(json({ data: [{ id: "p-1" }], page: { hasMore: false } }));
    const profiles = await createApiClient({ transport }).listProfiles();
    expect(profiles).toEqual([{ id: "p-1" }] as never);
  });

  test("a 204 resolves without a body", async () => {
    const { transport } = recorder(new Response(null, { status: 204 }));
    await expect(createApiClient({ transport }).deleteProfile("p-1")).resolves.toBeUndefined();
  });
});

describe("errors", () => {
  test("a problem document becomes an ApiError carrying its fields", async () => {
    const { transport } = recorder(
      problem({ title: "Profile not found", detail: "No profile with id 'p-9'." }, 404),
    );
    const error = (await createApiClient({ transport })
      .getProfile("p-9")
      .catch((e: unknown) => e)) as ApiError;

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(404);
    expect(error.problem.title).toBe("Profile not found");
    expect(error.displayMessage).toBe("No profile with id 'p-9'.");
  });

  test("401 is flagged, so a screen can send the grown-up back to sign in", async () => {
    const { transport } = recorder(problem({ title: "Invalid or expired token" }, 401));
    const error = (await createApiClient({ transport })
      .listProfiles()
      .catch((e: unknown) => e)) as ApiError;
    expect(error.isUnauthenticated).toBe(true);
  });

  test("a 404 is not mistaken for a sign-in problem", async () => {
    const { transport } = recorder(problem({ title: "Profile not found" }, 404));
    const error = (await createApiClient({ transport })
      .listProfiles()
      .catch((e: unknown) => e)) as ApiError;
    expect(error.isUnauthenticated).toBe(false);
  });

  test("validation failures are keyed by field, so a form can point at one", async () => {
    const { transport } = recorder(
      problem(
        {
          title: "Validation failed",
          errors: [
            { path: "/name", message: "String should have at least 1 character" },
            { path: "/pin", message: "only offered from grade 4 up" },
          ],
        },
        422,
      ),
    );
    const error = (await createApiClient({ transport })
      .createProfile({ name: "", avatar: "🦊", grade: 1 })
      .catch((e: unknown) => e)) as ApiError;

    expect(error.fieldErrors["/pin"]).toBe("only offered from grade 4 up");
    expect(Object.keys(error.fieldErrors)).toHaveLength(2);
  });

  test("an error body that is not a problem document still becomes an ApiError", async () => {
    const { transport } = recorder(new Response("<html>502 Bad Gateway</html>", { status: 502 }));
    const error = (await createApiClient({ transport })
      .listProfiles()
      .catch((e: unknown) => e)) as ApiError;

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(502);
    expect(error.problem.title.length).toBeGreaterThan(0);
  });

  test("an unreachable server is a NetworkError, not a server saying no", async () => {
    const transport: Transport = async () => {
      throw new TypeError("Failed to fetch");
    };
    const error = (await createApiClient({ transport })
      .listProfiles()
      .catch((e: unknown) => e)) as NetworkError;

    expect(error).toBeInstanceOf(NetworkError);
    expect(error).not.toBeInstanceOf(ApiError);
  });
});
