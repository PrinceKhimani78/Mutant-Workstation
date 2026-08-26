// Shared between the custom-field builder UI, the field renderer, and the API
// routes that validate/serialize values. No server-only imports here so it's
// safe to pull into client components too.

export const FIELD_TYPES = [
  { value: 'single_line', label: 'Single Line (Short Text)', group: 'Text' },
  { value: 'multi_line', label: 'Multi-Line (Long Text)', group: 'Text' },
  { value: 'textbox_list', label: 'Textbox List', group: 'Text' },
  { value: 'number', label: 'Number', group: 'Number & Value' },
  { value: 'monetary', label: 'Monetary', group: 'Number & Value' },
  { value: 'phone', label: 'Phone', group: 'Number & Value' },
  { value: 'email', label: 'Email', group: 'Number & Value' },
  { value: 'url', label: 'URL', group: 'Number & Value' },
  { value: 'dropdown_single', label: 'Dropdown (Single)', group: 'Selection' },
  { value: 'dropdown_multi', label: 'Dropdown (Multiple)', group: 'Selection' },
  { value: 'radio', label: 'Radio Select', group: 'Selection' },
  { value: 'checkbox', label: 'Checkbox / Checkbox Group', group: 'Selection' },
] as const;

export type FieldType = typeof FIELD_TYPES[number]['value'];

export const OPTION_TYPES: FieldType[] = ['dropdown_single', 'dropdown_multi', 'radio', 'checkbox'];
export const MULTI_VALUE_TYPES: FieldType[] = ['textbox_list', 'dropdown_multi'];

export function fieldTypeLabel(type: string) {
  return FIELD_TYPES.find((t) => t.value === type)?.label || type;
}

export function needsOptions(type: string) {
  return OPTION_TYPES.includes(type as FieldType);
}

// A "checkbox" field with no configured options behaves as a single yes/no
// toggle; with options configured it behaves as a checkbox group (multi-select).
export function isCheckboxGroup(type: string, options: string[]) {
  return type === 'checkbox' && options.length > 0;
}

export function parseValue(raw: string | null | undefined): any {
  if (raw == null || raw === '') return null;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

export function serializeValue(value: any): string | null {
  if (value == null || value === '' || (Array.isArray(value) && value.length === 0)) return null;
  return JSON.stringify(value);
}

export function parseOptions(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function isEmptyValue(value: any): boolean {
  if (value == null || value === '') return true;
  if (Array.isArray(value) && value.length === 0) return true;
  return false;
}
