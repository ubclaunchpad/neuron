import "./index.css";
import React, {useState} from 'react';
import checkbox from "../../assets/checkbox.png";

function CheckBox({onClicked, active}) {
     const [chosen, setChosen] = useState(active);

     const handleBoxClicked = () => {
          onClicked();
          setChosen(!chosen);
     }

     return (
          <button className="check-box" onClick={handleBoxClicked}>
               {chosen ? <img src={checkbox} alt="Checkbox"/> : null}
          </button>

     );
}

export default CheckBox;