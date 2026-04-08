/**
 * Employees — HR management screen for adding and managing employees.
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { usePageBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
} from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import {
  Search,
  Users,
  Mail,
  Building,
  MoreVertical,
  Filter,
  Plus,
  UserPlus,
  Loader2,
} from "lucide-react";
import {
  usersAPI,
  departmentsAPI,
  type UserResponse,
  type DepartmentResponse,
} from "@/lib/api/client";

interface EmployeeRow {
  id: string;
  name: string;
  email: string;
  role: string;
  department_id: string | null;
  manager_id?: string | null;
  status: string;
  hire_date: string;
}

const ROLE_OPTIONS = [
  { value: "employee", label: "Employee" },
  { value: "manager", label: "Manager" },
  { value: "hr_agent", label: "HR Agent" },
];

function toEmployeeRow(user: UserResponse): EmployeeRow {
  return {
    id: user.id,
    name: `${user.first_name} ${user.last_name}`,
    email: user.email,
    role: user.job_title || user.role,
    department_id: user.department_id,
    manager_id: user.manager_id,
    status: user.status,
    hire_date: user.hire_date || "",
  };
}

export default function EmployeesPage() {
  usePageBreadcrumbs([{ label: "Home", href: "/dashboard" }, { label: "Employees" }]);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [departments, setDepartments] = useState<DepartmentResponse[]>([]);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeRow | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "employee",
    department_id: "",
    manager_id: "",
  });

  useEffect(() => {
    async function loadEmployees() {
      try {
        const [usersData, departmentsData] = await Promise.all([
          usersAPI.list({ limit: 100 }),
          departmentsAPI.list(),
        ]);
        setEmployees(usersData.users.map(toEmployeeRow));
        setDepartments(departmentsData.departments);
      } catch {
        setEmployees([]);
        setDepartments([]);
      } finally {
        setLoading(false);
      }
    }

    loadEmployees();
  }, []);

  const departmentNameById = useMemo(
    () => new Map(departments.map((dept) => [dept.id, dept.name])),
    [departments],
  );

  const filteredEmployees = useMemo(
    () =>
      employees.filter(
        (e) =>
          e.name.toLowerCase().includes(search.toLowerCase()) ||
          e.email.toLowerCase().includes(search.toLowerCase()) ||
          (departmentNameById.get(e.department_id ?? "") || "")
            .toLowerCase()
            .includes(search.toLowerCase()) ||
          e.role.toLowerCase().includes(search.toLowerCase()),
      ),
    [employees, search, departmentNameById],
  );

  const stats = useMemo(
    () => ({
      total: employees.length,
      active: employees.filter((e) => e.status === "active").length,
      departments: new Set(employees.map((e) => e.department_id || "Unassigned")).size,
      managers: employees.filter((e) => e.role.toLowerCase().includes("manager")).length,
    }),
    [employees],
  );

  const departmentOptions = departments.map((department) => ({
    value: department.id,
    label: department.name,
  }));

  const handleInvite = async () => {
    setInviteLoading(true);
    try {
      const invited = await usersAPI.invite({
        email: inviteForm.email,
        role: inviteForm.role,
        department_id: inviteForm.department_id || undefined,
        manager_id: inviteForm.manager_id || undefined,
      });

      const created: EmployeeRow = {
        id: invited.user.id,
        name:
          `${inviteForm.firstName} ${inviteForm.lastName}`.trim() || invited.user.email,
        email: invited.user.email,
        role: inviteForm.role,
        department_id: inviteForm.department_id || null,
        manager_id: inviteForm.manager_id || null,
        status: invited.user.status,
        hire_date: invited.user.hire_date || new Date().toISOString().split("T")[0],
      };

      setEmployees((prev) => [created, ...prev]);
      setInviteOpen(false);
      setInviteForm({
        firstName: "",
        lastName: "",
        email: "",
        role: "employee",
        department_id: "",
        manager_id: "",
      });
    } finally {
      setInviteLoading(false);
    }
  };

  const openEdit = (employee: EmployeeRow) => {
    setSelectedEmployee(employee);
    setEditOpen(true);
  };

  const handleEditSave = async () => {
    if (!selectedEmployee) return;

    setEditLoading(true);
    try {
      const [first_name, ...rest] = selectedEmployee.name.trim().split(/\s+/);
      const last_name = rest.join(" ");

      const updated = await usersAPI.update(selectedEmployee.id, {
        department_id: selectedEmployee.department_id,
        manager_id: selectedEmployee.manager_id || null,
        status: selectedEmployee.status,
        role: selectedEmployee.role,
      });

      setEmployees((prev) =>
        prev.map((employee) =>
          employee.id === selectedEmployee.id
            ? {
                ...employee,
                name: `${updated.user.first_name || first_name} ${updated.user.last_name || last_name}`.trim(),
                email: updated.user.email,
                role: updated.user.job_title || updated.user.role,
                department_id: updated.user.department_id,
                status: updated.user.status,
                manager_id: updated.user.manager_id,
              }
            : employee,
        ),
      );
      setEditOpen(false);
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <PageContainer
      title="Employees"
      description="View, invite, and manage your employee roster."
    >
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
            <Input
              placeholder="Search by name, email, role, or department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
            <Button onClick={() => setInviteOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Employee
            </Button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-4">
          <Card className="p-4">
            <p className="text-sm text-text-tertiary">Total Employees</p>
            <p className="text-2xl font-semibold text-text-primary">{stats.total}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-text-tertiary">Active</p>
            <p className="text-2xl font-semibold text-brand-success">{stats.active}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-text-tertiary">Departments</p>
            <p className="text-2xl font-semibold text-text-primary">
              {stats.departments}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-text-tertiary">Managers</p>
            <p className="text-2xl font-semibold text-text-primary">{stats.managers}</p>
          </Card>
        </div>

        {loading && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-40 animate-pulse rounded-lg bg-brand-slate-light"
              />
            ))}
          </div>
        )}

        {!loading && filteredEmployees.length === 0 && (
          <EmptyState
            icon={<Users className="h-8 w-8" />}
            title="No employees found"
            description="Try adjusting your search or add a new employee."
            actionLabel="Add Employee"
            onAction={() => setInviteOpen(true)}
          />
        )}

        {!loading && filteredEmployees.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredEmployees.map((employee) => (
              <Card key={employee.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-slate-light">
                      <span className="text-sm font-medium text-text-primary">
                        {employee.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-text-primary">{employee.name}</p>
                      <p className="text-xs text-text-tertiary">{employee.role}</p>
                    </div>
                  </div>
                  <button
                    className="text-text-tertiary hover:text-text-primary"
                    onClick={() => openEdit(employee)}
                    title="Edit employee"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-3 space-y-1 text-xs text-text-tertiary">
                  <div className="flex items-center gap-2">
                    <Mail className="h-3 w-3" />
                    {employee.email}
                  </div>
                  <div className="flex items-center gap-2">
                    <Building className="h-3 w-3" />
                    {departmentNameById.get(employee.department_id ?? "") || "Unassigned"}
                  </div>
                </div>

                <div className="mt-3 flex gap-2">
                  <Badge variant={employee.status === "active" ? "success" : "default"}>
                    {employee.status}
                  </Badge>
                  {employee.manager_id && (
                    <Badge variant="outline">Reports to manager</Badge>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal open={inviteOpen} onOpenChange={setInviteOpen}>
        <ModalContent size="lg">
          <ModalHeader>
            <ModalTitle>Add Employee</ModalTitle>
            <ModalDescription>
              Invite a new employee and assign their role and department.
            </ModalDescription>
          </ModalHeader>

          <div className="grid gap-4 py-2 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-text-primary">
                First Name
              </label>
              <Input
                value={inviteForm.firstName}
                onChange={(e) =>
                  setInviteForm((prev) => ({ ...prev, firstName: e.target.value }))
                }
                placeholder="First name"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-text-primary">
                Last Name
              </label>
              <Input
                value={inviteForm.lastName}
                onChange={(e) =>
                  setInviteForm((prev) => ({ ...prev, lastName: e.target.value }))
                }
                placeholder="Last name"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-text-primary">
                Email
              </label>
              <Input
                type="email"
                value={inviteForm.email}
                onChange={(e) =>
                  setInviteForm((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="employee@company.com"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-text-primary">
                Role
              </label>
              <Select
                options={ROLE_OPTIONS}
                value={inviteForm.role}
                onValueChange={(value) =>
                  setInviteForm((prev) => ({ ...prev, role: value }))
                }
                placeholder="Select role"
                searchable
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-text-primary">
                Department
              </label>
              <Select
                options={departmentOptions}
                value={inviteForm.department_id}
                onValueChange={(value) =>
                  setInviteForm((prev) => ({ ...prev, department_id: value }))
                }
                placeholder="Select department"
                searchable
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-text-primary">
                Manager ID
              </label>
              <Input
                value={inviteForm.manager_id}
                onChange={(e) =>
                  setInviteForm((prev) => ({ ...prev, manager_id: e.target.value }))
                }
                placeholder="Optional manager UUID"
              />
            </div>
          </div>

          <ModalFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleInvite} disabled={inviteLoading || !inviteForm.email}>
              {inviteLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="mr-2 h-4 w-4" />
              )}
              Add Employee
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal open={editOpen} onOpenChange={setEditOpen}>
        <ModalContent size="lg">
          <ModalHeader>
            <ModalTitle>Edit Employee</ModalTitle>
            <ModalDescription>
              Update the employee's role, department, or manager assignment.
            </ModalDescription>
          </ModalHeader>

          {selectedEmployee && (
            <div className="grid gap-4 py-2 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">
                  Name
                </label>
                <Input
                  value={selectedEmployee.name}
                  onChange={(e) =>
                    setSelectedEmployee((prev) =>
                      prev ? { ...prev, name: e.target.value } : prev,
                    )
                  }
                  placeholder="Employee name"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">
                  Email
                </label>
                <Input
                  value={selectedEmployee.email}
                  onChange={(e) =>
                    setSelectedEmployee((prev) =>
                      prev ? { ...prev, email: e.target.value } : prev,
                    )
                  }
                  placeholder="employee@company.com"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">
                  Role
                </label>
                <Select
                  options={ROLE_OPTIONS}
                  value={selectedEmployee.role}
                  onValueChange={(value) =>
                    setSelectedEmployee((prev) =>
                      prev ? { ...prev, role: value } : prev,
                    )
                  }
                  placeholder="Select role"
                  searchable
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">
                  Department
                </label>
                <Select
                  options={departmentOptions}
                  value={selectedEmployee.department_id || ""}
                  onValueChange={(value) =>
                    setSelectedEmployee((prev) =>
                      prev ? { ...prev, department_id: value || null } : prev,
                    )
                  }
                  placeholder="Select department"
                  searchable
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">
                  Status
                </label>
                <Select
                  options={[
                    { value: "active", label: "Active" },
                    { value: "inactive", label: "Inactive" },
                    { value: "invited", label: "Invited" },
                  ]}
                  value={selectedEmployee.status}
                  onValueChange={(value) =>
                    setSelectedEmployee((prev) =>
                      prev ? { ...prev, status: value } : prev,
                    )
                  }
                  placeholder="Select status"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">
                  Manager ID
                </label>
                <Input
                  value={selectedEmployee.manager_id || ""}
                  onChange={(e) =>
                    setSelectedEmployee((prev) =>
                      prev ? { ...prev, manager_id: e.target.value || null } : prev,
                    )
                  }
                  placeholder="Optional manager UUID"
                />
              </div>
            </div>
          )}

          <ModalFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditSave} disabled={editLoading || !selectedEmployee}>
              {editLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="mr-2 h-4 w-4" />
              )}
              Save Changes
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </PageContainer>
  );
}
