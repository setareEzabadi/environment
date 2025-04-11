import React from "react";
import Slider from "react-slick";
import styles from "./GallerySlider.module.css";
import imageOne from "../../public/Assets/img/43852f2cd7ff5bd37a2d0e2e-3.jpg";
import imageTwo from "../../public/Assets/img/abshar.jpg";
import imageThree from "../../public/Assets/img/jahannama-780x470.jpg";
import imageFour from "../../public/Assets/img/nody-طبیعت-پاییزی-گرگان-تصاویر-1726742409.jpg";
import imageFive from "../../public/Assets/img/جاهای-دیدنی-گرگان-شاخص.jpg";
import imageSix from "../../public/Assets/img/جنگل-شصت-کلا.jpg";


const GallerySlider = () => {
    const settings = {
        dots: true,
        infinite: true,
        speed: 500,
        slidesToShow: 3,
        slidesToScroll: 1,
        responsive: [
            {
                breakpoint: 768,
                settings: {
                    slidesToShow: 1,
                },
            },
            {
                breakpoint: 1024,
                settings: {
                    slidesToShow: 2,
                },
            },
        ],
    };

    const images = [
        { src: imageOne.src, alt: "طبیعت 1" },
        { src: imageTwo.src, alt: "طبیعت 2" },
        { src: imageThree.src, alt: "طبیعت 3" },
        { src: imageFour.src, alt: "طبیعت 4" },
        { src: imageFive.src, alt: "طبیعت 5" },
        { src: imageSix.src, alt: "6" },
    ];

    return (
        <div className={styles.sliderContainer}>
            <Slider {...settings}>
                {images.map((img, idx) => (
                    <div key={idx} className={styles.slide}>
                        <img src={img.src} alt={img.alt} className={styles.image} />
                    </div>
                ))}
            </Slider>
        </div>
    );
};

export default GallerySlider;
