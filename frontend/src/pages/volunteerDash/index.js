// home/ is the landing page of the application.
import "./index.css";
import React from 'react'
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import VolunteerLayout from "../../components/volunteerLayout";
import { getHelloWorld } from '../../api/homePageService';
import { isAuthenticated } from "../../api/authService";

function VolunteerDash() {
    const [data, setData] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        isAuthenticated().then((response) => {
            if (!response) {
                console.log("here")
                navigate("/auth/login");
            }
        }).catch((error) => {
            console.error(error);
        });
      getHelloWorld()
        .then((data) => setData(data.message))
        .catch((error) => console.error(error));
        // eslint-disable-next-line
    }, []);

    return (
        <VolunteerLayout
            pageTitle="Dashboard"
            pageContent={
                <div className="dash-container">
                    <h1>{!data ? "Loading..." : data}</h1>
                </div>
            }
        ></VolunteerLayout>
      );
};

export default VolunteerDash;