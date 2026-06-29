import mongoose from 'mongoose';

/**
 * HRMS Document Management
 * Stores all employee documents: offer letters, payslips, KYC, certificates, etc.
 */
const hrmsDocumentSchema = new mongoose.Schema(
    {
        employeeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'HrmsEmployee',
            required: true
        },
        documentType: {
            type: String,
            required: true,
            trim: true
            // e.g., 'Offer Letter', 'Payslip', 'Aadhaar', 'PAN', 'Certificate', 'Other'
        },
        name: {
            type: String,
            required: true,
            trim: true
        },
        url: {
            type: String,
            required: true
        },
        publicId: { type: String }, // Cloudinary public ID for deletion

        // For payslips — month/year reference
        month: { type: Number }, // 1-12
        year: { type: Number },

        // Metadata
        fileSize: { type: Number }, // bytes
        mimeType: { type: String },
        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'FoodAdmin'
        },
        isVerified: { type: Boolean, default: false },
        remarks: { type: String, trim: true }
    },
    {
        timestamps: true,
        collection: 'hrms_documents'
    }
);

hrmsDocumentSchema.index({ employeeId: 1 });
hrmsDocumentSchema.index({ documentType: 1 });
hrmsDocumentSchema.index({ employeeId: 1, documentType: 1 });

export const HrmsDocument = mongoose.model('HrmsDocument', hrmsDocumentSchema, 'hrms_documents');
