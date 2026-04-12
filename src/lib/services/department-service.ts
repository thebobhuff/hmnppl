/**
 * Department service — list departments for the authenticated company.
 */

import { createAdminClient } from "@/lib/supabase/admin";

export interface DepartmentResponse {
  id: string;
  company_id: string;
  name: string;
  head_id: string | null;
  employee_count?: number;
  head?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  created_at: string;
  updated_at: string;
}

export async function listDepartments(companyId: string): Promise<DepartmentResponse[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("departments")
    .select("*, head:users!fk_departments_head(id, first_name, last_name, email)")
    .eq("company_id", companyId)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to list departments: ${error.message}`);
  }

  const departments = (data ?? []) as Array<
    DepartmentResponse & { head?: DepartmentResponse["head"] }
  >;

  const { data: counts, error: countError } = await supabase
    .from("users")
    .select("department_id")
    .eq("company_id", companyId)
    .not("department_id", "is", null);

  if (countError) {
    throw new Error(`Failed to count department employees: ${countError.message}`);
  }

  const countMap = new Map<string, number>();
  for (const row of counts ?? []) {
    const departmentId = row.department_id as string | null;
    if (!departmentId) continue;
    countMap.set(departmentId, (countMap.get(departmentId) ?? 0) + 1);
  }

  return departments.map((department) => ({
    ...department,
    employee_count: countMap.get(department.id) ?? 0,
    head: department.head ?? null,
  }));
}

export async function createDepartment(
  companyId: string,
  name: string,
  headId?: string | null,
): Promise<DepartmentResponse> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("departments")
    .insert({ company_id: companyId, name, head_id: headId ?? null })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create department: ${error.message}`);
  }

  return data as DepartmentResponse;
}

export async function updateDepartment(
  companyId: string,
  departmentId: string,
  name: string,
  headId?: string | null,
): Promise<DepartmentResponse> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("departments")
    .update({ name, head_id: headId ?? null })
    .eq("id", departmentId)
    .eq("company_id", companyId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update department: ${error.message}`);
  }

  return data as DepartmentResponse;
}

export async function deleteDepartment(
  companyId: string,
  departmentId: string,
  reassignToDepartmentId?: string | null,
): Promise<void> {
  const supabase = createAdminClient();

  const { data: members, error: membersError } = await supabase
    .from("users")
    .select("id")
    .eq("company_id", companyId)
    .eq("department_id", departmentId);

  if (membersError) {
    throw new Error(`Failed to inspect department members: ${membersError.message}`);
  }

  if ((members?.length ?? 0) > 0 && !reassignToDepartmentId) {
    throw new Error(
      "Department has employees and requires reassignment before deletion.",
    );
  }

  if ((members?.length ?? 0) > 0 && reassignToDepartmentId) {
    const { error: reassignError } = await supabase
      .from("users")
      .update({ department_id: reassignToDepartmentId })
      .eq("company_id", companyId)
      .eq("department_id", departmentId);

    if (reassignError) {
      throw new Error(
        `Failed to reassign department employees: ${reassignError.message}`,
      );
    }
  }

  const { error } = await supabase
    .from("departments")
    .delete()
    .eq("id", departmentId)
    .eq("company_id", companyId);

  if (error) {
    throw new Error(`Failed to delete department: ${error.message}`);
  }
}
