import { Response } from 'express';
import { AuthenticatedRequest } from '../common/types.js';
import { coverageModel } from '../config/models.js';
import { adminApprovesDeniesAbsence, adminApprovesDeniesCoverage, adminClicksNotifyInstructorForAbsence, adminClicksNotifyInstructorForCoverage, notifyVolunteersForShiftCoverage, volunteerRequestingCoverage, volunterRequestingAbsence } from '../utils/emailUtil.js';

// volunteer requesting to cover someone else’s open shift
async function requestCoverShift(req: AuthenticatedRequest, res: Response) {
    const { request_id } = req.params;
    const { volunteer_id } = req.body;

    await coverageModel.insertCoverageRequest(Number(request_id), volunteer_id);

    // send email to admins
    await volunteerRequestingCoverage(Number(request_id), volunteer_id);

    res.sendStatus(200);
}

// volunteer cancels on covering a shift
async function withdrawCoverShift(req: AuthenticatedRequest, res: Response) {
    const { request_id, volunteer_id } = req.params;

    if (req.volunteer?.volunteer_id !== volunteer_id) {
        res.sendStatus(403);
    }

    await coverageModel.deleteCoverageRequest(Number(request_id), volunteer_id);

    res.sendStatus(200);
}

async function approveCoverShift(req: AuthenticatedRequest, res: Response) {
    const { request_id, volunteer_id } = req.params;
    const { signoff } = req.body;

    await coverageModel.approveCoverageRequest(Number(request_id), volunteer_id, signoff);

    // send email to volunteer who requested coverage
    await adminApprovesDeniesCoverage(Number(request_id), volunteer_id, "approved");

    // send email to instructor of the class
    await adminClicksNotifyInstructorForCoverage(Number(request_id), volunteer_id);

    res.sendStatus(200);
}

async function rejectCoverShift(req: AuthenticatedRequest, res: Response) {
    const { request_id, volunteer_id } = req.params;
    const { signoff } = req.body;

    // send email to volunteer who requested coverage
    // Sending before deleting the request to ensure the email is sent even if the request is not found
    await adminApprovesDeniesCoverage(Number(request_id), volunteer_id, "denied");

    await coverageModel.denyCoverageRequest(Number(request_id), volunteer_id, signoff);

    res.sendStatus(200);
}

// volunteer requests absence for their own shift
async function requestAbsence(req: AuthenticatedRequest, res: Response) {
    const { shift_id } = req.params; 
    const request = req.body; 

    await coverageModel.insertAbsenceRequest(Number(shift_id), request);
    // send email to admins
    await volunterRequestingAbsence(Number(shift_id));

    res.sendStatus(200);
}

// volunteers cancels their request for shift absence
async function withdrawAbsenceRequest(req: AuthenticatedRequest, res: Response) {
    const { request_id } = req.params;

    const absenceRequest = await coverageModel.getAbsenceRequest(Number(request_id));

    // 403 if volunteer is not the one who made the request
    if (absenceRequest.volunteer_id !== req.volunteer?.volunteer_id) {
        res.sendStatus(403);
    }

    await coverageModel.deleteAbsenceRequest(Number(request_id));

    res.sendStatus(200);
}

async function approveAbsenceRequest(req: AuthenticatedRequest, res: Response) {
    const { request_id } = req.params;
    const { signoff } = req.body;

    await coverageModel.approveAbsenceRequest(Number(request_id), signoff);

    // send email to volunteer who requested absence
    await adminApprovesDeniesAbsence(Number(request_id), "approved");

    // send email to instructor of the class
    await adminClicksNotifyInstructorForAbsence(Number(request_id));

    // send email to all volunteers to notify them that a shift needs coverage
    await notifyVolunteersForShiftCoverage(Number(request_id));

    res.sendStatus(200);
}

async function rejectAbsenceRequest(req: AuthenticatedRequest, res: Response) {
    const { request_id } = req.params;
    const { signoff } = req.body;

    // send email to volunteer who requested absence
    // Sending before deleting the request to ensure the email is sent even if the request is not found
    await adminApprovesDeniesAbsence(Number(request_id), "denied");

    await coverageModel.denyAbsenceRequest(Number(request_id), signoff);

    res.sendStatus(200);
}

export {
    approveAbsenceRequest,
    approveCoverShift,
    rejectAbsenceRequest,
    rejectCoverShift,
    requestAbsence,
    requestCoverShift,
    withdrawAbsenceRequest,
    withdrawCoverShift
};

