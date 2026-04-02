"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { updateTask, addTask, deleteTask } from "@/app/(dashboard)/projects/actions";
import { toast } from "sonner";

interface Task {
  id: string;
  name: string;
  startDate: string | null;
  endDate: string | null;
  progress: number;
  assigneeName: string | null;
  assigneeId: string | null;
  color: string;
  note: string | null;
}

interface Props {
  projectId: string;
  tasks: Task[];
  users: { id: string; name: string }[];
  canEdit: boolean;
  projectStartDate: string;
  projectEndDate: string;
}

const QUICK_PROGRESS = [0, 25, 50, 75, 100];

export function GanttChart({ projectId, tasks, users, canEdit, projectStartDate, projectEndDate }: Props) {
  const [isPending, startTransition] = useTransition();
  const [newTaskName, setNewTaskName] = useState("");

  const start = new Date(projectStartDate);
  const end = new Date(projectEndDate);
  const totalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000));

  const dateLabels: string[] = [];
  const labelDate = new Date(start);
  while (labelDate <= end) {
    dateLabels.push(`${labelDate.getMonth() + 1}/${labelDate.getDate()}`);
    labelDate.setDate(labelDate.getDate() + 7);
  }

  const getBarStyle = (task: Task) => {
    if (!task.startDate || !task.endDate) return { left: "0%", width: "100%" };
    const taskStart = new Date(task.startDate);
    const taskEnd = new Date(task.endDate);
    const leftPercent = Math.max(0, (taskStart.getTime() - start.getTime()) / (end.getTime() - start.getTime()) * 100);
    const widthPercent = Math.max(2, (taskEnd.getTime() - taskStart.getTime()) / (end.getTime() - start.getTime()) * 100);
    return { left: `${leftPercent}%`, width: `${Math.min(widthPercent, 100 - leftPercent)}%` };
  };

  const handleUpdateDate = (taskId: string, field: "startDate" | "endDate", value: string) => {
    startTransition(async () => {
      try {
        await updateTask(taskId, { [field]: value || null });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "更新に失敗しました");
      }
    });
  };

  const handleUpdateProgress = (taskId: string, progress: number) => {
    startTransition(async () => {
      try {
        await updateTask(taskId, { progress: Math.min(100, Math.max(0, progress)) });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "更新に失敗しました");
      }
    });
  };

  const handleAddTask = () => {
    if (!newTaskName.trim()) return;
    startTransition(async () => {
      try {
        await addTask(projectId, newTaskName.trim());
        setNewTaskName("");
        toast.success("タスクを追加しました");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "追加に失敗しました");
      }
    });
  };

  const handleDeleteTask = (taskId: string) => {
    startTransition(async () => {
      try {
        await deleteTask(taskId);
        toast.success("タスクを削除しました");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "削除に失敗しました");
      }
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>ガントチャート</CardTitle>
        {canEdit && (
          <div className="flex gap-2">
            <Input
              value={newTaskName}
              onChange={(e) => setNewTaskName(e.target.value)}
              placeholder="新しいタスク名"
              className="h-8 w-48 text-sm"
              onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
            />
            <Button variant="outline" size="sm" onClick={handleAddTask} disabled={isPending || !newTaskName.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <p className="text-muted-foreground text-sm py-8 text-center">タスクがありません</p>
        ) : (
          <div className="space-y-0">
            {/* Date header */}
            <div className="flex border-b overflow-x-auto">
              <div className="w-44 shrink-0 px-2 py-1 text-xs font-medium text-muted-foreground border-r">タスク</div>
              <div className="w-36 shrink-0 px-1 py-1 text-xs font-medium text-muted-foreground border-r text-center">進捗</div>
              <div className="w-48 shrink-0 px-1 py-1 text-xs font-medium text-muted-foreground border-r text-center">期間</div>
              <div className="flex-1 flex relative min-w-[200px]">
                {dateLabels.map((label, i) => (
                  <div key={i} className="text-[10px] text-muted-foreground absolute top-1" style={{ left: `${(i * 7 / totalDays) * 100}%` }}>
                    {label}
                  </div>
                ))}
              </div>
            </div>

            {/* Task rows */}
            {tasks.map((task) => {
              const barStyle = getBarStyle(task);
              return (
                <div key={task.id} className="flex border-b hover:bg-muted/30 overflow-x-auto">
                  {/* Task name */}
                  <div className="w-44 shrink-0 px-2 py-2 flex items-center gap-1 border-r">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: task.color }} />
                    <span className="text-sm truncate flex-1">{task.name}</span>
                    {canEdit && (
                      <button onClick={() => handleDeleteTask(task.id)} className="text-muted-foreground hover:text-destructive shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>

                  {/* Progress - slider + quick buttons */}
                  <div className="w-36 shrink-0 px-1 py-1 flex flex-col items-center justify-center border-r gap-1">
                    {canEdit ? (
                      <>
                        {/* Slider */}
                        <div className="flex items-center gap-1 w-full px-1">
                          <input
                            type="range"
                            min={0}
                            max={100}
                            step={5}
                            value={task.progress}
                            onChange={(e) => handleUpdateProgress(task.id, parseInt(e.target.value))}
                            className="w-full h-2 accent-current cursor-pointer"
                            style={{ accentColor: task.color }}
                          />
                          <span className="text-xs font-mono w-8 text-right shrink-0">{task.progress}%</span>
                        </div>
                        {/* Quick buttons */}
                        <div className="flex gap-0.5">
                          {QUICK_PROGRESS.map((v) => (
                            <button
                              key={v}
                              onClick={() => handleUpdateProgress(task.id, v)}
                              className={`text-[9px] px-1 py-0 rounded border transition-colors ${
                                task.progress === v
                                  ? "bg-foreground text-background border-foreground"
                                  : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                              }`}
                            >
                              {v}
                            </button>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center gap-1">
                        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${task.progress}%`, backgroundColor: task.color }} />
                        </div>
                        <span className="text-xs font-mono">{task.progress}%</span>
                      </div>
                    )}
                  </div>

                  {/* Date range */}
                  <div className="w-48 shrink-0 px-1 py-2 flex items-center gap-1 border-r">
                    {canEdit ? (
                      <>
                        <input
                          type="date"
                          value={task.startDate ?? ""}
                          onChange={(e) => handleUpdateDate(task.id, "startDate", e.target.value)}
                          className="text-[11px] border rounded px-1 h-7 w-[88px] bg-background"
                        />
                        <span className="text-[10px] text-muted-foreground">〜</span>
                        <input
                          type="date"
                          value={task.endDate ?? ""}
                          onChange={(e) => handleUpdateDate(task.id, "endDate", e.target.value)}
                          className="text-[11px] border rounded px-1 h-7 w-[88px] bg-background"
                        />
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {task.startDate?.slice(5)} 〜 {task.endDate?.slice(5)}
                      </span>
                    )}
                  </div>

                  {/* Gantt bar */}
                  <div className="flex-1 py-2 px-1 relative min-w-[200px]">
                    <div className="h-7 relative w-full bg-gray-100 rounded">
                      <div
                        className="absolute top-0 h-full rounded opacity-25"
                        style={{ ...barStyle, backgroundColor: task.color }}
                      />
                      <div
                        className="absolute top-0 h-full rounded transition-all duration-300"
                        style={{
                          left: barStyle.left,
                          width: `calc(${barStyle.width} * ${task.progress / 100})`,
                          backgroundColor: task.color,
                        }}
                      />
                      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-foreground/70">
                        {task.progress > 0 && `${task.progress}%`}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
