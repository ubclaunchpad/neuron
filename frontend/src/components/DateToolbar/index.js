import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Button, Popover } from "@mui/material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { StaticDatePicker } from "@mui/x-date-pickers/StaticDatePicker";
import dayjs from "dayjs";
import React, { useState } from "react";
import Select from "react-select";
import "./index.css";

function DateToolbar({ selectedDate, setSelectedDate, viewMode, setViewMode, nextWeek, previousWeek, goToToday }) {
    const [anchorEl, setAnchorEl] = useState(null);
    const handleDatePickerOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };
    const handleDatePickerClose = () => {
        setAnchorEl(null);
    };
    const open = Boolean(anchorEl);
    const datePickerId = open ? "date-picker-popover" : undefined;

    return (
        <div className="date-toolbar">
            <div className="left-nav nav-group">
                {viewMode === "week" && (<>
                        <button className="calendar-btn" onClick={goToToday}>
                            Today
                        </button>
                        <div className="nav-group">
                            <button className="calendar-btn calendar-btn-icon" onClick={previousWeek}>
                                <i className="fa-solid fa-chevron-left"></i>
                            </button>
                            <button className="calendar-btn calendar-btn-icon" onClick={nextWeek}>
                                <i className="fa-solid fa-chevron-right"></i>
                            </button>
                        </div>
                    </>
                )}
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <Button onClick={handleDatePickerOpen} endIcon={<ExpandMoreIcon />}>
                        {selectedDate.format("MMMM YYYY")}
                    </Button>
                    <Popover
                        id={datePickerId}
                        open={open}
                        anchorEl={anchorEl}
                        onClose={handleDatePickerClose}
                        anchorOrigin={{
                            vertical: "bottom",
                            horizontal: "left",
                        }}
                    >
                        <StaticDatePicker
                            displayStaticWrapperAs="desktop"
                            value={selectedDate}
                            onChange={(newDate) => setSelectedDate(newDate)}
                            minDate={dayjs().subtract(1, "year")}
                            maxDate={dayjs().add(1, "year")}
                        />
                    </Popover>
                </LocalizationProvider>
            </div>
            <div className="right-nav">
                <Select
                    options={[
                        {
                            value: "list",
                            label: (
                                <span>
                                    <i className="fa-solid fa-table-list"></i>&nbsp;List
                                </span>
                            ),
                        },
                        {
                            value: "week",
                            label: (
                                <span>
                                    <i className="fa-solid fa-calendar-week"></i>&nbsp;Week
                                </span>
                            ),
                        },
                    ]}
                    defaultValue={{
                        value: "list",
                        label: (
                            <span>
                                <i className="fa-solid fa-table-list"></i>&nbsp;List
                            </span>
                        ),
                    }}
                    isSearchable={false}
                    onChange={(selectedOption) => setViewMode(selectedOption.value)}
                    className="view-mode-select"
                    classNamePrefix={"viewMode"}
                    name="viewMode"
                />
            </div>
        </div>
    );
}

export default DateToolbar;
