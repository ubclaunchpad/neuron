import "./index.css";

const CustomButton = ({ text, isSubmitting }) => {
    return (
        <button type="submit" disabled={isSubmitting}>
            {text}
        </button>
    );
};

export default CustomButton;
