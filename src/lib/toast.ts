type ToastMessage = string;

export async function showSuccessToast(message: ToastMessage) {
  const { toast } = await import("sonner");
  toast.success(message);
}

export async function showErrorToast(message: ToastMessage) {
  const { toast } = await import("sonner");
  toast.error(message);
}

export async function showInfoToast(message: ToastMessage) {
  const { toast } = await import("sonner");
  toast.info(message);
}

export async function showWarningToast(message: ToastMessage) {
  const { toast } = await import("sonner");
  toast.warning(message);
}
