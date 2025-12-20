
import { TransactionRecord, InventoryItem } from '../types';

export interface ValidationError {
    field: string;
    message: string;
}

export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
}

export function validateTransaction(
    record: Partial<TransactionRecord>,
    inventory: InventoryItem[]
): ValidationResult {
    const errors: ValidationError[] = [];

    if (!record.itemId) {
        errors.push({ field: 'itemId', message: '请选择商品' });
    }

    if (!record.method) {
        errors.push({ field: 'method', message: '请选择业务渠道' });
    }

    if (!record.quantity || record.quantity < 1) {
        errors.push({ field: 'quantity', message: '数量必须大于0' });
    }

    if (record.type === 'outbound' && record.itemId) {
        const item = inventory.find(i => i.id === record.itemId);
        if (item && record.quantity && record.quantity > item.quantity) {
            errors.push({ field: 'quantity', message: `库存不足，当前库存: ${item.quantity}` });
        }
    }

    if (record.amount !== undefined && record.amount < 0) {
        errors.push({ field: 'amount', message: '金额不能为负数' });
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

export function validateInventoryItem(item: Partial<InventoryItem>): ValidationResult {
    const errors: ValidationError[] = [];

    if (!item.modelNumber?.trim()) {
        errors.push({ field: 'modelNumber', message: '请输入款号' });
    }

    if (!item.category) {
        errors.push({ field: 'category', message: '请选择品类' });
    }

    if (!item.warehouse) {
        errors.push({ field: 'warehouse', message: '请选择仓库' });
    }

    if (item.costPrice !== undefined && item.costPrice < 0) {
        errors.push({ field: 'costPrice', message: '成本价不能为负数' });
    }

    if (item.quantity !== undefined && item.quantity < 0) {
        errors.push({ field: 'quantity', message: '库存数量不能为负数' });
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

export function getFieldError(errors: ValidationError[], field: string): string | undefined {
    return errors.find(e => e.field === field)?.message;
}
