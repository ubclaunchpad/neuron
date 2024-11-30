import "./index.css";

const formatSchedules = (schedules) => {
  const formatTime = (time) => {
    const [hour, minute] = time.split(":").map(Number);
    const period = hour >= 12 ? "PM" : "AM";
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minute.toString().padStart(2, "0")} ${period}`;
  };

  const dayMap = {
    0: "Sunday",
    1: "Monday",
    2: "Tuesday",
    3: "Wednesday",
    4: "Thursday",
    5: "Friday",
    6: "Saturday",
  };

  // sort by day of week then start time
  const sortedSchedules = schedules.sort((a, b) => {
    if (a.day_of_week !== b.day_of_week) {
      return a.day_of_week - b.day_of_week;
    }
    return a.start_time.localeCompare(b.start_time);
  });

  return sortedSchedules.map((schedule) => {
    const day = dayMap[schedule.day_of_week];
    const startTime = formatTime(schedule.start_time);
    const endTime = formatTime(schedule.end_time);
    return `${day}, ${startTime} - ${endTime}`;
  });
};

const ClassCard = ({ classData, onClassSelect }) => {
  const { class_id, class_name, category, subcategory, image_url, schedules } =
    classData;

  const formattedSchedules = formatSchedules(schedules);

  return (
    <div className="class-card" onClick={() => onClassSelect(classData)}>
      <img className="class-image" src={image_url} />
      <div className="class-info">
        <h4 className="class-title">{class_name}</h4>
        <div className="class-schedule-container">
          {formattedSchedules.map((schedule, index) => (
            <p key={index} className="class-schedule">
              {schedule}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ClassCard;
