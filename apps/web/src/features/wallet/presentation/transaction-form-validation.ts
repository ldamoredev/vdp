// Single field-level validator for the three transaction forms (full form,
// quick-add, edit). The rules mirror `createTransactionSchema` in
// @vdp/shared (amount positive, account required, date required); the copy is
// product-facing Spanish, which is why the zod messages are not reused as-is.

export interface TransactionFieldError {
  field: "amount" | "accountId" | "date";
  message: string;
}

export function validateTransactionFields(fields: {
  amount: string;
  accountId: string;
  date?: string;
}): TransactionFieldError | null {
  if (fields.amount.trim() === "") {
    return { field: "amount", message: "Ingresá un monto" };
  }

  const numericAmount = Number(fields.amount);
  if (Number.isNaN(numericAmount)) {
    return { field: "amount", message: "El monto no es un número válido" };
  }

  if (numericAmount <= 0) {
    return { field: "amount", message: "El monto debe ser mayor a cero" };
  }

  if (fields.date !== undefined && fields.date.trim() === "") {
    return { field: "date", message: "Ingresá una fecha" };
  }

  if (fields.accountId.trim() === "") {
    return { field: "accountId", message: "Elegí una cuenta" };
  }

  return null;
}
