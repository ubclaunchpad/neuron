import React from "react";
import "./index.css";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

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
    <div className="nav-profile-card__avatar">
      {avatar ? (
        <img src={avatar} alt={name} width={24} height={24} />
      ) : (
        <img
          src={`https://avatars.dicebear.com/api/human/${name}.svg`}
          alt={name}
          width={24}
          height={24}
        />
      )}
    </div>
  ) : (
    <div className="nav-profile-card" onClick={toProfile}>
      <div className="nav-profile-card__main">
        <div className="nav-profile-card__avatar">
          {avatar ? (
            <img src={avatar} alt={name} width={40} height={40} />
          ) : (
            <img
              src={`https://avatars.dicebear.com/api/human/${name}.svg`}
              alt={name}
              width={40}
              height={40}
            />
          )}
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
