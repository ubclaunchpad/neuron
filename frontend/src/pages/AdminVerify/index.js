import "./index.css";
import { useEffect, useState } from "react";
import {
    getUnverifiedVolunteers,
    verifyVolunteer,
} from "../../api/adminService";
import { useNavigate } from "react-router-dom";
import notyf from "../../utils/notyf";

const AdminVerify = () => {
    const [volunteers, setVolunteers] = useState([]);
    const navigate = useNavigate();

    const getUnverifiedVolunteersAndSetVolunteers = async () => {
        getUnverifiedVolunteers()
            .then((response) => {
                if (response.volunteers === null) {
                    navigate("/auth/login");
                } else if (response.volunteers.length === 0) {
                    notyf.error("No unverified volunteers");
                    setVolunteers([]);
                } else {
                    setVolunteers(response.volunteers);
                    console.log("Volunteers: ", response.volunteers);
                }
            })
            .catch((error) => {
                if (error.response.status === 401 || 400) {
                    console.log("Error: ", error.response.data.message);
                    navigate("/auth/login");
                } else if (error.response.status === 500) {
                    console.log("Error: ", error.response.data.message);
                    notyf.error("Internal server error");
                }
            });
    };

    useEffect(() => {
        getUnverifiedVolunteersAndSetVolunteers();
        // eslint-disable-next-line
    }, []);

    return (
        <>
            <h1 className="verify-heading">Verify Volunteers</h1>
            <table className="verify-table">
                <thead className="verify-table-head">
                    <tr className="verify-tr">
                        <th className="verify-th">#</th>
                        <th className="verify-th">Volunteer ID</th>
                        <th className="verify-th">First Name</th>
                        <th className="verify-th">Last Name</th>
                        <th className="verify-th">Email</th>
                        <th className="verify-th">Verify</th>
                    </tr>
                </thead>
                {volunteers.length === 0 && (
                    <td colspan="6" className="verify-td errorMsg">
                        No unverified volunteers
                    </td>
                )}
                <tbody>
                    {volunteers.map((volunteer, index) => (
                        <tr key={index} className="verify-tr">
                            <td className="verify-td table-data">{index + 1}</td>
                            <td className="verify-td table-data">
                                {volunteer.volunteer_id}
                            </td>
                            <td className="verify-td table-data">{volunteer.f_name}</td>
                            <td className="verify-td table-data">{volunteer.l_name}</td>
                            <td className="verify-td table-data">{volunteer.email}</td>
                            <td className="verify-td">
                                <button
                                    className="btn btn-primary"
                                    onClick={() => {
                                        console.log(
                                            "Verify volunteer: ",
                                            volunteer.volunteer_id
                                        );
                                        verifyVolunteer(volunteer.volunteer_id)
                                            .then((response) => {
                                                if (response.error) {
                                                    notyf.error(response.error);
                                                } else {
                                                    notyf.success(
                                                        "Volunteer verified"
                                                    );
                                                    getUnverifiedVolunteersAndSetVolunteers();
                                                }
                                            })
                                            .catch((error) => {
                                                if (
                                                    error.response.status ===
                                                    401
                                                ) {
                                                    navigate("/auth/login");
                                                } else if (
                                                    error.response.status ===
                                                    500
                                                ) {
                                                    notyf.error(
                                                        "Internal server error"
                                                    );
                                                }
                                            });
                                    }}>
                                    Verify
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </>
    );
};

export default AdminVerify;
