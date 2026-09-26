// ==========================================
// SCRIPT: MAIN APPLICATION LOGIC, 24H STORAGE CLEAR & SPLASH INIT
// ==========================================

function checkAndClearLocalStorageDaily() {
  const lastClearTime = localStorage.getItem("moka_last_clear");
  const now = Date.now();
  const twentyFourHours = 24 * 60 * 60 * 1000;

  if (!lastClearTime || (now - Number(lastClearTime)) > twentyFourHours) {
    localStorage.removeItem("moka_posts");
    localStorage.setItem("moka_last_clear", now);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // 1. التعامل مع عرض شاشة الـ Splash (مرة كل 24 ساعة ولمدة 3 ثواني)
  const splash = document.getElementById("startupSplash");
  const lastSplashTime = localStorage.getItem("mokaSplashTimestamp");
  const currentTime = Date.now();
  const twentyFourHours = 24 * 60 * 60 * 1000;

  if (!lastSplashTime || (currentTime - Number(lastSplashTime)) > twentyFourHours) {
    if (splash) splash.style.display = "flex";
    setTimeout(() => {
      if (splash) {
        splash.style.opacity = "0";
        splash.style.visibility = "hidden";
        setTimeout(() => splash.remove(), 500);
      }
      localStorage.setItem("mokaSplashTimestamp", currentTime.toString());
    }, 3000);
  } else {
    if (splash) splash.remove();
  }

  // 2. تفعيل العمليات الأساسية للتطبيق
  checkAndClearLocalStorageDaily();

  showLoader();
  checkAuthUI();
  
  setTimeout(() => {
    fetchingPosts();
    hideLoader();
  }, 400);

  initEventListeners();
  initLightboxModal();
  initCommentsModal();
  initSearchFeature();
  initNativeSidebarIntegration();
});

function initSearchFeature() {
  const searchInput = (typeof DOM !== 'undefined' && DOM.searchInput) ? DOM.searchInput : document.getElementById("searchInput");
  if (!searchInput) return;

  searchInput.addEventListener("focus", (e) => {
    const token = localStorage.getItem("token");
    if (!token) {
      e.target.blur();
      showToast("Please login first to use search!", "error");
    }
  });

  searchInput.addEventListener("input", (e) => {
    const token = localStorage.getItem("token");
    if (!token) {
      e.target.value = "";
      showToast("Please login first to use search!", "error");
      return;
    }
    fetchingPosts(e.target.value, state.activeTagFilter);
  });
}

