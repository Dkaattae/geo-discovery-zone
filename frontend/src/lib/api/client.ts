/**
 * The backend client.
 *
 * One place that knows about HTTP. Screens call methods and get typed values or
 * an `ApiError` carrying the server's RFC 9457 problem document — no screen
 * builds a URL, reads a status code or touches a header.
 *
 * The transport is injected rather than calling `fetch` directly, so tests
 * exercise the real request-building and response-parsing without a network and
 * without stubbing a global.
 */

import type {
  Account,
  AnswerResult,
  ContentVersion,
  Problem,
  Profile,
  ProfileProgress,
  ReviewRoundResponse,
  ServedQuestion,
  Session,
  SessionSummary,
  SessionTopic,
  StartSessionResponse,
  TokenResponse,
} from "./types";

export type Transport = (url: string, init: RequestInit) => Promise<Response>;

/** Same-origin by default; the dev server proxies `/api` to the backend. */
export const DEFAULT_BASE_URL = "/api/v1";

export interface ApiClientOptions {
  baseUrl?: string | undefined;
  transport?: Transport | undefined;
  /** Called before every request; return null when signed out. */
  getToken?: (() => string | null) | undefined;
}

export class ApiError extends Error {
  readonly status: number;
  readonly problem: Problem;

  constructor(status: number, problem: Problem) {
    super(problem.title || `Request failed with ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.problem = problem;
  }

  /** True when the token is missing, expired or revoked. */
  get isUnauthenticated() {
    return this.status === 401;
  }

  /** Field-level validation failures, keyed by JSON pointer (`/name`). */
  get fieldErrors(): Record<string, string> {
    const entries = (this.problem.errors ?? []).map((e) => [e.path, e.message] as const);
    return Object.fromEntries(entries);
  }

  /** What a grown-up should be shown. */
  get displayMessage() {
    return this.problem.detail || this.problem.title;
  }
}

/** The server was unreachable — a different problem from the server saying no. */
export class NetworkError extends Error {
  constructor(override readonly cause: unknown) {
    super("Could not reach the server.");
    this.name = "NetworkError";
  }
}

export function createApiClient(options: ApiClientOptions = {}) {
  const baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, "");
  const transport: Transport = options.transport ?? ((url, init) => fetch(url, init));
  const getToken = options.getToken ?? (() => null);

  async function request<T>(
    method: string,
    path: string,
    body?: unknown,
    query?: Record<string, string | number | boolean | undefined>,
  ): Promise<T> {
    const headers: Record<string, string> = { accept: "application/json" };
    const token = getToken();
    if (token) headers["authorization"] = `Bearer ${token}`;
    if (body !== undefined) headers["content-type"] = "application/json";

    const init: RequestInit = { method, headers };
    if (body !== undefined) init.body = JSON.stringify(body);

    let response: Response;
    try {
      response = await transport(baseUrl + path + queryString(query), init);
    } catch (cause) {
      throw new NetworkError(cause);
    }

    if (response.status === 204) return undefined as T;
    if (!response.ok) throw new ApiError(response.status, await readProblem(response));
    return (await response.json()) as T;
  }

  return {
    // -- auth -------------------------------------------------------------
    // A grown-up's account. Username and password only: no email, no name, and
    // nothing about the child beyond the nickname on a profile.
    register: (username: string, password: string) =>
      request<Account>("POST", "/auth/register", { username, password }),
    signIn: (username: string, password: string) =>
      request<TokenResponse>("POST", "/auth/token", { username, password }),
    me: () => request<Account>("GET", "/auth/me"),
    signOut: () => request<void>("POST", "/auth/logout"),

    // -- content ----------------------------------------------------------
    // Public and cacheable. Questions reach the app inlined in a served
    // question, so this is only used to check the backend is reachable.
    contentVersion: () => request<ContentVersion>("GET", "/content/version"),

    // -- profiles ---------------------------------------------------------
    listProfiles: () => request<{ data: Profile[] }>("GET", "/profiles").then((page) => page.data),
    createProfile: (input: { name: string; avatar: string; grade: number }) =>
      request<Profile>("POST", "/profiles", input),
    getProfile: (profileId: string) => request<Profile>("GET", `/profiles/${enc(profileId)}`),
    deleteProfile: (profileId: string) => request<void>("DELETE", `/profiles/${enc(profileId)}`),
    getProgress: (profileId: string) =>
      request<ProfileProgress>("GET", `/profiles/${enc(profileId)}/progress`),

    // -- sessions ---------------------------------------------------------
    startSession: (input: {
      profileId: string;
      topic: SessionTopic;
      level?: number | undefined;
      serveFirstQuestion?: boolean | undefined;
    }) => request<StartSessionResponse>("POST", "/sessions", input),
    getSession: (sessionId: string) => request<Session>("GET", `/sessions/${enc(sessionId)}`),
    /**
     * `includeAnswerKey` is false by default: grading runs through
     * `submitAnswer`, so the answer never needs to reach the device holding the
     * question.
     */
    nextQuestion: (
      sessionId: string,
      input?: { forceReview?: boolean; includeAnswerKey?: boolean },
    ) =>
      request<ServedQuestion>("POST", `/sessions/${enc(sessionId)}/next-question`, {
        forceReview: input?.forceReview ?? false,
        includeAnswerKey: input?.includeAnswerKey ?? false,
      }),
    submitAnswer: (sessionId: string, input: { questionId: string; choiceIndex: number }) =>
      request<AnswerResult>("POST", `/sessions/${enc(sessionId)}/answers`, input),
    /** Backs out a mis-tap. The question returns to PRESENTING. */
    undoAnswer: (sessionId: string, answerId: string) =>
      request<void>("DELETE", `/sessions/${enc(sessionId)}/answers/${enc(answerId)}`),
    startReviewRound: (sessionId: string, length = 5) =>
      request<ReviewRoundResponse>("POST", `/sessions/${enc(sessionId)}/review-round`, { length }),
    endSession: (sessionId: string) =>
      request<SessionSummary>("POST", `/sessions/${enc(sessionId)}/end`),
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;

function enc(segment: string) {
  return encodeURIComponent(segment);
}

function queryString(query?: Record<string, string | number | boolean | undefined>) {
  if (!query) return "";
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) params.set(key, String(value));
  }
  const encoded = params.toString();
  return encoded ? `?${encoded}` : "";
}

/**
 * Every error the contract describes is `application/problem+json`. A body that
 * is not one — a proxy's HTML 502, say — still has to become a Problem, or the
 * screens would need two error shapes.
 */
async function readProblem(response: Response): Promise<Problem> {
  try {
    const body = (await response.json()) as Partial<Problem>;
    if (body && typeof body.title === "string") {
      return { ...body, title: body.title, status: body.status ?? response.status } as Problem;
    }
  } catch {
    /* not JSON — fall through */
  }
  return { title: response.statusText || "Request failed", status: response.status };
}
