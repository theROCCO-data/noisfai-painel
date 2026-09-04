export type ToastTipo = "sucesso" | "erro";
export type ToastItem = { id: number; mensagem: string; tipo: ToastTipo };

type Listener = (toasts: ToastItem[]) => void;

let toasts: ToastItem[] = [];
let proximoId = 1;
const listeners = new Set<Listener>();

function notificar() {
  for (const l of listeners) l([...toasts]);
}

export function toast(mensagem: string, tipo: ToastTipo = "sucesso") {
  const id = proximoId++;
  toasts = [...toasts, { id, mensagem, tipo }];
  notificar();
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    notificar();
  }, 3500);
}

export function subscribeToast(listener: Listener) {
  listeners.add(listener);
  listener([...toasts]);
  return () => {
    listeners.delete(listener);
  };
}

export function dismissToast(id: number) {
  toasts = toasts.filter((t) => t.id !== id);
  notificar();
}
