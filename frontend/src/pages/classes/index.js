import "./index.css";
import { useEffect, useState } from "react";
import VolunteerLayout from "../../components/volunteerLayout";
import { getAllClasses } from "../../api/classesPageService";
import { getShiftInfo } from "../../api/shiftService";
import ClassCategoryContainer from "../../components/ClassCategoryContainer";

function Classes() {
  const [data, setData] = useState(null);
  const [infoDisplay, setInfoDisplay] = useState(false);
  const [shiftInfo, setShiftInfo] = useState({});

  useEffect(() => {
    getAllClasses()
      .then((data) => setData(data))
      .catch((error) => console.error(error));
  }, []);

  console.log(data);

  const getInfo = () => {
    getShiftInfo("8eafa250-393b-4918-afdb-d0cfa79b1bdd", "1", "2024-01-01")
      .then((data) => {
        setShiftInfo(data);
        setInfoDisplay(true);
      })
      .catch((error) => console.error(error));
  };

  return (
    <VolunteerLayout
      pageTitle="Classes"
      pageContent={
        <div className="classes-page">
          <div className="main-category-header">
            <button className="category-button">Online Exercise</button>
            <button className="category-button">Creative & Expressive</button>
            <button className="category-button">Care Partner Workshops</button>
            <button className="category-button">In-Person Exercise</button>
            <button className="category-button">One-on-One Exercise</button>
            <button className="category-button">Food & Nutrition</button>
          </div>
          {/* ----- */}
          <div className="class-catalog">
            {/* TODO: Need to render numerous based on how many categories we have */}
            <ClassCategoryContainer />
          </div>
        </div>
      }
    ></VolunteerLayout>
  );
}

export default Classes;
