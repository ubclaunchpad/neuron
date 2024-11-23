import './index.css';
import React, { useState } from 'react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { StaticDatePicker } from '@mui/x-date-pickers/StaticDatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { Popover, Button } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

function DateToolbar({ selectedDate, setSelectedDate }) {
    const [anchorEl, setAnchorEl] = useState(null);
    const handleDatePickerOpen = (event) => { setAnchorEl(event.currentTarget) };
    const handleDatePickerClose = () => { setAnchorEl(null) };
    const open = Boolean(anchorEl);
    const datePickerId = open ? 'date-picker-popover' : undefined;

    return (
        <div className="date-toolbar">
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
                        onChange={(newDate) => setSelectedDate(newDate)}
                        minDate={dayjs().subtract(1, 'year')}
                        maxDate={dayjs().add(1, 'year')}
                    />
                </Popover>
            </LocalizationProvider>
        </div>
    );
}

export default DateToolbar;