import notif_icon from "../../assets/notif-icon.png";
import "./index.css";

const Notifications = () => {
  return (
    <button className="notif-button"><img src={notif_icon} alt="notifications button"></img> Notifications</button>
  )
}

export default Notifications