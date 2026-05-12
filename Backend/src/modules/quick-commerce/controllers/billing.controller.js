import mongoose from 'mongoose';
import {
  validateDeliveryCommissionRuleDto,
  validateFeeSettingsUpsertDto,
  validateOptionalStatusDto,
} from '../admin/validators/billing.validator.js';
import * as billingService from '../admin/services/billing.service.js';

export async function getDeliveryCommissionRules(req, res, next) {
  try {
    const data = await billingService.getDeliveryCommissionRules();
    res.status(200).json({ success: true, message: 'Commission rules fetched successfully', data });
  } catch (error) {
    next(error);
  }
}

export async function createDeliveryCommissionRule(req, res, next) {
  try {
    const body = validateDeliveryCommissionRuleDto(req.body || {});
    const created = await billingService.createDeliveryCommissionRule(body);
    res.status(201).json({ success: true, message: 'Commission rule created successfully', data: { commission: created } });
  } catch (error) {
    next(error);
  }
}

export async function updateDeliveryCommissionRule(req, res, next) {
  try {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid commission id' });
    }
    const body = validateDeliveryCommissionRuleDto(req.body || {});
    const updated = await billingService.updateDeliveryCommissionRule(id, body);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Commission rule not found' });
    }
    res.status(200).json({ success: true, message: 'Commission rule updated successfully', data: { commission: updated } });
  } catch (error) {
    next(error);
  }
}

export async function deleteDeliveryCommissionRule(req, res, next) {
  try {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid commission id' });
    }
    const result = await billingService.deleteDeliveryCommissionRule(id);
    if (!result) {
      return res.status(404).json({ success: false, message: 'Commission rule not found' });
    }
    res.status(200).json({ success: true, message: 'Commission rule deleted successfully', data: result });
  } catch (error) {
    next(error);
  }
}

export async function toggleDeliveryCommissionRuleStatus(req, res, next) {
  try {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid commission id' });
    }
    const { status } = validateOptionalStatusDto(req.body || {});
    if (typeof status !== 'boolean') {
      return res.status(400).json({ success: false, message: 'status is required' });
    }
    const updated = await billingService.toggleDeliveryCommissionRuleStatus(id, status);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Commission rule not found' });
    }
    res.status(200).json({ success: true, message: 'Status updated successfully', data: { commission: updated } });
  } catch (error) {
    next(error);
  }
}

export async function getFeeSettings(req, res, next) {
  try {
    const data = await billingService.getFeeSettings();
    res.status(200).json({ success: true, message: 'Fee settings fetched successfully', data });
  } catch (error) {
    next(error);
  }
}

export async function createOrUpdateFeeSettings(req, res, next) {
  try {
    const body = validateFeeSettingsUpsertDto(req.body || {});
    const feeSettings = await billingService.upsertFeeSettings(body);
    res.status(200).json({ success: true, message: 'Fee settings saved successfully', data: { feeSettings } });
  } catch (error) {
    next(error);
  }
}

export async function getPublicBillingSettings(req, res, next) {
  try {
    const { feeSettings } = await billingService.getFeeSettings();
    res.status(200).json({
      success: true,
      message: 'Billing settings fetched successfully',
      result: feeSettings,
      data: { feeSettings },
    });
  } catch (error) {
    next(error);
  }
}
