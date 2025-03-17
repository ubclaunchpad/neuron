import React, { useState } from "react";
import { Modal } from "react-responsive-modal";
import "react-responsive-modal/styles.css";
import { requestCoverage } from "../../api/coverageService";
import AbsenceRequestConfirmation from "../AbsenceRequestConfirmation";
import "./index.css";

function CoverageRequestForm({ open, onClose, shift }) {
    const [whichShifts, setWhichShifts] = useState("single"); // "single" or "recurring"
    const [acknowledgment, setAcknowledgment] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);

    const resetForm = () => {
        setWhichShifts("single");
        setAcknowledgment(false);
        setLoading(false);
    };

    const closeModal = () => {
        resetForm();
        setShowConfirmation(false);
        onClose();
    }

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!acknowledgment) {
            alert("You must acknowledge the request terms before submitting.");
            return;
        }

        if (!shift || !shift.shift_id) {
            console.error("Shift data is missing.");
            alert("Invalid shift data.");
            return;
        }

        setLoading(true);

        try {
            const request_id = shift.absence_request.request_id;
            const volunteer_id = shift.volunteer_id;
            const response = await requestCoverage(request_id, volunteer_id);

            console.log("Coverage request submitted successfully:", response);

            onClose();
            resetForm();
            setShowConfirmation(true);
        } catch (error) {
            console.error("Error submitting coverage request:", error);
            alert("Failed to submit coverage request. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Modal open={open} onClose={closeModal} center classNames={{ modal: "tile" }}>
                <div className="request-coverage-form-header">
                    <div className="request-coverage-title">Coverage request form</div>
                </div>

                <div className="form-container">
                    {/* Shift Selection */}
                    <div className="form-group">
                        <div className="form-label">
                            <span>Which shifts are you requesting to fulfill coverage for?</span>
                            <i className="required">(Required)</i>
                        </div>
                        <div className="radio-group">
                            <div className="radio-option">
                                <input
                                    type="radio"
                                    name="whichShifts"
                                    value="single"
                                    className="radio-input"
                                    checked={whichShifts === "single"}
                                    onChange={() => setWhichShifts("single")}
                                />
                                <span>This session only</span>
                                <input
                                    type="radio"
                                    name="whichShifts"
                                    value="recurring"
                                    className="radio-input"
                                    checked={whichShifts === "recurring"}
                                    onChange={() => setWhichShifts("recurring")}
                                    disabled={true}
                                />
                                <span className="radio-text-recurring-sessions">This session and future recurring sessions</span>
                            </div>
                        </div>
                    </div>

                    {/* Acknowledgment */}
                    <div className="form-group acknowledgment-group">
                        <div className="checkbox-label">
                            <input
                                type="checkbox"
                                className="acknowledgment-checkbox"
                                checked={acknowledgment}
                                onChange={() => setAcknowledgment(!acknowledgment)}
                                required
                            />
                            <span className="acknowledgment-text">
                                I understand that submitting this request does not guarantee approval.
                            </span>
                        </div>
                    </div>
                </div>

                {/* Submit Button */}
                <button className="submit-button" type="submit" onClick={handleSubmit} disabled={loading}>
                    {loading ? "Submitting..." : "Send Request"}
                </button>
            </Modal>
            <AbsenceRequestConfirmation open={showConfirmation} onClose={() => setShowConfirmation(false)} />
        </>
    );
}

export default CoverageRequestForm;
