import { describe, expect, it } from "vitest";
import { findProductionConfigProblems } from "./config-check";

const healthy = {
  APP_URL: "https://app.instantestimate.com",
  SMTP_HOST: "smtp.resend.com",
  OPENAI_API_KEY: "sk-test-xxx",
};

const problemsFor = (env: Record<string, string | undefined>) =>
  findProductionConfigProblems(env).map((p) => p.variable);

describe("findProductionConfigProblems", () => {
  it("reports nothing for a correctly configured production environment", () => {
    expect(findProductionConfigProblems(healthy)).toEqual([]);
  });

  it("catches the localhost APP_URL that silently breaks every notification link", () => {
    expect(problemsFor({ ...healthy, APP_URL: "http://localhost:3000" })).toContain("APP_URL");
    expect(problemsFor({ ...healthy, APP_URL: "http://127.0.0.1:3000" })).toContain("APP_URL");
  });

  it("catches a missing APP_URL", () => {
    expect(problemsFor({ ...healthy, APP_URL: undefined })).toContain("APP_URL");
  });

  it("does not flag a legitimate remote APP_URL that merely contains a digit host", () => {
    expect(problemsFor({ ...healthy, APP_URL: "https://127-app.example.com" })).not.toContain("APP_URL");
  });

  it("catches SMTP still pointed at the dev Mailpit relay", () => {
    expect(problemsFor({ ...healthy, SMTP_HOST: "127.0.0.1" })).toContain("SMTP_HOST");
  });

  it("catches a missing OpenAI key, which would make every estimate quote-required", () => {
    expect(problemsFor({ ...healthy, OPENAI_API_KEY: undefined })).toContain("OPENAI_API_KEY");
  });

  it("reports every problem at once rather than stopping at the first", () => {
    expect(problemsFor({})).toEqual(expect.arrayContaining(["APP_URL", "SMTP_HOST", "OPENAI_API_KEY"]));
  });
});
