"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../../components/ui/table";
import { deleteUser, disableUser, revokeDevice, type UserDetail } from "../../actions";
import { ConfirmDialog } from "./ConfirmDialog";

export function UserDetailActions({ detail }: { detail: UserDetail }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmDisable, setConfirmDisable] = useState(false);

  function onRevoke(deviceId: number) {
    start(async () => {
      const result = await revokeDevice(deviceId);
      if (result.ok) {
        toast.success("Device revoked");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function onDisable() {
    start(async () => {
      const result = await disableUser(detail.user.id);
      if (result.ok) toast.success("User disabled in Firebase");
      else toast.error(result.error);
      setConfirmDisable(false);
    });
  }

  function onDelete() {
    start(async () => {
      const result = await deleteUser(detail.user.id);
      if (result.ok) {
        toast.success("User deleted");
        router.replace("/admin/users");
      } else {
        toast.error(result.error);
      }
      setConfirmDelete(false);
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>{detail.user.name}</CardTitle>
              <CardDescription>{detail.user.email}</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" disabled={pending} onClick={() => setConfirmDisable(true)}>
                Disable
              </Button>
              <Button
                variant="destructive"
                disabled={pending}
                onClick={() => setConfirmDelete(true)}
              >
                Delete
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <Field label="Internal ID" value={detail.user.id} />
          <Field label="Provider" value={detail.user.provider ?? "—"} />
          <Field label="Firebase UID" value={detail.user.firebaseUid ?? "—"} mono />
          <Field label="Created" value={detail.user.createdAt.toLocaleString()} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Devices</CardTitle>
          <CardDescription>{detail.devices.length} registered for push.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>FCM Token</TableHead>
                <TableHead>Device</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {detail.devices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-6 text-center text-sm text-muted-foreground">
                    No devices.
                  </TableCell>
                </TableRow>
              ) : (
                detail.devices.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-mono text-xs">
                      {d.fcmToken.slice(0, 12)}…{d.fcmToken.slice(-6)}
                    </TableCell>
                    <TableCell>
                      {d.deviceInfo ? (
                        <Badge variant="secondary">{d.deviceInfo}</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {d.createdAt.toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="icon"
                        variant="ghost"
                        disabled={pending}
                        onClick={() => onRevoke(d.id)}
                        aria-label="Revoke device"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmDisable}
        onOpenChange={setConfirmDisable}
        title="Disable user?"
        description="This sets disabled=true on the Firebase Auth user. They can no longer sign in until re-enabled."
        confirmLabel="Disable"
        onConfirm={onDisable}
        pending={pending}
      />
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete user?"
        description="Removes the Firebase Auth user and the local row, cascading their devices. This cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={onDelete}
        pending={pending}
      />
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string | number; mono?: boolean }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={mono ? "font-mono text-xs" : ""}>{value}</div>
    </div>
  );
}
