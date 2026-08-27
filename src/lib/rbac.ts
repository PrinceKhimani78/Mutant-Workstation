// Central role logic. "Owner" is the CEO / main account — the only role that may
// ever see money. Everyone else gets the same records with monetary fields stripped
// server-side, so it's not just hidden in the UI — it never leaves the API.

export function isOwner(user: { role?: string } | null | undefined): boolean {
  return user?.role === 'Owner';
}

function omit<T extends Record<string, any>>(obj: T, keys: string[]): T {
  const copy: any = { ...obj };
  for (const key of keys) {
    if (key in copy) copy[key] = null;
  }
  return copy;
}

const LEAD_MONEY_FIELDS = ['budget', 'proposalValue', 'hourlyRate'];
const CLIENT_MONEY_FIELDS = ['retainerValue', 'hourlyRate'];
const PROJECT_MONEY_FIELDS = ['budget'];
const INVOICE_MONEY_FIELDS = ['amount', 'tax', 'discount'];

export function scrubLead<T extends Record<string, any>>(lead: T, owner: boolean): T {
  return owner ? lead : scrubCustomFieldValues(omit(lead, LEAD_MONEY_FIELDS), owner);
}

export function scrubClient<T extends Record<string, any>>(client: T, owner: boolean): T {
  return owner ? client : omit(client, CLIENT_MONEY_FIELDS);
}

export function scrubProject<T extends Record<string, any>>(project: T, owner: boolean): T {
  return owner ? project : omit(project, PROJECT_MONEY_FIELDS);
}

export function scrubInvoice<T extends Record<string, any>>(invoice: T, owner: boolean): T {
  return owner ? invoice : omit(invoice, INVOICE_MONEY_FIELDS);
}

// Custom fields can be typed "monetary" by whoever built them — treat those
// values the same as any other revenue figure: owner-only.
export function scrubCustomFieldValues<T extends { customFieldValues?: any[] }>(lead: T, owner: boolean): T {
  if (owner || !lead.customFieldValues) return lead;
  return {
    ...lead,
    customFieldValues: lead.customFieldValues.map((v: any) =>
      v.field?.type === 'monetary' ? { ...v, value: null } : v
    ),
  };
}
