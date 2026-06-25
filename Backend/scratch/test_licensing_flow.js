import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { submitLicensingRequestService, getAllLicensingRequestsService, getLicensingRequestByIdService, updateLicensingStatusService, deleteLicensingRequestService } from '../src/modules/food/licensing/services/licensingService.js';
import { LicensingRequest } from '../src/modules/food/licensing/models/LicensingRequest.js';
import { FoodUser } from '../src/core/users/user.model.js';
import { FoodAdmin } from '../src/core/admin/admin.model.js';

dotenv.config({ path: 'e:/itzo folder/itzo/Backend/.env' });

async function assert(condition, message) {
    if (!condition) {
        throw new Error(`Assertion Failed: ${message}`);
    }
    console.log(`✅ [ASSERT] ${message}`);
}

async function runTests() {
    console.log('Connecting to database...');
    await connectDB();
    console.log('Connected.');

    // 1. Cleanup old test requests and admins
    await LicensingRequest.deleteMany({ email: 'test_licensing_flow@example.com' });
    await FoodAdmin.deleteMany({ email: 'test_admin_licensing@example.com' });
    console.log('Cleaned up previous test requests and test admin.');

    // Create test admin
    const mockAdmin = await FoodAdmin.create({
        email: 'test_admin_licensing@example.com',
        password: 'password123',
        name: 'Test Licensing Admin'
    });

    // 2. Submit new request
    console.log('Submitting licensing request...');
    const mockData = {
        vendor: 'Plans4U',
        restaurantName: 'Test Food Oasis',
        ownerName: 'Test Owner',
        city: 'Mumbai',
        address: '123 Test Street, Mumbai',
        restaurantId: '6a353dac196d70ba0fd03813',
        gstNumber: '27AAAAA1111A1Z1',
        mobile: '9876543210',
        email: 'test_licensing_flow@example.com',
        selectedLicenses: ['FSSAI License', 'GST Registration', 'Other'],
        otherLicenseText: 'Music License',
        termsAccepted: true
    };

    const request = await submitLicensingRequestService(mockData, {});
    await assert(request._id !== undefined, 'Request should be created with an ID');
    await assert(request.status === 'Pending', 'Default status should be Pending');
    await assert(request.selectedLicenses.includes('FSSAI License'), 'Licenses should be stored correctly');
    await assert(request.otherLicenseText === 'Music License', 'Other license text should be stored correctly');

    // 3. Test duplication block (should throw ValidationError)
    console.log('Testing duplicate submission...');
    try {
        await submitLicensingRequestService(mockData, {});
        throw new Error('Allowed duplicate submission, should have thrown ValidationError');
    } catch (error) {
        await assert(error.name === 'ValidationError', 'Duplication should throw ValidationError');
        await assert(error.message.includes('already submitted'), 'Error message should explain duplication');
    }

    // 4. Test fetch all requests with pagination, search, and filters
    console.log('Testing requests retrieval...');
    const searchResult = await getAllLicensingRequestsService({
        search: 'Oasis',
        vendor: 'Plans4U',
        status: 'Pending',
        limit: 10,
        page: 1
    });
    await assert(searchResult.requests.length > 0, 'Should find the submitted request via search');
    await assert(searchResult.total >= 1, 'Total count should be at least 1');
    await assert(searchResult.stats.pending >= 1, 'Stats pending count should be updated');

    // 5. Test retrieve details by ID
    console.log('Testing get by ID...');
    const details = await getLicensingRequestByIdService(request._id);
    await assert(details.restaurantName === 'Test Food Oasis', 'Details should match restaurantName');
    await assert(details.uploadedDocuments.otherDocs.length === 0, 'Uploaded documents should be empty');

    // 6. Test update status & remarks
    console.log('Testing status transition...');
    const updated = await updateLicensingStatusService(
        request._id,
        'In Progress',
        'Consultant reached out via phone to test owner.',
        mockAdmin._id
    );
    await assert(updated.status === 'In Progress', 'Status should be updated to In Progress');
    await assert(updated.adminRemarks === 'Consultant reached out via phone to test owner.', 'Remarks should be updated');
    await assert(updated.reviewedBy._id.toString() === mockAdmin._id.toString(), 'ReviewedBy admin ID should match');

    // 7. Test delete request
    console.log('Testing delete request...');
    const deleted = await deleteLicensingRequestService(request._id);
    await assert(deleted === true, 'Delete request should return true');
    await FoodAdmin.deleteOne({ _id: mockAdmin._id });

    try {
        await getLicensingRequestByIdService(request._id);
        throw new Error('Deleted request is still retrievable');
    } catch (error) {
        await assert(error.name === 'NotFoundError', 'Retrieving deleted request should throw NotFoundError');
    }

    console.log('\n⭐⭐⭐ ALL LICENSING BACKEND INTEGRATION TESTS PASSED SUCCESSFULLY ⭐⭐⭐\n');
}

runTests()
    .then(async () => {
        await disconnectDB();
        process.exit(0);
    })
    .catch(async (err) => {
        console.error('❌ Test execution failed:', err);
        await disconnectDB();
        process.exit(1);
    });
