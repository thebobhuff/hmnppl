/**
 * Utility to generate unique reference numbers for incidents.
 *
 * Format: INC-YYYY-NNNN (e.g., INC-2026-0001)
 * Unique per company per year.
 */
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Generates the next reference number for a company.
 *
 * Queries the database for the highest existing number in the current year
 * and increments it.
 */
export async function generateReferenceNumber(companyId: string): Promise<string> {
  const year = new Date().getFullYear();
  const supabase = createAdminClient();

  // Get the highest sequence number for this company and year
  const { data, error } = await supabase
    .from("incidents")
    .select("reference_number")
    .eq("company_id", companyId)
    .like("reference_number", `INC-${year}-%`);

  if (error) {
    throw new Error(`Failed to generate reference number: ${error.message}`);
  }

  // Extract the highest sequence number
  let maxSeq = 0;
  if (data && data.length > 0) {
    for (const incident of data) {
      const parts = incident.reference_number.split("-");
      const seq = parseInt(parts[2], 10);
      if (seq > maxSeq) {
        maxSeq = seq;
      }
    }
  }

  const nextSeq = maxSeq + 1;
  return `INC-${year}-${String(nextSeq).padStart(4, "0")}`;
}
