import { getUnverifiedVolunteers } from "../../api/adminService";
import UnverifiedUsers from "../../components/UnverifiedUsers";
import { useEffect, useState } from "react";
import { getVolunteers, getInstructors } from "../../api/adminService";
import "./index.css";
import Notifications from "../../components/Notifications";
import MemberList from "../../components/MemberList";
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import Modal from "../../components/Modal";
import AddEditInstructorModal from "../../components/AddEditInstructorModal";

const MemberManagement = () => {
    const [data, setData] = useState([]);
    const [mainData, setMainData] = useState([]);
    const [activeTab, setActiveTab] = useState("volunteers");
    const [type, setType] = useState("volunteers");
    const [showAddInstructorModal, setShowAddInstructorModal] = useState(false);
    const [unverifiedUsers, setUnverifiedUsers] = useState(null);

    async function getMemMgtData() {
        const unverifiedUsers_ = await getUnverifiedVolunteers();
        setUnverifiedUsers(unverifiedUsers_.volunteers);
    }

    useEffect(() => {
        getMemMgtData();
    }, []);

    function renderNumUsers() {
        if (!unverifiedUsers || unverifiedUsers.length === 0) return null;
        const num = unverifiedUsers.length;
        return (<span className="num-unv-user">{num}</span>);
    }

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line
    }, [activeTab]);

    async function fetchData() {
        let data = {};
        try {
            if (activeTab === "volunteers") {
                data = await getVolunteers();
            } else if (activeTab === "instructors") {
                data = await getInstructors();
            }

            setData(data);
            setMainData(data);
            setType(activeTab);
        }
        catch (error) {
            console.error(error);
        }
    }

    const searchVolunteers = (searchTerm) => {
        if (!searchTerm) {
            setData(mainData);
            return;
        }
        const words = searchTerm.toLowerCase().split(/\s+/); // Split query into words

        const filteredData = mainData.filter(user =>
            words.every(word => {
                const pattern = word.split("").join(".*");
                const regex = new RegExp(pattern, "i");

                return [user.f_name, user.l_name, user.email].some(field =>
                    regex.test(field)
                );
            })
        );

        setData(filteredData);
    }

    return (
        <main className="content-container">
            <div className="content-heading">
                <h2 className="content-title">Member Management</h2>
                <Notifications />
            </div>

            <nav className="tabs">
                <button onClick={() => {
                    setActiveTab("volunteers")
                }} className={activeTab === "volunteers" ? "tab active" : "tab"}>Volunteers</button>
                <button onClick={() => {
                    setActiveTab("instructors")
                }} className={activeTab === "instructors" ? "tab active" : "tab"}>Instructors</button>
                <button onClick={() => {
                    setActiveTab("unverified")
                }} className={activeTab === "unverified" ? "tab active unverified" : "tab unverified"}>
                    Verification Requests 
                    <div className="num-unv-user-container">
                        {renderNumUsers()}
                    </div>
                </button>
            </nav>
            { type === "unverified" ? null :
                <div className="member-search-bar">
                    <input type="search" placeholder="Search by name or email" className="member-search-input" onChange={(e) => {
                        searchVolunteers(e.target.value);
                    }} />
                    {type === "volunteers" && (
                        <button className="filter-button"></button>
                    )}
                    {type === "instructors" && (
                        <button className="add-instructor-button" onClick={() => setShowAddInstructorModal(true)}>
                            <AddRoundedIcon />Add Instructor
                        </button>
                    )}
                </div>
            }
            
            <Modal title="Add instructor" isOpen={showAddInstructorModal} onClose={() => setShowAddInstructorModal(false)} width="500px" height="fit-content">
                <AddEditInstructorModal closeEvent={() => {
                        setShowAddInstructorModal(false)
                        fetchData();
                    }} />
            </Modal>
            { activeTab === "unverified" ? 
            <UnverifiedUsers unverifiedUsers={unverifiedUsers} /> : 
            <MemberList data={data} fetchData={fetchData} type={type} />
            }

        </main>
    )
}

export default MemberManagement;
