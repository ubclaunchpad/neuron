import { body, param } from 'express-validator';
import { RouteDefinition } from "../common/types.js";
import { isAdmin, isAuthorized } from '../config/authCheck.js';
import {
  getAbsenceRequests,
  getCoverageRequests,
  approveAbsenceRequest,
  approveCoverShift,
  rejectAbsenceRequest,
  rejectCoverShift,
  requestCoverShift,
  withdrawAbsenceRequest,
  withdrawCoverShift,
} from "../controllers/coverageController.js";

export const CoverageRoutes: RouteDefinition = {
  path: "/absence/:request_id",
  middleware: [isAuthorized, isAdmin],
  validation: [param("request_id").isInt({ min: 0 })],
  children: [
    {
      path: "",
      method: "get",
      action: getAbsenceRequests,
    },
    {
      path: "/approve",
      method: "put",
      middleware: [isAdmin],
      action: approveAbsenceRequest,
    },
    {
      path: "/reject",
      method: "delete",
      middleware: [isAdmin],
      action: rejectAbsenceRequest,
    },
    {
      path: "/withdraw",
      method: "delete",
      action: withdrawAbsenceRequest,
    },
    {
      path: "/coverage",
      method: "post",
      validation: [body("volunteer_id").isUUID()],
      action: requestCoverShift,
    },
    {
      path: "/coverage",
      method: "get",
      action: getCoverageRequests,
    },
    {
      path: "/coverage/:volunteer_id",
      validation: [param("volunteer_id").isUUID()],
      children: [
        {
          path: "/approve",
          method: "put",
          middleware: [isAdmin],
          action: approveCoverShift,
        },
        {
          path: "/reject",
          method: "delete",
          middleware: [isAdmin],
          action: rejectCoverShift,
        },
        {
          path: "/withdraw",
          method: "delete",
          action: withdrawCoverShift,
        },
      ],
    },
  ],
};