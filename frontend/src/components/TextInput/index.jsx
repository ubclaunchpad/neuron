import "./index.css";
import { useRef, useState } from "react";

const TextInput = ({ type, placeholder, label }) => {
    const playerRef = useRef(null);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    return (
        <div className="inputWithLabel">
            <label>{label}</label>
            {type !== "password" && (
                <input type={type} placeholder={placeholder} />
            )}

            {type === "password" && (
                <>
                    <input
                        type={isPasswordVisible ? "text" : "password"}
                        placeholder={placeholder}
                    />
                    <lord-icon
                        ref={playerRef}
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
