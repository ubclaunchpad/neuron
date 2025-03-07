import "./index.css";
import { useEffect, useState } from "react";
import { getUnverifiedVolunteers } from "../../api/adminService";
import UnverifiedUsers from "../../components/UnverifiedUsers";

const MemberManagement = () => {
    const [unverifiedUsers, setUnverifiedUsers] = useState(null);
    const subpages = [(<>a</>), (<>b</>), (<UnverifiedUsers unverifiedUsers={unverifiedUsers}/>)];
    const [currentView, setCurrentView] = useState(subpages[0])

    useEffect(async () => {
        const unverifiedUsers_ = await getUnverifiedVolunteers();
        setUnverifiedUsers(unverifiedUsers_.volunteers);
        console.log(unverifiedUsers_.volunteers);
    }, []);


    function showView(view) {
        setCurrentView(subpages[view]);
    }

    function renderNumUsers() {
        if (!unverifiedUsers || unverifiedUsers.length === 0) return null;
        const num = unverifiedUsers.length;
        return (<span className="num-unv-user">{num}</span>);
    }

    return (
        <main className="content-container">
            <div className="content-heading">
                <h2 className="content-title">Member Management</h2>
            </div>

            <div className="selection-bar">
                <button className="selection-bar-view col-1" onClick={()=>showView(0)}>Volunteers</button>
                <button className="selection-bar-view" onClick={()=>showView(1)}>Instructors</button>
                <button className="selection-bar-view col-3 active" onClick={()=>showView(2)}>
                    Unverified Users {renderNumUsers()}
                </button>
            </div>

            {currentView}


        </main>
    );
};

export default MemberManagement;
