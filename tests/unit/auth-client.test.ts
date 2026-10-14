import { afterEach, describe, expect, it, vi } from "vitest";
import { requestAuthRedirect } from "../../src/features/auth/protocol-client.ts";

afterEach(() => vi.unstubAllGlobals());
function protocolFixture(post: Response) {
  vi.stubGlobal("location", { origin: "https://student.invalid" });
  const fetch = vi.fn().mockResolvedValueOnce(Response.json({ csrfToken: "synthetic-protocol-only" })).mockResolvedValueOnce(post);
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

describe("confirmed auth redirects and failure handling (simulated HTTP only)", () => {
  it.each([429, 503])("keeps sign-out unconfirmed on HTTP %s", async status => {
    protocolFixture(Response.json({ error: { code: "UNAVAILABLE" } }, { status }));
    await expect(requestAuthRedirect("signout", "/signin")).rejects.toThrow();
  });
  it("does not treat a CSRF rejection or an unsafe redirect as sign-out", async () => {
    for (const url of ["https://student.invalid/signin?csrf=true", "https://attacker.invalid/signin"]) {
      protocolFixture(Response.json({ url }));
      await expect(requestAuthRedirect("signout", "/signin")).rejects.toThrow();
    }
  });
  it("only returns the confirmed own sign-out destination", async () => {
    const fetch = protocolFixture(Response.json({ url: "https://student.invalid/signin" }));
    expect(await requestAuthRedirect("signout", "/signin")).toBe("https://student.invalid/signin");
    expect(fetch.mock.calls[1]?.[0]).toBe("/api/auth/signout");
    expect(fetch.mock.calls[1]?.[1].body.get("csrfToken")).toBe("synthetic-protocol-only");
  });
});
