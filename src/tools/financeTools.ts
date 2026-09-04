// BRANIFY Free Tools — Finance Tools
// 15 pure client-side finance calculators: compound & simple interest, EMI,
// loans, mortgage, investment returns, ROI, savings, percentages, currency
// conversion, profit/loss, GST, VAT, tipping, and debt payoff.
// Output style: kv() context lines → blank line → bullet() result lines.
import { bool, num, str } from './types';
import type { ToolDefinition, ToolField, ToolResult } from './types';
import { bullet, fmtMoney, fmtNum, kv } from './helpers';

/* ------------------------------------------------------------------ */
/* field builders                                                      */
/* ------------------------------------------------------------------ */

const numF = (
  name: string,
  label: string,
  def: number,
  opts: { min?: number; max?: number; step?: number; hint?: string } = {},
): ToolField => ({ type: 'number', name, label, default: def, ...opts });

const selF = (
  name: string,
  label: string,
  def: string,
  options: { value: string; label: string }[],
): ToolField => ({ type: 'select', name, label, default: def, options });

/* ------------------------------------------------------------------ */
/* shared finance math                                                 */
/* ------------------------------------------------------------------ */

/** Standard amortized monthly payment: M = P·r / (1 − (1+r)^−n). */
const monthlyPayment = (principal: number, annualRatePct: number, months: number): number => {
  if (months <= 0) return principal;
  const r = annualRatePct / 100 / 12;
  if (r === 0) return principal / months;
  return (principal * r) / (1 - Math.pow(1 + r, -months));
};

/** Future value of a lump sum plus monthly contributions, compounded monthly. */
const futureValueWithContributions = (
  initial: number,
  monthly: number,
  annualRatePct: number,
  months: number,
): number => {
  const i = annualRatePct / 100 / 12;
  if (i === 0) return initial + monthly * months;
  const growth = Math.pow(1 + i, months);
  return initial * growth + monthly * ((growth - 1) / i);
};

/** Signed money: renders losses as -$1,200.00 instead of $-1,200.00. */
const signedMoney = (n: number): string => `${n < 0 ? '-' : ''}${fmtMoney(Math.abs(n))}`;

const compoundingLabel = (n: number): string => {
  if (n === 1) return 'Annually';
  if (n === 2) return 'Semi-Annually';
  if (n === 4) return 'Quarterly';
  if (n === 12) return 'Monthly';
  if (n === 365) return 'Daily';
  return 'Custom';
};

const CURRENCIES = ['USD', 'PKR', 'AED', 'EUR', 'GBP', 'CAD', 'AUD'];

/** Static reference table: 1 USD expressed in each supported currency. */
const REFERENCE_RATES: Record<string, number> = {
  USD: 1,
  PKR: 278,
  AED: 3.67,
  EUR: 0.92,
  GBP: 0.79,
  CAD: 1.36,
  AUD: 1.52,
};

const currencyOptions = CURRENCIES.map((c) => ({ value: c, label: c }));

/* ------------------------------------------------------------------ */
/* tools                                                               */
/* ------------------------------------------------------------------ */

