import React from 'react'
import SignupForm from '../../components/SignupForm/SignupForm';

function Home() {
    const [data, setData] = React.useState(null);

    React.useEffect(() => {
      fetch("/api")
        .then((res) => res.json())
        .then((data) => setData(data.message));
    }, []);

    return (
        <div className="homePage">
            <h1>{!data ? "Loading..." : data}</h1>
            <SignupForm></SignupForm>
        </div>
      );
}

export default Home;