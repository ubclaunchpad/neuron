import React, { useEffect, useState } from "react";
import { Modal } from "react-responsive-modal";
import "react-responsive-modal/styles.css";
import "./index.css";

function CoverageRequestForm({ open, onClose, shift }) {
    const [whichShifts, setWhichShifts] = useState("single"); // "single" or "recurring"
    const [category, setCategory] = useState("");
    const [comments, setComments] = useState("");
    const [acknowledgment, setAcknowledgment] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // TODO: Add your API request logic here, for example:
        // await requestCoverage({ shiftId: shift.shift_id, whichShifts, category, comments, ... });

        onClose(); // close modal
    };

    return (
        <Modal open={open} onClose={onClose} center classNames={{ modal: "custom-modal" }}>
            <div className="coverage-form-container">
                <h2 className="coverage-form-title">Request coverage form</h2>

                {/* Shift Selection */}
                <div className="form-group">
                    <label className="form-label">Which shifts are you requesting coverage for? <span className="required">(Required)</span></label>
                    <div className="radio-group">
                        <label className="radio-label">
                            <input type="radio" name="whichShifts" value="single" checked={whichShifts === "single"} onChange={() => setWhichShifts("single")} />
                            This session only
                        </label>
                        <label className="radio-label">
                            <input type="radio" name="whichShifts" value="recurring" checked={whichShifts === "recurring"} onChange={() => setWhichShifts("recurring")} />
                            This session and future recurring sessions
                        </label>
                    </div>
                </div>

                {/* Category Selection */}
                <div className="form-group">
                    <label className="form-label">Why are you requesting for coverage? <span className="required">(Required)</span></label>
                    <select className="form-input" value={category} onChange={(e) => setCategory(e.target.value)} required>
                        <option value="">Select category</option>
                        <option value="personal">Personal</option>
                        <option value="vacation">Vacation</option>
                        <option value="illness">Illness</option>
                    </select>
                    <textarea className="form-textarea" placeholder="Enter details about your request"></textarea>
                </div>

                {/* Additional Comments */}
                <div className="form-group">
                    <label className="form-label">Additional comments <span className="optional">(Optional)</span></label>
                    <textarea className="form-textarea" placeholder="Enter any additional comments here"></textarea>
                </div>

                {/* Acknowledgment */}
                <div className="form-group acknowledgment-group">
                    <label className="checkbox-label">
                        <input type="checkbox" checked={acknowledgment} onChange={() => setAcknowledgment(!acknowledgment)} required />
                        <span className="acknowledgment-text">
                            I understand that submitting this request does not guarantee approval, and I remain responsible for the shift until this request is approved.
                        </span>
                    </label>
                </div>

                {/* Submit Button */}
                <button className="btn-submit" type="submit" onClick={handleSubmit}>
                    Send Request
                </button>
            </div>
        </Modal>
      );
}

export default CoverageRequestForm;