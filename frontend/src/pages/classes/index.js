import "./index.css";
import React from 'react'
import Header from '../../components/header';
import { getAllClasses } from '../../api/classesPageService';

function Classes() {
     const [data, setData] = React.useState(null);

     React.useEffect(() => {
          getAllClasses()
          .then((data) => setData(data.message))
          .catch((error) => console.error(error));
     }, []);

     return (
          <div className="classes-page">
               <Header />
               {!data ? "Loading Classes..." : 
                    data.map((element) => (
                         <h1 key={element.class_id}> {element.class_name}</h1>
                    ))
               }
          </div>
          );
};

export default Classes;