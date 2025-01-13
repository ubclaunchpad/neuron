import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import React from "react";
import ProfileImg from "../ImgFallback";
import "./index.css";

import { useNavigate } from "react-router-dom";

export default function NavProfileCard({
  avatar,
  name,
  email,
  collapse,
  link,
}) {
  const navigate = useNavigate();
  const toProfile = () => {
    navigate(link);
  };

  return collapse ? (
    <div className="nav-profile-card__avatar-collapse">
      <ProfileImg
        src={avatar}
        name={name}
      ></ProfileImg>
    </div>
  ) : (
    <div className="nav-profile-card" onClick={toProfile}>
      <div className="nav-profile-card__main">
        <div className="nav-profile-card__avatar">
          <ProfileImg
            src={avatar}
            name={name}
          ></ProfileImg>
        </div>
        <div className="nav-profile-card__info">
          <p className="nav-profile-card__name">{name}</p>
          <p className="nav-profile-card__email">{email}</p>
        </div>
      </div>
      <ArrowForwardIcon sx={{ color: "grey", fontSize: 24 }} />
    </div>
  );
}
