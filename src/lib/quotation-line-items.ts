export type QuotationLineInput = {
  itemType?: string;
  parentIndex?: number | null;
  quantity?: number | unknown;
  materialPrice?: number | unknown;
  labourPrice?: number | unknown;
  description?: string;
  unit?: string;
};

export const OVERHEAD_ITEM_TYPE = 'OVERHEAD';
export const OVERHEAD_DESCRIPTION = 'Overhead and Profit';
export const OVERHEAD_UNIT = 'เหมา';
export const OVERHEAD_PERCENT = 10;
export const OVERHEAD_TEMP_ID = -1;

export function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}

export function isOverheadItem(item: QuotationLineInput): boolean {
  return item.itemType === OVERHEAD_ITEM_TYPE;
}

export function getRegularItems<T extends QuotationLineInput>(items: T[]): T[] {
  return items.filter((item) => !isOverheadItem(item));
}

/** Index of the nearest HEADER row above this item. */
export function findParentHeaderIndex(items: QuotationLineInput[], itemIndex: number): number {
  for (let i = itemIndex - 1; i >= 0; i--) {
    if (items[i].itemType === 'HEADER') return i;
  }
  return -1;
}

/** HEADER indices that have at least one ITEM child (by row order, not stored parentIndex). */
export function getHeaderIndicesWithSubItems(items: QuotationLineInput[]): Set<number> {
  const set = new Set<number>();
  items.forEach((item, idx) => {
    if (item.itemType === 'ITEM') {
      const parentIdx = findParentHeaderIndex(items, idx);
      if (parentIdx >= 0) set.add(parentIdx);
    }
  });
  return set;
}

export function computeLineAmount(item: QuotationLineInput): number {
  const qty = Number(item.quantity) || 0;
  const mat = Number(item.materialPrice) || 0;
  const lab = Number(item.labourPrice) || 0;
  return qty * mat + qty * lab;
}

export function computeBaseSubtotal(items: QuotationLineInput[]): number {
  return roundMoney(computeQuotationSubtotal(getRegularItems(items)));
}

export function computeOverheadAmount(baseSubtotal: number): number {
  return roundMoney((baseSubtotal * OVERHEAD_PERCENT) / 100);
}

export function computeQuotationSubtotal(items: QuotationLineInput[]): number {
  return roundMoney(items.reduce((sum, item) => sum + computeLineAmount(item), 0));
}

export function computeQuotationTotals(
  items: QuotationLineInput[],
  discountAmount: number,
  vatPercent: number,
) {
  const regularItems = getRegularItems(items);
  const baseSubtotal = computeQuotationSubtotal(regularItems);
  const includeOverhead = items.some(isOverheadItem);
  const overheadAmount = includeOverhead ? computeOverheadAmount(baseSubtotal) : 0;
  const subtotal = roundMoney(baseSubtotal + overheadAmount);
  const afterDiscount = roundMoney(subtotal - (Number(discountAmount) || 0));
  const vatAmount = roundMoney((afterDiscount * (Number(vatPercent) || 0)) / 100);
  const totalAmount = roundMoney(afterDiscount + vatAmount);

  return {
    baseSubtotal,
    overheadAmount,
    subtotal,
    afterDiscount,
    vatAmount,
    totalAmount,
  };
}

export function buildOverheadLineItem(baseSubtotal: number) {
  const amount = computeOverheadAmount(baseSubtotal);
  return {
    tempId: OVERHEAD_TEMP_ID,
    itemType: OVERHEAD_ITEM_TYPE,
    description: OVERHEAD_DESCRIPTION,
    unit: OVERHEAD_UNIT,
    quantity: 1,
    materialPrice: amount,
    labourPrice: 0,
  };
}

export function appendOverheadItem<T extends QuotationLineInput>(regularItems: T[], includeOverhead: boolean): T[] {
  if (!includeOverhead) return regularItems;
  const baseSubtotal = computeQuotationSubtotal(regularItems);
  return [...regularItems, buildOverheadLineItem(baseSubtotal) as unknown as T];
}

export function normalizeQuotationItemsForSave(items: QuotationLineInput[]): QuotationLineInput[] {
  const regularItems = getRegularItems(items);
  const includeOverhead = items.some(isOverheadItem);
  if (!includeOverhead) return regularItems;
  return appendOverheadItem(regularItems, true);
}

/** HEADER row has qty/unit/prices entered (not section-title only). */
export function headerHasOwnLineValues(item: {
  quantity?: number | unknown;
  materialPrice?: number | unknown;
  labourPrice?: number | unknown;
}): boolean {
  const qty = Number(item.quantity) || 0;
  const mat = Number(item.materialPrice) || 0;
  const lab = Number(item.labourPrice) || 0;
  return qty > 0 || mat > 0 || lab > 0;
}

export function hasOverheadInItems(items: QuotationLineInput[]): boolean {
  return items.some(isOverheadItem);
}
