import { describe, expect, it } from 'vitest';
import { thaiAmountText } from './npk-document-html';

describe('thaiAmountText (ยอดเป็นตัวอักษรในเอกสาร)', () => {
	it('ตรงกับตัวอย่างเอกสารลูกค้า', () => {
		expect(thaiAmountText(124800)).toBe('หนึ่งแสนสองหมื่นสี่พันแปดร้อยบาทถ้วน');
		expect(thaiAmountText(178336.9)).toBe('หนึ่งแสนเจ็ดหมื่นแปดพันสามร้อยสามสิบหกบาทเก้าสิบสตางค์');
		expect(thaiAmountText(41516)).toBe('สี่หมื่นหนึ่งพันห้าร้อยสิบหกบาทถ้วน');
	});
});
