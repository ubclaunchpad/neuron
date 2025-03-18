import { Formik } from "formik";
import { useNavigate } from "react-router-dom";
import * as Yup from "yup";
import { deleteInstructor } from "../../api/instructorService";
import { deactivateVolunteer, verifyVolunteer } from "../../api/volunteerService";
import cleanInitials from "../../utils/cleanInitials";
import notyf from "../../utils/notyf";
import TextInput from "../TextInput";
import "./index.css";

const VerificationSchema = Yup.object().shape({
    initials: Yup.string()
                .required("Please enter your admin initials.")
                .matches(/^[a-zA-Z][^a-zA-Z]*[a-zA-Z][^a-zA-Z]*$/, "Please enter only two letters."),
});


const DeactivateReactivateModal = ({ id, closeEvent, type }) => {
    const navigate = useNavigate();

    return (
        <div className="deactivate-reactivate-modal">
            {type === 1 && <p className="inactive-account">Deactivating this account will mark the account as <span>Inactive</span>. This volunteer will no longer be able to sign in or volunteer for classes until their account is reactivated.
            </p>}
            {type === 0 && <p className="active-account">Re-activating this account will mark the account as <span>Active</span>. This will restore access for the volunteer, allowing them to sign in and volunteer for classes again.</p>}
            {type === 2 && <p>Deleting this profile will delete the instructor name and email data, but saved classes under this instructor will remain.</p>}

            <Formik
                initialValues={{
                    initials: "",
                }}
                validationSchema={VerificationSchema}
                onSubmit={(values, { setSubmitting }) => {
                    const initials = cleanInitials(values.initials);
                    if (type === 1) {
                        deactivateVolunteer(id)
                            .then(() => {
                                notyf.success("Account deactivated.");
                                setTimeout(() => {
                                    navigate(0);
                                }, 2000);
                            })
                            .catch((error) => {
                                notyf.error("Failed to deactivate volunteer's account.");
                                console.error(error);
                            });
                    } else if (type === 0) {
                        verifyVolunteer(id)
                            .then(() => {
                                notyf.success("Account reactivated.");
                                setTimeout(() => {
                                    navigate(0);
                                }, 2000);
                            })
                            .catch((error) => {
                                notyf.error("Failed to reactivate volunteer's account.");
                                console.error(error);
                            });
                    } else if (type === 2) {
                        deleteInstructor(id)
                            .then(() => {
                                notyf.success("Instructor profile deleted.");
                                closeEvent();
                            })
                            .catch((error) => {
                                notyf.error("Failed to delete instructor profile.");
                                console.error(error);
                            });
                    }
                    setSubmitting(false);
                }}>
                    {({
                        values,
                        errors,
                        touched,
                        handleChange,
                        handleBlur,
                        handleSubmit,
                        isSubmitting,
                    }) => (
                        <form onSubmit={handleSubmit}>
                            <TextInput
                                label="Your admin initials (for logging purposes)"
                                hint="(Required)"
                                name="initials"
                                type="text"
                                placeholder="M.U"
                                value={values.initials}
                                handleChange={handleChange}
                                handleBlur={handleBlur}
                                errors={errors}
                                touched={touched}
                            />
                            <button style={{
                                backgroundColor: type === 0 ? "var(--button-blue)" : "var(--red)"
                            }} className="act-deact-btn" type="submit" disabled={isSubmitting}>
                                {type === 1 && "Deactivate Account"} 
                                {type === 0 && "Reactivate Account"}
                                {type === 2 && "Delete Instructor Profile"}
                            </button>
                        </form>
                    )}
                </Formik>
        </div>
    )
}

export default DeactivateReactivateModal