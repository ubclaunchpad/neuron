import "./index.css";
import React from "react";
import ClassCard from "../ClassCard";
import moreInfo from "../../assets/more-info.png";

const ClassCategoryContainer = React.forwardRef(
  ({ category, classData, onClassSelect, ...props }, ref) => {
    const groupedBySubcategory = classData.reduce((acc, classItem) => {
      const subcategory = classItem.subcategory || ""; // Handle no subcategory case
      if (!acc[subcategory]) {
        acc[subcategory] = [];
      }
      acc[subcategory].push(classItem);
      return acc;
    }, {});
    // console.log("Grouped by subcategory:", groupedBySubcategory);

    return (
      <div className="category-container" ref={ref} {...props}>
        <div className="category-header">
          <h2 className="category-title">{category}</h2>
          <img className="more-info-icon" src={moreInfo} alt="More Info" />
        </div>
        {Object.entries(groupedBySubcategory).map(
          ([subcategory, subcategoryClasses]) => (
            <div key={subcategory} className="sub-category-container">
              <h3 className="sub-category-title">{subcategory}</h3>
              <div className="class-cards">
                {subcategoryClasses.map((classItem) => (
                  <ClassCard
                    key={classItem.class_id}
                    classData={classItem}
                    onClassSelect={onClassSelect}
                  />
                ))}
              </div>
            </div>
          )
        )}
      </div>
    );
  }
);

export default ClassCategoryContainer;
