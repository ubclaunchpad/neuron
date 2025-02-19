import React from 'react';
import './index.css';

function ShiftStatusToolbar({ setFilter, filter, userType }) {
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
            {userType === 'volunteer' && (
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
                  <div className="button-icon"></div> Requested Coverage
                </button>
                <button
                  onClick={() => setFilter('coverage')}
                  className={`needs-coverage-button ${filter === 'coverage' ? 'selected' : ''}`}
                >
                  <div className="button-icon"></div> Needs Coverage
                </button>
              </>
            )}
            {userType === 'admin' && (
              <>
                <button
                  onClick={() => setFilter('needs_coverage')}
                  className={`needs-coverage-button ${filter === 'needs_coverage' ? 'selected' : ''}`}
                >
                  <div className="button-icon"></div> Needs Coverage
                </button>
                <button
                  onClick={() => setFilter('requested_coverage')}
                  className={`requested-coverage-button ${filter === 'requested_coverage' ? 'selected' : ''}`}
                >
                  <div className="button-icon"></div> Request for Shift Coverage
                </button>
                <button
                  onClick={() => setFilter('pending_fulfill')}
                  className={`pending-fulfill-button ${filter === 'pending_fulfill' ? 'selected' : ''}`}
                >
                  <div className="button-icon"></div> Request to Fulfill Coverage
                </button>
                
              </>
            )}
        </div>
    </div>
  );
}

export default ShiftStatusToolbar;