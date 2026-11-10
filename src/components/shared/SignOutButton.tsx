import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/AuthProvider";
import { Button, type ButtonProps } from "@/components/ui/button";

export function SignOutButton({
  variant = "outline",
  size = "default",
  ...props
}: Omit<ButtonProps, "onClick">) {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    toast.success("Sesión cerrada");
    navigate("/", { replace: true });
  }

  return (
    <Button variant={variant} size={size} onClick={() => void handleSignOut()} {...props}>
      <LogOut aria-hidden="true" />
      Cerrar sesión
    </Button>
  );
}
