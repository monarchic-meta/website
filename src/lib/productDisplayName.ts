// Keep customer-facing spacing separate from catalog identifiers and API names.
export const productDisplayName = (name: string) => name.replace(/\bOrgFleet\b/g, "Org Fleet");
