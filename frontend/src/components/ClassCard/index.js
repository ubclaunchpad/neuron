import "./index.css";

const ClassCard = ({ classData }) => {
  const { class_id, class_name, category, subcategory, image_url } = classData;

  return (
    <div className="class-card">
      <img className="class-image" src={image_url} />
      <div className="class-info">
        <p className="class-level">Level 2-4</p> // TODO: Do we remove?
        <h4 className="class-title">{class_name}</h4>
        <p className="class-schedule">Wednesday, 12:00 PM - 01:00 PM</p>
        // TODO: Need to change with data^
      </div>
    </div>
  );
};

export default ClassCard;
