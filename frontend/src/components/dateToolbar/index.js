import './index.css';
import React, { useState } from 'react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { StaticDatePicker } from '@mui/x-date-pickers/StaticDatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import Button from '@mui/material/Button';
import Popover from '@mui/material/Popover';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

function DateToolbar({ selectedDate, setSelectedDate }) {

    const [anchorEl, setAnchorEl] = useState(null);
    const handleDatePickerOpen = (event) => { setAnchorEl(event.currentTarget) };
    const handleDatePickerClose = () => { setAnchorEl(null) };
    const open = Boolean(anchorEl);
    const datePickerId = open ? 'date-picker-popover' : undefined;

    const setToCurrentDate = () => { setSelectedDate(dayjs()) };
    const incrementDate = () => { setSelectedDate((prevDate) => prevDate.add(1, 'day')) };
    const decrementDate = () => { setSelectedDate((prevDate) => prevDate.subtract(1, 'day')) };

    return (
        <div className="date-toolbar">
            {/* Date Navigation Buttons */}
            <div className="day-navigation">
                <Button onClick={setToCurrentDate}>Today</Button>
                <Button onClick={decrementDate} endIcon={<NavigateBeforeIcon />} />
                <Button onClick={incrementDate} endIcon={<NavigateNextIcon />} />
            </div>

            {/* Minimal Date Toolbar with Popover */}
            <LocalizationProvider dateAdapter={AdapterDayjs}>
                <Button
                    onClick={handleDatePickerOpen}
                    endIcon={<ExpandMoreIcon />}
                    >
                    {selectedDate.format('MMMM YYYY')}
                </Button>
                <Popover
                    id={datePickerId}
                    open={open}
                    anchorEl={anchorEl}
                    onClose={handleDatePickerClose}
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'left',
                    }}
                    >
                    <StaticDatePicker
                        displayStaticWrapperAs="desktop"
                        value={selectedDate}
                        onChange={(newDate) => {
                            setSelectedDate(newDate);
                        }}
                        minDate={dayjs().subtract(1, 'year')}
                        maxDate={dayjs().add(1, 'year')}
                    />
                </Popover>
            </LocalizationProvider>
        </div>
    );
}

export default DateToolbar;