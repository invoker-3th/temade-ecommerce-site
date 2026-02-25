"use client";

import { useAuth } from "@/app/context/AuthContext";

export default function RolesPage() {
  const { user } = useAuth();

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Roles</h2>
      <p className="text-sm text-gray-600">
        The detailed roles management UI is temporarily disabled while build issues are being fixed.
      </p>
      <p className="mt-2 text-xs text-gray-500">
        You can still manage team members and permissions from other admin sections; this page will be restored later.
      </p>
      {user?.email && (
        <p className="mt-4 text-xs text-gray-500">
          Signed in as <span className="font-semibold">{user.email}</span>.
        </p>
      )}
    </div>
  );
}
