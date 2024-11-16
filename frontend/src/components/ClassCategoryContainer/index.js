import "./index.css";
import ClassCard from "../ClassCard";
import moreInfo from "../../assets/more-info.png";

const ClassCategoryContainer = () => {
  return (
    <div className="category-container">
      <div className="category-header">
        <h2 className="category-title">Online Exercise</h2>
        <img className="more-info-icon" src={moreInfo} alt="More Info" />
      </div>
      <div className="sub-category-container">
        <h3 className="sub-category-title">Tai Chi</h3>
        <ClassCard />
      </div>
    </div>
  );
};

export default ClassCategoryContainer;
