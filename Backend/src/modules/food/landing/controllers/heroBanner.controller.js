import {
    listHeroBanners,
    createHeroBannersFromFiles,
    deleteHeroBanner,
    updateHeroBannerOrder,
    toggleHeroBannerStatus,
    updateHeroBanner
} from '../services/heroBanner.service.js';
import { sendResponse } from '../../../../utils/response.js';
import { ValidationError } from '../../../../core/auth/errors.js';

export const listHeroBannersController = async (req, res, next) => {
    try {
        const data = await listHeroBanners();
        // Wrap in { banners } to match LandingPageManagement.jsx expectations
        return sendResponse(res, 200, 'Hero banners fetched successfully', { banners: data });
    } catch (error) {
        next(error);
    }
};

export const uploadHeroBannersController = async (req, res, next) => {
    try {
        if (!req.files || !req.files.length) {
            throw new ValidationError('No files uploaded');
        }

        const meta = {
            title: req.body.title,
            ctaText: req.body.ctaText,
            ctaLink: req.body.ctaLink,
            zoneId: req.body.zoneId
        };

        const results = await createHeroBannersFromFiles(req.files, meta);
        return sendResponse(res, 201, 'Hero banners uploaded', { results });
    } catch (error) {
        next(error);
    }
};

export const deleteHeroBannerController = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!id) {
            throw new ValidationError('Banner id is required');
        }
        const result = await deleteHeroBanner(id);
        return sendResponse(res, 200, result.deleted ? 'Hero banner deleted' : 'Hero banner not found', result);
    } catch (error) {
        next(error);
    }
};

export const updateHeroBannerOrderController = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { sortOrder } = req.body;
        if (!id || typeof sortOrder !== 'number') {
            throw new ValidationError('id and numeric sortOrder are required');
        }
        const updated = await updateHeroBannerOrder(id, sortOrder);
        return sendResponse(res, 200, 'Hero banner order updated', updated);
    } catch (error) {
        next(error);
    }
};

export const toggleHeroBannerStatusController = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;
        if (!id || typeof isActive !== 'boolean') {
            throw new ValidationError('id and boolean isActive are required');
        }
        const updated = await toggleHeroBannerStatus(id, isActive);
        return sendResponse(res, 200, 'Hero banner status updated', updated);
    } catch (error) {
        next(error);
    }
};

export const updateHeroBannerController = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!id) {
            throw new ValidationError('Banner id is required');
        }

        const updated = await updateHeroBanner(id, {
            zoneId: req.body?.zoneId
        });

        return sendResponse(res, 200, 'Hero banner updated', updated);
    } catch (error) {
        next(error);
    }
};

