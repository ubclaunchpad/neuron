import "./index.css";

const Permission = ({ children, permissions }) => {
    return permissions ? children : <></>
};

export default Permission;
