import React from 'react';
import { useAuth } from '../../contexts/authContext';
import './index.css';


function ShiftStatusToolbar({ setFilter, filter}) {
  const {isAdmin, isVolunteer} = useAuth();
  return (
    <div className="shift-status-container">
        <div>
            <p>Filter by Status:</p>
        </div>
        <div className="button-group">
            <button
              onClick={() => setFilter('all-shifts')}
              className={`all-shifts-button ${filter === 'all-shifts' ? 'selected' : ''}`}
            >
              <div className="button-icon"></div> All Shifts
            </button>
            {isVolunteer && (
              <>
                <button
                  onClick={() => setFilter('my-shifts')}
                  className={`my-shifts-button ${filter === 'my-shifts' ? 'selected' : ''}`}
                >
                  <div className="button-icon"></div> My Shifts
                </button>
                <button
                  onClick={() => setFilter('my-coverage-requests')}
                  className={`requested-coverage-button ${filter === 'my-coverage-requests' ? 'selected' : ''}`}
                >
                  <div className="button-icon"></div> My Absence Requests 
                </button>
                <button
                  onClick={() => setFilter('coverage')}
                  className={`needs-coverage-button ${filter === 'coverage' ? 'selected' : ''}`}
                >
                  <div className="button-icon"></div> Needs Coverage
                </button>
              </>
            )}
            {isAdmin && (
              <>
                <button
                  onClick={() => setFilter('requested_coverage')}
                  className={`requested-coverage-button ${filter === 'requested_coverage' ? 'selected' : ''}`}
                >
                  <div className="button-icon"></div> Absence Requests
                </button>
                <button
                  onClick={() => setFilter('needs_coverage')}
                  className={`needs-coverage-button ${filter === 'needs_coverage' ? 'selected' : ''}`}
                >
                  <div className="button-icon"></div> Needs Coverage
                </button>
                <button
                  onClick={() => setFilter('pending_fulfill')}
                  className={`pending-fulfill-button ${filter === 'pending_fulfill' ? 'selected' : ''}`}
                >
                  <div className="button-icon"></div> Coverage Pending
                </button>
                
              </>
            )}
        </div>
    </div>
  );
}

export default ShiftStatusToolbar;