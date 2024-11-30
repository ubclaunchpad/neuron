import "./index.css";

const CustomButton = ({ text, isSubmitting }) => {
    return (
        <button type="submit" className="customButton" disabled={isSubmitting}>
            {text}
        </button>
    );
};

export default CustomButton;
