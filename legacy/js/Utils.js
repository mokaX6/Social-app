// ==========================================
// 1. DOM ELEMENTS CACHE & STATE & UTILS
// ==========================================
const DOM = {
  postsContainer: document.getElementById("postsContainer"),
  navLinksContainer: document.querySelector(".nav-links"),
  loadingSpinner: document.getElementById("loadingSpinner"),
  searchInput: document.querySelector(".search-box input"),
  
  // Register Form
  registerName: document.getElementById("registerName"),
  registerUsername: document.getElementById("registerUsername"),
  registerPassword: document.getElementById("registerPassword"),
  registerImageFile: document.getElementById("registerImageFile"),
  registerSubmitBtn: document.getElementById("registerSubmitBtn"),

  // Login Form
  loginUsername: document.getElementById("loginUsername"),
  loginPassword: document.getElementById("loginPassword"),
  loginSubmitBtn: document.getElementById("loginSubmitBtn"),

  // Create Post Modal
  openCreatePostBtn: document.getElementById("openCreatePostModal"),
  createPostModal: document.getElementById("createPostModal"),
  closeCreateModalBtn: document.getElementById("closeCreateModal"),
  postTitleInput: document.getElementById("postTitleInput"),
  postDescInput: document.getElementById("postDescInput"),
  postTagsInput: document.getElementById("postTagsInput"),
  postMediaFile: document.getElementById("postMediaFile"),
  publishPostBtn: document.querySelector(".publish-btn"),
  
  // Toast
  toast: document.getElementById("toastNotification"),
  toastMessage: document.getElementById("toastMessage"),
  toastIcon: document.getElementById("toastIcon")
};

let state = {
  selectedProfileImage: "https://via.placeholder.com/150",
  selectedPostImage: "",
  activeTagFilter: null
};

// Loading Helpers
function showLoader() {
  if (DOM.loadingSpinner) DOM.loadingSpinner.style.display = "flex";
}

function hideLoader() {
  if (DOM.loadingSpinner) DOM.loadingSpinner.style.display = "none";
}

// Image Compressor Utility
function compressImage(file, maxWidth = 800, maxHeight = 800, quality = 0.65) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) { height *= maxWidth / width; width = maxWidth; }
        } else {
          if (height > maxHeight) { width *= maxHeight / height; height = maxHeight; }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
}

// Safe Modal Closer
function safeCloseModal(modalId) {
  const modalElement = document.getElementById(modalId);
  if (modalElement) {
    const modalInstance = window.bootstrap?.Modal?.getInstance(modalElement) || new window.bootstrap.Modal(modalElement);
    modalInstance.hide();
  }
  setTimeout(() => {
    document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
    document.body.classList.remove('modal-open');
    document.body.style.overflow = 'auto';
    document.body.style.paddingRight = '';
  }, 200);
}

// Toast Notification
function showToast(message, type = "success") {
  if (!DOM.toast) return;
  DOM.toastMessage.textContent = message;
  DOM.toastIcon.className = type === "success" ? "fa-solid fa-circle-check" : "fa-solid fa-circle-xmark";
  DOM.toast.style.borderColor = type === "success" ? "#28a745" : "#dc3545";
  DOM.toast.classList.add("show");
  setTimeout(() => DOM.toast.classList.remove("show"), 3000);
}
