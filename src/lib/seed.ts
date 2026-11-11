import type { HealthRecord } from "@/types";

/**
 * Clearly fictional sample data. No real personal health information.
 * Names, dates and values are invented for demonstration only.
 */
export const SAMPLE_RECORDS: HealthRecord[] = [
  {
    id: "sample-discharge-001",
    title: "Hospital Discharge Summary — Alex Morgan (SAMPLE)",
    type: "Discharge Summary",
    createdAt: "2026-11-02T09:00:00.000Z",
    isSample: true,
    content: `DISCHARGE SUMMARY — SAMPLE DATA (fictional patient)

Patient: Alex Morgan (fictional)
Date of admission: October 28, 2026
Date of discharge: November 2, 2026
Attending physician: Dr. Priya Sharma

Diagnosis: Community-acquired pneumonia
Secondary diagnosis: Mild dehydration

Hospital course:
The patient was admitted with fever, cough, and shortness of breath.
Chest X-ray showed a right lower lobe infiltrate. The patient was treated
with antibiotics and intravenous fluids and improved steadily over five days.
Oxygen saturation improved to 97% on room air before discharge.

Discharge medications:
- Amoxicillin 500 mg three times daily for 7 days
- Albuterol inhaler 90 mcg as needed for wheezing

Follow-up instructions:
- Follow up with your primary care physician, Dr. Priya Sharma, in 7 days, on November 9, 2026.
- Return to the emergency department if fever returns, breathing worsens, or chest pain develops.
- Drink plenty of fluids and rest for one week.
- Repeat chest X-ray in 4 weeks if cough persists.

Discharge condition: Stable. The patient was discharged home in good condition.`,
  },
  {
    id: "sample-lab-001",
    title: "Lab Report — Blood Work, November 5, 2026 (SAMPLE)",
    type: "Lab Report",
    createdAt: "2026-11-05T14:30:00.000Z",
    isSample: true,
    content: `LABORATORY REPORT — SAMPLE DATA (fictional patient)

Patient: Alex Morgan (fictional)
Collected: November 5, 2026
Ordering physician: Dr. Priya Sharma
Lab: Riverside Sample Laboratory

Complete Blood Count:
Hemoglobin: 11.8 g/dL (Reference: 12.0-15.5 g/dL)
White Blood Cell Count (WBC): 11.2 x10^9/L (Reference: 4.5-11.0 x10^9/L)
Platelets: 245 x10^9/L (Reference: 150-400 x10^9/L)

Metabolic Panel:
Glucose: 142 mg/dL (Reference: 70-99 mg/dL)
Potassium: 4.2 mmol/L (Reference: 3.5-5.1 mmol/L)
Sodium: 139 mmol/L (Reference: 136-145 mmol/L)

Lipid Panel:
Total Cholesterol: 185 mg/dL (Desirable: less than 200 mg/dL)
LDL Cholesterol: 110 mg/dL (Reference: 0-100 mg/dL)

Notes:
Hemoglobin is slightly below the reference range. White blood cell count
and glucose are above the reference range, which may reflect the recent
infection. Please discuss these results with Dr. Priya Sharma at your
follow-up appointment on November 9, 2026.`,
  },
  {
    id: "sample-insurance-001",
    title: "Insurance Letter — Prior Authorization Approved (SAMPLE)",
    type: "Insurance Letter",
    createdAt: "2026-11-06T10:00:00.000Z",
    isSample: true,
    content: `INSURANCE LETTER — SAMPLE DATA (fictional)

From: Northstar Health Plan — Sample Insurance
To: Alex Morgan (fictional member)
Date: November 6, 2026
Reference number: NS-2026-88412

Re: Prior authorization request for Amoxicillin 500 mg

Dear Member,

We are pleased to inform you that your prior authorization request for
Amoxicillin 500 mg has been approved. Coverage is effective from
November 6, 2026 through December 6, 2026.

Your copay for this medication is $10 per fill at an in-network pharmacy.
This approval covers up to a 7-day supply.

If you disagree with any part of this decision, you may file an appeal
by December 15, 2026. To appeal, call Member Services at (800) 555-0142
or write to Northstar Health Plan, Appeals Department, PO Box 100, Chicago, IL.

Please bring this letter and your member ID card to the pharmacy.
Thank you for choosing Northstar Health Plan.`,
  },
];
