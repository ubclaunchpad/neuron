import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import dayjs from "dayjs";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWeekView } from "react-weekview";
import {
  approveAbsenceRequest,
  approveCoverageRequest,
  rejectAbsenceRequest,
  rejectCoverageRequest,
} from "../../api/coverageService";
import { getShifts } from "../../api/shiftService";
import AbsenceModal from "../../components/AbsenceModal";
import AbsenceRequestCard from "../../components/AbsenceRequestCard";
import CalendarView from "../../components/CalendarView";
import CoverageDetailsPanel from "../../components/CoverageDetailsPanel";
import CoverageModal from "../../components/CoverageModal";
import CoverageRequestCard from "../../components/CoverageRequestCard";
import Notifications from "../../components/Notifications";
import { getCoverageButtonConfig } from "../../utils/coverageButtonConfig";
import "./index.css";

function CoverageRequests() {
  const currentDate = dayjs();
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [shifts, setShifts] = useState([]);
  const [coverageShifts, setCoverageShifts] = useState([]);
  const [selectedShift, setSelectedShift] = useState(null);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [selectedShiftButtons, setSelectedShiftButtons] = useState([]);
  const [selectedShiftDetails, setShiftDetails] = useState(null);
  const [viewMode, setViewMode] = useState("list");
  const [tab, setTab] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [approve, setApprove] = useState(false);
  const [selectedCoverage, setSelectedCoverage] = useState(null);
  const { days, initialDate, nextWeek, previousWeek, goToToday } =
    useWeekView();
  const navigate = useNavigate();

  // Create a ref object to store references to each shifts-container for scrolling
  const shiftRefs = useRef({});
  const scheduleContainerRef = useRef(null);

  const fetchAbsenceShifts = useCallback(async () => {
    const params = {
      after: selectedDate.startOf("month").format("YYYY-MM-DD"),
      before: selectedDate.endOf("month").format("YYYY-MM-DD"),
      type: "absence",
    };
    const response = await getShifts(params);

    // Filter out duplicated shifts and past absence requests
    const coverageShiftMap = new Map();
    response.forEach((shift) => {
      const shiftDay = dayjs(shift.shift_date).format("YYYY-MM-DD");
      const shiftEnd = dayjs(`${shiftDay} ${shift.end_time}`);
      const pastShift = currentDate.isAfter(shiftEnd);
      if (!pastShift) {
        coverageShiftMap.set(shift.shift_id, shift);
      }
    });
    const uniqueShifts = Array.from(coverageShiftMap.values());

    // Filter shifts based on selected filter type
    setShifts(uniqueShifts);
  }, [selectedDate, showModal]);

  const fetchCoverageShifts = useCallback(async () => {
    const params = {
      after: selectedDate.startOf("month").format("YYYY-MM-DD"),
      before: selectedDate.endOf("month").format("YYYY-MM-DD"),
      type: "coverage",
    };
    const response = await getShifts(params);
    // Filter out duplicated shifts and past coverage requests
    const coverageShiftMap = new Map();
    response.forEach((shift) => {
      const shiftDay = dayjs(shift.shift_date).format("YYYY-MM-DD");
      const shiftEnd = dayjs(`${shiftDay} ${shift.end_time}`);
      const pastShift = currentDate.isAfter(shiftEnd);

      if (!pastShift) {
        coverageShiftMap.set(shift.shift_id, shift);
      }
    });
    const uniqueShifts = Array.from(coverageShiftMap.values());

    // Filter shifts based on selected filter type
    setCoverageShifts(uniqueShifts);
  }, [selectedDate, showModal]);

  // Fetch shifts for the selected date
  useEffect(() => {
    const fetchData = async () => {
      await fetchAbsenceShifts();
      await fetchCoverageShifts();
    };
    fetchData();
  }, [fetchAbsenceShifts, fetchCoverageShifts]);

  // map of shifts grouped by date { date: [shift1, shift2, ...] }
  const groupedAbsenceShifts = shifts.reduce((acc, shift) => {
    const date = shift.shift_date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(shift);
    return acc;
  }, {});

  const groupedCoverageShifts = coverageShifts.reduce((acc, shift) => {
    const date = shift.shift_date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(shift);
    return acc;
  }, {});

  // Creates the buttons for the details panel based on the shift type
  const generateButtonsForDetailsPanel = (shift) => {
    const buttonConfig = getCoverageButtonConfig(shift, handleShiftButton);
    const buttons =
      tab === 1
        ? shift.absence_request.status === "absence-pending"
          ? [buttonConfig.available, buttonConfig.decline]
          : [buttonConfig.approved]
        : shift.absence_request.status === "coverage-pending"
          ? [buttonConfig.available, buttonConfig.decline]
          : [buttonConfig.approved];

    return buttons;
  };

  const getRequestorName = (shift) => {
    if (shift) {
      const f_name =
        shift.absence_request.request_f_name || shift.volunteer_f_name;
      const l_name =
        shift.absence_request.request_l_name || shift.volunteer_l_name;
      return `${f_name} ${l_name}`;
    }
    return "";
  };

  const handleShiftButton = (shift, action) => {
    setSelectedShift(shift);
    setShowModal(true);
    if (action === "approve") {
      setApprove(true);
    } else if (action === "decline") {
      setApprove(false);
    }
  };

  // Update state when we update a shift
  const handleShiftUpdate = (newShift, action) => {
    if (tab === 1) {
      setShifts((staleShifts) => {
        return staleShifts.map((shift) => {
          if (shift.shift_id === newShift.shift_id) {
            return newShift;
          }
          return shift;
        });
      });
    } else {
      setCoverageShifts((staleShifts) => {
        return staleShifts.map((shift) => {
          if (shift.shift_id === newShift.shift_id) {
            return newShift;
          }
          return shift;
        });
      });
    }

    // Triggers a re-render of the details panel
    handleShiftSelection(newShift);
  };

  // Update details panel when a shift is selected
  const handleShiftSelection = (classData) => {
    console.log(classData);
    setSelectedClassId(classData.class_id);
    setSelectedShiftButtons(generateButtonsForDetailsPanel(classData));
    setShiftDetails(classData);
  };

  const scrollToTop = useCallback(() => {
    const targetDate = selectedDate.format("YYYY-MM-DD");
    const scheduleContainer = scheduleContainerRef.current;
    const targetElement = shiftRefs.current[targetDate];

    if (scheduleContainer && targetElement) {
      // Calculate the offset of the target element within scheduleContainerRef
      const offsetTop = targetElement.offsetTop - scheduleContainer.offsetTop;
      scheduleContainer.scrollTo({
        top: offsetTop,
        behavior: "smooth",
      });
    }
  }, [selectedDate]); // Scroll to top when selectedDate changes

  const handleAbsenceApprove = (shift, initials) => {
    setApprove(false);
    approveAbsenceRequest(shift.absence_request.request_id, initials)
      .then(() => {
        console.log("Absence request approved successfully");
        window.location.reload();
      })
      .catch((error) => {
        console.error("Error approving absence request:", error);
      });
  };

  const handleCoverageApprove = (shift, initials) => {
    setApprove(false);
    approveCoverageRequest(
      shift.absence_request.request_id,
      shift.absence_request.covering_volunteer_id,
      initials
    )
      .then(() => {
        console.log("Coverage request approved successfully");
        window.location.reload();
      })
      .catch((error) => {
        console.error("Error approving coverage request:", error);
      });
  };

  const handleAbsenceDecline = (shift, initials) => {
    rejectAbsenceRequest(shift.absence_request.request_id, initials)
      .then(() => {
        console.log("Absence request declined successfully");
        window.location.reload();
      })
      .catch((error) => {
        console.error("Error declining absence request:", error);
      });
  };

  const handleCoverageDecline = (shift, initials) => {
    rejectCoverageRequest(
      shift.absence_request.request_id,
      shift.absence_request.covering_volunteer_id,
      initials
    )
      .then(() => {
        console.log("Coverage request declined successfully");
        window.location.reload();
      })
      .catch((error) => {
        console.error("Error declining coverage request:", error);
      });
  };

  useEffect(() => {
    scrollToTop();
  }, [scrollToTop, groupedAbsenceShifts, groupedCoverageShifts]);

  return (
    <main className="content-container">
      <div className="content-heading">
        <h2 className="content-title">Coverage Requests</h2>
        <Notifications />
      </div>
      <div className="content-heading">
        <div className="coverage-date-picker">
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              views={["month", "year"]}
              sx={{
                fontSize: "16px",
                color: "var(--primary-blue)",
              }}
              value={selectedDate}
              onChange={(newValue) => setSelectedDate(newValue.date(1))}
            />
          </LocalizationProvider>
        </div>
      </div>
      <hr />
      <CoverageDetailsPanel
        classId={selectedClassId}
        classList={tab === 1 ? shifts : coverageShifts}
        setClassId={setSelectedClassId}
        shiftDetails={selectedShiftDetails}
        dynamicShiftButtons={selectedShiftButtons}
        requestName={getRequestorName(selectedShiftDetails)}
      >
        <div className="coverage-schedule-page">
          {viewMode === "list" ? (
            <>
              <div className="coverage-tabs">
                <div
                  className={"coverage-tab".concat(
                    tab == 1 ? " coverage-active-tab" : ""
                  )}
                  onClick={() => {
                    setTab(1);
                  }}
                >
                  Request for Shift Absence
                </div>
                <div
                  className={"coverage-tab".concat(
                    tab == 2 ? " coverage-active-tab" : ""
                  )}
                  onClick={() => {
                    setTab(2);
                    // setSelectedClassId(null);
                    // setSelectedShiftButtons(null);
                    // setShiftDetails(null);
                  }}
                >
                  Request to Fulfill Coverage
                </div>
              </div>
              <hr />
              <div
                ref={scheduleContainerRef}
                className="coverage-schedule-container"
              >
                {tab === 1 ? (
                  Object.keys(groupedAbsenceShifts).length > 0 ? (
                    Object.keys(groupedAbsenceShifts).map((date) => (
                      <div
                        key={date}
                        className="coverage-shifts-container"
                        ref={(el) =>
                          (shiftRefs.current[dayjs(date).format("YYYY-MM-DD")] =
                            el)
                        }
                      >
                        {/* Date Header */}
                        <h2
                          className={`coverage-date-header ${
                            dayjs(date).isSame(selectedDate, "day")
                              ? "coverage-selected-date"
                              : "coverage-non-selected-date"
                          }`}
                        >
                          {dayjs(date).format("ddd, D")}
                          {dayjs(date).isSame(currentDate, "day") && " | Today"}
                        </h2>

                        {/* Shift List for this date */}
                        <div className="coverage-shift-list">
                          {groupedAbsenceShifts[date].map((shift) => (
                            <AbsenceRequestCard
                              key={shift.fk_schedule_id}
                              shift={shift}
                              onShiftSelect={handleShiftSelection}
                              buttonConfig={getCoverageButtonConfig(
                                shift,
                                handleShiftButton
                              )}
                            />
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p>No shifts to display for this month.</p>
                  )
                ) : Object.keys(groupedCoverageShifts).length > 0 ? (
                  Object.keys(groupedCoverageShifts).map((date) => (
                    <div
                      key={date}
                      className="coverage-shifts-container"
                      ref={(el) =>
                        (shiftRefs.current[dayjs(date).format("YYYY-MM-DD")] =
                          el)
                      }
                    >
                      {/* Date Header */}
                      <h2
                        className={`coverage-date-header ${
                          dayjs(date).isSame(selectedDate, "day")
                            ? "coverage-selected-date"
                            : "coverage-non-selected-date"
                        }`}
                      >
                        {dayjs(date).format("ddd, D")}
                        {dayjs(date).isSame(currentDate, "day") && " | Today"}
                      </h2>

                      {/* Shift List for this date */}
                      <div className="coverage-shift-list">
                        {groupedCoverageShifts[date].map((shift) => (
                          <CoverageRequestCard
                            key={shift.fk_schedule_id}
                            shift={shift}
                            onShiftSelect={handleShiftSelection}
                            buttonConfig={getCoverageButtonConfig(
                              shift,
                              handleShiftButton
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <p>No shifts to display for this month.</p>
                )}
              </div>
            </>
          ) : (
            <CalendarView
              days={days}
              shifts={shifts}
              initialDate={initialDate}
              onShiftSelect={handleShiftSelection}
            />
          )}
        </div>
      </CoverageDetailsPanel>
      {showModal && (
        <div className="coverage-modal-container">
          {tab === 1 ? (
            <AbsenceModal
              approve={approve}
              setShowModal={setShowModal}
              shift={selectedShift}
              selectedCoverage={selectedCoverage}
              handleApprove={handleAbsenceApprove}
              handleDecline={handleAbsenceDecline}
            />
          ) : (
            <CoverageModal
              approve={approve}
              setShowModal={setShowModal}
              shift={selectedShift}
              handleApprove={handleCoverageApprove}
              handleDecline={handleCoverageDecline}
            />
          )}
        </div>
      )}
    </main>
  );
}

export default CoverageRequests;
