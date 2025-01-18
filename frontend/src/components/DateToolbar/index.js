import "./index.css";
import React, { useState } from "react";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { StaticDatePicker } from "@mui/x-date-pickers/StaticDatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { Popover, Button } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

function DateToolbar({ selectedDate, setSelectedDate, setViewMode }) {
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
            <div className="left-nav">
                <div className="nav-group">
                    <button className="calendar-btn">Today</button>
                    <div className="nav-group">
                        <button className="calendar-btn calendar-btn-icon">
                            <i class="fa-solid fa-chevron-left"></i>
                        </button>
                        <button className="calendar-btn calendar-btn-icon">
                            <i class="fa-solid fa-chevron-right"></i>
                        </button>
                    </div>
                </div>
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
                <select onChange={(e) => setViewMode(e.target.value)}>
                    <option value="list">List</option>
                    <option value="week">Week</option>
                </select>
            </div>
        </div>
    );
}

export default DateToolbar;
