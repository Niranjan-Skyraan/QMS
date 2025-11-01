// import React, { useContext, useRef, useState } from 'react'
// import gsap from 'gsap'
// import { useGSAP } from '@gsap/react'
// import 'bootstrap/dist/css/bootstrap.min.css' // Import Bootstrap
// import { ThemeContext } from '../App'

// const ButtonAnimation = ({ text, handleClick }) => {
//   const { theme } = useContext(ThemeContext)
//   const buttonRef = useRef()
//   const [position, setPosition] = useState([])

//   useGSAP(() => {
//     const x = position[0]
//     const y = position[1]

//     if (x && y) {
//       gsap.fromTo(
//         '.mask',
//         {
//           scale: 0,
//           top: `${y}px`,
//           left: `${x}px`,
//           transform: 'translate(-50%, -50%)'
//         },
//         {
//           scale: 1.5,
//           duration: 0.5,
//           overwrite: 'auto'
//         }
//       )
//       gsap.to('.button-text', {
//         color: 'white',
//         zIndex: 100,
//         overwrite: 'auto'
//       })
//     }
//   }, [position])

//   const HandleMouseLeave = () => {
//     gsap.to('.mask', {
//       scale: 0,
//       duration: 0.2,
//       overwrite: 'auto'
//     })
//     gsap.to('.button-text', {
//       color: 'white',
//       overwrite: 'auto',
//       duration: 0.3
//     })
//   }

//   const handleMouseEnter = (event) => {
//     const rect = buttonRef.current.getBoundingClientRect()
//     const maskX = event.clientX - rect.left
//     const maskY = event.clientY - rect.top
//     setPosition([maskX, maskY])
//   }

//   return (
//     <div className="d-flex justify-content-center align-items-center">
//       <a
//         ref={buttonRef}
//         onMouseEnter={handleMouseEnter}
//         onMouseLeave={HandleMouseLeave}
//         onClick={handleClick}
//         className="btn btn-outline-light position-relative overflow-hidden rounded-pill px-4 py-2"
//         style={{ fontWeight: 'bold', backgroundColor: theme.buttonBg }}
//       >
//         <span className="position-relative button-text">{text}</span>

//         <span
//           className="mask position-absolute rounded-circle"
//           style={{
//             backgroundColor: theme.buttonBgHover,
//             width: '15rem',
//             height: '15rem',
//             transform: 'scale(0)',
//             zIndex: 0
//           }}
//         ></span>
//       </a>
//     </div>
//   )
// }

// export default ButtonAnimation
