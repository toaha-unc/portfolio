gsap.registerPlugin(ScrollTrigger);

const GITHUB_USERNAME = "toaha-unc";
const GITHUB_API_URL = `https://api.github.com/users/${GITHUB_USERNAME}`;

let scene, camera, renderer, particles, geometry, material;
let mouseX = 0,
  mouseY = 0;
let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;
let renderActive = true;

function initThreeJS() {
  const container = document.getElementById("three-container");

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 5;

  renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    powerPreference: "high-performance",
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  geometry = new THREE.BufferGeometry();
  const isMobile = window.matchMedia("(max-width: 768px)").matches;
  const particleCount = isMobile ? 1500 : 3800;
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  const sizes = new Float32Array(particleCount);
  const velocities = new Float32Array(particleCount * 3);
  const shininess = new Float32Array(particleCount);

  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3;

    positions[i3] = (Math.random() - 0.5) * 15;
    positions[i3 + 1] = (Math.random() - 0.5) * 15;
    positions[i3 + 2] = (Math.random() - 0.5) * 15;

    const colorVariation = Math.random();
    if (colorVariation < 0.33) {
      colors[i3] = Math.random() * 0.5 + 0.5;
      colors[i3 + 1] = Math.random() * 0.3;
      colors[i3 + 2] = Math.random() * 0.5 + 0.5;
    } else if (colorVariation < 0.66) {
      colors[i3] = Math.random() * 0.3;
      colors[i3 + 1] = Math.random() * 0.5 + 0.5;
      colors[i3 + 2] = Math.random() * 0.5 + 0.5;
    } else {
      colors[i3] = Math.random() * 0.5 + 0.5;
      colors[i3 + 1] = Math.random() * 0.3;
      colors[i3 + 2] = Math.random() * 0.5 + 0.5;
    }

    sizes[i] = Math.random() * 0.15 + 0.03;
    if (Math.random() < 0.15) {
      sizes[i] = Math.random() * 0.25 + 0.12;
    }

    shininess[i] = Math.random();

    velocities[i3] = (Math.random() - 0.5) * 0.01;
    velocities[i3 + 1] = (Math.random() - 0.5) * 0.01;
    velocities[i3 + 2] = (Math.random() - 0.5) * 0.01;
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute("shininess", new THREE.BufferAttribute(shininess, 1));

  material = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      mousePosition: { value: new THREE.Vector2(0, 0) },
    },
    vertexShader: `
            attribute float size;
            attribute vec3 color;
            attribute float shininess;
            varying vec3 vColor;
            varying float vDistance;
            varying float vShininess;
            uniform float time;
            uniform vec2 mousePosition;
            
            void main() {
                vColor = color;
                vShininess = shininess;
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                vDistance = -mvPosition.z;
                
                vec3 pos = position;
                pos.x += sin(time * 0.5 + position.y * 0.1) * 0.5;
                pos.y += cos(time * 0.3 + position.x * 0.1) * 0.5;
                
                float distance = length(position.xy - mousePosition * 10.0);
                pos.z += sin(distance * 0.1 - time) * 2.0;
                
                vec4 finalPosition = modelViewMatrix * vec4(pos, 1.0);
                gl_PointSize = size * clamp(300.0 / max(0.001, -finalPosition.z), 0.0, 100.0);
                gl_Position = projectionMatrix * finalPosition;
            }
        `,
    fragmentShader: `
            varying vec3 vColor;
            varying float vDistance;
            varying float vShininess;
            
            void main() {
                float alpha = 1.0 - (vDistance / 50.0);
                alpha = clamp(alpha, 0.0, 1.0);
                
                vec2 center = gl_PointCoord - vec2(0.5);
                float dist = length(center);
                
                float circle = 1.0 - smoothstep(0.0, 0.5, dist);
                
                float shiny = vShininess * 0.8;
                float highlight = 1.0 - smoothstep(0.0, 0.2, dist);
                highlight *= shiny;
                
                if (vShininess > 0.8) {
                    float sparkle = sin(dist * 20.0) * 0.3 + 0.7;
                    highlight += sparkle * 0.5;
                }
                
                vec3 finalColor = vColor + vec3(highlight * 0.5);
                
                gl_FragColor = vec4(finalColor, alpha * circle);
            }
        `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  particles = new THREE.Points(geometry, material);
  scene.add(particles);

  const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
  scene.add(ambientLight);

  ScrollTrigger.create({
    trigger: "#home",
    start: "top bottom",
    end: "bottom top",
    onLeave: () => (renderActive = false),
    onEnterBack: () => (renderActive = true),
  });

  animate();
}

