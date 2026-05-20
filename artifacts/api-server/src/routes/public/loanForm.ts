import { Router, type IRouter } from "express";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

const router: IRouter = Router();

const NAVY = rgb(0.169, 0.290, 0.478);
const GOLD = rgb(0.788, 0.592, 0.173);
const GREEN = rgb(0.153, 0.639, 0.384);
const LIGHT_GRAY = rgb(0.96, 0.96, 0.96);
const DARK = rgb(0.1, 0.1, 0.1);
const MID_GRAY = rgb(0.5, 0.5, 0.5);
const WHITE = rgb(1, 1, 1);

router.get("/loan-application-form.pdf", async (req, res): Promise<void> => {
  try {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4
    const { width, height } = page.getSize();
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

    let y = height - 30;

    // Header bar
    page.drawRectangle({ x: 0, y: height - 80, width, height: 80, color: NAVY });
    page.drawRectangle({ x: 0, y: height - 85, width, height: 5, color: GOLD });

    page.drawText("ELLEN FINANCE", { x: 30, y: height - 40, size: 22, font: helveticaBold, color: WHITE });
    page.drawText("MICROFINANCE INSTITUTION — HARARE, ZIMBABWE", { x: 30, y: height - 58, size: 8, font: helvetica, color: rgb(0.8, 0.8, 0.8) });
    page.drawText("Transforming lives through financial aid", { x: 30, y: height - 72, size: 7, font: helvetica, color: GOLD });

    page.drawText("LOAN APPLICATION FORM", { x: 280, y: height - 45, size: 14, font: helveticaBold, color: WHITE });
    page.drawText("FOR OFFICE USE ONLY", { x: 280, y: height - 60, size: 8, font: helvetica, color: rgb(0.7, 0.7, 0.7) });
    page.drawText(`Ref No: ____________________`, { x: 280, y: height - 72, size: 8, font: helvetica, color: rgb(0.8, 0.8, 0.8) });

    y = height - 100;

    // Helper: section header
    const sectionHeader = (label: string, yPos: number) => {
      page.drawRectangle({ x: 30, y: yPos - 4, width: width - 60, height: 18, color: NAVY });
      page.drawText(label.toUpperCase(), { x: 38, y: yPos, size: 8, font: helveticaBold, color: GOLD });
      return yPos - 26;
    };

    // Helper: draw field
    const drawField = (label: string, xPos: number, yPos: number, w: number) => {
      page.drawText(label, { x: xPos, y: yPos, size: 7, font: helvetica, color: MID_GRAY });
      page.drawRectangle({ x: xPos, y: yPos - 16, width: w, height: 14, color: LIGHT_GRAY });
      page.drawLine({ start: { x: xPos, y: yPos - 16 }, end: { x: xPos + w, y: yPos - 16 }, color: rgb(0.75, 0.75, 0.75), thickness: 0.5 });
    };

    // Helper: checkbox
    const drawCheckbox = (label: string, xPos: number, yPos: number) => {
      page.drawRectangle({ x: xPos, y: yPos - 2, width: 10, height: 10, borderColor: NAVY, borderWidth: 0.8, color: WHITE });
      page.drawText(label, { x: xPos + 14, y: yPos, size: 7.5, font: helvetica, color: DARK });
    };

    // ── SECTION 1: PERSONAL INFORMATION ──────────────────────────────────
    y = sectionHeader("1. Personal Information", y);

    drawField("Full Name (as on National ID) *", 30, y, 340);
    drawField("Date of Birth *", 385, y, 180);
    y -= 28;

    drawField("National ID Number *", 30, y, 250);
    drawField("Gender", 295, y, 100);
    drawField("Marital Status", 410, y, 155);
    y -= 28;

    drawField("Phone Number *", 30, y, 250);
    drawField("Alternative Phone", 295, y, 250);
    y -= 28;

    drawField("Email Address", 30, y, 350);
    y -= 28;

    drawField("Residential Address (House No., Street, Suburb) *", 30, y, 535);
    y -= 28;

    drawField("City / Town *", 30, y, 200);
    drawField("Province *", 245, y, 150);
    drawField("Post Code", 410, y, 155);
    y -= 14;

    // ── SECTION 2: EMPLOYMENT ─────────────────────────────────────────────
    y = sectionHeader("2. Employment & Income Details", y);

    page.drawText("Employment Type *", { x: 30, y, size: 7, font: helvetica, color: MID_GRAY });
    y -= 10;
    const empTypes = ["Employed (full-time)", "Employed (part-time)", "Self-Employed", "Business Owner", "Civil Servant", "Contractor", "Unemployed"];
    let ex = 30;
    for (const t of empTypes) {
      if (ex + 80 > width - 30) { ex = 30; y -= 14; }
      drawCheckbox(t, ex, y);
      ex += 90;
    }
    y -= 22;

    drawField("Employer / Business Name *", 30, y, 340);
    drawField("Job Title / Position", 385, y, 180);
    y -= 28;

    drawField("Employer Address", 30, y, 340);
    drawField("Length of Employment", 385, y, 180);
    y -= 28;

    drawField("Gross Monthly Income (USD) *", 30, y, 200);
    drawField("Net Monthly Income (USD) *", 245, y, 200);
    drawField("Other Income Sources", 460, y, 105);
    y -= 14;

    // ── SECTION 3: LOAN DETAILS ───────────────────────────────────────────
    y = sectionHeader("3. Loan Request Details", y);

    drawField("Loan Amount Requested (USD) *", 30, y, 200);
    drawField("Repayment Period (months) *", 245, y, 170);
    drawField("Interest Preference", 430, y, 135);
    y -= 28;

    drawField("Purpose of Loan (brief description) *", 30, y, 535);
    y -= 28;

    page.drawText("Payout Method *", { x: 30, y, size: 7, font: helvetica, color: MID_GRAY });
    y -= 10;
    drawCheckbox("EcoCash (+263 78 328 6316)", 30, y);
    drawCheckbox("InnBucks", 230, y);
    drawCheckbox("Bank Transfer", 380, y);
    y -= 24;

    drawField("Bank Name (if applicable)", 30, y, 200);
    drawField("Branch", 245, y, 140);
    drawField("Account Number", 400, y, 165);
    y -= 14;

    // ── SECTION 4: DOCUMENTS ──────────────────────────────────────────────
    y = sectionHeader("4. Required Documents (attach copies)", y);

    const docs = [
      "National ID (front & back) — MANDATORY",
      "Proof of Residence (utility bill / bank statement — max 3 months old)",
      "Payslip or Bank Statement (last 3 months)",
      "Business Registration Certificate (for self-employed)",
      "Passport Photo (recent, 2x2)",
    ];
    for (const d of docs) {
      drawCheckbox(d, 30, y);
      y -= 16;
    }
    y -= 4;

    // ── SECTION 5: REFERENCES ─────────────────────────────────────────────
    y = sectionHeader("5. References (2 required, not relatives)", y);

    drawField("Reference 1 — Full Name", 30, y, 250);
    drawField("Phone", 295, y, 130);
    drawField("Relationship", 440, y, 125);
    y -= 28;

    drawField("Reference 2 — Full Name", 30, y, 250);
    drawField("Phone", 295, y, 130);
    drawField("Relationship", 440, y, 125);
    y -= 14;

    // ── DECLARATION + SIGNATURE ──────────────────────────────────────────
    y = sectionHeader("6. Declaration & Signature", y);

    const declaration = "I hereby certify that all information provided in this form is accurate and complete. I authorise Ellen Finance to verify any information provided herein and to contact my employer, bank, or any other entity for verification. I understand that providing false information may result in immediate rejection or recovery of disbursed funds.";
    const words = declaration.split(" ");
    let line = "";
    const lineY = [y, y - 12, y - 24];
    let lineIdx = 0;
    for (const word of words) {
      const testLine = line + word + " ";
      if (helvetica.widthOfTextAtSize(testLine, 7.5) > 535 && lineIdx < lineY.length - 1) {
        page.drawText(line.trim(), { x: 30, y: lineY[lineIdx], size: 7.5, font: helvetica, color: DARK });
        line = word + " ";
        lineIdx++;
      } else {
        line = testLine;
      }
    }
    if (line.trim()) page.drawText(line.trim(), { x: 30, y: lineY[lineIdx], size: 7.5, font: helvetica, color: DARK });

    y = lineY[lineY.length - 1] - 20;

    drawField("Applicant Signature *", 30, y, 200);
    drawField("Date *", 245, y, 130);
    drawField("Thumbprint (if unable to sign)", 390, y, 175);
    y -= 24;

    // Office use section
    page.drawRectangle({ x: 30, y: y - 70, width: width - 60, height: 78, color: LIGHT_GRAY, borderColor: rgb(0.75, 0.75, 0.75), borderWidth: 0.5 });
    page.drawText("FOR OFFICE USE ONLY — DO NOT WRITE BELOW THIS LINE", { x: 38, y: y - 10, size: 7, font: helveticaBold, color: MID_GRAY });
    drawField("Received By", 38, y - 20, 150);
    drawField("Date Received", 200, y - 20, 120);
    drawField("Officer ID", 335, y - 20, 100);
    drawField("Decision", 450, y - 20, 115);
    drawField("Notes", 38, y - 52, 527);

    // Footer
    page.drawRectangle({ x: 0, y: 0, width, height: 28, color: NAVY });
    page.drawText("Ellen Finance | 6th Avenue, Harare, Zimbabwe | +263 78 328 6316 | support@ellenfinance.co.zw", {
      x: 30, y: 10, size: 7, font: helvetica, color: rgb(0.7, 0.7, 0.7),
    });
    page.drawText("Regulated Microfinance Institution", { x: width - 190, y: 10, size: 7, font: helvetica, color: GOLD });

    const pdfBytes = await pdfDoc.save();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=Ellen-Finance-Loan-Application.pdf");
    res.setHeader("Content-Length", pdfBytes.length);
    res.send(Buffer.from(pdfBytes));
  } catch (err) {
    req.log.error({ err }, "PDF generation failed");
    res.status(500).json({ error: "Failed to generate PDF" });
  }
});

export default router;
