"use client";

import { useState } from "react";
import { Calculator, X } from "lucide-react";
import { CURRENCY_SYMBOL } from "@/lib/formatting";

interface AffordabilityCalculatorProps {
  price: number;
  currency: string;
}

export default function AffordabilityCalculator({ price, currency }: AffordabilityCalculatorProps) {
  const [open, setOpen] = useState(false);
  const [depositPercent, setDepositPercent] = useState(20);
  const [rate, setRate] = useState(7);
  const [termYears, setTermYears] = useState(25);
  const [income, setIncome] = useState("");

  const symbol = CURRENCY_SYMBOL[currency] ?? "";
  const deposit = price * (depositPercent / 100);
  const loanAmount = price - deposit;
  const monthlyRate = rate / 100 / 12;
  const numPayments = termYears * 12;

  const monthlyPayment =
    monthlyRate === 0
      ? loanAmount / numPayments
      : (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
        (Math.pow(1 + monthlyRate, numPayments) - 1);

  const annualIncomeNeeded = monthlyPayment * 12 * 3.5; // common ~3.5x income affordability rule of thumb
  const incomeNum = Number(income);
  const likelyAffordable = incomeNum > 0 ? incomeNum >= annualIncomeNeeded : null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 text-sm font-semibold text-gold-dark hover:underline mt-2"
      >
        <Calculator className="w-4 h-4" /> Can you afford it?
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setOpen(false)}>
          <div
            className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-navy text-lg">Affordability calculator</h3>
              <button onClick={() => setOpen(false)} className="text-navy/40 hover:text-navy">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-navy/40 mb-4">
              A rough estimate only — not financial advice. Speak to a mortgage broker or lender for a real assessment.
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-navy">Deposit: {depositPercent}%</label>
                <input
                  type="range"
                  min={5}
                  max={50}
                  value={depositPercent}
                  onChange={(e) => setDepositPercent(Number(e.target.value))}
                  className="w-full mt-1"
                />
                <p className="text-xs text-navy/50 mt-1">{symbol}{deposit.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-navy">Interest rate: {rate}%</label>
                <input
                  type="range"
                  min={1}
                  max={20}
                  step={0.1}
                  value={rate}
                  onChange={(e) => setRate(Number(e.target.value))}
                  className="w-full mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-navy">Term: {termYears} years</label>
                <input
                  type="range"
                  min={5}
                  max={30}
                  value={termYears}
                  onChange={(e) => setTermYears(Number(e.target.value))}
                  className="w-full mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-navy">Your annual income (optional)</label>
                <input
                  type="number"
                  min={0}
                  value={income}
                  onChange={(e) => setIncome(e.target.value)}
                  placeholder={`e.g. ${symbol}5,000,000`}
                  className="mt-1 w-full border border-navy/15 rounded-md px-3 py-2 text-sm outline-none focus:border-gold"
                />
              </div>
            </div>

            <div className="mt-5 bg-navy/5 rounded-lg p-4">
              <p className="text-sm text-navy/60">Estimated monthly payment</p>
              <p className="text-2xl font-bold text-navy">
                {symbol}{monthlyPayment.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
              <p className="text-xs text-navy/50 mt-1">
                Based on a {symbol}{loanAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })} loan at {rate}% over {termYears} years.
              </p>

              {likelyAffordable !== null && (
                <p className={`text-sm font-semibold mt-3 ${likelyAffordable ? "text-green-700" : "text-amber-700"}`}>
                  {likelyAffordable
                    ? "Based on typical lending rules, this looks within reach for your income."
                    : "This may be a stretch based on typical lending rules \u2014 a lender might ask for a bigger deposit or longer term."}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