function animate() {
  requestAnimationFrame(animate);

  if (!renderActive) return;

  if (particles && material) {
    material.uniforms.time.value += 0.01;

    material.uniforms.mousePosition.value.x = mouseX / windowHalfX;
    material.uniforms.mousePosition.value.y = mouseY / windowHalfY;

    particles.rotation.x += 0.0005;
    particles.rotation.y += 0.001;
    particles.rotation.z += 0.0003;

    const positions = geometry.attributes.position.array;
    const shininess = geometry.attributes.shininess.array;
    const time = material.uniforms.time.value;

    for (let i = 0; i < positions.length; i += 3) {
      const shiny = shininess[i / 3];

      if (shiny > 0.8) {
        positions[i] += Math.sin(time * 2.0 + i * 0.02) * 0.003;
        positions[i + 1] += Math.cos(time * 1.8 + i * 0.02) * 0.003;
      } else if (shiny > 0.5) {
        positions[i] += Math.sin(time * 1.2 + i * 0.015) * 0.002;
        positions[i + 1] += Math.cos(time * 1.0 + i * 0.015) * 0.002;
      } else {
        positions[i] += Math.sin(time * 0.8 + i * 0.01) * 0.001;
        positions[i + 1] += Math.cos(time * 0.6 + i * 0.01) * 0.001;
      }
    }

    geometry.attributes.position.needsUpdate = true;
  }

  renderer.render(scene, camera);
}

