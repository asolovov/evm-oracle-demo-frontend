"use client";

import { getFormProps, getInputProps, getTextareaProps, useForm } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod/v4";
import { useAction } from "next-safe-action/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { submitContact } from "../_actions/submit-contact";
import { contactSchema } from "../_schemas/contact";

export function ContactForm() {
  const { execute, result, isPending, hasSucceeded } = useAction(submitContact);

  const [form, fields] = useForm({
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: contactSchema, async: false });
    },
    onSubmit(event, { formData }) {
      event.preventDefault();
      const submission = parseWithZod(formData, { schema: contactSchema, async: false });
      if (submission.status === "success") {
        execute(submission.value);
      }
    },
    shouldValidate: "onBlur",
    shouldRevalidate: "onInput",
  });

  if (hasSucceeded && result.data) {
    return (
      <div
        role="status"
        className="rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-200"
      >
        Thanks, {result.data.name} — your message is saved (id {result.data.id}).
      </div>
    );
  }

  return (
    <form {...getFormProps(form)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={fields.name.id}>Name</Label>
        <Input {...getInputProps(fields.name, { type: "text" })} />
        {fields.name.errors ? (
          <p id={fields.name.errorId} className="text-sm text-destructive">
            {fields.name.errors[0]}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor={fields.email.id}>Email</Label>
        <Input {...getInputProps(fields.email, { type: "email" })} />
        {fields.email.errors ? (
          <p id={fields.email.errorId} className="text-sm text-destructive">
            {fields.email.errors[0]}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor={fields.message.id}>Message</Label>
        <textarea
          {...getTextareaProps(fields.message)}
          rows={5}
          className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        />
        {fields.message.errors ? (
          <p id={fields.message.errorId} className="text-sm text-destructive">
            {fields.message.errors[0]}
          </p>
        ) : null}
      </div>

      {result.serverError ? <p className="text-sm text-destructive">{result.serverError}</p> : null}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Sending…" : "Send"}
      </Button>
    </form>
  );
}
