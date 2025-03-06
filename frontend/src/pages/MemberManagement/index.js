import { useEffect, useState } from "react";
import { getVolunteers, getInstructors } from "../../api/adminService";
import "./index.css";
import Notifications from "../../components/Notifications";
import MemberList from "../../components/MemberList";
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import Modal from "../../components/Modal";
import AddInstructorModal from "../../components/AddInstructorModal";

const MemberManagement = () => {
    const [data, setData] = useState([]);
    const [mainData, setMainData] = useState([]);
    const [activeTab, setActiveTab] = useState("volunteers");
    const [type, setType] = useState("volunteers");
    const [showAddInstructorModal, setShowAddInstructorModal] = useState(false);

    useEffect(() => {
        async function fetchData() {
            let data = {};
            if (activeTab === "volunteers") {
                data = await getVolunteers();
            } else if (activeTab === "instructors") {
                data = await getInstructors();
            }
            
            return data;
        }

        fetchData().then((data) => {
            console.log(data)
            if (data) {
                setData(data);
                setMainData(data);
                setType(activeTab);
            }
        })
        .catch((error) => {
            console.error(error);
        });

    }, [activeTab]);

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
                    Unverified <div className="badge-count">2</div>
                </button>
            </nav>

            <div className="member-search-bar">
                <input type="search" placeholder="Search" className="member-search-input" onChange={(e) => {
                    searchVolunteers(e.target.value);
                }} />
                {type === "volunteers" && (
                    <button className="filter-button"></button>
                )}
                {type === "instructors" && (
                    <button className="add-instructor-button" onClick={() => setShowAddInstructorModal(true)}><AddRoundedIcon />Add Instructor</button>
                )}
            </div>
            
            <Modal title="Add instructor" isOpen={showAddInstructorModal} onClose={() => setShowAddInstructorModal(false)} width="500px" height="fit-content">
                <AddInstructorModal closeEvent={() => setShowAddInstructorModal(false)} />
            </Modal>

            <MemberList data={data} type={type} />
        </main>
    )
}

export default MemberManagement;
