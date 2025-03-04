import React from 'react';
import axios from 'axios';

const ApproveCoverageButton = ({ requestId }) => {
    const approveCoverage = async () => {
        try {
            const response = await axios.post('/api/approve-volunteer-coverage', { request_id: requestId });
            alert(response.data.message);
        } catch (error) {
            alert(`Error: ${error.response ? error.response.data.message : error.message}`);
        }
    };

    return (
        <button onClick={approveCoverage}>
            Approve Coverage
        </button>
    );
};

export default ApproveCoverageButton;