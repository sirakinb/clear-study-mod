import { toast } from "sonner";

interface ToastOptions {
  description?: string;
  variant?: "default" | "destructive";
}

export const sonnerToast = (title: string, options?: ToastOptions) => {
  toast(title, {
    variant: options?.variant || "default",
    description: options?.description
  });
}; 