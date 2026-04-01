export interface PlatformFeeInput {
  base_amount: number;
  percentage_rate?: number;
  fixed_fee?: number;
}

export interface PlatformFeeResult {
  percentage_fee_amount: number;
  fixed_fee_amount: number;
  total_platform_fee_amount: number;
}

export function calculatePercentageFee(
  base_amount: number,
  percentage_rate: number = 0,
): number {
  return base_amount * percentage_rate;
}

export function calculateFixedFee(fixed_fee: number = 0): number {
  return fixed_fee;
}

export function calculatePlatformFee(input: PlatformFeeInput): PlatformFeeResult {
  const percentage_fee_amount = calculatePercentageFee(
    input.base_amount,
    input.percentage_rate ?? 0,
  );

  const fixed_fee_amount = calculateFixedFee(input.fixed_fee ?? 0);

  return {
    percentage_fee_amount,
    fixed_fee_amount,
    total_platform_fee_amount: percentage_fee_amount + fixed_fee_amount,
  };
}