function onWindowResize() {
  if (camera && renderer) {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
}

async function fetchGitHubData() {
  try {
    const response = await fetch(GITHUB_API_URL);
    const data = await response.json();

    const profilePic = document.getElementById("profile-pic");
    if (profilePic && data.avatar_url) {
      profilePic.src = data.avatar_url;
    } else if (profilePic) {
      profilePic.src = "https://github.com/toaha-unc.png";
    }

    const bioText = document.getElementById("bio-text");
    if (bioText && data.bio) {
      bioText.textContent = data.bio;
    }

    return data;
  } catch (error) {
    console.error("Error fetching GitHub data:", error);

    return {
      avatar_url: "https://via.placeholder.com/200x200/667eea/ffffff?text=T",
      bio: "Hi Im Toaha. Im a Software Engineer. I love to learn new technologies. I am currently learning Spring Boot and Angular.",
      public_repos: 10,
      followers: 0,
      following: 1,
      public_gists: 0,
    };
  }
}

const sampleProjects = [
  {
    name: "FreelanceWork",
    description:
      "FreelanceWork is a full-stack web application that connects service providers (Sellers) with service purchasers (Buyers). The system is designed to simulate a modern freelancing marketplace with essential features for authentication, service listings, order management, dashboards, and reviews.",
    technologies: ["Python", "Django", "PostgreSQL", "React"],
    githubUrl: "https://github.com/toaha-unc/react-final",
    liveUrl: "https://react-final-phi-eight.vercel.app/",
    image: "images/react-final.png",
  },
  {
    name: "Event Management System",
    description:
      "A full-featured event management system built with Django that allows users to create, manage, and attend events. Includes user authentication, event registration, and comprehensive event management capabilities.",
    technologies: [
      "Python",
      "Django",
      "PostgreSQL",
      "HTML/CSS",
      "Tailwind CSS",
    ],
    githubUrl: "https://github.com/toaha-unc/django-event-management-system",
    liveUrl: "https://django-event-management-system-60t0.onrender.com/",
    image: "images/EMS.png",
  },
  {
    name: "Twitter Backend",
    description:
      "A comprehensive RESTful API built with Spring Boot, JPA, and PostgreSQL that replicates Twitter's core functionality. Features include user management, tweet creation, following/followers, likes, replies, reposts, hashtags, and mentions.",
    technologies: [
      "Java",
      "Spring Boot",
      "JPA",
      "PostgreSQL",
      "Maven",
      "REST API",
    ],
    githubUrl: "https://github.com/toaha-unc/twitter-x",
    liveUrl: null,
    image: "images/twitter.png",
  },
];

function populateProjects() {
  const projectsGrid = document.getElementById("projects-grid");

  sampleProjects.forEach((project) => {
    const projectCard = document.createElement("div");
    projectCard.className =
      "project-card bg-white rounded-2xl shadow-lg overflow-hidden h-full";
    projectCard.style.cssText = "display: flex; flex-direction: column;";
    projectCard.innerHTML = `
            <div class="relative overflow-hidden">
                <img src="${project.image}" alt="${
      project.name
    }" class="w-full h-64 object-cover" loading="lazy">
            </div>
            <div class="p-6" style="display: flex; flex-direction: column; flex-grow: 1;">
                <h3 class="text-xl font-semibold text-white mb-3">${
                  project.name
                }</h3>
                <p class="text-gray-300 mb-4 leading-relaxed">${
                  project.description
                }</p>
                <div class="flex flex-wrap gap-2 mb-4">
                    ${project.technologies
                      .map((tech) => `<span class="skill-badge">${tech}</span>`)
                      .join("")}
                </div>
                <div class="flex gap-3" style="margin-top: auto;">
                    <a href="${
                      project.githubUrl
                    }" target="_blank" rel="noopener noreferrer" 
                       class="flex-1 bg-gray-800 text-white py-2 px-4 rounded-lg text-center hover:bg-gray-700 transition-colors">
                        <i class="fab fa-github mr-2" aria-hidden="true"></i>GitHub
                    </a>
                    ${
                      project.liveUrl
                        ? `
                        <a href="${project.liveUrl}" target="_blank" rel="noopener noreferrer" 
                           class="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 px-4 rounded-lg text-center hover:shadow-lg transition-all">
                            <i class="fas fa-external-link-alt mr-2" aria-hidden="true"></i>Live Demo
                        </a>
                    `
                        : `
                        <div class="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg text-center cursor-not-allowed opacity-70">
                            <i class="fas fa-code mr-2" aria-hidden="true"></i>Backend Only
                        </div>
                    `
                    }
                </div>
            </div>
        `;
    projectsGrid.appendChild(projectCard);
  });
}

function initAnimations() {
  gsap.fromTo(
    ".floating",
    { y: 100, opacity: 0, scale: 0.8, rotation: -10 },
    {
      y: 0,
      opacity: 1,
      scale: 1,
      rotation: 0,
      duration: 1.5,
      ease: "back.out(1.7)",
    }
  );

  gsap.fromTo(
    "h1",
    { y: 100, opacity: 0, scale: 0.9 },
    {
      y: 0,
      opacity: 1,
      scale: 1,
      duration: 1.2,
      delay: 0.3,
      ease: "power3.out",
    }
  );

  gsap.fromTo(
    "#bio-text",
    { y: 50, opacity: 0, scale: 0.95 },
    {
      y: 0,
      opacity: 1,
      scale: 1,
      duration: 1,
      delay: 0.6,
      ease: "power2.out",
    }
  );

  gsap.fromTo(
    ".flex.flex-col.sm\\:flex-row a",
    { y: 50, opacity: 0, scale: 0.8 },
    {
      y: 0,
      opacity: 1,
      scale: 1,
      duration: 0.8,
      delay: 0.9,
      stagger: 0.2,
      ease: "back.out(1.7)",
    }
  );

  gsap.utils.toArray("section").forEach((section, index) => {
    const elements = section.querySelectorAll("h2, h3, p");
    gsap.fromTo(
      elements,
      { y: 60, opacity: 0, scale: 0.9 },
      {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 1,
        stagger: 0.15,
        ease: "power3.out",
        scrollTrigger: {
          trigger: section,
          start: "top 85%",
          end: "bottom 15%",
          toggleActions: "play none none reverse",
        },
      }
    );

    const skillBadges = section.querySelectorAll(".skill-badge");
    if (skillBadges.length > 0) {
      gsap.fromTo(
        skillBadges,
        { y: 40, opacity: 0, scale: 0.8 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.8,
          stagger: 0.08,
          ease: "power2.out",
          scrollTrigger: {
            trigger: section,
            start: "top 80%",
            end: "bottom 20%",
            toggleActions: "play none none reverse",
          },
        }
      );
    }
  });

  gsap.fromTo(
    ".project-card",
    { y: 150, opacity: 0, scale: 0.8, rotationY: 15 },
    {
      y: 0,
      opacity: 1,
      scale: 1,
      rotationY: 0,
      duration: 1.2,
      stagger: 0.15,
      ease: "power3.out",
      scrollTrigger: {
        trigger: "#projects",
        start: "top 80%",
        end: "bottom 20%",
      },
    }
  );

  gsap.fromTo(
    ".projects-title",
    {
      y: 100,
      opacity: 0,
      scale: 0.5,
      rotationX: 90,
      filter: "blur(10px)",
    },
    {
      y: 0,
      opacity: 1,
      scale: 1,
      rotationX: 0,
      filter: "blur(0px)",
      duration: 2,
      ease: "back.out(1.7)",
      scrollTrigger: {
        trigger: "#projects",
        start: "top 85%",
      },
    }
  );

  gsap.utils.toArray("h2, h3").forEach((heading) => {
    gsap.fromTo(
      heading,
      {
        backgroundPosition: "200% center",
        backgroundSize: "200% 100%",
      },
      {
        backgroundPosition: "0% center",
        backgroundSize: "100% 100%",
        duration: 1.5,
        ease: "power2.out",
        scrollTrigger: {
          trigger: heading,
          start: "top 80%",
        },
      }
    );
  });

  gsap.fromTo(
    "#about .skill-badge",
    { scale: 0, opacity: 0, rotation: -180 },
    {
      scale: 1,
      opacity: 1,
      rotation: 0,
      duration: 0.8,
      stagger: 0.1,
      ease: "back.out(1.7)",
      scrollTrigger: {
        trigger: "#about",
        start: "top 70%",
      },
    }
  );
}

function initMobileMenu() {
  const mobileMenuBtn = document.getElementById("mobile-menu-btn");
  const mobileMenu = document.getElementById("mobile-menu");

  if (!mobileMenuBtn || !mobileMenu) return;

  mobileMenuBtn.addEventListener("click", () => {
    mobileMenu.classList.toggle("hidden");
  });

  const mobileLinks = mobileMenu.querySelectorAll("a");
  mobileLinks.forEach((link) => {
    link.addEventListener("click", () => {
      mobileMenu.classList.add("hidden");
    });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      mobileMenu.classList.add("hidden");
    }
  });

  document.addEventListener("click", (e) => {
    if (!mobileMenu.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
      mobileMenu.classList.add("hidden");
    }
  });
}

