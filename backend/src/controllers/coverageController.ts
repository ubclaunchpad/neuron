import { Response } from 'express';
import { AuthenticatedRequest } from '../common/types.js';
import { coverageModel } from '../config/models.js';

// volunteer requesting to cover someone else’s open shift
async function requestCoverShift(req: AuthenticatedRequest, res: Response) {
    const { request_id } = req.params;
    const { volunteer_id } = req.body;

    await coverageModel.insertCoverageRequest(Number(request_id), volunteer_id);

    res.sendStatus(200);
}

// volunteer cancels on covering a shift
async function withdrawCoverShift(req: AuthenticatedRequest, res: Response) {
    const { request_id, volunteer_id } = req.params;

    await coverageModel.deleteCoverageRequest(Number(request_id), volunteer_id);

    res.sendStatus(200);
}

async function approveCoverShift(req: AuthenticatedRequest, res: Response) {
    const { request_id, volunteer_id } = req.params;

    await coverageModel.approveCoverageRequest(Number(request_id), volunteer_id);

    res.sendStatus(200);
}

async function rejectCoverShift(req: AuthenticatedRequest, res: Response) {
    const { request_id, volunteer_id } = req.params;

    await coverageModel.deleteCoverageRequest(Number(request_id), volunteer_id);

    res.sendStatus(200);
}

// volunteer requests absence for their own shift
async function requestAbsence(req: AuthenticatedRequest, res: Response) {
    const { shift_id } = req.params; 
    const data = req.body; 

    coverageModel.insertAbsenceRequest(Number(shift_id), data);

    res.sendStatus(200);
}

// volunteers cancels their request for shift absence
async function withdrawAbsenceRequest(req: AuthenticatedRequest, res: Response) {
    const { request_id } = req.params;

    await coverageModel.deleteAbsenceRequest(Number(request_id));

    res.sendStatus(200);
}

async function approveAbsenceRequest(req: AuthenticatedRequest, res: Response) {
    const { request_id } = req.params;

    await coverageModel.approveAbsenceRequest(Number(request_id));

    res.sendStatus(200);
}

async function rejectAbsenceRequest(req: AuthenticatedRequest, res: Response) {
    const { request_id } = req.params;

    await coverageModel.deleteAbsenceRequest(Number(request_id));

    res.sendStatus(200);
}

async function getAbsenceRequests(req: AuthenticatedRequest, res: Response) {
  const results = await coverageModel.getAbsenceRequests();
  res.json(results);
}

async function getCoverageRequests(req: AuthenticatedRequest, res: Response) {
  const results = await coverageModel.getCoverageRequests();
  res.json(results);
}

export {
  getAbsenceRequests,
  getCoverageRequests,
  approveAbsenceRequest,
  approveCoverShift,
  rejectAbsenceRequest,
  rejectCoverShift,
  requestAbsence,
  requestCoverShift,
  withdrawAbsenceRequest,
  withdrawCoverShift,
};

