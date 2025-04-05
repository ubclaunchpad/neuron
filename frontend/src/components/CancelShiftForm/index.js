import { Formik } from "formik";
import * as Yup from "yup";
import { useState } from "react";
import "./index.css";

const CancelShiftSchema = Yup.object().shape({
  cancelScope: Yup.string()
    .required("Please select which sessions to cancel"),
  subject: Yup.string()
    .required("Please enter a subject for the cancellation notice"),
  message: Yup.string()
    .required("Please enter a message for the cancellation notice"),
  sendTo: Yup.array()
    .min(1, "Please select at least one recipient"),
  adminInitials: Yup.string()
    .required("Please enter your admin initials")
});

function CancelShiftForm({ open, onClose, shift, onSubmitSuccess }) {
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (values, { setSubmitting }) => {
    setSubmitting(true);
    try {
      // Here you would add your API call to cancel the shift
      console.log("Submitting shift cancellation:", values);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // On successful submission, trigger the modal
      onSubmitSuccess();
      onClose();
    } catch (error) {
      console.error("Error cancelling shift:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const initialValues = {
    cancelScope: "this",
    subject: `Cancellation: ${shift?.class_name || 'Shift'} on ${dayjs(shift?.shift_date).format('MMM D')}`,
    message: `The ${shift?.class_name || 'shift'} scheduled for ${dayjs(shift?.shift_date).format('dddd, MMMM D')} at ${shift?.start_time} has been cancelled.\n\nReason: `,
    sendTo: ["instructors", "volunteers"],
    adminInitials: ""
  };

  if (!open) return null;

  return (
    <div className="cancellation-modal-overlay">
      <div className="cancellation-modal">
        <div className="cancellation-modal-header">
          <h2 className="cancellation-title">Shift Cancellation Notice</h2>
          <button 
            type="button" 
            className="close-button"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <Formik
          initialValues={initialValues}
          validationSchema={CancelShiftSchema}
          onSubmit={handleSubmit}
        >
          {({
            values,
            errors,
            touched,
            handleChange,
            handleBlur,
            handleSubmit,
            setFieldValue,
            isSubmitting
          }) => (
            <form onSubmit={handleSubmit} className="cancellation-form">
              <div className="form-group">
                <label className="form-label">
                  Which sessions do you want to cancel? <span className="required">(Required)</span>
                </label>
                <div className="radio-group">
                  <div className="radio-option">
                    <input
                      type="radio"
                      id="this-session"
                      name="cancelScope"
                      value="this"
                      checked={values.cancelScope === "this"}
                      onChange={handleChange}
                    />
                    <label htmlFor="this-session">This shift only</label>
                  </div>
                  <div className="radio-option">
                    <input
                      type="radio"
                      id="future-sessions"
                      name="cancelScope"
                      value="future"
                      checked={values.cancelScope === "future"}
                      onChange={handleChange}
                    />
                    <label htmlFor="future-sessions">This shift and future recurring shifts</label>
                  </div>
                </div>
                {errors.cancelScope && touched.cancelScope && (
                  <div className="error-message">{errors.cancelScope}</div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  Cancellation Notice Subject <span className="required">(Required)</span>
                </label>
                <input
                  type="text"
                  name="subject"
                  value={values.subject}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`form-input ${errors.subject && touched.subject ? "input-error" : ""}`}
                />
                {errors.subject && touched.subject && (
                  <div className="error-message">{errors.subject}</div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  Message Body <span className="required">(Required)</span>
                </label>
                <textarea
                  name="message"
                  value={values.message}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`form-textarea ${errors.message && touched.message ? "input-error" : ""}`}
                  rows="5"
                />
                {errors.message && touched.message && (
                  <div className="error-message">{errors.message}</div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Send cancellation email to:</label>
                <div className="checkbox-group">
                  <div className="checkbox-option">
                    <input
                      type="checkbox"
                      id="instructors"
                      name="sendTo"
                      value="instructors"
                      checked={values.sendTo.includes("instructors")}
                      onChange={(e) => {
                        const newSendTo = e.target.checked
                          ? [...values.sendTo, "instructors"]
                          : values.sendTo.filter(item => item !== "instructors");
                        setFieldValue("sendTo", newSendTo);
                      }}
                    />
                    <label htmlFor="instructors">Instructors</label>
                  </div>
                  <div className="checkbox-option">
                    <input
                      type="checkbox"
                      id="volunteers"
                      name="sendTo"
                      value="volunteers"
                      checked={values.sendTo.includes("volunteers")}
                      onChange={(e) => {
                        const newSendTo = e.target.checked
                          ? [...values.sendTo, "volunteers"]
                          : values.sendTo.filter(item => item !== "volunteers");
                        setFieldValue("sendTo", newSendTo);
                      }}
                    />
                    <label htmlFor="volunteers">Volunteers</label>
                  </div>
                </div>
                {errors.sendTo && touched.sendTo && (
                  <div className="error-message">{errors.sendTo}</div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  Your admin initials (for logging purposes) <span className="required">(Required)</span>
                </label>
                <input
                  type="text"
                  name="adminInitials"
                  placeholder="MU"
                  value={values.adminInitials}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`form-input ${errors.adminInitials && touched.adminInitials ? "input-error" : ""}`}
                />
                {errors.adminInitials && touched.adminInitials && (
                  <div className="error-message">{errors.adminInitials}</div>
                )}
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="submit-button"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Submit Cancellation"}
                </button>
              </div>
            </form>
          )}
        </Formik>
      </div>
    </div>
  );
}

export default CancelShiftForm;