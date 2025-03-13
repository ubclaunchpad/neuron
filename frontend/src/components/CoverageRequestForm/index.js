import React, { useState } from "react";
import { Modal } from "react-responsive-modal";
import "react-responsive-modal/styles.css";
import "./index.css";

function CoverageRequestForm({ open, onClose, shift }) {
    const [whichShifts, setWhichShifts] = useState("single"); // "single" or "recurring"
    const [category, setCategory] = useState("");
    const [comments, setComments] = useState("");
    const [acknowledgment, setAcknowledgment] = useState(false);

    const categoryOptions = [
        { value: "personal", label: "Personal emergancy" },
        { value: "health", label: "Health-related issue" },
        { value: "scheduling", label: "Scheduling conflict" },
        { value: "other", label: "Other" }
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        onClose();
    };

    return (
        <Modal open={open} onClose={onClose} center classNames={{ modal: "tile" }}>
            <div className="request-coverage-form-header">
                <div className="request-coverage-title">Request coverage form</div>
            </div>

            <div className="form-container">
                {/* Shift Selection */}
                <div className="form-group">
                    <div className="form-label">
                        <span>Which shifts are you requesting coverage for? </span>
                        <i className="required">(Required)</i>
                    </div>
                    <div className="radio-group">
                        <label className="radio-option">
                            <input
                                type="radio"
                                name="whichShifts"
                                value="single"
                                checked={whichShifts === "single"}
                                onChange={() => setWhichShifts("single")}
                            />
                            <span>This session only</span>
                        </label>

                        <label className="radio-option">
                            <input
                                type="radio"
                                name="whichShifts"
                                value="recurring"
                                checked={whichShifts === "recurring"}
                                onChange={() => setWhichShifts("recurring")}
                            />
                            <span>This session and future recurring sessions</span>
                        </label>
                    </div>
                </div>

                {/* Category Selection */}
                <div className="form-group">
                    <div className="form-label">
                        <span>Why are you requesting coverage? </span>
                        <i className="required">(Required)</i>
                    </div>
                    <div className="category-wrapper">
                        <label className="category-label">Category</label>
                        <select className="dropdown" value={category} onChange={(e) => setCategory(e.target.value)} required>
                            <option value="">Select category</option>
                            {categoryOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <textarea className="textarea" placeholder="Enter details about your request"></textarea>
                </div>

                {/* Additional Comments */}
                <div className="form-group">
                    <div className="form-label">
                        <span>Additional comments </span>
                        <i className="optional">(Optional)</i>
                    </div>
                    <textarea className="textarea" placeholder="Enter any additional comments here"></textarea>
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
            </div>

            {/* Submit Button */}
            <div className="button-wrapper">
                <button className="submit-button" type="submit" onClick={handleSubmit}>
                    Send Request
                </button>
            </div>
        </Modal>
    );
}

export default CoverageRequestForm;
