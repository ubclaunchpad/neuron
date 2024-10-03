// home/ is the landing page of the application.
import "./index.css";
import React from 'react'
import Header from '../../components/header';
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
            <Header />
            <h1>{!data ? "Loading..." : data}</h1>
        </div>
      );
};

export default Home;