import React, { useState } from "react";
import { Modal } from "react-responsive-modal";
import "react-responsive-modal/styles.css";
import { requestShiftCoverage } from "../../api/shiftService";
import CoverageRequestConfirmation from "../CoverageRequestConfirmation";
import "./index.css";

function CoverageRequestForm({ open, onClose, shift }) {
    const [whichShifts, setWhichShifts] = useState("single"); // "single" or "recurring"
    const [category, setCategory] = useState("");
    const [comments, setComments] = useState("");
    const [details, setDetails] = useState("");
    const [acknowledgment, setAcknowledgment] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);

    const categoryOptions = [
        { value: "emergency", label: "Personal emergency" },
        { value: "health", label: "Health-related issue" },
        { value: "conflict", label: "Scheduling conflict" },
        { value: "transportation", label: "Transportation" },
        { value: "other", label: "Other" },
    ];

    const resetForm = () => {
        setWhichShifts("single");
        setCategory("");
        setComments("");
        setDetails("");
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
            const requestData = {
                shift_id: shift.shift_id,
                category: category,
                details: details,
                comments: comments || "",
            };

            console.log("Submitting request with data:", requestData);

            const response = await requestShiftCoverage(requestData);

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

                        <textarea className="textarea" placeholder="Enter details about your request" value={details} onChange={(e) => setDetails(e.target.value)}></textarea>
                    </div>

                    {/* Additional Comments */}
                    <div className="form-group">
                        <div className="form-label">
                            <span>Additional comments </span>
                            <i className="optional">(Optional)</i>
                        </div>
                        <textarea className="textarea" placeholder="Enter any additional comments here" value={comments} onChange={(e) => setComments(e.target.value)} />
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
                <button className="submit-button" type="submit" onClick={handleSubmit} disabled={loading}>
                    {loading ? "Submitting..." : "Send Request"}
                </button>
            </Modal>
            <CoverageRequestConfirmation open={showConfirmation} onClose={() => setShowConfirmation(false)} />
        </>
    );
}

export default CoverageRequestForm;
