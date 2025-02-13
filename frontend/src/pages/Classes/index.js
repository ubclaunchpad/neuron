import React, { useEffect, useRef, useState } from "react";
import {
  getAllClasses,
  getAllClassSchedules
} from "../../api/classesPageService";
import { formatImageUrl } from "../../api/imageService";
import ClassCategoryContainer from "../../components/ClassCategoryContainer";
import DetailsPanel from "../../components/DetailsPanel";
import "./index.css";

function Classes() {
  const [completeClassData, setCompleteClassData] = useState(null);
  const [groupedByCategory, setGroupedByCategory] = useState({});
  const [selectedCategory, setSelectedCategory] = useState("Online Exercise");
  const [selectedClassId, setSelectedClassId] = useState(null);

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
  }, []);

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
    const catalog = document.querySelector(".class-catalog");
  
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
      <div className="content-heading">
        <h2 className="content-title">Classes</h2>
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
      <DetailsPanel
        classId={selectedClassId}
        classList={completeClassData}
        setClassId={setSelectedClassId}
      >
        <div className="classes-page">
          {/* ----- */}
          <div className="class-catalog">
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
            <div className="spacer"></div>
          </div>
        </div>
      </DetailsPanel>
    </main>
  );
}

export default Classes;
