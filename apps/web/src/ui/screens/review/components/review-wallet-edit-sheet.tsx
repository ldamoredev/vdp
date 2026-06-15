import { useEffect, useState } from "react";

import { useCore } from "@/CoreProvider";
import { GetAccounts } from "@/core/app/wallet/GetAccounts";
import { GetCategories } from "@/core/app/wallet/GetCategories";
import { UpdateTransaction } from "@/core/app/wallet/UpdateTransaction";
import type { Account } from "@/core/domain/wallet/Account";
import type { Category } from "@/core/domain/wallet/Category";
import type { Transaction } from "@/core/domain/wallet/Transaction";
import type { UpdateTransactionInput } from "@/core/domain/wallet/WalletGateway";
import type {
  EditTransactionFormField,
  EditTransactionSheetVM,
} from "@/ui/models/wallet/TransactionsViewModel";
import { EditTransactionSheet } from "@/ui/screens/wallet/transactions/EditTransactionSheet";

interface ReviewWalletEditSheetProps {
  transaction: Transaction;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

interface EditFormState {
  amount: string;
  categoryId: string;
  description: string;
  date: string;
  accountId: string;
}

function buildForm(transaction: Transaction): EditFormState {
  return {
    amount: transaction.amount,
    categoryId: transaction.categoryId ?? "",
    description: transaction.description ?? "",
    date: transaction.date,
    accountId: transaction.accountId,
  };
}

function validateForm(form: EditFormState): string | null {
  if (form.amount.trim() === "") return "Ingresá un monto";
  const amount = Number(form.amount);
  if (Number.isNaN(amount)) return "El monto no es un número válido";
  if (amount <= 0) return "El monto debe ser mayor a cero";
  if (form.date.trim() === "") return "Ingresá una fecha";
  if (form.accountId.trim() === "") return "Elegí una cuenta";
  return null;
}

function buildUpdatePayload(
  transaction: Transaction,
  form: EditFormState,
): UpdateTransactionInput | null {
  const payload: UpdateTransactionInput = {};
  if (form.amount !== transaction.amount) payload.amount = form.amount;

  const nextCategoryId = form.categoryId === "" ? null : form.categoryId;
  if (nextCategoryId !== transaction.categoryId) payload.categoryId = nextCategoryId;

  const trimmedDescription = form.description.trim();
  const normalizedDescription = trimmedDescription === "" ? null : trimmedDescription;
  const originalDescription =
    transaction.description?.trim() === "" ? null : (transaction.description ?? null);
  if (normalizedDescription !== originalDescription) payload.description = normalizedDescription;

  if (form.date !== transaction.date) payload.date = form.date;
  if (form.accountId !== transaction.accountId) payload.accountId = form.accountId;

  return Object.keys(payload).length === 0 ? null : payload;
}

export function ReviewWalletEditSheet({
  transaction,
  open,
  onClose,
  onSaved,
}: ReviewWalletEditSheetProps) {
  const core = useCore();
  const [form, setForm] = useState(() => buildForm(transaction));
  const [message, setMessage] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubmitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(buildForm(transaction));
    setMessage(null);
  }, [open, transaction]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    Promise.all([
      core.execute(new GetAccounts()),
      core.execute(new GetCategories()),
    ])
      .then(([nextAccounts, nextCategories]) => {
        if (cancelled) return;
        setAccounts(nextAccounts);
        setCategories(nextCategories);
      })
      .catch(() => {
        if (!cancelled) setMessage("No se pudieron cargar las opciones de edicion");
      });

    return () => {
      cancelled = true;
    };
  }, [core, open]);

  function setEditField(field: EditTransactionFormField, value: string): void {
    setForm((current) => ({ ...current, [field]: value }));
    setMessage(null);
  }

  async function submitEdit(): Promise<void> {
    const validationError = validateForm(form);
    if (validationError) {
      setMessage(validationError);
      return;
    }

    const payload = buildUpdatePayload(transaction, form);
    if (!payload) {
      setMessage("Sin cambios");
      return;
    }

    try {
      setSubmitting(true);
      await core.execute(new UpdateTransaction(transaction.id, payload));
      onSaved();
    } catch {
      setMessage("No se pudo guardar la transaccion");
    } finally {
      setSubmitting(false);
    }
  }

  const vm: EditTransactionSheetVM = {
    title: "Editar transaccion",
    transactionId: transaction.id,
    amount: form.amount,
    currency: transaction.currency,
    accountId: form.accountId,
    categoryId: form.categoryId,
    description: form.description,
    date: form.date,
    accountOptions: accounts.map((account) => ({
      value: account.id,
      label: `${account.name} (${account.currency})`,
    })),
    categoryOptions: categories
      .filter((category) => category.type === transaction.type)
      .map((category) => ({
        value: category.id,
        label: `${category.icon ? `${category.icon} ` : ""}${category.name}`,
    })),
    message,
    isSubmitting,
    canSubmit: !isSubmitting,
  };

  return (
    <EditTransactionSheet
      vm={vm}
      presenter={{ closeEdit: onClose, setEditField, submitEdit }}
    />
  );
}
