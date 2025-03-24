import "./index.css";

const SearchInput = ({ placeholder, value, onChange }) => {
    return (
        <input
            type="search"
            className="search-input"
            placeholder={placeholder ?? "Search..."}
            value={value}
            onChange={onChange}
        />
    )
};

export default SearchInput;
