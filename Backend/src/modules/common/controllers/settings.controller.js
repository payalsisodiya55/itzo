import { GlobalSettings } from '../models/settings.model.js';
import { sendResponse } from '../../../utils/response.js';
import { uploadImageBufferDetailed } from '../../../services/cloudinary.service.js';

export async function getGlobalSettings(req, res, next) {
    try {
        let settings = await GlobalSettings.findOne();
        if (!settings) {
            // Create default settings if none exist
            settings = await GlobalSettings.create({
                companyName: 'Appzeto',
                email: 'admin@appzeto.com'
            });
        }

        // Cleanup any extra modules that might be in the DB (taxi, hotel, etc.)
        const rawSettings = settings.toObject();
        if (rawSettings.modules) {
            const allowedModules = ['food', 'quickCommerce'];
            const cleanedModules = {};
            allowedModules.forEach(mod => {
                if (rawSettings.modules[mod] !== undefined) {
                    cleanedModules[mod] = rawSettings.modules[mod];
                }
            });
            rawSettings.modules = cleanedModules;
        }

        return sendResponse(res, 200, 'Global settings fetched successfully', rawSettings);
    } catch (error) {
        next(error);
    }
}

export async function updateGlobalSettings(req, res, next) {
    try {
        let data = {};
        if (req.body.data) {
            try {
                data = typeof req.body.data === 'string' ? JSON.parse(req.body.data) : req.body.data;
            } catch (e) {
                console.error("Error parsing settings data:", e);
                data = req.body;
            }
        } else {
            data = req.body;
        }
        
        const { 
            companyName, email, phoneCountryCode, phoneNumber, address, state, pincode, region, 
            adminLogoUrl, adminFaviconUrl, userLogoUrl, userFaviconUrl, deliveryLogoUrl, deliveryFaviconUrl, restaurantLogoUrl, restaurantFaviconUrl, sellerLogoUrl, sellerFaviconUrl,
            themeColor, modules 
        } = data;
        
        console.log("Updating global settings with data:", data);

        // Validation
        if (companyName !== undefined && (!companyName || companyName.trim().length < 2 || companyName.trim().length > 50)) {
            return res.status(400).json({ success: false, message: 'Company name must be between 2 and 50 characters' });
        }
        
        if (email && (email.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))) {
            return res.status(400).json({ success: false, message: 'Invalid email address' });
        }
        
        if (phoneNumber && !/^\d{7,15}$/.test(phoneNumber.trim())) {
            return res.status(400).json({ success: false, message: 'Invalid phone number (7-15 digits required)' });
        }

        let settings = await GlobalSettings.findOne();
        if (!settings) {
            settings = new GlobalSettings();
        }

        if (companyName) settings.companyName = companyName;
        if (email) settings.email = email;
        if (phoneCountryCode || phoneNumber) {
            settings.phone = {
                countryCode: phoneCountryCode || settings.phone?.countryCode || '+91',
                number: phoneNumber || settings.phone?.number || ''
            };
        }
        if (address !== undefined) settings.address = address;
        if (state !== undefined) settings.state = state;
        if (pincode !== undefined) settings.pincode = pincode;
        if (region) settings.region = region;

        // Update URLs if provided
        const mediaFields = [
            'adminLogo', 'adminFavicon', 'userLogo', 'userFavicon', 
            'deliveryLogo', 'deliveryFavicon', 'restaurantLogo', 'restaurantFavicon', 
            'sellerLogo', 'sellerFavicon'
        ];
        mediaFields.forEach(field => {
            const urlKey = `${field}Url`;
            if (data[urlKey] !== undefined) {
                settings[field] = {
                    url: String(data[urlKey] || '').trim(),
                    publicId: settings[field]?.publicId || ''
                };
                settings.markModified(field);
            }
        });
        if (themeColor !== undefined) {
            settings.themeColor = themeColor;
        }

        // Strictly define modules and remove unwanted ones like taxi, hotel
        const currentModules = settings.modules || {};
        settings.modules = {
            food: modules?.food !== undefined ? !!modules.food : (currentModules.food !== undefined ? !!currentModules.food : true),
            quickCommerce: modules?.quickCommerce !== undefined ? !!modules.quickCommerce : (currentModules.quickCommerce !== undefined ? !!currentModules.quickCommerce : true)
        };
        // Use markModified to ensure the modules object is fully replaced in DB
        settings.markModified('modules');

        // Handle file uploads
        if (req.files) {
            const mediaUploadFields = [
                { name: 'adminLogo', folder: 'business/logos/admin' },
                { name: 'adminFavicon', folder: 'business/favicons/admin' },
                { name: 'userLogo', folder: 'business/logos/user' },
                { name: 'userFavicon', folder: 'business/favicons/user' },
                { name: 'deliveryLogo', folder: 'business/logos/delivery' },
                { name: 'deliveryFavicon', folder: 'business/favicons/delivery' },
                { name: 'restaurantLogo', folder: 'business/logos/restaurant' },
                { name: 'restaurantFavicon', folder: 'business/favicons/restaurant' },
                { name: 'sellerLogo', folder: 'business/logos/seller' },
                { name: 'sellerFavicon', folder: 'business/favicons/seller' }
            ];

            for (const field of mediaUploadFields) {
                if (req.files[field.name] && req.files[field.name][0]) {
                    const result = await uploadImageBufferDetailed(req.files[field.name][0].buffer, field.folder);
                    settings[field.name] = {
                        url: result.secure_url,
                        publicId: result.public_id
                    };
                    settings.markModified(field);
                }
            }
        }

        await settings.save();
        return sendResponse(res, 200, 'Global settings updated successfully', settings);
    } catch (error) {
        next(error);
    }
}