function initSmoothScrolling() {
  const links = document.querySelectorAll('a[href^="#"]');

  links.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const targetId = link.getAttribute("href");
      const targetSection = document.querySelector(targetId);

      if (targetSection) {
        targetSection.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    });
  });
}

function initContactForm() {
  const contactForm = document.getElementById("contact-form");

  if (!contactForm) return;

  emailjs.init("bwDY-XFrNnOLjvT7L");
  console.log("📧 EmailJS initialized with public key: bwDY-XFrNnOLjvT7L");

  const successMessage = document.createElement("div");
  successMessage.className =
    "hidden mt-4 p-4 bg-green-600 text-white rounded-lg text-center";
  successMessage.setAttribute("aria-live", "polite");

  const errorMessage = document.createElement("div");
  errorMessage.className =
    "hidden mt-4 p-4 bg-red-600 text-white rounded-lg text-center";
  errorMessage.setAttribute("aria-live", "polite");

  contactForm.appendChild(successMessage);
  contactForm.appendChild(errorMessage);

  contactForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const formData = new FormData(contactForm);
    const name = formData.get("name").trim();
    const email = formData.get("email").trim();
    const message = formData.get("message").trim();

    if (!name || !email || !message) {
      showError("Please fill in all fields.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showError("Please enter a valid email address.");
      return;
    }

    const submitBtn = contactForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;

    submitBtn.innerHTML =
      '<i class="fas fa-spinner fa-spin mr-2"></i>Sending...';
    submitBtn.disabled = true;

    hideMessages();

    const templateParams = {
      from_name: name,
      from_email: email,
      sender_email: email,
      message: message,
      to_name: "Toaha",
      reply_to: email,
      subject: `New Contact Form Message from ${name}`,
      date: new Date().toLocaleString(),
    };

    console.log("Attempting to send email with params:", templateParams);
    emailjs
      .send("service_bbj9lpo", "template_pzmadb3", templateParams)
      .then(
        function (response) {
          console.log(
            "✅ EMAIL SENT SUCCESSFULLY!",
            response.status,
            response.text
          );
          console.log("Response details:", response);
          showSuccess(
            `Thank you for your message, ${name}! I'll get back to you soon at ${email}.`
          );
          contactForm.reset();
        },
        function (error) {
          console.log("❌ EMAIL SEND FAILED!", error);
          console.log("Error details:", error);
          showError(
            "Sorry, there was an error sending your message. Please try again or contact me directly at toahasiddique.ts@gmail.com"
          );
        }
      )
      .finally(() => {
        // Reset button state
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
      });
  });

  function showSuccess(message) {
    successMessage.textContent = message;
    successMessage.classList.remove("hidden");
    errorMessage.classList.add("hidden");

    setTimeout(() => {
      successMessage.classList.add("hidden");
    }, 8000);
  }

  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove("hidden");
    successMessage.classList.add("hidden");

    setTimeout(() => {
      errorMessage.classList.add("hidden");
    }, 8000);
  }

  function hideMessages() {
    successMessage.classList.add("hidden");
    errorMessage.classList.add("hidden");
  }
}

