"use client";

import { useTransition } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateUserRole, deactivateUser, activateUser } from "./actions";
import { toast } from "sonner";

const roleLabels: Record<string, string> = {
  owner: "オーナー",
  manager: "マネージャー",
  staff: "スタッフ",
  viewer: "閲覧者",
};

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
}

interface Props {
  users: User[];
  currentUserId: string;
  isOwner: boolean;
}

function UserRow({
  user,
  currentUserId,
  isOwner,
}: {
  user: User;
  currentUserId: string;
  isOwner: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const isSelf = user.id === currentUserId;

  const handleRoleChange = (role: string) => {
    startTransition(async () => {
      try {
        await updateUserRole(user.id, role);
        toast.success("ロールを更新しました");
      } catch {
        toast.error("更新に失敗しました");
      }
    });
  };

  const handleToggleActive = () => {
    startTransition(async () => {
      try {
        if (user.isActive) {
          await deactivateUser(user.id);
          toast.success("ユーザーを無効にしました");
        } else {
          await activateUser(user.id);
          toast.success("ユーザーを有効にしました");
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "更新に失敗しました");
      }
    });
  };

  return (
    <TableRow className={!user.isActive ? "opacity-50" : ""}>
      <TableCell>
        <div>
          <p className="font-medium">{user.name}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </div>
      </TableCell>
      <TableCell>
        {isOwner && !isSelf ? (
          <Select value={user.role} onValueChange={(v) => v && handleRoleChange(v)} disabled={isPending}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="owner">オーナー</SelectItem>
              <SelectItem value="manager">マネージャー</SelectItem>
              <SelectItem value="staff">スタッフ</SelectItem>
              <SelectItem value="viewer">閲覧者</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <Badge variant="outline">{roleLabels[user.role] ?? user.role}</Badge>
        )}
      </TableCell>
      <TableCell>
        <Badge variant={user.isActive ? "default" : "secondary"}>
          {user.isActive ? "有効" : "無効"}
        </Badge>
      </TableCell>
      <TableCell>
        {isSelf ? (
          <span className="text-xs text-muted-foreground">（自分）</span>
        ) : isOwner ? (
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleActive}
            disabled={isPending}
          >
            {user.isActive ? "無効にする" : "有効にする"}
          </Button>
        ) : null}
      </TableCell>
    </TableRow>
  );
}

export function UserManagement({ users, currentUserId, isOwner }: Props) {
  return (
    <div className="space-y-4">
      {!isOwner && (
        <p className="text-sm text-muted-foreground">
          ※ ユーザー管理はオーナーのみ操作できます
        </p>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ユーザー</TableHead>
            <TableHead>ロール</TableHead>
            <TableHead>状態</TableHead>
            <TableHead>操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <UserRow
              key={user.id}
              user={user}
              currentUserId={currentUserId}
              isOwner={isOwner}
            />
          ))}
        </TableBody>
      </Table>
      <div className="text-xs text-muted-foreground">
        <p>ロール権限:</p>
        <ul className="list-disc ml-4 mt-1 space-y-0.5">
          <li>オーナー: 全機能 + 設定管理・ユーザー管理</li>
          <li>マネージャー: 見積作成・削除・原価閲覧・単価マスタ編集</li>
          <li>スタッフ: 見積作成・編集（削除不可）</li>
          <li>閲覧者: 閲覧のみ（原価非表示）</li>
        </ul>
      </div>
    </div>
  );
}