export const financeTools: ToolDefinition[] = [
  {
    slug: 'compound-interest-calculator',
    fields: [
      numF('principal', 'Initial Principal', 10000, { min: 0, hint: 'Amount you start with' }),
      numF('rate', 'Annual Interest Rate (%)', 8, { min: 0, max: 100, step: 0.1 }),
      numF('years', 'Investment Duration (years)', 5, { min: 0.25, max: 60, step: 0.5 }),
      selF('frequency', 'Compounding Frequency', '12', [
        { value: '1', label: 'Annually (1x per year)' },
        { value: '2', label: 'Semi-Annually (2x per year)' },
        { value: '4', label: 'Quarterly (4x per year)' },
        { value: '12', label: 'Monthly (12x per year)' },
        { value: '365', label: 'Daily (365x per year)' },
      ]),
    ],
    run: ({ values }): ToolResult => {
      const p = num(values.principal, 10000);
      const rate = num(values.rate, 8);
      const years = num(values.years, 5);
      const n = Math.max(1, Math.round(num(values.frequency, 12)));
      const balance = p * Math.pow(1 + rate / 100 / n, n * years);
      const interest = balance - p;
      const ear = (Math.pow(1 + rate / 100 / n, n) - 1) * 100;
      const growthPct = p > 0 ? (interest / p) * 100 : 0;
      return {
        output: [
          kv('Initial Principal', fmtMoney(p)),
          kv('Annual Interest Rate', `${fmtNum(rate, 2)}%`),
          kv('Duration', `${fmtNum(years, 2)} years`),
          kv('Compounding', `${compoundingLabel(n)} (${n}x per year)`),
          '',
          bullet('Future Value', fmtMoney(balance)),
          bullet('Interest Earned', fmtMoney(interest)),
          bullet('Effective Annual Rate (EAR)', `${fmtNum(ear, 2)}%`),
          bullet('Total Growth', `+${fmtNum(growthPct, 2)}%`),
        ].join('\n'),
      };
    },
  },
  {
    slug: 'simple-interest-calculator',
    fields: [
      numF('principal', 'Principal Amount', 10000, { min: 0 }),
      numF('rate', 'Annual Interest Rate (%)', 5, { min: 0, max: 100, step: 0.1 }),
      numF('years', 'Time Period (years)', 3, { min: 0.25, max: 50, step: 0.5 }),
    ],
    run: ({ values }): ToolResult => {
      const p = num(values.principal, 10000);
      const rate = num(values.rate, 5);
      const years = num(values.years, 3);
      const interest = (p * rate * years) / 100;
      const total = p + interest;
      return {
        output: [
          kv('Initial Principal', fmtMoney(p)),
          kv('Annual Interest Rate', `${fmtNum(rate, 2)}%`),
          kv('Duration', `${fmtNum(years, 2)} years`),
          '',
          bullet('Interest Earned', fmtMoney(interest)),
          bullet('Maturity Value (P + I)', fmtMoney(total)),
          bullet('Interest per Year', fmtMoney(years > 0 ? interest / years : interest)),
        ].join('\n'),
      };
    },
  },
  {
    slug: 'emi-calculator',
    fields: [
      numF('amount', 'Loan Amount', 25000, { min: 0 }),
      numF('rate', 'Annual Interest Rate (%)', 9, { min: 0, max: 100, step: 0.1 }),
      numF('years', 'Tenure (years)', 3, { min: 0.5, max: 30, step: 0.5 }),
    ],
    run: ({ values }): ToolResult => {
      const amount = num(values.amount, 25000);
      const rate = num(values.rate, 9);
      const years = num(values.years, 3);
      const months = Math.max(1, Math.round(years * 12));
      const emi = monthlyPayment(amount, rate, months);
      const totalPaid = emi * months;
      const totalInterest = totalPaid - amount;
      const share = totalPaid > 0 ? (totalInterest / totalPaid) * 100 : 0;
      return {
        output: [
          kv('Loan Amount', fmtMoney(amount)),
          kv('Annual Interest Rate', `${fmtNum(rate, 2)}%`),
          kv('Tenure', `${fmtNum(years, 2)} years (${months} months)`),
          '',
          bullet('Monthly EMI', fmtMoney(emi)),
          bullet('Total Payment', fmtMoney(totalPaid)),
          bullet('Total Interest', fmtMoney(totalInterest)),
          bullet('Interest Share of Total', `${fmtNum(share, 1)}%`),
        ].join('\n'),
      };
    },
  },
  {
    slug: 'loan-calculator',
    fields: [
      numF('amount', 'Loan Amount', 15000, { min: 0 }),
      numF('rate', 'Annual Interest Rate (%)', 7.5, { min: 0, max: 100, step: 0.1 }),
      numF('years', 'Loan Term (years)', 5, { min: 0.5, max: 40, step: 0.5 }),
    ],
    run: ({ values }): ToolResult => {
      const amount = num(values.amount, 15000);
      const rate = num(values.rate, 7.5);
      const years = num(values.years, 5);
      const months = Math.max(1, Math.round(years * 12));
      const monthly = monthlyPayment(amount, rate, months);
      const totalCost = monthly * months;
      const interest = totalCost - amount;
      const interestPct = totalCost > 0 ? (interest / totalCost) * 100 : 0;
      return {
        output: [
          kv('Loan Amount', fmtMoney(amount)),
          kv('Annual Interest Rate', `${fmtNum(rate, 2)}%`),
          kv('Loan Term', `${fmtNum(years, 2)} years (${months} months)`),
          '',
          bullet('Monthly Payment (Principal & Interest)', fmtMoney(monthly)),
          bullet('Total Cost of Loan', fmtMoney(totalCost)),
          bullet('Total Interest Paid', fmtMoney(interest)),
          bullet(
            'Interest Breakdown',
            `${fmtNum(interestPct, 1)}% interest / ${fmtNum(100 - interestPct, 1)}% principal`,
          ),
        ].join('\n'),
      };
    },
  },
  {
    slug: 'mortgage-calculator',
    fields: [
      numF('price', 'Home Price', 350000, { min: 0 }),
      numF('downPct', 'Down Payment (%)', 20, { min: 0, max: 95, step: 1 }),
      numF('rate', 'Interest Rate (%)', 6.5, { min: 0, max: 30, step: 0.05 }),
      numF('years', 'Term (years)', 30, { min: 1, max: 40, step: 1 }),
    ],
    run: ({ values }): ToolResult => {
      const price = num(values.price, 350000);
      const downPct = num(values.downPct, 20);
      const rate = num(values.rate, 6.5);
      const years = num(values.years, 30);
      const downAmt = (price * downPct) / 100;
      const loan = price - downAmt;
      const months = Math.max(1, Math.round(years * 12));
      const monthly = monthlyPayment(loan, rate, months);
      const totalPaid = monthly * months;
      const totalInterest = totalPaid - loan;
      const ltv = price > 0 ? (loan / price) * 100 : 0;
      return {
        output: [
          kv('Home Price', fmtMoney(price)),
          kv('Down Payment', `${fmtMoney(downAmt)} (${fmtNum(downPct, 1)}%)`),
          kv('Loan Amount', fmtMoney(loan)),
          kv('Rate / Term', `${fmtNum(rate, 2)}% / ${fmtNum(years, 0)} years`),
          '',
          bullet('Monthly Payment (P&I)', fmtMoney(monthly)),
          bullet('Loan-to-Value', `${fmtNum(ltv, 1)}%`),
          bullet('Total Interest Paid', fmtMoney(totalInterest)),
          bullet('Total Cost (Loan + Interest)', fmtMoney(totalPaid)),
        ].join('\n'),
      };
    },
  },
  {
    slug: 'investment-return-calculator',
    fields: [
      numF('initial', 'Initial Deposit', 5000, { min: 0 }),
      numF('monthly', 'Monthly Contribution', 250, { min: 0 }),
      numF('rate', 'Annual Return (%)', 7, { min: -50, max: 100, step: 0.1 }),
      numF('years', 'Investment Duration (years)', 10, { min: 0.5, max: 60, step: 0.5 }),
    ],
    run: ({ values }): ToolResult => {
      const initial = num(values.initial, 5000);
      const monthly = num(values.monthly, 250);
      const rate = num(values.rate, 7);
      const years = num(values.years, 10);
      const months = Math.max(1, Math.round(years * 12));
      const futureValue = futureValueWithContributions(initial, monthly, rate, months);
      const contributed = initial + monthly * months;
      const interest = futureValue - contributed;
      const multiple = contributed > 0 ? futureValue / contributed : 0;
      return {
        output: [
          kv('Initial Deposit', fmtMoney(initial)),
          kv('Monthly Contribution', fmtMoney(monthly)),
          kv('Annual Return', `${fmtNum(rate, 2)}%`),
          kv('Duration', `${fmtNum(years, 2)} years (${months} months)`),
          '',
          bullet('Future Value', fmtMoney(futureValue)),
          bullet('Total Contributed', fmtMoney(contributed)),
          bullet('Total Interest Earned', fmtMoney(interest)),
          bullet('Growth Multiple', `${fmtNum(multiple, 2)}x`),
        ].join('\n'),
      };
    },
  },
  {
    slug: 'finance-roi-calculator',
    fields: [
      numF('initial', 'Initial Investment', 10000, { min: 0.01 }),
      numF('final', 'Final Value', 14500, { min: 0 }),
      numF('years', 'Holding Period (years)', 2, { min: 0.08, max: 60, step: 0.08 }),
    ],
    run: ({ values }): ToolResult => {
      const initial = num(values.initial, 10000);
      const final = num(values.final, 14500);
      const years = num(values.years, 2);
      const net = final - initial;
      const roi = initial > 0 ? (net / initial) * 100 : 0;
      const cagr =
        initial > 0 && years > 0 && final > 0 ? (Math.pow(final / initial, 1 / years) - 1) * 100 : roi;
      return {
        output: [
          kv('Initial Investment', fmtMoney(initial)),
          kv('Final Value', fmtMoney(final)),
          kv('Holding Period', `${fmtNum(years, 2)} years`),
          '',
          bullet('Net Profit / Loss', signedMoney(net)),
          bullet('Total ROI', `${fmtNum(roi, 2)}%`),
          bullet('Annualized ROI (CAGR)', `${fmtNum(cagr, 2)}%`),
          bullet('Outcome', net > 0 ? 'Gain' : net < 0 ? 'Loss' : 'Break-even'),
        ].join('\n'),
      };
    },
  },
  {
    slug: 'savings-calculator',
    fields: [
      numF('initial', 'Starting Balance', 1000, { min: 0 }),
      numF('monthly', 'Monthly Deposit', 200, { min: 0 }),
      numF('rate', 'Annual Interest (%)', 3, { min: 0, max: 50, step: 0.1 }),
      numF('years', 'Savings Duration (years)', 5, { min: 0.5, max: 50, step: 0.5 }),
      numF('goal', 'Savings Goal (0 = none)', 15000, { min: 0 }),
    ],
    run: ({ values }): ToolResult => {
      const initial = num(values.initial, 1000);
      const monthly = num(values.monthly, 200);
      const rate = num(values.rate, 3);
      const years = num(values.years, 5);
      const goal = num(values.goal, 15000);
      const months = Math.max(1, Math.round(years * 12));
      const total = futureValueWithContributions(initial, monthly, rate, months);
      const deposited = initial + monthly * months;
      const interest = total - deposited;
      const coverage = goal > 0 ? (total / goal) * 100 : 0;
      return {
        output: [
          kv('Starting Balance', fmtMoney(initial)),
          kv('Monthly Deposit', fmtMoney(monthly)),
          kv('Annual Interest', `${fmtNum(rate, 2)}%`),
          kv('Duration', `${fmtNum(years, 2)} years (${months} months)`),
          '',
          bullet('Total Saved', fmtMoney(total)),
          bullet('Total Deposited', fmtMoney(deposited)),
          bullet('Interest Earned', fmtMoney(interest)),
          bullet(
            'Goal Coverage',
            goal > 0 ? `${fmtNum(coverage, 1)}% of ${fmtMoney(goal)}` : 'no goal set',
          ),
        ].join('\n'),
      };
    },
  },
  {
    slug: 'percentage-calculator',
    fields: [
      numF('value', 'Value (X)', 25, { step: 1 }),
      numF('percent', 'Percentage', 20, { step: 1 }),
      numF('ofValue', 'Reference Value (Y)', 200, { step: 1 }),
    ],
    run: ({ values }): ToolResult => {
      const value = num(values.value, 25);
      const percent = num(values.percent, 20);
      const ofValue = num(values.ofValue, 200);
      const part = (percent / 100) * ofValue;
      const whatPct = ofValue !== 0 ? (value / ofValue) * 100 : NaN;
      const change = value !== 0 ? ((ofValue - value) / Math.abs(value)) * 100 : NaN;
      return {
        output: [
          kv('Value (X)', fmtNum(value, 2)),
          kv('Percentage', `${fmtNum(percent, 2)}%`),
          kv('Reference Value (Y)', fmtNum(ofValue, 2)),
          '',
          bullet(`${fmtNum(percent, 2)}% of ${fmtNum(ofValue, 2)}`, fmtNum(part, 2)),
          bullet(
            `${fmtNum(value, 2)} is what % of ${fmtNum(ofValue, 2)}`,
            Number.isFinite(whatPct) ? `${fmtNum(whatPct, 2)}%` : 'undefined (Y is zero)',
          ),
          bullet(
            `${change < 0 ? '% decrease' : '% increase'} from ${fmtNum(value, 2)} to ${fmtNum(ofValue, 2)}`,
            Number.isFinite(change)
              ? `${change >= 0 ? '+' : ''}${fmtNum(change, 2)}%`
              : 'undefined (X is zero)',
          ),
        ].join('\n'),
      };
    },
  },
  {
    slug: 'currency-converter',
    fields: [
      numF('amount', 'Amount', 100, { min: 0 }),
      selF('from', 'From Currency', 'USD', currencyOptions),
      selF('to', 'To Currency', 'PKR', currencyOptions),
    ],
    run: async ({ values }): Promise<ToolResult> => {
      const amount = num(values.amount, 100);
      const from = str(values.from, 'USD').toUpperCase();
      const to = str(values.to, 'PKR').toUpperCase();
      let rates = REFERENCE_RATES;
      let note = 'Reference rates (offline fallback)';
      try {
        const request = fetch('https://open.er-api.com/v6/latest/USD');
        request.catch(() => undefined); // never leave an unhandled rejection behind
        const timeout = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Rate lookup timed out')), 4000);
        });
        const response = await Promise.race([request, timeout]);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = (await response.json()) as { rates?: Record<string, number> } | null;
        const live = data?.rates;
        if (
          live &&
          typeof live[from] === 'number' &&
          Number.isFinite(live[from]) &&
          typeof live[to] === 'number' &&
          Number.isFinite(live[to])
        ) {
          rates = live;
          note = 'Live rates via open.er-api.com';
        }
      } catch {
        // offline, blocked, slow, or malformed response → static reference table
      }
      const rate =
        (rates[to] ?? REFERENCE_RATES[to] ?? 1) / (rates[from] ?? REFERENCE_RATES[from] ?? 1);
      const converted = amount * rate;
      const inverse = rate !== 0 ? 1 / rate : 0;
      return {
        output: [
          kv('Amount', `${fmtNum(amount, 2)} ${from}`),
          kv('Rate Used', `1 ${from} = ${rate.toFixed(4)} ${to}`),
          '',
          bullet('Converted Amount', `${fmtNum(converted, 2)} ${to}`),
          bullet('Inverse Rate', `1 ${to} = ${inverse.toFixed(6)} ${from}`),
        ].join('\n'),
        note,
      };
    },
  },
  {
    slug: 'profit-loss-calculator',
    fields: [
      numF('revenue', 'Total Revenue', 50000, { min: 0 }),
      numF('cost', 'Total Cost', 37500, { min: 0 }),
    ],
    run: ({ values }): ToolResult => {
      const revenue = num(values.revenue, 50000);
      const cost = num(values.cost, 37500);
      const profit = revenue - cost;
      const margin = revenue !== 0 ? (profit / revenue) * 100 : 0;
      return {
        output: [
          kv('Total Revenue', fmtMoney(revenue)),
          kv('Total Cost', fmtMoney(cost)),
          '',
          bullet(profit >= 0 ? 'Net Profit' : 'Net Loss', fmtMoney(Math.abs(profit))),
          bullet('Margin on Revenue', `${fmtNum(margin, 2)}%`),
          bullet('Status', profit > 0 ? 'PROFIT' : profit < 0 ? 'LOSS' : 'BREAK-EVEN'),
        ].join('\n'),
      };
    },
  },
  {
    slug: 'gst-calculator',
    fields: [
      numF('amount', 'Amount', 10000, { min: 0 }),
      selF('gstRate', 'GST Rate', '5', [
        { value: '5', label: '5%' },
        { value: '12', label: '12%' },
        { value: '18', label: '18%' },
        { value: '28', label: '28%' },
      ]),
      selF('mode', 'Mode', 'add', [
        { value: 'add', label: 'Add GST (net → gross)' },
        { value: 'remove', label: 'Remove GST (gross → net)' },
      ]),
    ],
    run: ({ values }): ToolResult => {
      const amount = num(values.amount, 10000);
      const gstRate = num(values.gstRate, 5);
      const mode = str(values.mode, 'add');
      let net: number;
      let gross: number;
      let gstAmount: number;
      if (mode === 'remove') {
        gross = amount;
        net = gross / (1 + gstRate / 100);
        gstAmount = gross - net;
      } else {
        net = amount;
        gstAmount = (net * gstRate) / 100;
        gross = net + gstAmount;
      }
      return {
        output: [
          kv('Amount Entered', fmtMoney(amount)),
          kv('Mode', mode === 'remove' ? 'Remove GST from gross' : 'Add GST to net'),
          kv('GST Rate', `${fmtNum(gstRate, 0)}%`),
          '',
          bullet('GST Amount', fmtMoney(gstAmount)),
          bullet('Net Amount (excl. GST)', fmtMoney(net)),
          bullet('Gross Amount (incl. GST)', fmtMoney(gross)),
        ].join('\n'),
      };
    },
  },
  {
    slug: 'vat-calculator',
    fields: [
      numF('amount', 'Amount', 1200, { min: 0 }),
      numF('vatRate', 'VAT Rate (%)', 20, { min: 0, max: 100, step: 0.5 }),
      selF('mode', 'Mode', 'add', [
        { value: 'add', label: 'Add VAT (net → gross)' },
        { value: 'remove', label: 'Remove VAT (gross → net)' },
      ]),
    ],
    run: ({ values }): ToolResult => {
      const amount = num(values.amount, 1200);
      const vatRate = num(values.vatRate, 20);
      const mode = str(values.mode, 'add');
      let net: number;
      let gross: number;
      let vatAmount: number;
      if (mode === 'remove') {
        gross = amount;
        net = gross / (1 + vatRate / 100);
        vatAmount = gross - net;
      } else {
        net = amount;
        vatAmount = (net * vatRate) / 100;
        gross = net + vatAmount;
      }
      return {
        output: [
          kv('Amount Entered', fmtMoney(amount)),
          kv('Mode', mode === 'remove' ? 'Remove VAT from gross' : 'Add VAT to net'),
          kv('VAT Rate', `${fmtNum(vatRate, 2)}%`),
          '',
          bullet('VAT Amount', fmtMoney(vatAmount)),
          bullet('Net Amount (excl. VAT)', fmtMoney(net)),
          bullet('Gross Amount (incl. VAT)', fmtMoney(gross)),
        ].join('\n'),
      };
    },
  },
  {
    slug: 'tip-calculator',
    fields: [
      numF('bill', 'Bill Amount', 85, { min: 0 }),
      numF('tipPct', 'Tip (%)', 15, { min: 0, max: 100, step: 1 }),
      numF('guests', 'Number of Guests', 2, { min: 1, max: 50, step: 1 }),
      {
        name: 'roundUp',
        label: 'Round total up to the nearest whole number',
        type: 'checkbox',
        default: false,
      },
    ],
    run: ({ values }): ToolResult => {
      const bill = num(values.bill, 85);
      const tipPct = num(values.tipPct, 15);
      const guests = Math.max(1, Math.round(num(values.guests, 2)));
      const roundUp = bool(values.roundUp, false);
      const tipAmount = (bill * tipPct) / 100;
      let total = bill + tipAmount;
      let rounded = false;
      if (roundUp && total % 1 !== 0) {
        total = Math.ceil(total);
        rounded = true;
      }
      const perPerson = total / guests;
      return {
        output: [
          kv('Bill Amount', fmtMoney(bill)),
          kv('Tip Percentage', `${fmtNum(tipPct, 1)}%`),
          kv('Guests', guests),
          '',
          bullet('Tip Amount', fmtMoney(tipAmount)),
          bullet('Total with Tip', fmtMoney(total)),
          bullet('Each Guest Pays', fmtMoney(perPerson)),
        ].join('\n'),
        note: rounded ? 'Total rounded up to a clean payment amount.' : undefined,
      };
    },
  },
  {
    slug: 'debt-payoff-calculator',
    fields: [
      numF('balance', 'Outstanding Balance', 8000, { min: 0 }),
      numF('apr', 'APR (%)', 19.99, { min: 0, max: 100, step: 0.01 }),
      numF('payment', 'Monthly Payment', 250, { min: 0 }),
    ],
    run: ({ values }): ToolResult => {
      const balance = num(values.balance, 8000);
      const apr = num(values.apr, 19.99);
      const payment = num(values.payment, 250);
      const monthlyRate = apr / 100 / 12;
      const monthlyInterest = balance * monthlyRate;
      const context = [
        kv('Outstanding Balance', fmtMoney(balance)),
        kv('APR', `${fmtNum(apr, 2)}%`),
        kv('Monthly Payment', fmtMoney(payment)),
        '',
      ];
      if (balance <= 0) {
        return { output: [...context, bullet('Status', 'Debt is already fully paid off.')].join('\n') };
      }
      if (payment <= 0 || payment <= monthlyInterest) {
        return {
          output: [
            ...context,
            '• Monthly payment does not cover interest — debt never pays off',
            bullet('Monthly Interest Accrued', fmtMoney(monthlyInterest)),
            bullet('Minimum Viable Payment', fmtMoney(monthlyInterest + 1)),
          ].join('\n'),
          note: 'Raise the payment above the monthly interest to start reducing the principal.',
        };
      }
      let remaining = balance;
      let totalInterest = 0;
      let months = 0;
      while (remaining > 0.005 && months < 1200) {
        const interest = remaining * monthlyRate;
        const pay = Math.min(payment, remaining + interest);
        totalInterest += interest;
        remaining = remaining + interest - pay;
        months += 1;
      }
      if (remaining > 0.005) {
        return {
          output: [
            ...context,
            '• Monthly payment does not cover interest — debt never pays off',
          ].join('\n'),
        };
      }
      const payoffDate = new Date();
      payoffDate.setMonth(payoffDate.getMonth() + months);
      return {
        output: [
          ...context,
          bullet('Months to Payoff', `${months} months (≈ ${fmtNum(months / 12, 1)} years)`),
          bullet('Total Interest Paid', fmtMoney(totalInterest)),
          bullet('Total Amount Paid', fmtMoney(balance + totalInterest)),
          bullet(
            'Projected Debt-Free Date',
            payoffDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          ),
        ].join('\n'),
      };
    },
  },
];
