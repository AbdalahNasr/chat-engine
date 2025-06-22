import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

const RecordingAnimation = ({ size = 80 }) => {
  const mountRef = useRef();

  useEffect(() => {
    // Simple test to see if Three.js loads
    const loadThreeJS = async () => {
      try {
        const THREE = await import('three');
        
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, size / size, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        
        renderer.setSize(size, size);
        renderer.setClearColor(0x000000, 0);
        
        // Create a more complex geometry - icosahedron
        const geometry = new THREE.IcosahedronGeometry(1.5, 0);
        const material = new THREE.MeshBasicMaterial({ 
          color: 0x03e9f4, 
          wireframe: true,
          transparent: true,
          opacity: 0.9
        });
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
        
        camera.position.z = 5;
        
        if (mountRef.current) {
          mountRef.current.appendChild(renderer.domElement);
        }
        
        let time = 0;
        const animate = () => {
          requestAnimationFrame(animate);
          time += 0.05;
          
          // More dynamic rotation
          mesh.rotation.x += 0.03;
          mesh.rotation.y += 0.04;
          mesh.rotation.z += 0.02;
          
          // Add pulsing scale effect
          const scale = 1 + Math.sin(time * 3) * 0.2;
          mesh.scale.set(scale, scale, scale);
          
          // Add some wobble
          mesh.position.x = Math.sin(time * 2) * 0.1;
          mesh.position.y = Math.cos(time * 2.5) * 0.1;
          
          renderer.render(scene, camera);
        };
        
        animate();
        
        return () => {
          if (mountRef.current && renderer.domElement) {
            mountRef.current.removeChild(renderer.domElement);
          }
        };
      } catch (error) {
        console.error('Three.js error:', error);
        // Fallback to a more dynamic CSS animation
        if (mountRef.current) {
          mountRef.current.innerHTML = `
            <div style="
              width: 100%; 
              height: 100%; 
              background: #03e9f4; 
              border-radius: 50%; 
              animation: recordingPulse 1.5s ease-in-out infinite;
              box-shadow: 0 0 20px #03e9f4;
            "></div>
          `;
          mountRef.current.style.cssText += `
            @keyframes recordingPulse {
              0%, 100% { 
                transform: scale(1) rotate(0deg); 
                opacity: 0.8;
              }
              50% { 
                transform: scale(1.3) rotate(180deg); 
                opacity: 1;
              }
            }
          `;
        }
      }
    };
    
    loadThreeJS();
  }, [size]);

  return (
    <div
      ref={mountRef}
      style={{ 
        width: size, 
        height: size, 
        display: 'inline-block', 
        verticalAlign: 'middle',
        borderRadius: '50%',
        overflow: 'hidden',
        background: 'transparent'
      }}
    />
  );
};

RecordingAnimation.propTypes = {
  size: PropTypes.number
};

export default RecordingAnimation; 