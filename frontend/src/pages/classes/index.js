import "./index.css";
import React, { useEffect, useState, useRef } from "react";
import VolunteerLayout from "../../components/volunteerLayout";
import { getAllClasses, getAllClassImages } from "../../api/classesPageService";
import { getShiftInfo } from "../../api/shiftService";
import ClassCategoryContainer from "../../components/ClassCategoryContainer";

function Classes() {
  const [classAndImageData, setClassAndImageData] = useState(null);
  const [groupedByCategory, setGroupedByCategory] = useState({});
  const [selectedCategory, setSelectedCategory] = useState("Online Exercise");

  const sectionRefs = useRef({});
  const observer = useRef(null);

  useEffect(() => {
    const fetchClassesAndImages = async () => {
      try {
        const [classData, classImages] = await Promise.all([
          getAllClasses(),
          getAllClassImages(),
        ]);

        // console.log("Classes:", classData);
        // console.log("Images:", classImages);

        const classesWithImages = classData.map((classItem) => {
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

          return {
            class_id: classItem.class_id,
            class_name: classItem.class_name,
            category: classItem.category,
            subcategory: classItem.subcategory,
            image_url: imageUrl,
          };
        });

        setClassAndImageData(classesWithImages);
        // console.log(classesWithImages);
      } catch (error) {
        console.error(error);
      }
    };

    fetchClassesAndImages();
  }, []);

  useEffect(() => {
    if (classAndImageData) {
      const grouped = classAndImageData.reduce((acc, classItem) => {
        if (!acc[classItem.category]) {
          acc[classItem.category] = [];
        }
        acc[classItem.category].push(classItem);
        return acc;
      }, {});
      setGroupedByCategory(grouped);
    }
  }, [classAndImageData]);

  // const getInfo = () => {
  //   getShiftInfo("8eafa250-393b-4918-afdb-d0cfa79b1bdd", "1", "2024-01-01")
  //     .then((data) => {
  //       setShiftInfo(data);
  //       setInfoDisplay(true);
  //     })
  //     .catch((error) => console.error(error));
  // };

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

  return (
    <VolunteerLayout
      pageTitle="Classes"
      pageContent={
        <div className="classes-page">
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
                />
              );
            })}
          </div>
        </div>
      }
    ></VolunteerLayout>
  );
}

export default Classes;
