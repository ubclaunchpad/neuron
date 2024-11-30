import "./index.css";
import React, { useEffect, useState, useRef } from "react";
import VolunteerLayout from "../../components/volunteerLayout";
import ClassPanel from "../../components/classPanel";
import {
  getAllClasses,
  getAllClassImages,
  getAllClassSchedules,
} from "../../api/classesPageService";
import ClassCategoryContainer from "../../components/ClassCategoryContainer";

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
        const [classData, classImages, classSchedules] = await Promise.all([
          getAllClasses(),
          getAllClassImages(),
          getAllClassSchedules(),
        ]);

        const classesWithImagesAndSchedules = classData.map((classItem) => {
          const matchedImage = classImages.data.find(
            (imageItem) => imageItem.fk_class_id === classItem.class_id
          );
          const imageUrl = matchedImage
            ? URL.createObjectURL(
                new Blob([new Uint8Array(matchedImage.image.data)], {
                  type: "image/png",
                })
              )
            : null;

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
    "In-Person Exercise",
    "One-on-One Exercise",
    "Food & Nutrition",
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
    if (sectionRef && sectionRef.current) {
      sectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleClassSelection = (classData) => {
    setSelectedClassId(classData.class_id);
    console.log("Selected class data: ", classData);
  };

  return (
    <VolunteerLayout
      pageTitle="Classes"
      pageContent={
        <ClassPanel
          classId={selectedClassId}
          classList={completeClassData}
          setClassId={setSelectedClassId}
          pageContent={
            <div className="classes-page">
              <div className="main-category-header">
                {categories.map((category) => {
                  const isSelected = selectedCategory === category;
                  return (
                    <button
                      key={category}
                      className={`category-button ${
                        isSelected ? "selected" : ""
                      }`}
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
              {/* ----- */}
              <div className="class-catalog">
                {Object.entries(groupedByCategory).map(
                  ([category, classData]) => {
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
                  }
                )}
              </div>
            </div>
          }
        ></ClassPanel>
      }
    ></VolunteerLayout>
  );
}

export default Classes;
