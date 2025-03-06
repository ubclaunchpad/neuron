import TextInput from "../TextInput"
import { Formik } from "formik";
import * as Yup from "yup";
import "./index.css";
import { deactivateVolunteer, verifyVolunteer } from "../../api/adminService";
import { useAuth } from "../../contexts/authContext";
import notyf from "../../utils/notyf";
import cleanInitials from "../../utils/cleanInitials";

const VerificationSchema = Yup.object().shape({
    initials: Yup.string()
                .required("Please enter your admin initials.")
                .matches(/^[a-zA-Z][^a-zA-Z]*[a-zA-Z][^a-zA-Z]*$/, "Please enter only two letters."),
});


const DeactivateReactivateModal = ({ volunteer_id, setShowModal, type }) => {

    const {user} = useAuth();

    return (
        <div className="deactivate-reactivate-modal">
            {type === 1 ? <p className="inactive-account">Deactivating this account will mark the account as <span>Inactive</span>. This volunteer will no longer be able to sign in or volunteer for classes until their account is reactivated.
            </p> : <p className="active-account">Re-activating this account will mark the account as <span>Active</span>. This will restore access for the volunteer, allowing them to sign in and volunteer for classes again.</p>}

            <Formik
                initialValues={{
                    initials: "",
                }}
                validationSchema={VerificationSchema}
                onSubmit={(values, { setSubmitting }) => {
                    const initials = cleanInitials(values.initials);
                    if (initials !== user.f_name[0].toUpperCase() + "" + user.l_name[0].toUpperCase()) {
                        if (type === 1) {
                            deactivateVolunteer(volunteer_id)
                                .then(() => {
                                    notyf.success("Account deactivated.");
                                    setShowModal(false);
                                })
                                .catch((error) => {
                                    notyf.error("Failed to deactivate volunteer's account.");
                                    console.error(error);
                                });
                        } else {
                            verifyVolunteer(volunteer_id)
                                .then(() => {
                                    notyf.success("Account reactivated.");
                                    setShowModal(false);
                                })
                                .catch((error) => {
                                    notyf.error("Failed to reactivate volunteer's account.");
                                    console.error(error);
                                });
                        }
                    } else {
                        notyf.error("Initials don't match your admin initials.");
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
                                backgroundColor: type === 1 ? "var(--red)" : "var(--button-blue)"
                            }} className="act-deact-btn" type="submit" disabled={isSubmitting}>
                                {type === 1 ? "Deactivate Account" : "Reactivate Account"}
                            </button>
                        </form>
                    )}
                </Formik>
        </div>
    )
}

export default DeactivateReactivateModal