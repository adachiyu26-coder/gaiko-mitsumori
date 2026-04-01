"use client";

import { useState, useTransition } from "react";
import { FolderOpen, FileText, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface TemplateSummary {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  isShared: boolean;
  _count: { items: number };
}

interface Props {
  templates: TemplateSummary[];
  onApply: (templateId: string) => Promise<void>;
}

interface TemplateGroup {
  label: string;
  templates: TemplateSummary[];
}

function groupTemplates(templates: TemplateSummary[]): TemplateGroup[] {
  const system = templates.filter((t) => t.isSystem);
  const shared = templates.filter((t) => t.isShared && !t.isSystem);
  const personal = templates.filter((t) => !t.isSystem && !t.isShared);

  return [
    { label: "システムテンプレート", templates: system },
    { label: "共有テンプレート", templates: shared },
    { label: "個人テンプレート", templates: personal },
  ].filter((group) => group.templates.length > 0);
}

export function TemplatePicker({ templates, onApply }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [applyingId, setApplyingId] = useState<string | null>(null);

  const groups = groupTemplates(templates);

  function handleApply(templateId: string) {
    setApplyingId(templateId);
    startTransition(async () => {
      try {
        await onApply(templateId);
        setOpen(false);
      } finally {
        setApplyingId(null);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline">
            <FolderOpen className="mr-2 size-4" />
            テンプレートから作成
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>テンプレートを選択</DialogTitle>
        </DialogHeader>

        {templates.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            テンプレートがありません
          </div>
        ) : (
          <div className="max-h-[60vh] space-y-4 overflow-y-auto">
            {groups.map((group) => (
              <div key={group.label} className="space-y-2">
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {group.label}
                </h3>
                <div className="space-y-1">
                  {group.templates.map((template) => {
                    const isLoading =
                      isPending && applyingId === template.id;

                    return (
                      <button
                        key={template.id}
                        type="button"
                        disabled={isPending}
                        onClick={() => handleApply(template.id)}
                        className="flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/50 disabled:pointer-events-none disabled:opacity-50"
                      >
                        <FileText className="size-5 shrink-0 text-muted-foreground" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="truncate font-medium text-sm">
                              {template.name}
                            </span>
                            <Badge variant="secondary" className="shrink-0">
                              {template._count.items}件
                            </Badge>
                          </div>
                          {template.description && (
                            <p className="mt-0.5 truncate text-xs text-muted-foreground">
                              {template.description}
                            </p>
                          )}
                        </div>
                        {isLoading ? (
                          <span className="size-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        ) : (
                          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
