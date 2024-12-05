import "./index.css";

const CustomButton = ({ text, isSubmitting }) => {
    return (
        <button className="custom-button" type="submit" disabled={isSubmitting}>
            {text}
        </button>
    );
};

export default CustomButton;
