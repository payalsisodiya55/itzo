import { HrmsSettings } from '../models/settings.model.js';
import { sendResponse } from '../../../utils/response.js';

export const getSettings = async (req, res, next) => {
    try {
        let settings = await HrmsSettings.findOne();
        if (!settings) {
            settings = await HrmsSettings.create({});
        }
        return sendResponse(res, 200, "HRMS Settings retrieved successfully", settings);
    } catch (error) {
        next(error);
    }
};

export const updateSettings = async (req, res, next) => {
    try {
        const { 
            workingHours, 
            leavePolicies, 
            payrollRules, 
            expensePolicies, 
            organization, 
            holidayCalendar, 
            templates 
        } = req.body;
        
        let settings = await HrmsSettings.findOne();
        if (!settings) {
            settings = new HrmsSettings();
        }

        if (workingHours) settings.workingHours = workingHours;
        if (leavePolicies) settings.leavePolicies = leavePolicies;
        if (payrollRules) settings.payrollRules = payrollRules;
        if (expensePolicies) settings.expensePolicies = expensePolicies;
        if (organization) settings.organization = organization;
        if (holidayCalendar) settings.holidayCalendar = holidayCalendar;
        if (templates) settings.templates = templates;

        settings.updatedBy = req.user.userId;

        await settings.save();
        return sendResponse(res, 200, "HRMS Settings updated successfully", settings);
    } catch (error) {
        next(error);
    }
};
