import React, { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import {
  getAllClasses,
  getAllClassSchedules
} from "../../api/classesPageService";
import { formatImageUrl } from "../../api/imageService";
import ClassCategoryContainer from "../../components/ClassCategoryContainer";
import DetailsPanel from "../../components/DetailsPanel";
import button_icon_prev from "../../assets/images/button-icons/button-icon-prev.png";
import add_icon from "../../assets/add-icon.png";
import "./index.css";
import AdminClassForm from "../../components/AdminClassForm";
import { useAuth } from "../../contexts/authContext";

function Classes() {
  const [completeClassData, setCompleteClassData] = useState(null);
  const [groupedByCategory, setGroupedByCategory] = useState({});
  const [selectedCategory, setSelectedCategory] = useState("Online Exercise");
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [updates, setUpdates] = useState(0);

  const { isAdmin } = useAuth();
  
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const classId = location.state?.classId;
  const editing = searchParams.get("edit") === "true";

  const sectionRefs = useRef({});
  const observer = useRef(null);

  useEffect(() => {
    const fetchClassesImagesAndSchedules = async () => {
      try {
        const [classData, classSchedules] = await Promise.all([
          getAllClasses(),
          getAllClassSchedules(),
        ]);

        const classesWithImagesAndSchedules = classData.map((classItem) => {
          const imageUrl = formatImageUrl(classItem.fk_image_id);
          const matchedSchedules = classSchedules.filter((schedule) => {
            return schedule.fk_class_id === classItem.class_id;
          });

          return {
            class_id: classItem.class_id,
            class_name: classItem.class_name,
            category: classItem.category,
            subcategory: classItem.subcategory,
            image_url: imageUrl,
            schedules: matchedSchedules,
          };
        });

        setCompleteClassData(classesWithImagesAndSchedules);
        // console.log(classesWithImages);
      } catch (error) {
        console.error(error);
      }
    };

    fetchClassesImagesAndSchedules();
  }, [updates, searchParams]);

  useEffect(() => {
    if (completeClassData) {
      const grouped = completeClassData.reduce((acc, classItem) => {
        if (!acc[classItem.category]) {
          acc[classItem.category] = [];
        }
        acc[classItem.category].push(classItem);
        return acc;
      }, {});
      setGroupedByCategory(grouped);
    }
  }, [completeClassData]);

  // TODO: Currently fixed categories for the header
  const categories = [
    "Online Exercise",
    "Creative & Expressive",
    "Care Partner Workshops",
    "Food & Nutrition",
    "Other Opportunities"
  ];

  categories.forEach((category) => {
    if (!sectionRefs.current[category]) {
      sectionRefs.current[category] = React.createRef();
    }
  });

  useEffect(() => {
    observer.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setSelectedCategory(entry.target.getAttribute("data-category"));
          }
        });
      },
      { threshold: 0.5 } // triggers when 50% of section is visible
    );

    // observe all section refs
    Object.entries(sectionRefs.current).forEach(([category, ref]) => {
      if (ref.current) {
        observer.current.observe(ref.current);
      }
    });

    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [groupedByCategory]);

  const scrollToSection = (category) => {
    const sectionRef = sectionRefs.current[category];
    const catalog = document.querySelector(".classes-page");
  
    if (sectionRef && sectionRef.current && catalog) {
      const catalogTop = catalog.getBoundingClientRect().top;
      const sectionTop = sectionRef.current.getBoundingClientRect().top;
      const scrollOffset = sectionTop - catalogTop + catalog.scrollTop;
  
      catalog.scrollTo({
        top: scrollOffset,
        behavior: "smooth",
      });
    }
  };

  const handleClassSelection = (classData) => {
    setSelectedClassId(classData.class_id);
    console.log("Selected class data: ", classData);
  };

  return (
    <main className="content-container">
      <div>
        {editing ?
          <div className="classes-heading">
            <button 
                className="back-button"
                onClick={() => navigate("/classes")}
              >
              <img
                alt="Back"
                src={button_icon_prev}
                style={{ width: 18, height: 18 }}
              />
              <h2 className="classes-title">{classId ? "Edit Class" : "Create Class"}</h2>
            </button>
          </div> :
          <div>
            <div className="classes-heading">
              <h2 className="classes-title">Classes</h2>
            </div>
            <div className="main-category-header">
              {categories.map((category) => {
                const isSelected = selectedCategory === category;
                return (
                  <button
                    key={category}
                    className={`category-button ${isSelected ? "selected" : ""}`}
                    onClick={() => {
                      setSelectedCategory(category);
                      scrollToSection(category);
                    }}
                  >
                    {category}
                  </button>
                );
              })}
            </div>
          </div>
        }
      </div>
      <DetailsPanel
        classId={selectedClassId}
        classList={completeClassData}
        updates={updates}
        setUpdates={setUpdates}
        setClassId={setSelectedClassId}
        navigate={navigate}
      > 
        <div className="classes-page">
          {/* ----- */}
          <div className="classes-content">
            {editing ? 
              <AdminClassForm 
                classId={selectedClassId} 
                setUpdates={setUpdates} 
              /> :
              <div>
                {isAdmin && <button
                  className="add-class-button"
                  onClick={() => navigate("/classes?edit=true")}
                >
                  <div 
                    className="add-class-container"
                  >
                    <img src={add_icon} alt="Add" className="add-class-icon"/>
                  </div>
                </button>}
                {Object.entries(groupedByCategory).map(([category, classData]) => {
                  return (
                    <ClassCategoryContainer
                      key={category}
                      ref={sectionRefs.current[category]}
                      category={category}
                      classData={classData}
                      data-category={category}
                      onClassSelect={handleClassSelection}
                    />
                  );
                })}
              </div>
            }
            <div className="spacer"></div>
          </div>
        </div>
      </DetailsPanel>
    </main>
  );
}

export default Classes;
