"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export interface FieldConfig {
  name: string;
  label: string;
  type: "text" | "number" | "select" | "textarea" | "date" | "password" | "file";
  placeholder?: string;
  options?: { value: string; label: string }[];
  required?: boolean;
}

interface CrudDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  fields: FieldConfig[];
  schema: z.ZodObject<any>;
  defaultValues?: Record<string, any>;
  onSubmit: (data: any) => void | Promise<void>;
  isLoading?: boolean;
}

export function CrudDialog({
  open,
  onOpenChange,
  title,
  fields,
  schema,
  defaultValues,
  onSubmit,
  isLoading,
}: CrudDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: defaultValues ?? {},
  });

  useEffect(() => {
    if (open) {
      reset(defaultValues ?? {});
    }
  }, [open, defaultValues, reset]);

  const handleFormSubmit = async (data: any) => {
    await onSubmit(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl border-[#E5E5E5] bg-[#FAFAFA] backdrop-blur-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-[#0B0909]">{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 mt-2">
          {fields.map((field) => (
            <div key={field.name} className="space-y-1.5">
              <Label htmlFor={field.name} className="text-xs font-bold text-[#0B0909] uppercase tracking-wider">
                {field.label}
              </Label>

              {field.type === "select" ? (
                <select
                  id={field.name}
                  {...register(field.name)}
                  className="w-full rounded-lg border border-[#E5E5E5] bg-white px-3 py-2.5 text-sm text-[#0B0909] outline-none focus:border-[#EF6905] transition-colors"
                >
                  <option value="">Select {field.label}</option>
                  {field.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : field.type === "textarea" ? (
                <textarea
                  id={field.name}
                  {...register(field.name)}
                  placeholder={field.placeholder}
                  rows={3}
                  className="w-full rounded-lg border border-[#E5E5E5] bg-white px-3 py-2.5 text-sm text-[#0B0909] outline-none focus:border-[#EF6905] transition-colors resize-none"
                />
              ) : field.type === "number" ? (
                <Input
                  id={field.name}
                  type="number"
                  step="any"
                  {...register(field.name, { valueAsNumber: true })}
                  placeholder={field.placeholder}
                  className="bg-white border-[#E5E5E5]"
                />
              ) : (
                <Input
                  id={field.name}
                  type={field.type}
                  {...register(field.name)}
                  placeholder={field.placeholder}
                  className="bg-white border-[#E5E5E5]"
                />
              )}

              {errors[field.name] && (
                <p className="text-xs text-[#B0523A]">
                  {(errors[field.name] as any)?.message}
                </p>
              )}
            </div>
          ))}

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-[#E5E5E5] text-[#0B0909]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-[#0B0909] text-white hover:bg-[#0B0909]/90 min-w-[100px]"
            >
              {isLoading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
