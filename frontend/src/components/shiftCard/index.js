import React from 'react';
import './index.css'; 
import { Card, CardContent, Typography, Box, Button } from '@mui/material';
import Grid from '@mui/material/Grid2';

function ShiftCard({ shift }) {
    return (
        // <Card className="shift-card" variant="outlined">
        //     <CardContent className="card-content"> {/* Apply CSS class here */}
        //         <Box sx={{ flexGrow: 1 }} className="card-box">
        //             <Grid container spacing={2}>
        //                 {/* Vertical Colored Line */}
        //                 <Grid item xs={1}>
        //                     <Box className="vertical-line" />
        //                 </Grid>

        //                 {/* Segment 1: Shift ID */}
        //                 <Grid item xs={2}>
        //                     <Typography variant="h6">Shift ID</Typography>
        //                     <Typography variant="body2">{shift.fk_schedule_id}</Typography>
        //                 </Grid>

        //                 {/* Segment 2: Description */}
        //                 <Grid item xs={9}>
        //                     <Typography variant="h6">Description</Typography>
        //                     <Typography variant="body2">Some description text here</Typography>
        //                 </Grid>
        //             </Grid>
        //         </Box>
        //     </CardContent>
        // </Card>

        <div className="shift-card"> {/* Use a div for the card */}
            <div className="vertical-line" />
            <div className="card-content"> {/* Content container */}
                <div className="segment segment-1">
                    <h6>Shift ID</h6>
                    <p>{shift.fk_schedule_id}</p>
                </div>
                <div className="segment segment-2">
                    <h6>Description</h6>
                    <p>Some description text here</p>
                </div>
            </div>
        </div>
    );
}

export default ShiftCard;