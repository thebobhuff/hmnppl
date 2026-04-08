/**
 * Departments — Company admin management screen.
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { usePageBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { Card } from "@/components/ui/card";
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
  departmentsAPI,
  usersAPI,
  type DepartmentResponse,
  type UserResponse,
} from "@/lib/api/client";
import { Building2, Plus, Search, Pencil, Trash2, Loader2 } from "lucide-react";

export default function DepartmentsPage() {
  usePageBreadcrumbs([{ label: "Home", href: "/dashboard" }, { label: "Departments" }]);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [departments, setDepartments] = useState<DepartmentResponse[]>([]);
  const [employees, setEmployees] = useState<UserResponse[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftHeadId, setDraftHeadId] = useState("");
  const [reassignDepartmentId, setReassignDepartmentId] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<DepartmentResponse | null>(
    null,
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [departmentData, userData] = await Promise.all([
          departmentsAPI.list(),
          usersAPI.list({ limit: 100 }),
        ]);
        setDepartments(departmentData.departments);
        setEmployees(userData.users);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const filteredDepartments = useMemo(
    () =>
      departments.filter((department) =>
        department.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [departments, search],
  );

  const headOptions = useMemo(
    () =>
      employees.map((employee) => ({
        value: employee.id,
        label: `${employee.first_name} ${employee.last_name}`.trim() || employee.email,
      })),
    [employees],
  );

  const reassignOptions = useMemo(
    () =>
      departments
        .filter((department) => department.id !== selectedDepartment?.id)
        .map((department) => ({ value: department.id, label: department.name })),
    [departments, selectedDepartment],
  );

  const handleCreate = async () => {
    setSaving(true);
    try {
      const result = await departmentsAPI.create({
        name: draftName.trim(),
        head_id: draftHeadId || null,
      });
      setDepartments((prev) =>
        [...prev, result.department].sort((a, b) => a.name.localeCompare(b.name)),
      );
      setDraftName("");
      setDraftHeadId("");
      setCreateOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedDepartment) return;
    setSaving(true);
    try {
      const result = await departmentsAPI.update(selectedDepartment.id, {
        name: draftName.trim(),
        head_id: draftHeadId || null,
      });
      setDepartments((prev) =>
        prev
          .map((department) =>
            department.id === selectedDepartment.id ? result.department : department,
          )
          .sort((a, b) => a.name.localeCompare(b.name)),
      );
      setEditOpen(false);
      setSelectedDepartment(null);
      setDraftName("");
      setDraftHeadId("");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedDepartment) return;
    setSaving(true);
    try {
      await departmentsAPI.delete(selectedDepartment.id, {
        reassign_to_department_id:
          selectedDepartment.employee_count && selectedDepartment.employee_count > 0
            ? reassignDepartmentId || null
            : null,
      });

      setDepartments((prev) =>
        prev.filter((department) => department.id !== selectedDepartment.id),
      );
      setDeleteOpen(false);
      setSelectedDepartment(null);
      setReassignDepartmentId("");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageContainer
      title="Departments"
      description="Create and manage company departments."
    >
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search departments..."
              className="pl-9"
            />
          </div>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Department
          </Button>
        </div>

        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-36 animate-pulse rounded-lg bg-brand-slate-light"
              />
            ))}
          </div>
        ) : filteredDepartments.length === 0 ? (
          <EmptyState
            icon={<Building2 className="h-8 w-8" />}
            title="No departments found"
            description="Create your first department to organize employees."
            actionLabel="Add Department"
            onAction={() => setCreateOpen(true)}
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredDepartments.map((department) => (
              <Card key={department.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-text-primary">{department.name}</p>
                    <p className="mt-1 text-xs text-text-tertiary">
                      Head:{" "}
                      {department.head
                        ? `${department.head.first_name} ${department.head.last_name}`.trim()
                        : "Unassigned"}
                    </p>
                    <p className="mt-1 text-xs text-text-tertiary">
                      Employees: {department.employee_count ?? 0}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedDepartment(department);
                        setDraftName(department.name);
                        setDraftHeadId(department.head_id || "");
                        setEditOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedDepartment(department);
                        setReassignDepartmentId("");
                        setDeleteOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal open={createOpen} onOpenChange={setCreateOpen}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Add Department</ModalTitle>
            <ModalDescription>Create a new department for your company.</ModalDescription>
          </ModalHeader>
          <div className="space-y-4">
            <Input
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              placeholder="Department name"
            />
            <Select
              options={headOptions}
              value={draftHeadId}
              onValueChange={setDraftHeadId}
              placeholder="Select department head"
              searchable
            />
          </div>
          <ModalFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={saving || draftName.trim().length < 2}
            >
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Create Department
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal open={editOpen} onOpenChange={setEditOpen}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Edit Department</ModalTitle>
            <ModalDescription>
              Rename the selected department and assign a head.
            </ModalDescription>
          </ModalHeader>
          <div className="space-y-4">
            <Input
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              placeholder="Department name"
            />
            <Select
              options={headOptions}
              value={draftHeadId}
              onValueChange={setDraftHeadId}
              placeholder="Select department head"
              searchable
            />
          </div>
          <ModalFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={saving || draftName.trim().length < 2}
            >
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Pencil className="mr-2 h-4 w-4" />
              )}
              Save Changes
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal open={deleteOpen} onOpenChange={setDeleteOpen}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Delete Department</ModalTitle>
            <ModalDescription>
              Delete <strong>{selectedDepartment?.name}</strong>?
            </ModalDescription>
          </ModalHeader>

          {selectedDepartment && (selectedDepartment.employee_count ?? 0) > 0 && (
            <div className="space-y-3">
              <div className="rounded-lg border border-brand-warning/30 bg-brand-warning/10 p-3 text-sm text-text-secondary">
                This department still has {selectedDepartment.employee_count} employees.
                Reassign them before deletion.
              </div>
              <Select
                options={reassignOptions}
                value={reassignDepartmentId}
                onValueChange={setReassignDepartmentId}
                placeholder="Reassign employees to..."
                searchable
              />
            </div>
          )}

          <ModalFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={
                saving ||
                ((selectedDepartment?.employee_count ?? 0) > 0 && !reassignDepartmentId)
              }
            >
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Delete Department
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </PageContainer>
  );
}
