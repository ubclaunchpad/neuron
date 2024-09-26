// home.js is the landing page of the application.
import React from 'react'
import { getHelloWorld } from '../../api/homePageService';

function Home() {
    const [data, setData] = React.useState(null);

    React.useEffect(() => {
      getHelloWorld()
        .then((data) => setData(data.message))
        .catch((error) => console.error(error));
    }, []);

    return (
        <div className="homePage">
            <h1>{!data ? "Loading..." : data}</h1>
        </div>
      );
};

export default Home;