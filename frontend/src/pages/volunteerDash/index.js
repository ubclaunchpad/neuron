// home/ is the landing page of the application.
import "./index.css";
import React from 'react'
import { useEffect, useState } from "react";
import VolunteerLayout from "../../components/volunteerLayout";
import { getHelloWorld } from '../../api/homePageService';

function VolunteerDash() {
    const [data, setData] = useState(null);

    useEffect(() => {
      getHelloWorld()
        .then((data) => setData(data.message))
        .catch((error) => console.error(error));
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