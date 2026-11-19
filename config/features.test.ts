import { describe, expect, it } from "vitest";
import { getMarketPlanPrice } from "./features";

describe("getMarketPlanPrice", () => {
  it("does not expose Nigeria's draft prices for checkout", () => {
    expect(getMarketPlanPrice("NG", "starter")).toBeNull();
    expect(getMarketPlanPrice("NG", "professional")).toBeNull();
  });
});
