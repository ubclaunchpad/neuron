import React, { useState, useEffect } from "react";

import dayjs from "dayjs";
import CheckMarkIcon from "../assets/images/button-icons/check-mark-icon.svg";
import CancelIcon from "../assets/images/button-icons/x-icon.svg";

export const getCoverageButtonConfig = (shift, handleShiftUpdate) => {
  const shiftDay = dayjs(shift.shift_date).format("YYYY-MM-DD");
  const shiftStart = dayjs(`${shiftDay} ${shift.start_time}`);
  const shiftEnd = dayjs(`${shiftDay} ${shift.end_time}`);
  const currentDate = dayjs();

  // Accounts for a 30 minute window before and after the shift
  const pastShift = currentDate.isAfter(shiftEnd.add(30, "minutes"));
  const currentShift = currentDate.isBetween(
    shiftStart.subtract(30, "minutes"),
    shiftEnd.add(30, "minutes"),
    "minute",
    "[]"
  );

  return {
    resolved: {
      lineColor: "var(--grey)",
      label: "Approved by Admin",
      icon: null,
      iconColourClass: "icon-white",
      disabled: true,
      onClick: () => {},
    },
    pending: {
      lineColor: "var(--yellow)",
      label: "Approve",
      icon: CheckMarkIcon,
      iconColourClass: "icon-white",
      disabled: false,
      buttonClass: "coverage-primary-action",

      onClick: () => handleShiftUpdate(shift, "approve"),
    },
  };
};
