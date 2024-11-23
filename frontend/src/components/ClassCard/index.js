import "./index.css";

const ClassCard = ({ classData }) => {
  const { class_id, class_name, category, subcategory, image_url } = classData;

  // TODO: Need to remove level
  // TODO: Need scheduling to change with data
  return (
    <div className="class-card">
      <img className="class-image" src={image_url} />
      <div className="class-info">
        <p className="class-level">Level 2-4</p>
        <h4 className="class-title">{class_name}</h4>
        <p className="class-schedule">Wednesday, 12:00 PM - 01:00 PM</p>
      </div>
    </div>
  );
};

export default ClassCard;
