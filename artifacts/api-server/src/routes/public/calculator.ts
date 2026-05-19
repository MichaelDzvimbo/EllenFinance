import { Router, type IRouter } from "express";
import { CalculateRepaymentQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/calculator", async (req, res): Promise<void> => {
  const parsed = CalculateRepaymentQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { amount, months } = parsed.data;
  const monthlyRate = 0.08;

  const monthlyPayment =
    (amount * monthlyRate * Math.pow(1 + monthlyRate, months)) /
    (Math.pow(1 + monthlyRate, months) - 1);

  const totalRepayable = monthlyPayment * months;
  const interestTotal = totalRepayable - amount;

  let balance = amount;
  const schedule = [];
  for (let m = 1; m <= months; m++) {
    const interest = balance * monthlyRate;
    const principal = monthlyPayment - interest;
    balance = Math.max(0, balance - principal);
    schedule.push({
      month: m,
      payment: Number(monthlyPayment.toFixed(2)),
      interest: Number(interest.toFixed(2)),
      principal: Number(principal.toFixed(2)),
      balance: Number(balance.toFixed(2)),
    });
  }

  res.json({
    monthlyPayment: Number(monthlyPayment.toFixed(2)),
    totalRepayable: Number(totalRepayable.toFixed(2)),
    interestTotal: Number(interestTotal.toFixed(2)),
    schedule,
  });
});

export default router;
