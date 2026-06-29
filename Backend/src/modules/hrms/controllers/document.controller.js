import { HrmsDocument } from '../models/document.model.js';
import { HrmsEmployee } from '../models/employee.model.js';
import { sendResponse, sendError } from '../../../utils/response.js';

/**
 * EMPLOYEE: Get own documents
 */
export const getMyDocuments = async (req, res, next) => {
    try {
        const employee = await HrmsEmployee.findOne({ adminId: req.user.userId });
        if (!employee) return sendError(res, 404, 'Employee not found');

        const { documentType } = req.query;
        const filter = { employeeId: employee._id };
        if (documentType) filter.documentType = documentType;

        const documents = await HrmsDocument.find(filter).sort({ createdAt: -1 }).lean();
        return sendResponse(res, 200, 'Documents retrieved', documents);
    } catch (error) {
        next(error);
    }
};

/**
 * ADMIN: Get documents for a specific employee
 */
export const getEmployeeDocuments = async (req, res, next) => {
    try {
        const { employeeId } = req.params;
        const documents = await HrmsDocument.find({ employeeId }).sort({ createdAt: -1 }).lean();
        return sendResponse(res, 200, 'Documents retrieved', documents);
    } catch (error) {
        next(error);
    }
};

/**
 * ADMIN: Upload a document for an employee
 */
export const uploadDocument = async (req, res, next) => {
    try {
        const { employeeId, documentType, name, url, month, year, remarks } = req.body;

        if (!employeeId || !documentType || !name || !url) {
            return sendError(res, 400, 'Employee ID, document type, name, and URL are required');
        }

        const employee = await HrmsEmployee.findById(employeeId);
        if (!employee) return sendError(res, 404, 'Employee not found');

        const doc = new HrmsDocument({
            employeeId,
            documentType,
            name,
            url,
            month,
            year,
            uploadedBy: req.user.userId,
            remarks
        });

        await doc.save();
        return sendResponse(res, 201, 'Document uploaded successfully', doc);
    } catch (error) {
        next(error);
    }
};

/**
 * ADMIN: Delete a document
 */
export const deleteDocument = async (req, res, next) => {
    try {
        const { id } = req.params;
        const doc = await HrmsDocument.findByIdAndDelete(id);
        if (!doc) return sendError(res, 404, 'Document not found');

        return sendResponse(res, 200, 'Document deleted successfully');
    } catch (error) {
        next(error);
    }
};

/**
 * ADMIN: Get all documents
 */
export const getAllDocuments = async (req, res, next) => {
    try {
        const { documentType } = req.query;
        const filter = {};
        if (documentType) filter.documentType = documentType;

        const documents = await HrmsDocument.find(filter).sort({ createdAt: -1 }).lean();
        return sendResponse(res, 200, 'Documents retrieved', documents);
    } catch (error) {
        next(error);
    }
};
