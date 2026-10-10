const nf = new Intl.NumberFormat("sv-SE", { maximumFractionDigits: 0 });
const nf1 = new Intl.NumberFormat("sv-SE", { maximumFractionDigits: 1 });

export const num = (n: number) => nf.format(Math.round(n));
export const num1 = (n: number) => nf1.format(n);
export const perSqm = (n: number) => `${num(n)} kr/m²`;
export const pct = (n: number) => `${num1(n)} %`;
/** Millions of SEK, e.g. "12,4 Mkr" */
export const mkr = (n: number) => `${nf1.format(n / 1e6)} Mkr`;
export const tkr = (n: number) => `${num(n / 1000)} tkr`;
