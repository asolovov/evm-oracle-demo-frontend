import { describe, expect, it } from "vitest";
import { buildReporterFunds, fundingTone, remainingTxs } from "@/lib/reporter-funding";

const ETH = 10n ** 18n;

describe("remainingTxs", () => {
  it("divides balance by the average tx cost", () => {
    expect(remainingTxs(10n * ETH, ETH)).toBe(10);
  });
  it("is Infinity when the avg cost is zero", () => {
    expect(remainingTxs(5n, 0n)).toBe(Number.POSITIVE_INFINITY);
  });
});

describe("fundingTone", () => {
  it("is red below the red threshold", () => expect(fundingTone(4, 10, 5)).toBe("red"));
  it("is warn between thresholds", () => expect(fundingTone(8, 10, 5)).toBe("warn"));
  it("is ok at/above the warn threshold", () => expect(fundingTone(10, 10, 5)).toBe("ok"));
});

describe("buildReporterFunds", () => {
  it("builds display models with tone, short address and ETH balance", () => {
    const avg = 10n ** 16n; // 0.01 ETH per tx
    const funds = buildReporterFunds(
      [
        { address: "0x7ab705fAa77CC9c6469916b9138Cc22B7d816F0d", balanceWei: 4n * 10n ** 16n },
        { address: "0xB0fEEcE62f7eAfA38C59656E1047362a83F22e61", balanceWei: 80n * 10n ** 16n },
      ],
      avg,
      10,
      5,
    );
    expect(funds[0]?.tone).toBe("red");
    expect(funds[0]?.remainingTxs).toBe(4);
    expect(funds[0]?.balanceEth).toBe("0.0400");
    expect(funds[0]?.addressShort).toBe("0x7ab7…6F0d");
    expect(funds[1]?.tone).toBe("ok");
    expect(funds[1]?.remainingTxs).toBe(80);
  });
});
