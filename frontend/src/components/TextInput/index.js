import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { useRef, useState } from "react";
import "./index.css";

const TextInput = ({
    type,
    placeholder,
    label,
    hint = "",
    name,
    value,
    handleChange,
    handleBlur,
    errors,
    touched,
}) => {
    const playerRef = useRef(null);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    return (
        <div className="inputWithLabel">
            <label>{label}<span className="hint">{hint}</span></label>
            {type !== "password" && (
                <>
                    <input
                        id={name}
                        type={type}
                        placeholder={placeholder}
                        value={value || ""}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={errors[name] && touched[name] && "error"}
                    />
                    {errors[name] && touched[name] && (
                        <div className="error-message"><ErrorOutlineIcon fontSize="small" /> {errors[name]}</div>
                    )}
                </>
            )}

            {type === "password" && (
                <>
                    <input
                        id={name}
                        type={isPasswordVisible ? "text" : "password"}
                        placeholder={placeholder}
                        value={value || ""}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={`icon ${errors[name] && touched[name] && "error"}`}
                    />
                    {errors[name] && touched[name] && (
                        <div className="error-message">{errors[name]}</div>
                    )}
                    <lord-icon
                        ref={playerRef}
                        id="passwordIcon"
                        src="https://cdn.lordicon.com/dicvhxpz.json"
                        onClick={() => {
                            setIsPasswordVisible(!isPasswordVisible);
                            playerRef.current.playerInstance.play();
                            setTimeout(() => {
                                playerRef.current.playerInstance.direction *=
                                    -1;
                            }, 600);
                        }}
                        stroke="bold"
                        state="morph-lashes"
                        colors="primary:#121331,secondary:#4385ac"
                        style={{
                            width: "1.8vw",
                            height: "1.8vw",
                            cursor: "pointer",
                        }}></lord-icon>
                </>
            )}
        </div>
    );
};

export default TextInput;
