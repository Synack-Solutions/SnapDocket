"use client";

import { useRouter } from "next/navigation";
import { useForm } from "@refinedev/react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const SELECT_CLASS =
  "h-10 w-full rounded border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent";

const schema = z.object({
  name: z.string().min(1, "Required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  address_line1: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postcode: z.string().optional(),
  status: z.enum(["active", "inactive", "prospect"]),
});

type FormValues = z.infer<typeof schema>;

export default function EditCustomerPage() {
  const router = useRouter();

  const {
    refineCore: { onFinish, formLoading },
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    refineCoreProps: {
      resource: "customers",
      action: "edit",
      redirect: "show",
    },
    resolver: zodResolver(schema),
    defaultValues: { status: "active" },
  });

  const onSubmit = handleSubmit(async (values) => {
    await onFinish(values);
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Edit Customer</h1>
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Customer Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <Input
              label="Name"
              required
              {...register("name")}
              error={errors.name?.message as string | undefined}
            />
            <Input
              label="Email"
              type="email"
              {...register("email")}
              error={errors.email?.message as string | undefined}
            />
            <Input label="Phone" type="tel" {...register("phone")} />
            <Input label="Address" {...register("address_line1")} />
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1">
                <Input label="City" {...register("city")} />
              </div>
              <Input label="State" {...register("state")} />
              <Input label="Postcode" {...register("postcode")} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Status</label>
              <select {...register("status")} className={SELECT_CLASS}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="prospect">Prospect</option>
              </select>
              {errors.status && (
                <p className="mt-1 text-xs text-destructive">{errors.status.message as string}</p>
              )}
            </div>
            <div className="flex gap-3">
              <Button type="submit" loading={formLoading}>
                Save Changes
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
