// BRANIFY Free Tools — Business Tools
// 15 pure client-side business utilities: invoicing, quoting, naming, margins,
// markup, break-even, ROI, growth projection, commission, payroll, discounts,
// sales tax, loan payments, and pricing strategy. No network calls.
// Output style: kv() context lines → blank line → bullet() result lines,
// except the invoice / quote / name generators, which render full documents.
import { bool, num, str } from './types';
import type { ToolDefinition, ToolField, ToolResult } from './types';
import { bullet, fmtMoney, fmtNum, kv, pick, sample, titleCase } from './helpers';

/* ------------------------------------------------------------------ */
/* field builders                                                      */
/* ------------------------------------------------------------------ */

const numF = (
  name: string,
  label: string,
  def: number,
  opts: { min?: number; max?: number; step?: number; hint?: string } = {},
): ToolField => ({ type: 'number', name, label, default: def, ...opts });

const textF = (
  name: string,
  label: string,
  def: string,
  opts: { placeholder?: string; hint?: string } = {},
): ToolField => ({ type: 'text', name, label, default: def, ...opts });

const selF = (
  name: string,
  label: string,
  def: string,
  options: { value: string; label: string }[],
): ToolField => ({ type: 'select', name, label, default: def, options });

/* ------------------------------------------------------------------ */
/* shared business math & document helpers                             */
/* ------------------------------------------------------------------ */

/** Standard amortized monthly payment: M = P·r / (1 − (1+r)^−n). */
const monthlyPayment = (principal: number, annualRatePct: number, months: number): number => {
  if (months <= 0) return principal;
  const r = annualRatePct / 100 / 12;
  if (r === 0) return principal / months;
  return (principal * r) / (1 - Math.pow(1 + r, -months));
};

/** Signed money: renders losses as -$1,200.00 instead of $-1,200.00. */
const signedMoney = (n: number): string => `${n < 0 ? '-' : ''}${fmtMoney(Math.abs(n))}`;

const DASH = '----------------------------------------';

const todayLong = (): string =>
  new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

/** Right-aligned money row for document totals. */
const moneyRow = (label: string, amount: string): string =>
  `${label.padEnd(30)}${amount.padStart(18)}`;

const NAME_PREFIXES = [
  'Nova', 'Zen', 'Lumi', 'Vertex', 'Apex', 'Orbit', 'Pulse', 'Echo',
  'Bloom', 'Forge', 'Atlas', 'Prime', 'Vivid', 'Aurora',
];

const NAME_STYLES: Record<string, { suffixes: string[]; taglines: string[] }> = {
  Modern: {
    suffixes: ['', 'ify', 'ly', ' Labs', ' Studio', ' & Co', ' Hub', ' Works'],
    taglines: [
      'Simply better, every day.',
      'Designed around your routine.',
      'Modern made friendly.',
      'Fresh thinking, daily.',
      'Where simplicity scales.',
      'Less friction, more flow.',
    ],
  },
  Luxury: {
    suffixes: ['', ' & Co', ' Maison', ' Atelier', ' Reserve', ' Elite', ' Signature', ' Prestige'],
    taglines: [
      'Quiet luxury, unmistakable.',
      'Crafted for the few.',
      'Timeless elegance, modern soul.',
      'Where indulgence begins.',
      'Refined without the effort.',
      'Excellence, by appointment.',
    ],
  },
  Playful: {
    suffixes: ['', 'ify', 'ster', ' Pop', ' Squad', ' Barn', ' Shack', ' Club'],
    taglines: [
      'Seriously fun stuff.',
      'A little joy in every order.',
      'Grins guaranteed.',
      'Playfully serious about quality.',
      'Delight served daily.',
      'Making ordinary sparkle.',
    ],
  },
  Tech: {
    suffixes: ['', 'ly', ' Labs', ' Systems', ' Stack', ' Grid', ' Byte', ' Cloud'],
    taglines: [
      'Ship faster, scale smarter.',
      'Infrastructure for the ambitious.',
      'Build today, lead tomorrow.',
      'The stack behind the bold.',
      'Automate the tedious away.',
      'From prototype to planet-scale.',
    ],
  },
};

