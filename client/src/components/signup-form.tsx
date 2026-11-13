import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useNavigate, Link } from "@tanstack/react-router";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { api } from "@/lib/api";
import { Spinner } from "@/components/ui/spinner";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

export function SignupForm({ className, ...props }: React.ComponentProps<"div">) {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    role: "admin",
  });
  const navigate = useNavigate();
  const registerUser = useMutation({
    mutationFn: async () => {
      const res = await api.post("/users/register", form);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Registered successfully");
      navigate({ to: "/login" });
    },
    onError: () => toast.error("Registration failed"),
  });
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Welcome to Tasky</CardTitle>
          <CardDescription>Sign up with your Apple or Google account</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              registerUser.mutate();
            }}
          >
            <FieldGroup>
              <Field>
                <Button variant="outline" type="button">
                  Sign up with Apple
                </Button>
                <Button variant="outline" type="button">
                  Sign up with Google
                </Button>
              </Field>
              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                Or continue with
              </FieldSeparator>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="username">Username</FieldLabel>
                <Input
                  type="text"
                  required
                  id="username"
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  required
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </Field>
              <Field>
                <Button type="submit" disabled={registerUser.isPending}>
                  {registerUser.isPending ? <Spinner /> : "Sign up"}
                </Button>
                <FieldDescription className="text-center">
                  Already have an account? <Link to="/login">Sign in</Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