function initParallax() {
  gsap.utils.toArray(".stats-card").forEach((card) => {
    gsap.to(card, {
      y: -30,
      scale: 1.05,
      ease: "none",
      scrollTrigger: {
        trigger: card,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
      },
    });
  });
}

function initSkillBadgeClicks() {
  const skillBadges = document.querySelectorAll("#about .skill-badge");
  const skillLogoDisplay = document.getElementById("skill-logo-display");

  if (skillBadges.length === 0) {
    console.log("No skill badges found in about section");
    return;
  }

  if (!skillLogoDisplay) {
    console.log("Skill logo display element not found");
    return;
  }

  let currentSkillLogo = null;
  let currentlyAnimatingBadge = null;

  const skillIcons = {
    Angular: "fab fa-angular",
    TypeScript: "fab fa-js-square",
    JavaScript: "fab fa-js-square",
    HTML5: "fab fa-html5",
    CSS3: "fab fa-css3-alt",
    TailwindCSS: "fab fa-css3-alt",
    ThreeJS: "fas fa-cube",
    GSAP: "fas fa-bolt",
    Spring: "fas fa-leaf",
    Java: "fab fa-java",
    Python: "fab fa-python",
    Django: "fab fa-python",
    Postman: "fas fa-paper-plane",
    PostgreSQL: "fas fa-database",
    MySQL: "fas fa-database",
    Docker: "fab fa-docker",
    Jenkins: "fas fa-cogs",
    Git: "fab fa-git-alt",
    Maven: "fas fa-box",
    AWS: "fab fa-aws",
    Azure: "fab fa-microsoft",
    Windows: "fab fa-windows",
    MacOS: "fab fa-apple",
  };

  skillBadges.forEach((badge) => {
    badge.isAnimating = false;

    badge.addEventListener("click", function () {
      const skillName = this.textContent.trim();
      const iconClass = skillIcons[skillName];

      if (this.isAnimating) {
        gsap.killTweensOf(this);
        gsap.set(this, { y: 0 });
        this.isAnimating = false;
        currentlyAnimatingBadge = null;

        if (currentSkillLogo) {
          gsap.to(currentSkillLogo, {
            opacity: 0,
            scale: 0.8,
            duration: 0.5,
            ease: "power2.out",
            onComplete: () => {
              if (currentSkillLogo && currentSkillLogo.parentNode) {
                currentSkillLogo.parentNode.removeChild(currentSkillLogo);
              }
              currentSkillLogo = null;
            },
          });
        }
      } else {
        if (currentlyAnimatingBadge && currentlyAnimatingBadge !== this) {
          gsap.killTweensOf(currentlyAnimatingBadge);
          gsap.set(currentlyAnimatingBadge, { y: 0 });
          currentlyAnimatingBadge.isAnimating = false;
          currentlyAnimatingBadge = null;
        }

        gsap.to(this, {
          y: -20,
          duration: 0.4,
          ease: "power2.inOut",
          yoyo: true,
          repeat: -1,
        });
        this.isAnimating = true;
        currentlyAnimatingBadge = this;

        if (iconClass && skillLogoDisplay) {
          if (currentSkillLogo) {
            gsap.killTweensOf(currentSkillLogo);
            if (currentSkillLogo.parentNode) {
              currentSkillLogo.parentNode.removeChild(currentSkillLogo);
            }
            currentSkillLogo = null;
          }

          const skillLogo = document.createElement("i");
          skillLogo.className = `skill-logo ${iconClass}`;
          skillLogo.style.opacity = "0";
          skillLogo.style.transform = "translate(-50%, -50%) scale(0.8)";
          skillLogoDisplay.appendChild(skillLogo);
          currentSkillLogo = skillLogo;

          gsap.to(skillLogo, {
            opacity: 0.1,
            scale: 1,
            duration: 0.8,
            ease: "power2.out",
            onComplete: () => {
              gsap.to(skillLogo, {
                x: 200,
                y: 600,
                rotation: 5,
                duration: 8,
                ease: "power1.inOut",
                yoyo: true,
                repeat: -1,
              });

              gsap.to(skillLogo, {
                x: -150,
                y: 400,
                rotation: -3,
                duration: 10,
                ease: "power1.inOut",
                yoyo: true,
                repeat: -1,
                delay: 3,
              });

              gsap.to(skillLogo, {
                scale: 1.05,
                duration: 3,
                ease: "power2.inOut",
                yoyo: true,
                repeat: -1,
                delay: 1,
              });
            },
          });
        }
      }
    });
  });
}