/* ------------------------------------------------------------------ */
/* tools                                                               */
/* ------------------------------------------------------------------ */

export const businessTools: ToolDefinition[] = [
  {
    slug: 'invoice-generator',
    fields: [
      textF('businessName', 'Business Name', 'BRANIFY Digital Studio'),
      textF('clientName', 'Client Name', 'Acme Corporation'),
      textF('itemDescription', 'Item / Service Description', 'Custom Website Development (Fixed Scope)'),
      numF('quantity', 'Quantity', 1, { min: 1, step: 1 }),
      numF('unitPrice', 'Unit Price', 2500, { min: 0 }),
      numF('taxRate', 'Tax Rate (%)', 10, { min: 0, max: 100, step: 0.5 }),
      textF('invoiceNumber', 'Invoice Number', 'INV-2026-001'),
    ],
    run: ({ values }): ToolResult => {
      const business = str(values.businessName, 'BRANIFY Digital Studio').trim() || 'BRANIFY Digital Studio';
      const client = str(values.clientName, 'Acme Corporation').trim() || 'Acme Corporation';
      const item = str(values.itemDescription, 'Custom Website Development (Fixed Scope)').trim() || 'Services rendered';
      const qty = Math.max(1, num(values.quantity, 1));
      const unitPrice = num(values.unitPrice, 2500);
      const taxRate = num(values.taxRate, 10);
      const invoiceNumber = str(values.invoiceNumber, 'INV-2026-001').trim() || 'INV-2026-001';
      const subtotal = qty * unitPrice;
      const tax = (subtotal * taxRate) / 100;
      const total = subtotal + tax;
      const output = [
        business,
        'INVOICE',
        '',
        `Invoice #: ${invoiceNumber}`,
        `Date: ${todayLong()}`,
        DASH,
        `Billed To: ${client}`,
        DASH,
        '',
        `Description: ${item}`,
        `Line Item:   ${fmtNum(qty, 2)} x ${fmtMoney(unitPrice)} = ${fmtMoney(subtotal)}`,
        '',
        moneyRow('Subtotal', fmtMoney(subtotal)),
        moneyRow(`Tax (${fmtNum(taxRate, 2)}%)`, fmtMoney(tax)),
        DASH,
        moneyRow('TOTAL', fmtMoney(total)),
        DASH,
        '',
        'Payment due within 14 days.',
        '',
        'Generated with BRANIFY Free Invoice Generator',
      ].join('\n');
      return { output, downloadName: `${invoiceNumber}.txt`, downloadMime: 'text/plain' };
    },
  },
  {
    slug: 'business-name-generator',
    fields: [
      textF('keyword', 'Seed Keyword / Industry', 'coffee', {
        placeholder: 'e.g. coffee, fitness, software',
        hint: 'Names are built around this root word',
      }),
      selF('style', 'Naming Style', 'Modern', [
        { value: 'Modern', label: 'Modern' },
        { value: 'Luxury', label: 'Luxury' },
        { value: 'Playful', label: 'Playful' },
        { value: 'Tech', label: 'Tech' },
      ]),
    ],
    run: ({ values }): ToolResult => {
      const keyword = str(values.keyword, 'coffee').trim() || 'coffee';
      const style = str(values.style, 'Modern');
      const bank = NAME_STYLES[style] ?? NAME_STYLES.Modern;
      const root = titleCase(keyword);
      const realSuffixes = bank.suffixes.filter((s) => s.length > 0);
      const candidates = new Set<string>();
      for (const prefix of sample(NAME_PREFIXES, 7)) candidates.add(`${prefix} ${root}`);
      for (const suffix of bank.suffixes) candidates.add(`${root}${suffix}`);
      for (const prefix of sample(NAME_PREFIXES, 5)) {
        candidates.add(`${prefix} ${root}${pick(realSuffixes)}`);
      }
      const names = sample([...candidates], 12);
      for (let guard = 0; names.length < 12 && guard < 60; guard += 1) {
        const candidate = `${pick(NAME_PREFIXES)} ${root}${pick(realSuffixes)}`;
        if (!names.includes(candidate)) names.push(candidate);
      }
      const taglines = sample(bank.taglines, bank.taglines.length);
      const output = [
        `Business Name Ideas — seed "${keyword}" · style: ${style}`,
        '',
        ...names.map((name, i) => `${i + 1}. ${name} — ${taglines[i % taglines.length]}`),
        '',
        'Tip: check domain availability before committing.',
      ].join('\n');
      return { output };
    },
  },
  {
    slug: 'profit-margin-calculator',
    fields: [
      numF('revenue', 'Revenue', 50000, { min: 0 }),
      numF('cogs', 'Cost of Goods Sold', 30000, { min: 0 }),
      numF('opex', 'Operating Expenses', 5000, { min: 0 }),
    ],
    run: ({ values }): ToolResult => {
      const revenue = num(values.revenue, 50000);
      const cogs = num(values.cogs, 30000);
      const opex = num(values.opex, 5000);
      const grossProfit = revenue - cogs;
      const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
      const netProfit = revenue - cogs - opex;
      const netMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
      const markup = cogs > 0 ? (grossProfit / cogs) * 100 : 0;
      return {
        output: [
          kv('Revenue', fmtMoney(revenue)),
          kv('Cost of Goods Sold', fmtMoney(cogs)),
          kv('Operating Expenses', fmtMoney(opex)),
          '',
          bullet('Gross Profit', fmtMoney(grossProfit)),
          bullet('Gross Margin', `${fmtNum(grossMargin, 1)}%`),
          bullet('Net Profit', signedMoney(netProfit)),
          bullet('Net Margin', `${fmtNum(netMargin, 1)}%`),
          bullet('Markup on Cost', `${fmtNum(markup, 1)}%`),
        ].join('\n'),
      };
    },
  },
  {
    slug: 'markup-calculator',
    fields: [
      numF('cost', 'Cost Price per Unit', 80, { min: 0 }),
      numF('markupPct', 'Markup (%)', 60, { min: 0, max: 1000, step: 1 }),
      numF('quantity', 'Quantity Sold', 10, { min: 1, step: 1 }),
    ],
    run: ({ values }): ToolResult => {
      const cost = num(values.cost, 80);
      const markupPct = num(values.markupPct, 60);
      const quantity = Math.max(1, num(values.quantity, 10));
      const price = cost * (1 + markupPct / 100);
      const profitPerUnit = price - cost;
      const marginPct = price > 0 ? (profitPerUnit / price) * 100 : 0;
      return {
        output: [
          kv('Cost Price per Unit', fmtMoney(cost)),
          kv('Markup', `${fmtNum(markupPct, 2)}%`),
          kv('Quantity', quantity),
          '',
          bullet('Selling Price per Unit', fmtMoney(price)),
          bullet('Profit per Unit', fmtMoney(profitPerUnit)),
          bullet('Equivalent Gross Margin', `${fmtNum(marginPct, 1)}%`),
          bullet('Total Revenue', fmtMoney(price * quantity)),
          bullet('Total Profit', fmtMoney(profitPerUnit * quantity)),
        ].join('\n'),
      };
    },
  },
  {
    slug: 'break-even-calculator',
    fields: [
      numF('fixedCosts', 'Fixed Costs', 12000, { min: 0 }),
      numF('price', 'Price per Unit', 45, { min: 0.01 }),
      numF('variableCost', 'Variable Cost per Unit', 18, { min: 0 }),
    ],
    run: ({ values }): ToolResult => {
      const fixedCosts = num(values.fixedCosts, 12000);
      const price = num(values.price, 45);
      const variableCost = num(values.variableCost, 18);
      const contribution = price - variableCost;
      const context = [
        kv('Fixed Costs', fmtMoney(fixedCosts)),
        kv('Price per Unit', fmtMoney(price)),
        kv('Variable Cost per Unit', fmtMoney(variableCost)),
        '',
      ];
      if (contribution <= 0) {
        return {
          output: [
            ...context,
            bullet('Contribution Margin per Unit', signedMoney(contribution)),
            '• Price must exceed variable cost per unit to break even',
          ].join('\n'),
        };
      }
      const breakEvenUnits = fixedCosts / contribution;
      const unitsCeil = Math.ceil(breakEvenUnits);
      const marginRatio = price > 0 ? (contribution / price) * 100 : 0;
      return {
        output: [
          ...context,
          bullet('Contribution Margin per Unit', fmtMoney(contribution)),
          bullet('Contribution Margin Ratio', `${fmtNum(marginRatio, 1)}%`),
          bullet(
            'Break-Even Units',
            `${fmtNum(unitsCeil, 0)} units (${fmtNum(breakEvenUnits, 1)} exact)`,
          ),
          bullet('Break-Even Revenue', fmtMoney(unitsCeil * price)),
        ].join('\n'),
      };
    },
  },
  {
    slug: 'roi-calculator',
    fields: [
      numF('invested', 'Amount Invested', 5000, { min: 0.01 }),
      numF('returned', 'Amount Returned / Revenue', 8500, { min: 0 }),
      numF('months', 'Period (months)', 12, { min: 0.5, max: 600, step: 1 }),
    ],
    run: ({ values }): ToolResult => {
      const invested = num(values.invested, 5000);
      const returned = num(values.returned, 8500);
      const months = num(values.months, 12);
      const net = returned - invested;
      const roi = invested > 0 ? (net / invested) * 100 : 0;
      const annualized =
        invested > 0 && months > 0 && returned > 0
          ? (Math.pow(returned / invested, 12 / months) - 1) * 100
          : roi;
      return {
        output: [
          kv('Amount Invested', fmtMoney(invested)),
          kv('Amount Returned', fmtMoney(returned)),
          kv('Period', `${fmtNum(months, 1)} months`),
          '',
          bullet('Net Profit', signedMoney(net)),
          bullet('ROI', `${fmtNum(roi, 2)}%`),
          bullet('Annualized ROI', `${fmtNum(annualized, 2)}%`),
          bullet('Verdict', roi > 0 ? 'Profitable' : roi < 0 ? 'Loss-making' : 'Break-even'),
        ].join('\n'),
      };
    },
  },
  {
    slug: 'business-growth-calculator',
    fields: [
      numF('currentRevenue', 'Current Annual Revenue', 120000, { min: 0 }),
      numF('growthPct', 'Growth Rate (% per year)', 15, { min: -90, max: 500, step: 1 }),
      numF('years', 'Projection Period (years)', 5, { min: 1, max: 10, step: 1, hint: 'Up to 10 years' }),
    ],
    run: ({ values }): ToolResult => {
      const currentRevenue = num(values.currentRevenue, 120000);
      const growthPct = num(values.growthPct, 15);
      const years = Math.min(10, Math.max(1, Math.round(num(values.years, 5))));
      const factor = Math.pow(1 + growthPct / 100, years);
      const yearLines: string[] = [];
      for (let n = 1; n <= years; n += 1) {
        yearLines.push(`Year ${n}: ${fmtMoney(currentRevenue * Math.pow(1 + growthPct / 100, n))}`);
      }
      return {
        output: [
          kv('Current Revenue', fmtMoney(currentRevenue)),
          kv('Annual Growth Rate', `${fmtNum(growthPct, 2)}%`),
          kv('Projection Period', `${years} years`),
          '',
          ...yearLines,
          '',
          bullet('Overall Growth', `${growthPct >= 0 ? '+' : ''}${fmtNum((factor - 1) * 100, 1)}%`),
          bullet('Revenue Multiple', `${fmtNum(factor, 2)}x`),
        ].join('\n'),
      };
    },
  },
  {
    slug: 'commission-calculator',
    fields: [
      numF('sales', 'Sales Volume', 60000, { min: 0 }),
      numF('rate', 'Commission Rate (%)', 5, { min: 0, max: 100, step: 0.5 }),
      numF('base', 'Base Salary / Draw', 1500, { min: 0, hint: 'Fixed pay added on top of commission' }),
    ],
    run: ({ values }): ToolResult => {
      const sales = num(values.sales, 60000);
      const rate = num(values.rate, 5);
      const base = num(values.base, 1500);
      const commission = (sales * rate) / 100;
      const payout = commission + base;
      const effective = sales > 0 ? (payout / sales) * 100 : 0;
      return {
        output: [
          kv('Sales Volume', fmtMoney(sales)),
          kv('Commission Rate', `${fmtNum(rate, 2)}%`),
          '',
          bullet('Commission Earned', fmtMoney(commission)),
          bullet('Base Salary / Draw', fmtMoney(base)),
          bullet('Total Payout', fmtMoney(payout)),
          bullet('Effective Payout Rate', `${fmtNum(effective, 2)}%`),
        ].join('\n'),
      };
    },
  },
  {
    slug: 'salary-calculator',
    fields: [
      numF('annual', 'Annual Salary', 52000, { min: 0 }),
      numF('hoursPerWeek', 'Hours per Week', 40, { min: 1, max: 100, step: 1 }),
      numF('workingDays', 'Working Days per Year', 260, { min: 1, max: 365, step: 1 }),
    ],
    run: ({ values }): ToolResult => {
      const annual = num(values.annual, 52000);
      const hoursPerWeek = Math.max(1, num(values.hoursPerWeek, 40));
      const workingDays = Math.max(1, num(values.workingDays, 260));
      return {
        output: [
          kv('Annual Salary', fmtMoney(annual)),
          kv('Schedule', `${fmtNum(hoursPerWeek, 0)} h/week · ${fmtNum(workingDays, 0)} working days/year`),
          '',
          bullet('Monthly', fmtMoney(annual / 12)),
          bullet('Bi-Weekly', fmtMoney(annual / 26)),
          bullet('Weekly', fmtMoney(annual / 52)),
          bullet('Daily', fmtMoney(annual / workingDays)),
          bullet('Hourly', fmtMoney(annual / (52 * hoursPerWeek))),
        ].join('\n'),
      };
    },
  },
  {
    slug: 'hourly-rate-calculator',
    fields: [
      numF('rate', 'Hourly Rate', 45, { min: 0 }),
      numF('hoursPerWeek', 'Billable Hours per Week', 30, { min: 1, max: 100, step: 1 }),
      numF('weeksPerYear', 'Working Weeks per Year', 48, { min: 1, max: 52, step: 1 }),
    ],
    run: ({ values }): ToolResult => {
      const rate = num(values.rate, 45);
      const hoursPerWeek = Math.max(1, num(values.hoursPerWeek, 30));
      const weeksPerYear = Math.max(1, num(values.weeksPerYear, 48));
      const annual = rate * hoursPerWeek * weeksPerYear;
      return {
        output: [
          kv('Hourly Rate', fmtMoney(rate)),
          kv('Weekly Hours', hoursPerWeek),
          kv('Working Weeks per Year', weeksPerYear),
          '',
          bullet('Annual Income', fmtMoney(annual)),
          bullet('Monthly Income', fmtMoney(annual / 12)),
          bullet('Weekly Income', fmtMoney(rate * hoursPerWeek)),
          bullet('Daily Income (5-day week)', fmtMoney((rate * hoursPerWeek) / 5)),
          bullet('Billable Hours per Year', `${fmtNum(hoursPerWeek * weeksPerYear, 0)} h`),
        ].join('\n'),
      };
    },
  },
  {
    slug: 'discount-calculator',
    fields: [
      numF('price', 'Original Price', 120, { min: 0 }),
      numF('discount', 'Discount Value', 25, {
        min: 0,
        hint: 'Percent by default; flat amount when the toggle below is on',
      }),
      {
        name: 'fixedAmount',
        label: 'Treat discount as a flat $ amount',
        type: 'checkbox',
        default: false,
        hint: 'Off = percentage off · on = dollar amount off',
      },
    ],
    run: ({ values }): ToolResult => {
      const price = num(values.price, 120);
      const discountValue = num(values.discount, 25);
      const fixedAmount = bool(values.fixedAmount, false);
      const discountAmount = Math.min(price, fixedAmount ? discountValue : (price * discountValue) / 100);
      const finalPrice = price - discountAmount;
      const savedPct = price > 0 ? (discountAmount / price) * 100 : 0;
      return {
        output: [
          kv('Original Price', fmtMoney(price)),
          kv('Discount', fixedAmount ? `${fmtMoney(discountValue)} flat` : `${fmtNum(discountValue, 2)}%`),
          '',
          bullet('Discount Amount', fmtMoney(discountAmount)),
          bullet('Final Price', fmtMoney(finalPrice)),
          bullet('You Save', `${fmtNum(savedPct, 1)}%`),
        ].join('\n'),
      };
    },
  },
  {
    slug: 'tax-calculator',
    fields: [
      numF('amount', 'Amount', 250, { min: 0 }),
      numF('taxRate', 'Sales Tax Rate (%)', 8.5, { min: 0, max: 100, step: 0.1 }),
      selF('mode', 'Mode', 'add', [
        { value: 'add', label: 'Add tax (net → gross)' },
        { value: 'remove', label: 'Remove tax (gross → net)' },
      ]),
    ],
    run: ({ values }): ToolResult => {
      const amount = num(values.amount, 250);
      const taxRate = num(values.taxRate, 8.5);
      const mode = str(values.mode, 'add');
      let net: number;
      let gross: number;
      let taxAmount: number;
      if (mode === 'remove') {
        gross = amount;
        net = gross / (1 + taxRate / 100);
        taxAmount = gross - net;
      } else {
        net = amount;
        taxAmount = (net * taxRate) / 100;
        gross = net + taxAmount;
      }
      return {
        output: [
          kv('Amount Entered', fmtMoney(amount)),
          kv('Tax Rate', `${fmtNum(taxRate, 2)}%`),
          kv('Mode', mode === 'remove' ? 'Extract tax from gross' : 'Add tax to net'),
          '',
          bullet('Tax Amount', fmtMoney(taxAmount)),
          bullet('Net Amount (before tax)', fmtMoney(net)),
          bullet('Gross Total (with tax)', fmtMoney(gross)),
        ].join('\n'),
      };
    },
  },
  {
    slug: 'loan-payment-calculator',
    fields: [
      numF('amount', 'Loan Amount', 50000, { min: 0 }),
      numF('rate', 'Annual Interest Rate (%)', 8, { min: 0, max: 100, step: 0.1 }),
      numF('years', 'Term (years)', 5, { min: 0.5, max: 40, step: 0.5 }),
    ],
    run: ({ values }): ToolResult => {
      const amount = num(values.amount, 50000);
      const rate = num(values.rate, 8);
      const years = num(values.years, 5);
      const months = Math.max(1, Math.round(years * 12));
      const monthly = monthlyPayment(amount, rate, months);
      const totalInterest = monthly * months - amount;
      return {
        output: [
          kv('Loan Amount', fmtMoney(amount)),
          kv('Annual Interest Rate', `${fmtNum(rate, 2)}%`),
          kv('Term', `${fmtNum(years, 2)} years (${months} months)`),
          '',
          bullet('Monthly Payment', fmtMoney(monthly)),
          bullet('Number of Payments', `${months}`),
          bullet('Total Interest Cost', fmtMoney(totalInterest)),
          bullet('Total Repaid', fmtMoney(amount + totalInterest)),
        ].join('\n'),
      };
    },
  },
  {
    slug: 'pricing-calculator',
    fields: [
      numF('cost', 'Unit Cost', 40, { min: 0 }),
      numF('marginPct', 'Target Profit Margin (%)', 55, { min: 0, max: 99, step: 1 }),
      numF('feesPct', 'Payment / Platform Fees (%)', 3, { min: 0, max: 99, step: 0.5 }),
    ],
    run: ({ values }): ToolResult => {
      const cost = num(values.cost, 40);
      const marginPct = num(values.marginPct, 55);
      const feesPct = num(values.feesPct, 3);
      const denominator = 1 - marginPct / 100 - feesPct / 100;
      const context = [
        kv('Unit Cost', fmtMoney(cost)),
        kv('Target Profit Margin', `${fmtNum(marginPct, 2)}%`),
        kv('Payment / Platform Fees', `${fmtNum(feesPct, 2)}%`),
        '',
      ];
      if (denominator <= 0) {
        return {
          output: [
            ...context,
            '• Target margin plus fees cannot reach or exceed 100% — price is undefined',
          ].join('\n'),
        };
      }
      const price = cost / denominator;
      const profit = price * (1 - feesPct / 100) - cost;
      const actualMargin = price > 0 ? (profit / price) * 100 : 0;
      const markupOnCost = cost > 0 ? (profit / cost) * 100 : 0;
      return {
        output: [
          ...context,
          bullet('Recommended Price', fmtMoney(price)),
          bullet('Profit per Unit (after fees)', fmtMoney(profit)),
          bullet('Achieved Margin', `${fmtNum(actualMargin, 1)}%`),
          bullet('Markup on Cost', `${fmtNum(markupOnCost, 1)}%`),
        ].join('\n'),
      };
    },
  },
  {
    slug: 'quote-generator',
    fields: [
      textF('businessName', 'Business Name', 'BRANIFY Digital Studio'),
      textF('clientName', 'Client Name', 'Acme Corporation'),
      textF('itemDescription', 'Item / Service Description', 'E-commerce Store Redesign & Build'),
      numF('quantity', 'Quantity', 1, { min: 1, step: 1 }),
      numF('unitPrice', 'Unit Price', 4200, { min: 0 }),
      numF('taxRate', 'Tax Rate (%)', 10, { min: 0, max: 100, step: 0.5 }),
      textF('quoteNumber', 'Quote Number', 'QUO-2026-014'),
    ],
    run: ({ values }): ToolResult => {
      const business = str(values.businessName, 'BRANIFY Digital Studio').trim() || 'BRANIFY Digital Studio';
      const client = str(values.clientName, 'Acme Corporation').trim() || 'Acme Corporation';
      const item = str(values.itemDescription, 'E-commerce Store Redesign & Build').trim() || 'Proposed services';
      const qty = Math.max(1, num(values.quantity, 1));
      const unitPrice = num(values.unitPrice, 4200);
      const taxRate = num(values.taxRate, 10);
      const quoteNumber = str(values.quoteNumber, 'QUO-2026-014').trim() || 'QUO-2026-014';
      const subtotal = qty * unitPrice;
      const tax = (subtotal * taxRate) / 100;
      const total = subtotal + tax;
      const output = [
        business,
        'PRICE QUOTE',
        '',
        `Quote #: ${quoteNumber}`,
        `Date: ${todayLong()}`,
        DASH,
        `Prepared For: ${client}`,
        DASH,
        '',
        `Description: ${item}`,
        `Line Item:   ${fmtNum(qty, 2)} x ${fmtMoney(unitPrice)} = ${fmtMoney(subtotal)}`,
        '',
        moneyRow('Subtotal', fmtMoney(subtotal)),
        moneyRow(`Tax (${fmtNum(taxRate, 2)}%)`, fmtMoney(tax)),
        DASH,
        moneyRow('TOTAL', fmtMoney(total)),
        DASH,
        '',
        'Quote valid for 30 days from date of issue.',
        '',
        'Generated with BRANIFY Free Quote Generator',
      ].join('\n');
      return { output, downloadName: `${quoteNumber}.txt`, downloadMime: 'text/plain' };
    },
  },
];
