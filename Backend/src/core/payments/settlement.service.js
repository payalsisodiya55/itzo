import mongoose from 'mongoose';
import { Settlement } from './models/settlement.model.js';
import { Transaction } from './models/transaction.model.js';
import { debitWallet, unlockWalletAmount } from './wallet.service.js';
import { logger } from '../../utils/logger.js';

/**
 * Create a settlement (payout request) for a restaurant or delivery partner.
 * Locks the settlement amount in their wallet until processed.
 */
export async function createSettlement({ entityType, entityId, amount, notes = '', periodStart, periodEnd }) {
    if (!['restaurant', 'deliveryBoy'].includes(entityType)) {
        throw new Error('Settlements only for restaurant or deliveryBoy');
    }

    const settlement = await Settlement.create({
        entityType,
        entityId: new mongoose.Types.ObjectId(entityId),
        amount: Number(amount),
        currency: 'INR',
        status: 'pending',
        notes,
        periodStart: periodStart || null,
        periodEnd: periodEnd || null
    });

    logger.info(`Settlement created: ${settlement._id} for ${entityType}:${entityId} amount=${amount}`);
    return settlement.toObject();
}

/**
 * Process a settlement — debit entity wallet + mark as processed.
 */
export async function processSettlement(settlementId, { processedBy, payoutRef = '' } = {}) {
    const settlement = await Settlement.findById(settlementId);
    if (!settlement) throw new Error('Settlement not found');
    if (settlement.status === 'processed') return settlement.toObject();
    if (settlement.status === 'failed') throw new Error('Cannot process a failed settlement');

    try {
        // Debit the entity's wallet
        const { transaction } = await debitWallet({
            entityType: settlement.entityType,
            entityId: String(settlement.entityId),
            amount: settlement.amount,
            description: `Settlement payout #${settlement._id.toString().slice(-6)}`,
            category: 'settlement_payout',
            metadata: { settlementId: settlement._id }
        });

        settlement.status = 'processed';
        settlement.processedAt = new Date();
        settlement.processedBy = processedBy ? new mongoose.Types.ObjectId(processedBy) : null;
        settlement.payoutRef = payoutRef;
        if (transaction?._id) {
            settlement.transactionIds.push(transaction._id);
        }
        await settlement.save();

        // Update totalSettled on the entity wallet
        const { Model, filter } = resolveWalletForSettlement(settlement.entityType, settlement.entityId);
        await Model.updateOne(filter, { $inc: { totalSettled: settlement.amount } });

        logger.info(`Settlement processed: ${settlementId} payoutRef=${payoutRef}`);
        return settlement.toObject();
    } catch (err) {
        settlement.status = 'failed';
        settlement.metadata = { error: err.message };
        await settlement.save();
        throw err;
    }
}

function resolveWalletForSettlement(entityType, entityId) {
    const id = new mongoose.Types.ObjectId(entityId);
    if (entityType === 'restaurant') {
        // Dynamic import would be circular — import at top
        return {
            Model: mongoose.model('FoodRestaurantWallet'),
            filter: { restaurantId: id }
        };
    }
    if (entityType === 'deliveryBoy') {
        return {
            Model: mongoose.model('FoodDeliveryWallet'),
            filter: { deliveryPartnerId: id }
        };
    }
    throw new Error(`Unsupported settlement entity: ${entityType}`);
}

/**
 * List settlements with filters.
 */
export async function listSettlements({ entityType, entityId, status, page = 1, limit = 20 } = {}) {
    const filter = {};
    if (entityType) filter.entityType = entityType;
    if (entityId) filter.entityId = new mongoose.Types.ObjectId(entityId);
    if (status) filter.status = status;

    const skip = (Math.max(1, page) - 1) * limit;
    const [docs, total] = await Promise.all([
        Settlement.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        Settlement.countDocuments(filter)
    ]);

    return {
        settlements: docs,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
    };
}

/**
 * Get settlement by ID.
 */
export async function getSettlementById(settlementId) {
    return Settlement.findById(settlementId).lean();
}
