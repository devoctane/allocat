export function calcTotalRepayable(
  principal: number,
  rate: number,
  tenureMonths: number | null,
  type: 'flat' | 'diminishing'
): number {
  if (!tenureMonths || tenureMonths <= 0 || rate <= 0) return principal;
  if (type === 'flat') {
    return Math.round(principal + principal * (rate / 100) * (tenureMonths / 12));
  }
  // Diminishing balance: EMI = P * r * (1+r)^n / ((1+r)^n - 1), total = EMI * n
  const r = rate / (12 * 100);
  if (r === 0) return principal;
  const factor = Math.pow(1 + r, tenureMonths);
  const emi = (principal * r * factor) / (factor - 1);
  return Math.round(emi * tenureMonths);
}

export function calcEMI(
  principal: number,
  rate: number,
  tenureMonths: number,
  type: 'flat' | 'diminishing'
): number {
  if (tenureMonths <= 0) return 0;
  if (type === 'flat') {
    const totalInterest = principal * (rate / 100) * (tenureMonths / 12);
    return Math.round((principal + totalInterest) / tenureMonths);
  }
  const r = rate / (12 * 100);
  if (r === 0) return Math.round(principal / tenureMonths);
  const factor = Math.pow(1 + r, tenureMonths);
  return Math.round((principal * r * factor) / (factor - 1));
}
