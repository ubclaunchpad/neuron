// backend/src/server.js
const express = require('express');
const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());

app.get('/api/volunteer/shifts/:month', (req, res) => {
    const month = req.params.month;
    // Fetch and return volunteer shifts for the given month
    res.json({ message: `Shifts for month: ${month}` });
});

app.get('/api/volunteer/:volunteer_id', (req, res) => {
    const volunteerId = req.params.volunteer_id;
    // Fetch and return volunteer data for the given ID
    res.json({ message: `Data for volunteer ID: ${volunteerId}` });
});

app.get('/api/user/:user_id', (req, res) => {
    const userId = req.params.user_id;
    // Fetch and return user data for the given ID
    res.json({ message: `Data for user ID: ${userId}` });
});

app.put('/api/volunteer/:volunteer_id', (req, res) => {
    const volunteerId = req.params.volunteer_id;
    const volunteerData = req.body;
    // Update and return volunteer data for the given ID
    res.json({ message: `Updated data for volunteer ID: ${volunteerId}`, data: volunteerData });
});

app.post('/api/user/:userId/upload', (req, res) => {
    const userId = req.params.userId;
    const profilePicData = req.body;
    // Handle profile picture upload
    res.json({ message: `Profile picture uploaded for user ID: ${userId}`, data: profilePicData });
});

app.get('/api/volunteer/availability/:volunteer_id', (req, res) => {
    const volunteerId = req.params.volunteer_id;
    // Fetch and return volunteer availability for the given ID
    res.json({ message: `Availability for volunteer ID: ${volunteerId}` });
});

app.post('/api/volunteer/availability/:volunteer_id', (req, res) => {
    const volunteerId = req.params.volunteer_id;
    const availability = req.body;
    // Set and return volunteer availability for the given ID
    res.json({ message: `Set availability for volunteer ID: ${volunteerId}`, data: availability });
});

app.put('/api/volunteer/availability/:volunteer_id', (req, res) => {
    const volunteerId = req.params.volunteer_id;
    const availability = req.body;
    // Update and return volunteer availability for the given ID
    res.json({ message: `Updated availability for volunteer ID: ${volunteerId}`, data: availability });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});