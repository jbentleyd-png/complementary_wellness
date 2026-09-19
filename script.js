const track = document.querySelector(".carousel-track");
const container = document.querySelector(".carousel-container");
const prevBtn = document.querySelector(".prev-btn");
const nextBtn = document.querySelector(".next-btn");
const dotsContainer = document.querySelector(".dots-container");
const cards = document.querySelectorAll(".card-link");

// ---------- State (what the user is doing; NOT reset on resize) ----------
let isDragging = false;
let startX = 0;
let currentTranslate = 0;
let prevTranslate = 0;
let animationID = 0;
let currentIndex = 0;

// Click vs Drag logic threshold variables
let dragMoved = false;
const dragThreshold = 5;

// ---------- Measurements (derived from layout; recalculated on resize) ----------
let cardWidth = 0;
let maxScroll = 0;
let totalPages = 1;

function measure() {
  // Read the gap from the CSS so the two can never disagree
  const gap = parseFloat(getComputedStyle(track).gap) || 0;
  cardWidth = cards[0].offsetWidth + gap;
  // If everything fits on screen, there's nothing to scroll (never negative)
  maxScroll = Math.max(0, track.scrollWidth - container.offsetWidth);
  // Always at least one page
  totalPages = Math.max(1, Math.ceil(maxScroll / cardWidth) + 1);
}

// ---------- Dot indicators ----------
let dots = [];

function createDots() {
  dotsContainer.innerHTML = ""; // clear old dots first
  for (let i = 0; i < totalPages; i++) {
    const dot = document.createElement("div");
    dot.classList.add("dot");
    if (i === currentIndex) dot.classList.add("active");
    dot.addEventListener("click", () => updatePositionByIndex(i));
    dotsContainer.appendChild(dot);
  }
  dots = document.querySelectorAll(".dot"); // re-query after rebuilding
}

function updateDots() {
  dots.forEach((dot, index) => {
    dot.classList.toggle("active", index === currentIndex);
  });
}

// ---------- Mouse & touch gestures ----------
container.addEventListener("mousedown", dragStart);
container.addEventListener("mouseup", dragEnd);
container.addEventListener("mouseleave", dragEnd);
container.addEventListener("mousemove", dragMove);

container.addEventListener("touchstart", dragStart);
container.addEventListener("touchend", dragEnd);
container.addEventListener("touchmove", dragMove);

// Intercept clicks during capture phase to prevent navigation if user dragged
track.addEventListener(
  "click",
  (e) => {
    if (dragMoved) {
      e.preventDefault();
      e.stopPropagation();
    }
  },
  true,
);

function getPositionX(event) {
  return event.type.includes("mouse") ? event.pageX : event.touches[0].clientX;
}

function dragStart(event) {
  isDragging = true;
  dragMoved = false; // Reset threshold flag
  startX = getPositionX(event);
  track.style.transition = "none";
  cancelAnimationFrame(animationID);
}

function dragMove(event) {
  if (!isDragging) return;
  const currentX = getPositionX(event);
  const diffX = currentX - startX;

  // If user moves beyond threshold, flag it as a drag action
  if (Math.abs(diffX) > dragThreshold) {
    dragMoved = true;
  }

  currentTranslate = prevTranslate + diffX;
  animationID = requestAnimationFrame(setTransform);
}

function dragEnd() {
  if (!isDragging) return;
  isDragging = false;
  cancelAnimationFrame(animationID);

  track.style.transition = "transform 0.3s ease-out";

  // Snap boundaries
  if (currentTranslate > 0) {
    currentTranslate = 0;
  } else if (Math.abs(currentTranslate) > maxScroll) {
    currentTranslate = -maxScroll;
  } else {
    // Find closest card position
    currentIndex = Math.round(Math.abs(currentTranslate) / cardWidth);
    currentTranslate = -currentIndex * cardWidth;
  }

  // Update tracked index
  currentIndex = Math.round(Math.abs(currentTranslate) / cardWidth);

  setTransform();
  updateDots();
  prevTranslate = currentTranslate;
}

function setTransform() {
  track.style.transform = `translateX(${currentTranslate}px)`;
}

// ---------- Arrow / dot navigation ----------
function updatePositionByIndex(index) {
  currentIndex = Math.max(0, Math.min(index, totalPages - 1));
  currentTranslate = -currentIndex * cardWidth;

  // Don't scroll past the end
  if (Math.abs(currentTranslate) > maxScroll) {
    currentTranslate = -maxScroll;
  }

  track.style.transition = "transform 0.3s ease-out";
  setTransform();
  updateDots();
  prevTranslate = currentTranslate;
}

prevBtn.addEventListener("click", () => {
  updatePositionByIndex(currentIndex - 1);
});

nextBtn.addEventListener("click", () => {
  updatePositionByIndex(currentIndex + 1);
});

// ---------- Resize handling ----------
function handleResize() {
  measure();
  createDots();
  updatePositionByIndex(currentIndex); // re-clamps the index and position
}

window.addEventListener("resize", handleResize);

// ---------- Initial setup ----------
measure();
createDots();
