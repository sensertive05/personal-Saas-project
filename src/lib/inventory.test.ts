import { describe, expect, it } from "vitest";

import { isLowStock, LOW_STOCK_THRESHOLD } from "@/lib/inventory";

describe("isLowStock", () => {
  it("returns false for out-of-stock (0)", () => {
    expect(isLowStock(0)).toBe(false);
  });

  it("returns false for negative stock", () => {
    expect(isLowStock(-1)).toBe(false);
  });

  it("returns true just above zero", () => {
    expect(isLowStock(1)).toBe(true);
  });

  it("returns true at the threshold boundary", () => {
    expect(isLowStock(LOW_STOCK_THRESHOLD)).toBe(true);
  });

  it("returns false just above the threshold", () => {
    expect(isLowStock(LOW_STOCK_THRESHOLD + 1)).toBe(false);
  });

  it("returns false for plentiful stock", () => {
    expect(isLowStock(100)).toBe(false);
  });
});