function initEventListeners() {
  const openCreatePostBtn = document.getElementById("openCreatePostModal") || (typeof DOM !== 'undefined' && DOM.openCreatePostBtn);
  const createPostModal = document.getElementById("createPostModal") || (typeof DOM !== 'undefined' && DOM.createPostModal);
  const closeCreateModalBtn = document.getElementById("closeCreateModalBtn") || (typeof DOM !== 'undefined' && DOM.closeCreateModalBtn);

  if (openCreatePostBtn) {
    openCreatePostBtn.addEventListener("click", () => {
      const token = localStorage.getItem("token");
      if (!token) {
        showToast("Please login first to create a post!", "error");
        return;
      }
      if (createPostModal) {
        createPostModal.style.display = "flex";
      }
    });
  }

  const closeCreatePostAction = () => {
    if (createPostModal) createPostModal.style.display = "none";
  };

  if (closeCreateModalBtn) closeCreateModalBtn.addEventListener("click", closeCreatePostAction);
  window.addEventListener("click", (e) => {
    if (createPostModal && e.target === createPostModal) closeCreatePostAction();
  });

  const editPostModal = document.getElementById("editPostModal");
  const closeEditModalBtn = document.getElementById("closeEditModalBtn");
  const closeEditAction = () => { if (editPostModal) editPostModal.style.display = "none"; };
  if (closeEditModalBtn) closeEditModalBtn.addEventListener("click", closeEditAction);
  window.addEventListener("click", (e) => { if (editPostModal && e.target === editPostModal) closeEditAction(); });

  const updatePostBtn = document.getElementById("updatePostBtn");
  if (updatePostBtn) {
    updatePostBtn.addEventListener("click", () => {
      const postId = document.getElementById("editPostIdInput")?.value;
      const title = document.getElementById("editPostTitleInput")?.value.trim();
      const body = document.getElementById("editPostDescInput")?.value.trim();
      const rawTags = document.getElementById("editPostTagsInput")?.value.trim();

      if (!title || !body) {
        showToast("Please provide title and description", "error");
        return;
      }

      let posts = JSON.parse(localStorage.getItem("moka_posts")) || [];
      const postIndex = posts.findIndex(p => Number(p.id) === Number(postId));

      if (postIndex !== -1) {
        posts[postIndex].title = title;
        posts[postIndex].body = body;
        posts[postIndex].tags = rawTags ? rawTags.split(",").map(t => t.trim().replace("#", "")).filter(t => t.length > 0) : [];
        
        localStorage.setItem("moka_posts", JSON.stringify(posts));
        showToast("Post updated successfully!", "success");
        closeEditAction();
        fetchingPosts(typeof DOM !== 'undefined' && DOM.searchInput ? DOM.searchInput.value : "", state.activeTagFilter);
      }
    });
  }

  const postMediaFile = document.getElementById("postMediaFile") || (typeof DOM !== 'undefined' && DOM.postMediaFile);
  if (postMediaFile) {
    postMediaFile.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (file) {
        try {
          showLoader();
          let imageUrl = "";
          if (file.type === "image/gif") {
            imageUrl = await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onload = (uploadEvent) => resolve(uploadEvent.target.result);
              reader.readAsDataURL(file);
            });
          } else {
            imageUrl = await compressImage(file, 900, 900, 0.65);
          }

          state.selectedPostImage = imageUrl;
          hideLoader();

          let previewContainer = document.getElementById("postMediaPreview");
          if (!previewContainer) {
            previewContainer = document.createElement("div");
            previewContainer.id = "postMediaPreview";
            previewContainer.style.cssText = "margin-top: 10px; position: relative; max-height: 150px; overflow: hidden; border-radius: 8px;";
            postMediaFile.insertAdjacentElement("afterend", previewContainer);
          }

          previewContainer.innerHTML = `
            <img src="${state.selectedPostImage}" style="width: 100%; height: 120px; object-fit: cover; border-radius: 8px; border: 1px solid #ddd;" />
            <span style="position: absolute; top: 5px; right: 5px; background: rgba(0,0,0,0.6); color: white; padding: 2px 6px; font-size: 10px; border-radius: 4px;">Attached ✓</span>
          `;
        } catch (err) {
          hideLoader();
          showToast("Failed to process image.", "error");
        }
      }
    });
  }

  const publishPostBtn = document.getElementById("publishPostBtn") || (typeof DOM !== 'undefined' && DOM.publishPostBtn);
  if (publishPostBtn) {
    publishPostBtn.addEventListener("click", () => {
      const token = localStorage.getItem("token");
      if (!token) {
        showToast("Please login first to publish posts!", "error");
        return;
      }

      const postTitleInput = document.getElementById("postTitleInput") || (typeof DOM !== 'undefined' && DOM.postTitleInput);
      const postDescInput = document.getElementById("postDescInput") || (typeof DOM !== 'undefined' && DOM.postDescInput);
      const postTagsInput = document.getElementById("postTagsInput") || (typeof DOM !== 'undefined' && DOM.postTagsInput);

      const title = postTitleInput?.value.trim() || "";
      const body = postDescInput?.value.trim().replace(/\r\n/g, '\n') || "";
      const rawTags = postTagsInput ? postTagsInput.value.trim() : "";

      if (!title || !body) {
        showToast("Please provide both a title and description!", "error");
        return;
      }

      const tagsArray = rawTags ? rawTags.split(",").map(tag => tag.trim().replace("#", "")).filter(tag => tag.length > 0) : [];

      showLoader();
      publishPostBtn.disabled = true;

      setTimeout(() => {
        try {
          const currentUser = JSON.parse(localStorage.getItem("user")) || { name: "User", username: "user" };
          const newPost = {
            id: Date.now(),
            title,
            body,
            tags: tagsArray,
            image: state.selectedPostImage || "",
            author: {
              name: currentUser.name || currentUser.username || "User",
              username: currentUser.username || "user",
              profile_image: currentUser.profile_image || "https://via.placeholder.com/40"
            },
            created_at: Date.now(),
            likes: [],
            comments: [],
            saves: []
          };

          let posts = JSON.parse(localStorage.getItem("moka_posts")) || [];
          posts.unshift(newPost);
          localStorage.setItem("moka_posts", JSON.stringify(posts));

          showToast("Post published successfully! 🚀", "success");

          if (postTitleInput) postTitleInput.value = "";
          if (postDescInput) postDescInput.value = "";
          if (postTagsInput) postTagsInput.value = "";
          state.selectedPostImage = "";
          if (postMediaFile) postMediaFile.value = "";
          
          const previewContainer = document.getElementById("postMediaPreview");
          if (previewContainer) previewContainer.remove();

          closeCreatePostAction();
          fetchingPosts("", state.activeTagFilter);
        } catch (error) {
          showToast("Storage full! Try clearing old data.", "error");
        } finally {
          hideLoader();
          if (publishPostBtn) publishPostBtn.disabled = false;
        }
      }, 300); 
    });
  }
}
