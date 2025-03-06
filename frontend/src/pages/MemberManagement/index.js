import { useEffect, useState } from "react";
import VolunteerList from "../../components/VolunteerList";
import { getVolunteers } from "../../api/adminService";
import "./index.css";
import Notifications from "../../components/Notifications";

const MemberManagement = () => {
    const [volunteers, setVolunteers] = useState([]);
    const [mainVolunteers, setMainVolunteers] = useState([]);

    useEffect(() => {
        getVolunteers().then((data) => {
            console.log(data)
            if (data) {
                setVolunteers(data);
                setMainVolunteers(data);
            }
        })
        .catch((error) => {
            console.error(error);
        });

    }, []);

    const searchVolunteers = (searchTerm) => {
        if (!searchTerm) {
            setVolunteers(mainVolunteers);
            return;
        }
        const words = searchTerm.toLowerCase().split(/\s+/); // Split query into words

        const filteredVolunteers = mainVolunteers.filter(user =>
            words.every(word => {
                const pattern = word.split("").join(".*");
                const regex = new RegExp(pattern, "i");

                return [user.f_name, user.l_name, user.email].some(field =>
                    regex.test(field)
                );
            })
        );

        setVolunteers(filteredVolunteers);
    }

    return (
        <main className="content-container">
            <div className="content-heading">
                <h2 className="content-title">Member Management</h2>
                <Notifications />
            </div>

            <nav className="tabs">
                <button className="tab active">Volunteers</button>
                <button className="tab">Instructors</button>
                <button className="tab unverified">
                    Unverified <div className="badge-count">2</div>
                </button>
            </nav>

            <div className="search-bar">
                <input type="search" placeholder="Search" className="search-input" onChange={(e) => {
                    searchVolunteers(e.target.value);
                }} />
                <button className="filter-button">
                </button>
            </div>

            <VolunteerList volunteers={volunteers} />
        </main>
    )
}

export default MemberManagement;