function initBlackHoleEffect() {
  console.log("Black hole effect initialized");
  document.addEventListener("click", (e) => {
    const heroSection = document.getElementById("home");

    console.log("Click detected:", e.target);
    console.log("Hero section found:", !!heroSection);

    if (!heroSection || !heroSection.contains(e.target)) {
      console.log("Click not in hero section");
      return;
    }

    console.log("Click is in hero section");

    if (
      e.target.tagName === "A" ||
      e.target.tagName === "BUTTON" ||
      e.target.closest("a") ||
      e.target.closest("button") ||
      e.target.closest(".scroll-down-btn")
    ) {
      console.log("Click on interactive element, skipping black hole");
      return;
    }

    console.log("Creating black hole at:", e.clientX, e.clientY);

    const blackHole = document.createElement("div");
    blackHole.className = "black-hole";
    blackHole.style.left = e.clientX + "px";
    blackHole.style.top = e.clientY + "px";

    document.body.appendChild(blackHole);

    setTimeout(() => {
      if (blackHole.parentNode) {
        blackHole.parentNode.removeChild(blackHole);
      }
    }, 4000);
  });
}

function initSparkEffect() {
  document.addEventListener("click", (e) => {
    if (
      e.target.tagName === "INPUT" ||
      e.target.tagName === "TEXTAREA" ||
      e.target.tagName === "BUTTON" ||
      e.target.tagName === "A" ||
      e.target.closest(".skill-badge") ||
      e.target.closest(".project-card") ||
      e.target.closest("#mobile-menu")
    ) {
      return;
    }

    for (let i = 0; i < 15; i++) {
      const spark = document.createElement("div");
      spark.className = "galaxy-spark";

      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * 100 + 50;
      const speed = Math.random() * 0.5 + 0.5;

      spark.style.left = e.clientX + "px";
      spark.style.top = e.clientY + "px";

      const size = Math.random() * 3 + 1;
      spark.style.width = size + "px";
      spark.style.height = size + "px";

      const colorVariation = Math.random();
      let r, g, b;
      if (colorVariation < 0.33) {
        r = Math.random() * 0.5 + 0.5;
        g = Math.random() * 0.3;
        b = Math.random() * 0.5 + 0.5;
      } else if (colorVariation < 0.66) {
        r = Math.random() * 0.3;
        g = Math.random() * 0.5 + 0.5;
        b = Math.random() * 0.5 + 0.5;
      } else {
        r = Math.random() * 0.5 + 0.5;
        g = Math.random() * 0.3;
        b = Math.random() * 0.5 + 0.5;
      }

      const hexColor =
        "#" +
        Math.floor(r * 255)
          .toString(16)
          .padStart(2, "0") +
        Math.floor(g * 255)
          .toString(16)
          .padStart(2, "0") +
        Math.floor(b * 255)
          .toString(16)
          .padStart(2, "0");
      spark.style.color = hexColor;

      spark.style.setProperty("--angle", angle + "rad");
      spark.style.setProperty("--distance", distance + "px");
      spark.style.setProperty("--speed", speed.toString());

      document.body.appendChild(spark);

      setTimeout(() => {
        if (spark.parentNode) {
          spark.parentNode.removeChild(spark);
        }
      }, 1500);
    }
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  console.log("=== PORTFOLIO INITIALIZATION STARTED ===");

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (!reduceMotion) {
    initThreeJS();
  }

  await fetchGitHubData();

  populateProjects();

  initAnimations();

  initMobileMenu();

  initSmoothScrolling();

  initContactForm();

  initParallax();

  window.addEventListener("resize", onWindowResize);

  initTypingEffect();

  initCustomCursor();

  if (!reduceMotion) {
    initAboutBackground();
  }

  initSkillBadgeClicks();

  if (!reduceMotion) {
    initBlackHoleEffect();
  }

  if (!reduceMotion) {
    initSparkEffect();
  }

  console.log("=== PORTFOLIO INITIALIZATION COMPLETE ===");
  console.log("All features should now be working!");
});

document.addEventListener("mousemove", (e) => {
  mouseX = e.clientX - windowHalfX;
  mouseY = e.clientY - windowHalfY;

  if (particles) {
    gsap.to(particles.rotation, {
      x: mouseY * 0.0001,
      y: mouseX * 0.0001,
      duration: 2,
      ease: "power2.out",
    });
  }
});

document.addEventListener("touchmove", (e) => {
  const touch = e.touches[0];
  mouseX = touch.clientX - windowHalfX;
  mouseY = touch.clientY - windowHalfY;
});

window.addEventListener("load", () => {
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (reduceMotion) {
    document.body.style.opacity = "1";
    document.body.classList.remove("js-fadein");
  } else {
    gsap.to("body", {
      opacity: 1,
      duration: 0.5,
      ease: "power2.out",
      onComplete: () => {
        document.body.classList.remove("js-fadein");
      },
    });
  }
});

function initTypingEffect() {
  const bioText = document.getElementById("bio-text");
  if (!bioText) return;

  const originalText =
    bioText.textContent ||
    "A passionate developer creating amazing digital experiences";
  bioText.textContent = "";

  let i = 0;
  const typeWriter = () => {
    if (i < originalText.length) {
      bioText.textContent += originalText.charAt(i);
      i++;
      setTimeout(typeWriter, 50);
    }
  };

  setTimeout(typeWriter, 2000);
}

function initAboutBackground() {
  const aboutSection = document.getElementById("about");
  const aboutBackground = document.getElementById("about-background");

  if (!aboutSection || !aboutBackground) {
    console.log(
      "About section elements not found, skipping background animation"
    );
    return;
  }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    75,
    aboutBackground.clientWidth / aboutBackground.clientHeight,
    0.1,
    1000
  );
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });

  renderer.setSize(aboutBackground.clientWidth, aboutBackground.clientHeight);
  renderer.setClearColor(0x000000, 0);
  aboutBackground.appendChild(renderer.domElement);

  const particleCount = 150;
  const particles = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * 20;
    positions[i + 1] = (Math.random() - 0.5) * 20;
    positions[i + 2] = (Math.random() - 0.5) * 20;

    const color = Math.random();
    if (color < 0.4) {
      colors[i] = 0.4;
      colors[i + 1] = 0.2;
      colors[i + 2] = 0.8;
    } else if (color < 0.8) {
      colors[i] = 0.2;
      colors[i + 1] = 0.4;
      colors[i + 2] = 0.9;
    } else {
      colors[i] = 0.9;
      colors[i + 1] = 0.3;
      colors[i + 2] = 0.9;
    }
  }

  particles.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  particles.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const particleMaterial = new THREE.PointsMaterial({
    size: 0.05,
    vertexColors: true,
    transparent: true,
    opacity: 0.6,
  });

  const particleSystem = new THREE.Points(particles, particleMaterial);
  scene.add(particleSystem);

  camera.position.z = 5;

  function animate() {
    requestAnimationFrame(animate);

    particleSystem.rotation.x += 0.001;
    particleSystem.rotation.y += 0.002;

    const positions = particleSystem.geometry.attributes.position.array;
    for (let i = 1; i < positions.length; i += 3) {
      positions[i] += Math.sin(Date.now() * 0.001 + i) * 0.001;
    }
    particleSystem.geometry.attributes.position.needsUpdate = true;

    renderer.render(scene, camera);
  }

  animate();

  window.addEventListener("resize", () => {
    camera.aspect = aboutBackground.clientWidth / aboutBackground.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(aboutBackground.clientWidth, aboutBackground.clientHeight);
  });

  gsap.to(particleSystem.rotation, {
    x: Math.PI * 2,
    y: Math.PI * 2,
    duration: 20,
    repeat: -1,
    ease: "none",
  });
}

function initCustomCursor() {
  const cursor = document.querySelector(".custom-cursor");
  if (!cursor) return;

  let mouseX = 0,
    mouseY = 0;
  let cursorX = 0,
    cursorY = 0;

  document.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  function animateCursor() {
    cursorX += (mouseX - cursorX) * 0.1;
    cursorY += (mouseY - cursorY) * 0.1;

    cursor.style.transform = `translate(${cursorX - 10}px, ${cursorY - 10}px)`;
    requestAnimationFrame(animateCursor);
  }
  animateCursor();

  const interactiveElements = document.querySelectorAll(
    "a, button, .project-card, .skill-badge, input, textarea"
  );

  interactiveElements.forEach((element) => {
    element.addEventListener("mouseenter", () => {
      cursor.classList.add("hover");
    });

    element.addEventListener("mouseleave", () => {
      cursor.classList.remove("hover");
    });
  });
}
