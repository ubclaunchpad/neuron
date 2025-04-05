import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./index.css";
import notyf from "../../utils/notyf";
//import { cancelShift } from "../../api/shiftService";

function CancelShiftModal({ 
    isOpen, 
    onClose, 
    shiftId,
    className, 
    shiftDate, 
    shiftTime, 
    onSuccess 
}) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    if (!isOpen) return null;
    
    const formattedDate = dayjs(shiftDate).format('MMM D');
    
    const handleCancel = () => {
        onClose();
    };
    
    const handleConfirm = () => {
        setIsSubmitting(true);
        
        /*
        cancelShift(shiftId)
            .then(() => {
                notyf.success(`${className || 'Shift'} on ${formattedDate} at ${shiftTime} has been successfully cancelled.`);
                onSuccess();
                onClose();
            })
            .catch((error) => {
                console.error(error);
                notyf.error("Sorry, an error occurred while cancelling the shift.");
            })
            .finally(() => {
                setIsSubmitting(false);
            });*/
    };
    
    return (
        <div className="cancellation-modal-overlay">
            <div className="cancellation-modal">
                <div className="cancellation-modal-header">
                    <div className="check-icon">
                        <svg viewBox="0 0 24 24" width="48" height="48" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="12" r="10" stroke="#4CAF50" strokeWidth="2" />
                            <path d="M8 12L11 15L16 9" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <h2 className="cancellation-modal-title">Shift Cancellation Confirmation</h2>
                </div>
                
                <div className="cancellation-modal-content">
                    <p className="cancellation-modal-message">
                        Your cancellation notice for "{className || 'the shift'}" on {formattedDate} at {shiftTime} 
                        has been successfully sent to the instructor and volunteers.
                    </p>
                    <p className="cancellation-modal-reminder">
                        If rescheduling is needed, you can create a new shift.
                    </p>
                </div>
                
                <div className="cancellation-modal-footer">
                    {isSubmitting ? (
                        <button type="button" className="cancellation-modal-button-loading" disabled>
                            Processing...
                        </button>
                    ) : (
                        <>
                            <button 
                                type="button" 
                                className="cancellation-modal-button-cancel" 
                                onClick={handleCancel}
                            >
                                Back
                            </button>
                            <button
                                type="button"
                                className="cancellation-modal-button-confirm"
                                onClick={handleConfirm}
                            >
                                Confirm Cancellation
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default CancelShiftModal;