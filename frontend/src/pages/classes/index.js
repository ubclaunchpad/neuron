import "./index.css";
import { useEffect, useState } from "react";
import VolunteerLayout from "../../components/volunteerLayout";
import { getAllClasses } from "../../api/classesPageService";
import { getShiftInfo } from "../../api/shiftService";
import ClassCategoryContainer from "../../components/ClassCategoryContainer";

function Classes() {
  const [data, setData] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("Online Exercise");
  // const [infoDisplay, setInfoDisplay] = useState(false);
  // const [shiftInfo, setShiftInfo] = useState({});

  // useEffect(() => {
  //   getAllClasses()
  //     .then((data) => setData(data))
  //     .catch((error) => console.error(error));
  // }, []);

  // console.log(data);

  // const getInfo = () => {
  //   getShiftInfo("8eafa250-393b-4918-afdb-d0cfa79b1bdd", "1", "2024-01-01")
  //     .then((data) => {
  //       setShiftInfo(data);
  //       setInfoDisplay(true);
  //     })
  //     .catch((error) => console.error(error));
  // };

  const categories = [
    "Online Exercise",
    "Creative & Expressive",
    "Care Partner Workshops",
    "In-Person Exercise",
    "One-on-One Exercise",
    "Food & Nutrition",
  ];

  return (
    <VolunteerLayout
      pageTitle="Classes"
      pageContent={
        <div className="classes-page">
          <div className="main-category-header">
            {categories.map((category) => {
              const isSelected = selectedCategory === category;
              return (
                <button
                  key={category}
                  className={`category-button ${isSelected ? "selected" : ""}`}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </button>
              );
            })}
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
